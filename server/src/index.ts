// Cloudflare Worker entry: D1 for data, rate limits and replay protection, KV for cached boards.
import { cleanup, handle } from './app'
import type { Env } from './ports'

export default {
  fetch: (req: Request, env: unknown): Promise<Response> => handle(req, env as Env),
  // daily housekeeping (see the cron trigger in wrangler.toml)
  scheduled: (_event: unknown, env: unknown, ctx: { waitUntil(promise: Promise<unknown>): void }): void => {
    ctx.waitUntil(cleanup(env as Env))
  },
}
