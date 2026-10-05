// The two things the API needs from its host. Cloudflare's D1 and KV fit these as they are,
// and a SQLite file fits them through adapters/sqlite.ts, so the SQL in app.ts never changes.

/** What D1 reports after a write; `changes` is how many rows it touched. */
export type RunResult = { meta?: { changes?: number } }

export interface Statement {
  bind(...values: unknown[]): Statement
  first<T = Record<string, unknown>>(): Promise<T | null>
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>
  run(): Promise<RunResult>
}

export interface Database {
  prepare(sql: string): Statement
  /** Runs the statements together: all of them or none. */
  batch(statements: Statement[]): Promise<unknown[]>
}

export interface Cache {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
}

export interface Env {
  DB: Database
  CACHE: Cache
  /** 64 hex characters (32 bytes). Account secrets are stored encrypted with it; without it the API refuses to run. */
  SECRETS_KEY?: string
  /** Optional operator token (16+ characters) that switches on /admin. */
  ADMIN_TOKEN?: string
  /** Optional comma-separated IPs that may use /admin; others get a 404 even with the token. */
  ADMIN_ALLOWED_IPS?: string
  /** Optional comma-separated words that may not appear in a nickname. */
  BLOCKED_NICKNAME_WORDS?: string
}
