# DeskFit leaderboard server

The optional backend for DeskFit's leaderboards and teams. DeskFit works fully offline; this server is only used for the shared board.

The plugin ships with `https://deskfit-api.atanur.dev` as its default server. DeskFit downloads the public board when it opens (a plain
request that carries nothing about you), and sends your nickname, points, sets and finish times only after you choose to join. Age, weight,
height, goal and limits never leave the device. To use your own server, paste its URL under Settings -> Leaderboard, or set the
`backendUrl` plugin option for everyone on a machine (empty falls back to the public server).

A company can run its own board: the same API runs on either of two storage options. The SQL is identical (both are SQLite), so
there is one codebase and one test suite:

| | Cloudflare D1 | SQLite file |
|---|---|---|
| Runs on | Cloudflare Workers | any machine with Node 22.13+ or Docker |
| Data | D1 database (limits and replay protection too), KV for the board cache | one `.sqlite` file (limits and caches live in it too) |
| Good for | the public board, no servers to run | a company's private board, kept on its own disk |

## Cloudflare D1

Local test (the server refuses to run without an encryption key; `.dev.vars` is git-ignored):

    cd server && npm install --legacy-peer-deps
    printf 'SECRETS_KEY=%s\n' "$(openssl rand -hex 32)" > .dev.vars
    npx wrangler d1 execute deskfit --local --file=schema.sql
    npx wrangler dev --local --port 8787      # in one terminal
    npm run e2e                               # in another, from the repo root

Deploy (your own Cloudflare account):

    cd server
    npx wrangler d1 create deskfit            # put the id in wrangler.toml
    npx wrangler kv namespace create CACHE    # put the id in wrangler.toml
    npx wrangler d1 execute deskfit --remote --file=schema.sql
    openssl rand -hex 32 > ~/secrets-key && chmod 600 ~/secrets-key      # keep this copy safe: without the key every account is locked out
    npx wrangler secret put SECRETS_KEY < ~/secrets-key
    npx wrangler deploy

Change the `routes` entry in `wrangler.toml` to your own domain first (or remove it to use the `workers.dev` address).

Upgrading a database made before the hardening release: run `migrations/0002_hardening.sql` once
(`npx wrangler d1 execute deskfit --remote --file=migrations/0002_hardening.sql`), and set `SECRETS_KEY` before deploying.
Accounts created earlier keep working: their secret is encrypted the first time they sign in. A daily cron trigger
(see `wrangler.toml`) clears expired limits and nonces and deletes accounts that never sent a set within 30 days.

## SQLite file (no Cloudflare)

The process needs read and write access to the file and to the folder it sits in (SQLite keeps a journal next to it).
It checks this on start and says so if not.

    cd server && npm install --legacy-peer-deps && npm run build:node
    SECRETS_KEY=$(openssl rand -hex 32) DESKFIT_DB=/var/lib/deskfit/deskfit.sqlite PORT=8787 npm run start:node

Settings (environment variables): `SECRETS_KEY` (required, 64 hex characters; keep a copy, see below), `DESKFIT_DB` (default
`./deskfit.sqlite`), `PORT` (8787), `HOST` (127.0.0.1; use 0.0.0.0 in a container), `TRUST_PROXY=1` behind a reverse proxy,
`ADMIN_TOKEN`, `ADMIN_ALLOWED_IPS`, `BLOCKED_NICKNAME_WORDS` (see below). The daily housekeeping runs inside the process.

With Docker: `DESKFIT_SECRETS_KEY=$(openssl rand -hex 32) docker compose up -d` in `server/` (data in the `deskfit-data` volume).
Put HTTPS in front (Caddy, nginx, a load balancer): the Worker serves HTTPS itself, the Node server does not.

Back up by copying the file while the server is stopped, or with `sqlite3 deskfit.sqlite ".backup copy.sqlite"`.

## One shared server, private boards on top

One server can serve everyone. The public board lists all joined people. A **team** (a company, a department, friends) is a
private board on the same scores: whoever joins with the invite code sees the same points in their own list. The
creator owns the team and can copy or rotate the invite code, remove members and close the team. If the owner leaves or
deletes their account, the longest-standing member takes over.

## Operator tools

To remove an inappropriate account or check size, set an `ADMIN_TOKEN` of 16+ characters (Worker:
`npx wrangler secret put ADMIN_TOKEN`; Node: environment variable). Without it these routes do not exist.

    curl -H "Authorization: Bearer $ADMIN_TOKEN" https://<server>/admin/stats
    curl -X DELETE -H "Authorization: Bearer $ADMIN_TOKEN" https://<server>/admin/users/<nickname>

`ADMIN_ALLOWED_IPS` (comma-separated) limits `/admin` to those addresses; everyone else gets a 404 even with the token. On Cloudflare
you can also put `/admin/*` behind Cloudflare Access. Never put the token or any Cloudflare credential in the plugin or in a repository.

`BLOCKED_NICKNAME_WORDS` (comma-separated) lists words a nickname may not contain; look-alike spellings are folded first
(I, l, 1; O, 0; - and _), so a nickname that only swaps look-alike characters is refused as a copy of a taken one.

## How requests are secured

- **Transport.** The plugin only talks to `https://` servers (plain `http://` is accepted for `localhost` only), because sign-up sends
  the account secret. Responses carry `cache-control: no-store` and `x-content-type-options: nosniff`.
- **Secrets at rest.** Sign-up creates a random 256-bit secret on the device. The server stores it encrypted (AES-GCM, bound to the
  account id) with `SECRETS_KEY`, which lives only in the Worker's secrets or the server's environment, never in the database.
  A leaked database alone does not give anyone an account. Keep a copy of the key: without it every account is locked out.
- **Requests.** Every request carries an HMAC-SHA256 over method, path, timestamp, nonce and body hash. A replay is refused by an
  atomic insert of the nonce in the database (so it holds across regions) within a 5 minute clock window.
- **Points are computed by the server.** Limits: 8 sign-ups per IP address per hour (counted atomically in the database), 10 new
  teams and 20 invite-code attempts per account per hour, 30 sets a day, sets of 15 to 180 s, events no older than 3 days. A set
  must start after the previous one ended (the gap between finishes is at least its length), and the daily cap and that gap are
  checked inside the insert, so parallel requests cannot slip past them.
- **Input.** Bodies over 20 KB are refused before they are read. Team names are plain letters, digits, spaces and a few separators
  (no control or bidirectional characters). Nicknames are 3-20 of `A-Z a-z 0-9 _ -` and look-alikes are folded.
- The recovery code (Account screen) encodes the user id and secret. Anyone holding it controls the account.
- The secret is kept in the plugin's store file on the device, unencrypted. Treat that file like a password.

## Recommended Cloudflare settings (not set from code)

The Worker cannot protect itself from floods that reach it, because every authenticated request touches D1 and the free plan
has daily limits. In the Cloudflare dashboard, for your zone:

- **Rate limiting rules** (Security -> WAF): `POST /v1/register` to a few requests per minute per IP, and `/v1/*` overall to a
  generous per-IP ceiling. The application limit (8 sign-ups an hour) is the backstop, not the first line.
- **Notifications** (Notifications -> Add): usage and billing alerts for Workers and D1.
- **Cloudflare Access** (or `ADMIN_ALLOWED_IPS`) in front of `/admin/*`.
- **Web Analytics**: turn off automatic injection for the zone if you want a website on the same zone free of third-party scripts.

## API

| Route | Auth | |
|---|---|---|
| `GET /health` | none | liveness |
| `POST /v1/register` | none | create an account (nickname, secret) |
| `GET /v1/leaderboard?period=week\|all&limit=1..100` | none | the public board (cached for 60 s) |
| `POST /v1/events` | signed | send finished sets |
| `GET /v1/me`, `DELETE /v1/me` | signed | your totals and teams; delete the account |
| `POST /v1/teams`, `POST /v1/teams/join` | signed | create a team; join with an invite code |
| `GET /v1/teams/:id/leaderboard` | signed | a team's board |
| `DELETE /v1/teams/:id` | signed | leave (`?disband=1` closes it, owner only) |
| `POST /v1/teams/:id/rotate-code`, `POST /v1/teams/:id/remove` | signed, owner | new invite code; remove a member |
| `GET /admin/stats`, `DELETE /admin/users/:nickname` | bearer token | operator tools |
