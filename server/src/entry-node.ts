// Node entry: the same API over a SQLite file you own. No Cloudflare needed.
//
//   DESKFIT_DB   path of the SQLite file (default ./deskfit.sqlite); it, or its folder, must be writable
//   PORT         default 8787
//   HOST         default 127.0.0.1 (use 0.0.0.0 in a container)
//   SECRETS_KEY  required, 64 hex characters (openssl rand -hex 32): account secrets are stored encrypted with it.
//                Keep a copy somewhere safe; without it every account is locked out.
//   ADMIN_TOKEN  optional, 16+ characters: switches on the /admin operator routes
//   ADMIN_ALLOWED_IPS  optional, comma-separated: only these IPs may reach /admin
//   BLOCKED_NICKNAME_WORDS  optional, comma-separated words a nickname may not contain
//   TRUST_PROXY  set to 1 behind a reverse proxy so sign-up limits use X-Forwarded-For
import { accessSync, constants, existsSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, resolve } from 'node:path'
import { cleanup, handle } from './app'
import { openSqlite, SqliteCache } from './adapters/sqlite'
import schema from '../schema.sql'

const dbPath = resolve(process.env.DESKFIT_DB ?? './deskfit.sqlite')
const port = Number(process.env.PORT ?? 8787)
const host = process.env.HOST ?? '127.0.0.1'
const trustProxy = process.env.TRUST_PROXY === '1'

const die = (message: string): never => {
  console.error(`deskfit: ${message}`)
  process.exit(1)
}

// Fail early and clearly when the file or its folder cannot be written.
const dir = dirname(dbPath)

try {
  mkdirSync(dir, { recursive: true })
  accessSync(dir, constants.R_OK | constants.W_OK)

  if (existsSync(dbPath)) accessSync(dbPath, constants.R_OK | constants.W_OK)
} catch {
  die(`cannot read and write ${dbPath} (SQLite needs write access to the file and its folder). Set DESKFIT_DB to a writable path.`)
}

if (!/^[0-9a-f]{64}$/i.test(process.env.SECRETS_KEY ?? '')) {
  die('SECRETS_KEY must be set to 64 hex characters, e.g. SECRETS_KEY=$(openssl rand -hex 32). Keep a copy: without it every account is locked out.')
}

const db = openSqlite(dbPath, schema)
const env = {
  DB: db,
  CACHE: new SqliteCache(db.raw),
  SECRETS_KEY: process.env.SECRETS_KEY,
  ADMIN_TOKEN: process.env.ADMIN_TOKEN,
  ADMIN_ALLOWED_IPS: process.env.ADMIN_ALLOWED_IPS,
  BLOCKED_NICKNAME_WORDS: process.env.BLOCKED_NICKNAME_WORDS,
}

// daily housekeeping, the counterpart of the Worker's cron trigger
setInterval(() => void cleanup(env).catch(error => console.error('deskfit: cleanup failed', error)), 24 * 3600000).unref()

const server = createServer((req, res) => {
  const chunks: Buffer[] = []

  req.on('data', c => chunks.push(c as Buffer))
  req.on('end', async () => {
    try {
      const headers = new Headers()

      for (const [k, v] of Object.entries(req.headers)) if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(', ') : v)

      const forwarded = trustProxy ? headers.get('x-forwarded-for')?.split(',')[0]?.trim() : undefined

      headers.set('cf-connecting-ip', forwarded || req.socket.remoteAddress || 'local')

      const body = chunks.length > 0 && req.method !== 'GET' && req.method !== 'DELETE' ? Buffer.concat(chunks) : undefined
      const response = await handle(
        new Request(`http://${req.headers.host ?? 'localhost'}${req.url ?? '/'}`, { method: req.method, headers, body }),
        env,
      )

      res.writeHead(response.status, Object.fromEntries(response.headers))
      res.end(Buffer.from(await response.arrayBuffer()))
    } catch (error) {
      console.error('deskfit: request failed', error)
      res.writeHead(500, { 'content-type': 'application/json' })
      res.end('{"error":"internal error"}')
    }
  })
})

server.listen(port, host, () => console.log(`deskfit: listening on http://${host}:${port}, data in ${dbPath}`))

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close()
    db.close()
    process.exit(0)
  })
}
