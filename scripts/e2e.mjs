// End-to-end check of the Worker (run `npm run dev` in server/ first).
// Usage: node --experimental-strip-types scripts/e2e.mjs [baseUrl]
import { randomHex, signHeaders, encodeRecovery, decodeRecovery } from '../hooks/net.ts'

const base = process.argv[2] ?? 'http://localhost:8787'
let failed = 0
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`)
  if (!ok) failed++
}

// Each test account gets its own made-up address (the server trusts cf-connecting-ip, which Cloudflare overwrites in production),
// so sign-up limits do not trip over each other. The limit itself is tested with one shared address below.
const fakeIp = () => `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`

const call = async (user, method, path, body, extraHeaders = {}) => {
  const text = body === undefined ? '' : JSON.stringify(body)
  const headers = user
    ? await signHeaders(user.id, user.secret, method, path, text, Date.now(), randomHex(12))
    : {}
  const res = await fetch(base + path, { method, headers: { ...headers, ...extraHeaders }, body: text || undefined })
  return { status: res.status, data: await res.json().catch(() => null) }
}

const make = async (name, ip = fakeIp()) => {
  const secret = randomHex(32)
  // the Node server reads x-forwarded-for when started with TRUST_PROXY=1, Cloudflare sets cf-connecting-ip itself
  const r = await call(null, 'POST', '/v1/register', { nickname: name, secret }, { 'cf-connecting-ip': ip, 'x-forwarded-for': ip })
  return { r, user: { id: r.data?.userId, secret } }
}

const tag = randomHex(3)
const a = await make(`ann_${tag}`)
const b = await make(`bob_${tag}`)
check('register ann', a.r.status === 200, JSON.stringify(a.r))
check('register bob', b.r.status === 200)
check('duplicate nickname rejected', (await make(`ANN_${tag}`)).r.status === 409)
check('bad nickname rejected', (await call(null, 'POST', '/v1/register', { nickname: 'x', secret: randomHex(32) })).status === 400)

const now = Date.now()
const ev = (offsetMin, seconds = 40) => ({ id: crypto.randomUUID(), exercise: 'chair-squat', seconds, at: now - offsetMin * 60000 })
const e1 = ev(30), e2 = ev(20), e3 = ev(19.9)
const post = await call(a.user, 'POST', '/v1/events', { events: [e1, e2, e3, { ...ev(10), seconds: 5 }] })
const st = Object.fromEntries(post.data.results.map(x => [x.id, x.status]))
check('events accepted', st[e1.id] === 'accepted' && st[e2.id] === 'accepted', JSON.stringify(post.data))
check('too-fast rejected', st[e3.id] === 'rejected:too-fast')
check('short set rejected', post.data.results.some(x => x.status === 'rejected:seconds'))
const again = await call(a.user, 'POST', '/v1/events', { events: [e1] })
check('duplicate id ignored', again.data.results[0].status === 'duplicate')
check('future event rejected', (await call(a.user, 'POST', '/v1/events', { events: [{ ...ev(0), at: now + 3600000 }] })).data.results[0].status === 'rejected:time')

check('unsigned request rejected', (await call(null, 'GET', '/v1/me')).status === 401)
check('wrong secret rejected', (await call({ id: a.user.id, secret: randomHex(32) }, 'GET', '/v1/me')).status === 401)

const meA = await call(a.user, 'GET', '/v1/me')
check('me shows points', meA.data?.weekPoints === 2 * (10 + Math.round(40 / 6)), JSON.stringify(meA.data))

const lb = await call(null, 'GET', '/v1/leaderboard?period=week&limit=10')
check('public leaderboard lists ann', lb.data.rows.some(r => r.nickname === `ann_${tag}`))

const team = await call(a.user, 'POST', '/v1/teams', { name: 'Night Owls' })
check('team created', team.status === 200 && team.data.inviteCode?.length === 8, JSON.stringify(team))
check('bob cannot read team board', (await call(b.user, 'GET', `/v1/teams/${team.data.id}/leaderboard`)).status === 403)
check('bob joins by code', (await call(b.user, 'POST', '/v1/teams/join', { inviteCode: team.data.inviteCode.toLowerCase() })).status === 200)
const tb = await call(b.user, 'GET', `/v1/teams/${team.data.id}/leaderboard`)
check('team board has both members', tb.data?.rows?.length === 2 && tb.data.rows[0].nickname === `ann_${tag}`, JSON.stringify(tb.data))
check('bad invite code', (await call(b.user, 'POST', '/v1/teams/join', { inviteCode: 'NOPE0000' })).status === 404)

// team ownership
const teamId = team.data.id
check('board reports the owner', tb.data.team?.name === 'Night Owls' && tb.data.team.isOwner === false && tb.data.team.members === 2, JSON.stringify(tb.data.team))
const annBoard = await call(a.user, 'GET', `/v1/teams/${teamId}/leaderboard`)
check('owner sees isOwner', annBoard.data.team?.isOwner === true && annBoard.data.total === meA.data.weekPoints, JSON.stringify(annBoard.data.team))
check('member cannot rotate the code', (await call(b.user, 'POST', `/v1/teams/${teamId}/rotate-code`, {})).status === 403)
check('member cannot remove anyone', (await call(b.user, 'POST', `/v1/teams/${teamId}/remove`, { nickname: `ann_${tag}` })).status === 403)
check('member cannot disband', (await call(b.user, 'DELETE', `/v1/teams/${teamId}?disband=1`)).status === 403)
const rotated = await call(a.user, 'POST', `/v1/teams/${teamId}/rotate-code`, {})
check('owner rotates the code', rotated.status === 200 && rotated.data.inviteCode.length === 8 && rotated.data.inviteCode !== team.data.inviteCode)
const c = await make(`cem_${tag}`)
check('old code no longer works', (await call(c.user, 'POST', '/v1/teams/join', { inviteCode: team.data.inviteCode })).status === 404)
check('new code works', (await call(c.user, 'POST', '/v1/teams/join', { inviteCode: rotated.data.inviteCode })).status === 200)
check('owner cannot remove self', (await call(a.user, 'POST', `/v1/teams/${teamId}/remove`, { nickname: `ann_${tag}` })).status === 400)
check('owner removes a member', (await call(a.user, 'POST', `/v1/teams/${teamId}/remove`, { nickname: `cem_${tag}` })).status === 200)
check('removed member loses access', (await call(c.user, 'GET', `/v1/teams/${teamId}/leaderboard`)).status === 403)
check('owner leaves, bob takes over', (await call(a.user, 'DELETE', `/v1/teams/${teamId}`)).status === 200 && (await call(b.user, 'GET', `/v1/teams/${teamId}/leaderboard`)).data.team?.isOwner === true)
check('new owner disbands', (await call(b.user, 'DELETE', `/v1/teams/${teamId}?disband=1`)).status === 200)
check('disbanded team is gone', (await call(b.user, 'GET', `/v1/teams/${teamId}/leaderboard`)).status === 403)
check('cem deletes account', (await call(c.user, 'DELETE', '/v1/me')).status === 200)

const code = encodeRecovery(a.user.id, a.user.secret)
const back = decodeRecovery(code)
check('recovery code round-trips', back?.userId === a.user.id && back?.secret === a.user.secret, code)
check('corrupt recovery code rejected', decodeRecovery(code.slice(0, -2) + 'AA') === null)
check('recovered credentials work', (await call(back && { id: back.userId, secret: back.secret }, 'GET', '/v1/me')).status === 200)

check('ann deletes account', (await call(a.user, 'DELETE', '/v1/me')).status === 200)
check('deleted account locked out', (await call(a.user, 'GET', '/v1/me')).status === 401)
check('bob deletes account', (await call(b.user, 'DELETE', '/v1/me')).status === 200)

// ---- hardening ----
const sec = await make(`sec_${tag}`)
check('security account registered', sec.r.status === 200, JSON.stringify(sec.r))

const health = await fetch(base + '/health')
check('responses are not cached and not sniffed', health.headers.get('cache-control') === 'no-store' && health.headers.get('x-content-type-options') === 'nosniff')

const board = await fetch(base + '/v1/leaderboard?period=week&limit=5')
check('public board can be read by a web page (CORS)', board.headers.get('access-control-allow-origin') === '*')
const signed = await fetch(base + '/v1/me')
check('private routes do not open up to web pages', signed.headers.get('access-control-allow-origin') === null)

const oversized = await fetch(base + '/v1/register', { method: 'POST', body: JSON.stringify({ nickname: 'x'.repeat(30000) }) })
check('oversized body rejected', oversized.status === 413)

// near-copies of a taken nickname are refused: I, l and 1 look alike, and so do O and 0
const eyes = await make(`i1_${tag}`)
const rings = await make(`o0_${tag}`)
check('first of a look-alike pair registers', eyes.r.status === 200 && rings.r.status === 200, JSON.stringify([eyes.r, rings.r]))
check('I, l and 1 fold together', (await make(`Il_${tag}`)).r.status === 409)
check('O and 0 fold together', (await make(`0o_${tag}`)).r.status === 409)
await call(eyes.user, 'DELETE', '/v1/me')
await call(rings.user, 'DELETE', '/v1/me')

// a signed request cannot be replayed
const sample = { method: 'GET', path: '/v1/me' }
const replayHeaders = await signHeaders(sec.user.id, sec.user.secret, sample.method, sample.path, '', Date.now(), randomHex(12))
const first = await fetch(base + sample.path, { headers: replayHeaders })
const second = await fetch(base + sample.path, { headers: replayHeaders })
check('request accepted once', first.status === 200)
check('same request refused the second time', second.status === 401)

// sets may not overlap: a 60 s set needs about a minute before the next finish
const t0 = Date.now() - 30 * 60000
const sets = [
  { id: crypto.randomUUID(), exercise: 'plank', seconds: 60, at: t0 },
  { id: crypto.randomUUID(), exercise: 'plank', seconds: 60, at: t0 + 30000 },
  { id: crypto.randomUUID(), exercise: 'plank', seconds: 60, at: t0 + 61000 },
]
const overlap = await call(sec.user, 'POST', '/v1/events', { events: sets })
const kinds = Object.fromEntries(overlap.data.results.map(x => [x.id, x.status]))
check('first long set accepted', kinds[sets[0].id] === 'accepted', JSON.stringify(overlap.data))
check('overlapping set refused', kinds[sets[1].id] === 'rejected:too-fast', JSON.stringify(overlap.data))
check('set after it ended accepted', kinds[sets[2].id] === 'accepted', JSON.stringify(overlap.data))

// team names: plain text only
check('hidden bidi character in a team name refused', (await call(sec.user, 'POST', '/v1/teams', { name: 'Evil‮team' })).status === 400)
check('too short team name refused', (await call(sec.user, 'POST', '/v1/teams', { name: 'ab' })).status === 400)
check('unicode letters allowed in a team name', (await call(sec.user, 'POST', '/v1/teams', { name: 'Güneş Takımı' })).status === 200)

// guessing invite codes is limited
let guessStatus = 0
for (let i = 0; i < 22; i++) guessStatus = (await call(sec.user, 'POST', '/v1/teams/join', { inviteCode: `GUESS${String(i).padStart(3, '0')}` })).status
check('invite code guessing is rate limited', guessStatus === 429, String(guessStatus))

// sign-ups from one address are limited
const shared = fakeIp()
const statuses = []
for (let i = 0; i < 10; i++) statuses.push((await make(`flood${i}_${tag}`, shared)).r.status)
check('sign-ups from one address are limited', statuses.includes(429) && statuses.slice(0, 5).every(s => s === 200), statuses.join(','))
check('limited sign-up leaves earlier ones working', statuses.filter(s => s === 200).length === 8, statuses.join(','))
check('security account deletes itself', (await call(sec.user, 'DELETE', '/v1/me')).status === 200)

const adminToken = process.env.E2E_ADMIN_TOKEN

if (adminToken) {
  const adm = async (method, path, token = adminToken) => {
    const res = await fetch(base + path, { method, headers: { authorization: `Bearer ${token}` } })
    return { status: res.status, data: await res.json().catch(() => null) }
  }
  const victim = await make(`vic_${tag}`)
  check('admin stats with token', (await adm('GET', '/admin/stats')).data?.users >= 1)
  check('admin hidden without token', (await adm('GET', '/admin/stats', 'x'.repeat(20))).status === 404)
  check('admin deletes a user', (await adm('DELETE', `/admin/users/vic_${tag}`)).status === 200)
  check('deleted by admin, locked out', (await call(victim.user, 'GET', '/v1/me')).status === 401)
}

console.log(failed === 0 ? '\nall checks passed' : `\n${failed} check(s) failed`)
process.exit(failed === 0 ? 0 : 1)
