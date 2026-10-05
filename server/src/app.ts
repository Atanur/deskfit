import type { Env } from './ports'

export type { Env }

type User = { id: string; nickname: string }
type StoredUser = User & { secret: string }

const DAY = 86400000
const MAX_EVENTS_PER_DAY = 30
const MIN_GAP_MS = 15000
const OVERLAP_SLACK_MS = 2000 // clock jitter allowed between one set's end and the next one's finish
const MIN_SECONDS = 15
const MAX_SECONDS = 180
const MAX_TEAMS_PER_USER = 5
const MAX_TEAM_MEMBERS = 200
const MAX_SIGNUPS_PER_IP_PER_HOUR = 8
const MAX_TEAM_CREATES_PER_HOUR = 10
const MAX_JOIN_ATTEMPTS_PER_HOUR = 20
const MAX_BODY_BYTES = 20000
const HOUR = 3600000
const NONCE_TTL_MS = 10 * 60000
const IDLE_ACCOUNT_DAYS = 30
const SEAL = 'enc1'
// printable letters and digits, spaces and a few separators: no control, invisible or bidirectional characters
const TEAM_NAME = /^[\p{L}\p{N} ._'&()-]{3,30}$/u
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const HEADERS = { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }

const json = (data: unknown, status = 200): Response => new Response(JSON.stringify(data), { status, headers: HEADERS })

const fail = (status: number, error: string): Response => json({ error }, status)

const hex = (bytes: ArrayBuffer | Uint8Array): string =>
  [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('')

const fromHex = (s: string): ArrayBuffer =>
  new Uint8Array((s.match(/../g) ?? []).map(h => parseInt(h, 16))).buffer as ArrayBuffer

const randomHex = (n: number): string => hex(crypto.getRandomValues(new Uint8Array(n)))

const sha256Hex = async (text: string): Promise<string> =>
  hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))

const hmacHex = async (secretHex: string, message: string): Promise<string> => {
  const key = await crypto.subtle.importKey('raw', fromHex(secretHex), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])

  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)))
}

const same = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false

  let diff = 0

  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)

  return diff === 0
}

const weekStart = (now: number): number => {
  const d = new Date(now)
  const day = (d.getUTCDay() + 6) % 7

  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - day * DAY
}

const pointsFor = (seconds: number): number => 10 + Math.round(seconds / 6)

/** Counts a hit on `key` inside a window; false once `max` is passed. One atomic statement, so it holds across regions. */
const hit = async (env: Env, key: string, max: number, windowMs: number): Promise<boolean> => {
  const now = Date.now()
  const row = await env.DB.prepare(
    `INSERT INTO limits (key, n, reset_at) VALUES (?, 1, ?)
     ON CONFLICT(key) DO UPDATE SET
       n = CASE WHEN reset_at <= ? THEN 1 ELSE n + 1 END,
       reset_at = CASE WHEN reset_at <= ? THEN ? ELSE reset_at END
     RETURNING n`,
  )
    .bind(key, now + windowMs, now, now, now + windowMs)
    .first<{ n: number }>()

  return (row?.n ?? 1) <= max
}

/** The key that account secrets are encrypted with, or null when the server was not given one. */
const sealKey = async (env: Env): Promise<CryptoKey | null> => {
  const raw = env.SECRETS_KEY ?? ''

  if (!/^[0-9a-f]{64}$/i.test(raw)) return null

  return crypto.subtle.importKey('raw', fromHex(raw.toLowerCase()), 'AES-GCM', false, ['encrypt', 'decrypt'])
}

const aad = (userId: string): ArrayBuffer => new TextEncoder().encode(userId).buffer as ArrayBuffer

/** AES-GCM, bound to the account id so a sealed secret cannot be moved to another row. */
const sealSecret = async (key: CryptoKey, userId: string, secretHex: string): Promise<string> => {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const sealed = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(userId) }, key, fromHex(secretHex))

  return `${SEAL}:${hex(iv)}:${hex(sealed)}`
}

/** The secret as 64 hex characters; rows written before encryption existed are plain hex and are sealed on first use. */
const openSecret = async (key: CryptoKey, userId: string, stored: string): Promise<string | null> => {
  if (!stored.startsWith(`${SEAL}:`)) return /^[0-9a-f]{64}$/.test(stored) ? stored : null

  const [, iv, data] = stored.split(':')

  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromHex(iv ?? ''), additionalData: aad(userId) }, key, fromHex(data ?? ''))

    return hex(plain)
  } catch {
    return null
  }
}

/** Nickname with look-alike characters folded (I, l and 1; O and 0; - and _), to refuse near-copies of a taken name. */
const skeleton = (nickname: string): string => nickname.toLowerCase().replace(/[il1]/g, 'l').replace(/[0o]/g, 'o').replace(/-/g, '_')

const isBlocked = (env: Env, key: string): boolean =>
  (env.BLOCKED_NICKNAME_WORDS ?? '')
    .split(',')
    .map(w => skeleton(w.trim()))
    .some(w => w.length > 0 && key.includes(w))

/** Verifies the HMAC headers; resolves the user or a ready error response. */
const authenticate = async (req: Request, env: Env, url: URL, body: string): Promise<User | Response> => {
  const id = req.headers.get('x-user') ?? ''
  const ts = Number(req.headers.get('x-ts'))
  const nonce = req.headers.get('x-nonce') ?? ''
  const sig = req.headers.get('x-sig') ?? ''

  if (!id || !nonce || nonce.length > 64 || !sig) return fail(401, 'missing credentials')
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > 5 * 60000) return fail(401, 'clock skew')

  const key = await sealKey(env)

  if (!key) return fail(503, 'server is not configured')

  const row = await env.DB.prepare('SELECT id, secret, nickname FROM users WHERE id = ?').bind(id).first<StoredUser>()

  if (!row) return fail(401, 'unknown user')

  const secret = await openSecret(key, row.id, row.secret)

  if (!secret) return fail(401, 'bad signature')

  const canonical = [req.method, url.pathname + url.search, ts, nonce, await sha256Hex(body)].join('\n')

  if (!same(await hmacHex(secret, canonical), sig)) return fail(401, 'bad signature')

  // one atomic insert: the second copy of a request finds the row already there, in any region
  const fresh = await env.DB.prepare('INSERT OR IGNORE INTO nonces (nonce, expires_at) VALUES (?, ?)')
    .bind(`${row.id}:${nonce}`, Date.now() + NONCE_TTL_MS)
    .run()

  if ((fresh.meta?.changes ?? 1) === 0) return fail(401, 'replay')

  if (!row.secret.startsWith(`${SEAL}:`)) {
    await env.DB.prepare('UPDATE users SET secret = ? WHERE id = ? AND secret = ?')
      .bind(await sealSecret(key, row.id, secret), row.id, row.secret)
      .run()
  }

  return { id: row.id, nickname: row.nickname }
}

const parse = (body: string): Record<string, unknown> | null => {
  try {
    const v = JSON.parse(body || '{}')

    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
  } catch {
    return null
  }
}

const register = async (req: Request, env: Env, body: string): Promise<Response> => {
  const data = parse(body)
  const ip = req.headers.get('cf-connecting-ip') ?? 'local'

  if (!data) return fail(400, 'bad json')

  const key = await sealKey(env)

  if (!key) return fail(503, 'server is not configured')

  const nickname = String(data.nickname ?? '')
  const secret = String(data.secret ?? '')

  if (!/^[A-Za-z0-9_-]{3,20}$/.test(nickname)) return fail(400, 'nickname must be 3-20 letters, digits, _ or -')
  if (!/^[0-9a-f]{64}$/.test(secret)) return fail(400, 'bad secret')

  const nickKey = skeleton(nickname)

  if (isBlocked(env, nickKey)) return fail(400, 'that nickname is not allowed')
  if (!(await hit(env, `register:${ip}`, MAX_SIGNUPS_PER_IP_PER_HOUR, HOUR))) return fail(429, 'too many sign-ups, try later')

  const id = randomHex(8)

  try {
    await env.DB.prepare('INSERT INTO users (id, secret, nickname, created_at, nick_key) VALUES (?, ?, ?, ?, ?)')
      .bind(id, await sealSecret(key, id, secret), nickname, Date.now(), nickKey)
      .run()
  } catch {
    return fail(409, 'nickname taken')
  }

  return json({ userId: id, nickname })
}

type Row = { nickname: string; points: number; sets: number }

const ranked = (rows: Row[]) => rows.map((r, i) => ({ rank: i + 1, ...r }))

const globalBoard = async (env: Env, period: string, limit: number): Promise<Response> => {
  const since = period === 'all' ? 0 : weekStart(Date.now())
  const key = `lb:${period}:${limit}`
  const cached = await env.CACHE.get(key)

  if (cached) return new Response(cached, { headers: HEADERS })

  const { results } = await env.DB.prepare(
    `SELECT u.nickname AS nickname, SUM(e.points) AS points, COUNT(*) AS sets
       FROM events e JOIN users u ON u.id = e.user_id
      WHERE e.at >= ?
      GROUP BY e.user_id
      ORDER BY points DESC, MIN(e.at) ASC
      LIMIT ?`,
  )
    .bind(since, limit)
    .all<Row>()
  const out = JSON.stringify({ period, rows: ranked(results) })

  await env.CACHE.put(key, out, { expirationTtl: 60 })

  return new Response(out, { headers: HEADERS })
}

const postEvents = async (env: Env, user: User, data: Record<string, unknown>): Promise<Response> => {
  const list = Array.isArray(data.events) ? data.events.slice(0, 20) : []
  const now = Date.now()
  const results: { id: string; status: string }[] = []

  const sorted = list
    .map(x => (x && typeof x === 'object' ? (x as Record<string, unknown>) : {}))
    .sort((a, b) => Number(a.at) - Number(b.at))

  for (const ev of sorted) {
    const id = String(ev.id ?? '')
    const exercise = String(ev.exercise ?? '')
    const seconds = Number(ev.seconds)
    const at = Number(ev.at)
    const reject = (reason: string) => results.push({ id, status: `rejected:${reason}` })

    if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) {
      reject('id')
      continue
    }
    if (!/^[a-z0-9-]{2,40}$/.test(exercise)) {
      reject('exercise')
      continue
    }
    if (!Number.isInteger(seconds) || seconds < MIN_SECONDS || seconds > MAX_SECONDS) {
      reject('seconds')
      continue
    }
    if (!Number.isInteger(at) || at < now - 3 * DAY || at > now + 5 * 60000) {
      reject('time')
      continue
    }
    if (await env.DB.prepare('SELECT 1 FROM events WHERE id = ?').bind(id).first()) {
      results.push({ id, status: 'duplicate' })
      continue
    }
    // A set must start after the previous one ended: the gap between finishes is at least this set's length.
    const minGap = Math.max(MIN_GAP_MS, seconds * 1000 - OVERLAP_SLACK_MS)
    const day = Math.floor(at / DAY) * DAY
    let isAdded = false

    try {
      // the daily cap and the gap are checked inside the insert, so parallel requests cannot slip past them
      const res = await env.DB.prepare(
        `INSERT INTO events (id, user_id, exercise, seconds, points, at)
         SELECT ?, ?, ?, ?, ?, ?
          WHERE (SELECT COUNT(*) FROM events WHERE user_id = ? AND at >= ? AND at < ?) < ?
            AND (SELECT COALESCE(MAX(at), 0) FROM events WHERE user_id = ?) <= ?`,
      )
        .bind(id, user.id, exercise, seconds, pointsFor(seconds), at, user.id, day, day + DAY, MAX_EVENTS_PER_DAY, user.id, at - minGap)
        .run()

      isAdded = (res.meta?.changes ?? 1) > 0
    } catch {
      results.push({ id, status: 'duplicate' })
      continue
    }

    if (isAdded) {
      results.push({ id, status: 'accepted' })
      continue
    }

    const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM events WHERE user_id = ? AND at >= ? AND at < ?')
      .bind(user.id, day, day + DAY)
      .first<{ n: number }>()

    reject((count?.n ?? 0) >= MAX_EVENTS_PER_DAY ? 'daily-cap' : 'too-fast')
  }

  return json({ results })
}

const me = async (env: Env, user: User): Promise<Response> => {
  const since = weekStart(Date.now())
  const totals = await env.DB.prepare(
    `SELECT COALESCE(SUM(points), 0) AS allPoints, COUNT(*) AS sets,
            COALESCE(SUM(CASE WHEN at >= ? THEN points ELSE 0 END), 0) AS weekPoints
       FROM events WHERE user_id = ?`,
  )
    .bind(since, user.id)
    .first<{ allPoints: number; sets: number; weekPoints: number }>()
  const weekPoints = totals?.weekPoints ?? 0
  const rank = await env.DB.prepare(
    `SELECT COUNT(*) + 1 AS rank FROM (
       SELECT user_id, SUM(points) AS p FROM events WHERE at >= ? GROUP BY user_id HAVING p > ?)`,
  )
    .bind(since, weekPoints)
    .first<{ rank: number }>()
  const { results: teams } = await env.DB.prepare(
    `SELECT t.id AS id, t.name AS name, t.invite_code AS inviteCode,
            (SELECT COUNT(*) FROM memberships WHERE team_id = t.id) AS members
       FROM memberships m JOIN teams t ON t.id = m.team_id
      WHERE m.user_id = ? ORDER BY m.joined_at`,
  )
    .bind(user.id)
    .all()

  return json({
    userId: user.id,
    nickname: user.nickname,
    weekPoints,
    allPoints: totals?.allPoints ?? 0,
    sets: totals?.sets ?? 0,
    weekRank: weekPoints > 0 ? (rank?.rank ?? null) : null,
    teams,
  })
}

const makeCode = (): string =>
  [...crypto.getRandomValues(new Uint8Array(8))].map(b => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')

const createTeam = async (env: Env, user: User, data: Record<string, unknown>): Promise<Response> => {
  const name = String(data.name ?? '').normalize('NFC').replace(/\s+/g, ' ').trim()

  if (!TEAM_NAME.test(name)) return fail(400, "team name must be 3-30 letters, digits, spaces or . _ - ' & ( )")
  if (!(await hit(env, `team:${user.id}`, MAX_TEAM_CREATES_PER_HOUR, HOUR))) return fail(429, 'too many teams, try later')

  const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM memberships WHERE user_id = ?').bind(user.id).first<{ n: number }>()

  if ((count?.n ?? 0) >= MAX_TEAMS_PER_USER) return fail(400, 'you are in too many teams')

  const id = randomHex(6)
  const inviteCode = makeCode()

  await env.DB.batch([
    env.DB.prepare('INSERT INTO teams (id, name, invite_code, created_by, created_at) VALUES (?, ?, ?, ?, ?)').bind(
      id, name, inviteCode, user.id, Date.now(),
    ),
    env.DB.prepare('INSERT INTO memberships (team_id, user_id, joined_at) VALUES (?, ?, ?)').bind(id, user.id, Date.now()),
  ])

  return json({ id, name, inviteCode, members: 1 })
}

const joinTeam = async (env: Env, user: User, data: Record<string, unknown>): Promise<Response> => {
  // every attempt counts, right or wrong, so guessing codes with throwaway accounts stays expensive
  if (!(await hit(env, `join:${user.id}`, MAX_JOIN_ATTEMPTS_PER_HOUR, HOUR))) return fail(429, 'too many attempts, try later')

  const code = String(data.inviteCode ?? '').trim().toUpperCase()
  const team = await env.DB.prepare('SELECT id, name, invite_code AS inviteCode FROM teams WHERE invite_code = ?')
    .bind(code)
    .first<{ id: string; name: string; inviteCode: string }>()

  if (!team) return fail(404, 'no team with that code')

  const joined = await env.DB.prepare('SELECT COUNT(*) AS n FROM memberships WHERE user_id = ?').bind(user.id).first<{ n: number }>()
  const size = await env.DB.prepare('SELECT COUNT(*) AS n FROM memberships WHERE team_id = ?').bind(team.id).first<{ n: number }>()

  if ((joined?.n ?? 0) >= MAX_TEAMS_PER_USER) return fail(400, 'you are in too many teams')
  if ((size?.n ?? 0) >= MAX_TEAM_MEMBERS) return fail(400, 'team is full')

  await env.DB.prepare('INSERT OR IGNORE INTO memberships (team_id, user_id, joined_at) VALUES (?, ?, ?)')
    .bind(team.id, user.id, Date.now())
    .run()

  return json({ id: team.id, name: team.name, inviteCode: team.inviteCode })
}

/** After someone leaves a team: pass ownership to the longest-standing member, or close an empty team. */
const settleTeam = async (env: Env, teamId: string, leftUserId: string): Promise<void> => {
  const next = await env.DB.prepare('SELECT user_id AS id FROM memberships WHERE team_id = ? ORDER BY joined_at ASC LIMIT 1')
    .bind(teamId)
    .first<{ id: string }>()

  if (!next) {
    await env.DB.prepare('DELETE FROM teams WHERE id = ?').bind(teamId).run()

    return
  }

  await env.DB.prepare('UPDATE teams SET created_by = ? WHERE id = ? AND created_by = ?').bind(next.id, teamId, leftUserId).run()
}

const leaveTeam = async (env: Env, user: User, teamId: string): Promise<Response> => {
  await env.DB.prepare('DELETE FROM memberships WHERE team_id = ? AND user_id = ?').bind(teamId, user.id).run()
  await settleTeam(env, teamId, user.id)

  return json({ ok: true })
}

type TeamRow = { id: string; name: string; inviteCode: string; createdBy: string }

const ownedTeam = async (env: Env, user: User, teamId: string): Promise<TeamRow | Response> => {
  const team = await env.DB.prepare('SELECT id, name, invite_code AS inviteCode, created_by AS createdBy FROM teams WHERE id = ?')
    .bind(teamId)
    .first<TeamRow>()

  if (!team) return fail(404, 'no such team')
  if (team.createdBy !== user.id) return fail(403, 'only the team owner can do that')

  return team
}

const rotateCode = async (env: Env, user: User, teamId: string): Promise<Response> => {
  const team = await ownedTeam(env, user, teamId)

  if (team instanceof Response) return team

  for (let attempt = 0; attempt < 5; attempt++) {
    const inviteCode = makeCode()

    try {
      await env.DB.prepare('UPDATE teams SET invite_code = ? WHERE id = ?').bind(inviteCode, teamId).run()

      return json({ inviteCode })
    } catch {
      // the code collided with another team's: draw a new one
    }
  }

  return fail(500, 'could not make a new code')
}

const removeMember = async (env: Env, user: User, teamId: string, data: Record<string, unknown>): Promise<Response> => {
  const team = await ownedTeam(env, user, teamId)

  if (team instanceof Response) return team

  const nickname = String(data.nickname ?? '')
  const target = await env.DB.prepare(
    'SELECT u.id AS id FROM users u JOIN memberships m ON m.user_id = u.id WHERE m.team_id = ? AND u.nickname = ?',
  )
    .bind(teamId, nickname)
    .first<{ id: string }>()

  if (!target) return fail(404, 'no such member')
  if (target.id === user.id) return fail(400, 'use leave to leave your own team')

  await env.DB.prepare('DELETE FROM memberships WHERE team_id = ? AND user_id = ?').bind(teamId, target.id).run()

  return json({ ok: true })
}

const disbandTeam = async (env: Env, user: User, teamId: string): Promise<Response> => {
  const team = await ownedTeam(env, user, teamId)

  if (team instanceof Response) return team

  await env.DB.batch([
    env.DB.prepare('DELETE FROM memberships WHERE team_id = ?').bind(teamId),
    env.DB.prepare('DELETE FROM teams WHERE id = ?').bind(teamId),
  ])

  return json({ ok: true })
}

const teamBoard = async (env: Env, user: User, teamId: string, period: string): Promise<Response> => {
  const member = await env.DB.prepare('SELECT 1 FROM memberships WHERE team_id = ? AND user_id = ?').bind(teamId, user.id).first()

  if (!member) return fail(403, 'not a member')

  const since = period === 'all' ? 0 : weekStart(Date.now())
  const { results } = await env.DB.prepare(
    `SELECT u.nickname AS nickname, COALESCE(SUM(e.points), 0) AS points, COUNT(e.id) AS sets
       FROM memberships m
       JOIN users u ON u.id = m.user_id
       LEFT JOIN events e ON e.user_id = u.id AND e.at >= ?
      WHERE m.team_id = ?
      GROUP BY u.id
      ORDER BY points DESC, u.nickname ASC`,
  )
    .bind(since, teamId)
    .all<Row>()

  const team = await env.DB.prepare('SELECT id, name, invite_code AS inviteCode, created_by AS createdBy FROM teams WHERE id = ?')
    .bind(teamId)
    .first<TeamRow>()

  return json({
    period,
    total: results.reduce((n, r) => n + r.points, 0),
    team: team && { id: team.id, name: team.name, inviteCode: team.inviteCode, isOwner: team.createdBy === user.id, members: results.length },
    rows: ranked(results),
  })
}

const removeUser = async (env: Env, userId: string): Promise<void> => {
  const { results } = await env.DB.prepare('SELECT team_id AS id FROM memberships WHERE user_id = ?').bind(userId).all<{ id: string }>()

  await env.DB.batch([
    env.DB.prepare('DELETE FROM events WHERE user_id = ?').bind(userId),
    env.DB.prepare('DELETE FROM memberships WHERE user_id = ?').bind(userId),
    env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId),
  ])

  for (const t of results) await settleTeam(env, t.id, userId)
}

const deleteMe = async (env: Env, user: User): Promise<Response> => {
  await removeUser(env, user.id)

  return json({ ok: true })
}

/** Operator tools, behind a bearer token set as ADMIN_TOKEN. Without the token they do not exist. */
const admin = async (req: Request, env: Env, url: URL): Promise<Response> => {
  const token = env.ADMIN_TOKEN ?? ''
  const given = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')

  const allowed = (env.ADMIN_ALLOWED_IPS ?? '').split(',').map(x => x.trim()).filter(Boolean)

  if (allowed.length > 0 && !allowed.includes(req.headers.get('cf-connecting-ip') ?? '')) return fail(404, 'not found')
  if (token.length < 16 || !same(given, token)) return fail(404, 'not found')

  if (req.method === 'GET' && url.pathname === '/admin/stats') {
    const count = async (table: string) =>
      (await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{ n: number }>())?.n ?? 0

    return json({ users: await count('users'), events: await count('events'), teams: await count('teams') })
  }

  const m = /^\/admin\/users\/([A-Za-z0-9_-]{3,20})$/.exec(url.pathname)

  if (m && req.method === 'DELETE') {
    const user = await env.DB.prepare('SELECT id FROM users WHERE nickname = ?').bind(m[1] ?? '').first<{ id: string }>()

    if (!user) return fail(404, 'no such user')

    await removeUser(env, user.id)

    return json({ ok: true })
  }

  return fail(404, 'not found')
}

/** Reads at most MAX_BODY_BYTES, so an oversized body is never held in memory. Null when it is too large. */
const readBody = async (req: Request): Promise<string | null> => {
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) return null
  if (!req.body) return ''

  const reader = req.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0

  for (;;) {
    const { done, value } = await reader.read()

    if (done) break

    size += value.byteLength

    if (size > MAX_BODY_BYTES) {
      await reader.cancel()

      return null
    }

    chunks.push(value)
  }

  const all = new Uint8Array(size)
  let at = 0

  for (const c of chunks) {
    all.set(c, at)
    at += c.byteLength
  }

  return new TextDecoder().decode(all)
}

/** Housekeeping, run daily: expired limits and nonces, and accounts that never sent a set in IDLE_ACCOUNT_DAYS. */
export const cleanup = async (env: Env, now = Date.now()): Promise<{ accounts: number }> => {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM limits WHERE reset_at <= ?').bind(now),
    env.DB.prepare('DELETE FROM nonces WHERE expires_at <= ?').bind(now),
  ])

  const { results } = await env.DB.prepare(
    'SELECT u.id AS id FROM users u WHERE u.created_at < ? AND NOT EXISTS (SELECT 1 FROM events e WHERE e.user_id = u.id) LIMIT 200',
  )
    .bind(now - IDLE_ACCOUNT_DAYS * DAY)
    .all<{ id: string }>()

  for (const u of results) await removeUser(env, u.id)

  return { accounts: results.length }
}

/** The whole API: one function from a request to a response, over any Database and Cache. */
export const handle = async (req: Request, env: Env): Promise<Response> => {
  const url = new URL(req.url)
  const { pathname } = url
  const body = req.method === 'GET' || req.method === 'DELETE' ? '' : await readBody(req)

  if (body === null) return fail(413, 'too large')
  if (pathname === '/health') return json({ ok: true })
  if (pathname.startsWith('/admin/')) return admin(req, env, url)

  if (req.method === 'POST' && pathname === '/v1/register') return register(req, env, body)

  if (req.method === 'GET' && pathname === '/v1/leaderboard') {
    const period = url.searchParams.get('period') === 'all' ? 'all' : 'week'
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 20) || 20, 1), 100)

    return globalBoard(env, period, limit)
  }

  if (!pathname.startsWith('/v1/')) return fail(404, 'not found')

  const auth = await authenticate(req, env, url, body)

  if (auth instanceof Response) return auth

  const data = parse(body)

  if (!data) return fail(400, 'bad json')

  if (req.method === 'POST' && pathname === '/v1/events') return postEvents(env, auth, data)
  if (req.method === 'GET' && pathname === '/v1/me') return me(env, auth)
  if (req.method === 'DELETE' && pathname === '/v1/me') return deleteMe(env, auth)
  if (req.method === 'POST' && pathname === '/v1/teams') return createTeam(env, auth, data)
  if (req.method === 'POST' && pathname === '/v1/teams/join') return joinTeam(env, auth, data)

  const m = /^\/v1\/teams\/([0-9a-f]{12})(\/leaderboard)?$/.exec(pathname)

  if (m && m[2] && req.method === 'GET') {
    return teamBoard(env, auth, m[1] ?? '', url.searchParams.get('period') === 'all' ? 'all' : 'week')
  }
  if (m && !m[2] && req.method === 'DELETE') {
    return url.searchParams.get('disband') === '1' ? disbandTeam(env, auth, m[1] ?? '') : leaveTeam(env, auth, m[1] ?? '')
  }

  const own = /^\/v1\/teams\/([0-9a-f]{12})\/(rotate-code|remove)$/.exec(pathname)

  if (own && req.method === 'POST') {
    return own[2] === 'rotate-code' ? rotateCode(env, auth, own[1] ?? '') : removeMember(env, auth, own[1] ?? '', data)
  }

  return fail(404, 'not found')
}
