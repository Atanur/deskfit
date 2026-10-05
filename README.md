# DeskFit

A Claude Code mod: short home workouts while Claude works, with a daily goal, streaks, badges and optional leaderboards.

- `hooks/`, `types/`, `.claude-plugin/`: the plugin (runs inside Claude Code)
- `server/`: optional Cloudflare Worker + D1 backend for leaderboards. Self-hostable, so a company can run its own.

Website: <https://deskfit.atanur.dev> (source in `site/`, served as static files by a Cloudflare Worker).

## Install

In Claude Code:

    /plugin marketplace add atanur/deskfit
    /plugin install deskfit@deskfit
    /workout

Then `/workout` opens DeskFit. Everything works offline. The public board is downloaded when DeskFit opens (a plain request, nothing about you); nothing about you is sent until you join a leaderboard.

## Develop the plugin

    claude --plugin-dir .

## Website

`site/public/` holds the static site (no build step). Deploy with `cd site && npx wrangler deploy`; the route in
`site/wrangler.toml` is `deskfit.atanur.dev`, so change it to your own domain first.

## Leaderboard server

Everything works offline. Leaderboards need a server and are opt-in per user. The plugin ships with
`https://deskfit-api.atanur.dev` as its default server (Cloudflare D1); the public board is downloaded when DeskFit opens, but nothing about you is sent until you join a board.
Change it in DeskFit Settings, or set `backendUrl` in the plugin config, to use your own. What a joined user shares:
nickname, points, sets and finish times. Age, weight, height, goal and limits never leave the device.

The same API runs on either of two storage options. The SQL is identical (both are SQLite), so there is one
codebase and one test suite:

| | Cloudflare D1 | SQLite file |
|---|---|---|
| Runs on | Cloudflare Workers | any machine with Node 22.13+ or Docker |
| Data | D1 database, KV for limits and caches | one `.sqlite` file (limits and caches live in it too) |
| Good for | the public board, no servers to run | a company's private board, kept on its own disk |

### Cloudflare D1

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

Upgrading a database made before the hardening release: run `migrations/0002_hardening.sql` once
(`npx wrangler d1 execute deskfit --remote --file=migrations/0002_hardening.sql`), and set `SECRETS_KEY` before deploying.
Accounts created earlier keep working: their secret is encrypted the first time they sign in. A daily cron trigger
(see `wrangler.toml`) clears expired limits and nonces and deletes accounts that never sent a set within 30 days.

### SQLite file (no Cloudflare)

The process needs read and write access to the file and to the folder it sits in (SQLite keeps a journal next to it).
It checks this on start and says so if not.

    cd server && npm install --legacy-peer-deps && npm run build:node
    SECRETS_KEY=$(openssl rand -hex 32) DESKFIT_DB=/var/lib/deskfit/deskfit.sqlite PORT=8787 npm run start:node

Settings (environment variables): `SECRETS_KEY` (required, 64 hex characters; keep a copy, see below), `DESKFIT_DB` (default
`./deskfit.sqlite`), `PORT` (8787), `HOST` (127.0.0.1; use 0.0.0.0 in a container), `TRUST_PROXY=1` behind a reverse proxy,
`ADMIN_TOKEN`, `ADMIN_ALLOWED_IPS`, `BLOCKED_NICKNAME_WORDS` (see below). The daily housekeeping runs inside the process.

With Docker: `DESKFIT_SECRETS_KEY=$(openssl rand -hex 32) docker compose up -d` in `server/` (data in the `deskfit-data` volume). Put HTTPS in front
(Caddy, nginx, a load balancer): the Worker serves HTTPS itself, the Node server does not.

Back up by copying the file while the server is stopped, or with `sqlite3 deskfit.sqlite ".backup copy.sqlite"`.

### One shared server, private boards on top

One server can serve everyone. The public board lists all joined people. A **team** (a company, a department, friends) is a
private board on the same scores: whoever joins with the invite code sees the same points in their own list. The
creator owns the team and can copy or rotate the invite code, remove members and close the team. If the owner leaves or
deletes their account, the longest-standing member takes over.

Operator tools (to remove an inappropriate account, check size) switch on only when you set an `ADMIN_TOKEN` of 16+
characters (Worker: `npx wrangler secret put ADMIN_TOKEN`; Node: environment variable):

    curl -H "Authorization: Bearer $ADMIN_TOKEN" https://<server>/admin/stats
    curl -X DELETE -H "Authorization: Bearer $ADMIN_TOKEN" https://<server>/admin/users/<nickname>

`ADMIN_ALLOWED_IPS` (comma-separated) limits `/admin` to those addresses; everyone else gets a 404 even with the token. On Cloudflare
you can also put `/admin/*` behind Cloudflare Access. Never put the token or any Cloudflare credential in the plugin or in a repository.

`BLOCKED_NICKNAME_WORDS` (comma-separated) lists words a nickname may not contain; look-alike spellings are folded first
(I, l, 1; O, 0; - and _), so a nickname that only swaps look-alike characters is refused as a copy of a taken one.

### Point the plugin at it

Set the default for everyone on a machine with the `backendUrl` plugin option, or let each person paste a URL under
Settings -> Leaderboard. Empty means leaderboards are off.

### How requests are secured

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
- Run your own server behind HTTPS. The Worker serves HTTPS itself, the Node server does not.

### Recommended Cloudflare settings (not set from code)

The Worker cannot protect itself from floods that reach it, because every authenticated request touches D1 and the free plan
has daily limits. In the Cloudflare dashboard, for your zone:

- **Rate limiting rules** (Security -> WAF): `POST /v1/register` to a few requests per minute per IP, and `/v1/*` overall to a
  generous per-IP ceiling. The application limit (8 sign-ups an hour) is the backstop, not the first line.
- **Notifications** (Notifications -> Add): usage and billing alerts for Workers and D1.
- **Cloudflare Access** (or `ADMIN_ALLOWED_IPS`) in front of `/admin/*`.
- **Web Analytics**: turn off automatic injection for the zone if you want the website free of third-party scripts.

## Moves: office, home, gear

64 moves. Each one knows where it suits and what it needs. **Office** moves are quiet and small (a chair, a desk or a wall is
enough). **Home** moves use the floor and more room. **Gear** moves only come up if you said you own the gear. A resistance band works at the office too; dumbbells, a kettlebell and a pull-up bar are home only (`npm run muscles` fails if an office move needs any of them). The Moves screen lists every move with its place, gear and why it is not in your plan. Pick the places you train and your gear during setup or under Settings -> Place and
gear, and switch between Office and Home on the home screen. To add a move: an entry in `hooks/catalog.ts`, its pose pair in
`hooks/art.ts`, a MET value in `hooks/calories.ts` and its Turkish text in `hooks/tr.ts` (`npm run i18n` checks the last one,
`npm run preview` shows the drawings).

## Illustrations

Three looks, picked under Settings -> Look and sound -> Illustrations:

- **Line art** (default): detailed line drawings of the exercises from [Workout Guide](https://github.com/bryllim/workout-guide)
  by Bryl Lim, built on [Everkinetic](https://github.com/everkinetic/data) artwork, licensed **CC BY-SA 4.0** (see `NOTICE.md`).
  About 40 of the moves have one; a move without a drawing shows none for now (office moves such as neck, wrist, eye and chair
  work). Three frames play one, two, three, two, drawn in the theme colour.
- **Abstract**: bold silhouettes made in code (`hooks/art.ts`) that highlight the muscles a move works. Every move has one.
- **Stick figure**: the first, thin look, also for every move.

Moves without a Workout Guide drawing use drawings made with an image model in the same style (`art-extra/`, see `NOTICE.md`; they
share the CC BY-SA 4.0 licence). The drawings are packed into `hooks/art-wg*.ts` by `npx tsx scripts/art/wg-build.mjs`; to add a
move that Workout Guide covers, put its slug in `scripts/art/wg-map.mjs`, then run `scripts/art/wg-fetch.mjs` and `wg-build.mjs`.

## How the next move is chosen

Every move lists the muscles it works (`hooks/muscles.ts`: main muscles count 1, helpers 0.5), its kind (strength, cardio, mobility, stretch), its movement pattern (push, pull, squat, hinge, core, rotate, move, release) and an effort from 1 to 5, taken from its MET value. Muscles roll up into eight body regions.

The planner (`hooks/planner.ts`) compares the last seven days with the goal's target share per region and favours the regions that are behind. Hard work in a region needs rest (strength and cardio count against it for about two days; stretches do not). It also keeps the mix of kinds close to the goal's, balances pushing and pulling, starts the day gently, follows a hard set with an easy one, and never repeats a move from the last eight sets, the same region, or the same movement pattern back to back. Regions picked under Settings > Focus regions get extra weight. The home screen says why a move was chosen and shows the next few.

`npm run plan` plays 14 simulated days for seven kinds of person and fails if the plan repeats itself, drifts from the goal's shares, or leans on a few moves. `npm run ui` runs the Pane render in plain Node against a stand-in engine, presses through every screen and filter, and fails on an exception, a duplicate key or a tree over 160 KB (the engine may refuse a huge one). `npm run muscles` checks the muscle table against the Workout Guide manifest.

## Languages

English and Turkish. Pick one under Settings -> Language and units. The English text of each message is its key:
`hooks/tr.ts` maps it to Turkish, and a text with no translation shows in English. `npm run i18n` lists texts that are
missing a translation or whose `{placeholders}` do not match. To add a language, add a table like `tr.ts`, extend `Lang`
in `hooks/i18n.ts` and the language list in `hooks/settings.ts`.

## Calories

Active calories per set = (MET - 1) x resting kcal per hour x hours. MET values are from the 2024 Adult Compendium of
Physical Activities (`hooks/calories.ts` lists the source of each); the resting rate comes from the Mifflin-St Jeor equation
using age, weight, height and (optional) sex. Estimates can be off by 20-30%.
