// A SQLite file as the Database and Cache of the API, for running without Cloudflare.
// Uses node:sqlite (Node 22.13 or newer), so it needs no native module.
import { DatabaseSync } from 'node:sqlite'
import type { Cache, Database, RunResult, Statement } from '../ports'

type Value = null | number | bigint | string
type Row = Record<string, unknown>

const clean = (values: unknown[]): Value[] => values.map(v => (v === undefined ? null : (v as Value)))

class Stmt implements Statement {
  constructor(
    readonly db: DatabaseSync,
    readonly sql: string,
    readonly values: Value[] = [],
  ) {}

  bind(...values: unknown[]): Statement {
    return new Stmt(this.db, this.sql, clean(values))
  }

  runSync(): RunResult {
    const info = this.db.prepare(this.sql).run(...this.values)

    return { meta: { changes: Number(info.changes) } }
  }

  first<T = Row>(): Promise<T | null> {
    const row = this.db.prepare(this.sql).get(...this.values)

    return Promise.resolve(row ? ({ ...row } as T) : null)
  }

  all<T = Row>(): Promise<{ results: T[] }> {
    return Promise.resolve({ results: this.db.prepare(this.sql).all(...this.values).map(r => ({ ...r }) as T) })
  }

  run(): Promise<RunResult> {
    return Promise.resolve(this.runSync())
  }
}

/** Brings a file made by an older release up to date before the schema (whose index needs the new column) runs. */
const upgrade = (raw: DatabaseSync): void => {
  const columns = raw.prepare("PRAGMA table_info('users')").all() as { name: string }[]

  if (columns.length === 0 || columns.some(c => c.name === 'nick_key')) return

  raw.exec('ALTER TABLE users ADD COLUMN nick_key TEXT')
  raw.exec(
    "UPDATE users SET nick_key = replace(replace(replace(replace(lower(nickname), 'i', 'l'), '1', 'l'), '0', 'o'), '-', '_') WHERE nick_key IS NULL",
  )
}

export type SqliteDatabase = Database & { raw: DatabaseSync; close(): void }

export const openSqlite = (path: string, schema: string): SqliteDatabase => {
  const raw = new DatabaseSync(path)

  raw.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;')
  upgrade(raw)
  raw.exec(schema)
  raw.exec('CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, value TEXT NOT NULL, expires_at INTEGER NOT NULL)')

  return {
    raw,
    close: () => raw.close(),
    prepare: (sql: string) => new Stmt(raw, sql),
    batch: async statements => {
      raw.exec('BEGIN')

      try {
        for (const s of statements) (s as Stmt).runSync()

        raw.exec('COMMIT')
      } catch (error) {
        raw.exec('ROLLBACK')

        throw error
      }

      return statements.map(() => ({}))
    },
  }
}

/** Rate limits, replay nonces and board snapshots, kept in the same file so they survive a restart. */
export class SqliteCache implements Cache {
  constructor(private readonly db: DatabaseSync) {}

  get(key: string): Promise<string | null> {
    const row = this.db.prepare('SELECT value, expires_at FROM cache WHERE key = ?').get(key) as
      | { value: string; expires_at: number }
      | undefined

    if (!row) return Promise.resolve(null)

    if (row.expires_at <= Date.now()) {
      this.db.prepare('DELETE FROM cache WHERE key = ?').run(key)

      return Promise.resolve(null)
    }

    return Promise.resolve(row.value)
  }

  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    const expires = Date.now() + (options?.expirationTtl ?? 3600) * 1000

    this.db
      .prepare('INSERT INTO cache (key, value, expires_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at')
      .run(key, value, expires)

    if (Math.random() < 0.02) this.db.prepare('DELETE FROM cache WHERE expires_at <= ?').run(Date.now())

    return Promise.resolve()
  }
}
