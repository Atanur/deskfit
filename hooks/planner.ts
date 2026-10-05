import type { Ability, Equipment, Exercise, Goal, Kind, Level, Limit, Place, Profile, Progress, Region } from '../types'
import { byId, CATALOG } from './catalog'
import { dayKey, lastDays, weekRegions, withCredit } from './game'
import { credit, REGIONS, topRegion } from './muscles'

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced']
const RANK: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2 }

// How the week's work should be spread over the body, per goal. Shares sum to 1.
const SHARE: Record<Goal, Record<Region, number>> = {
  //            neck  shoulders back  arms  core  hips  thighs calves
  fitness: { neck: 0.06, shoulders: 0.14, back: 0.14, arms: 0.08, core: 0.18, hips: 0.14, thighs: 0.18, calves: 0.08 },
  weight: { neck: 0.04, shoulders: 0.1, back: 0.1, arms: 0.06, core: 0.2, hips: 0.18, thighs: 0.26, calves: 0.06 },
  strength: { neck: 0.04, shoulders: 0.18, back: 0.16, arms: 0.14, core: 0.16, hips: 0.12, thighs: 0.16, calves: 0.04 },
  posture: { neck: 0.16, shoulders: 0.16, back: 0.22, arms: 0.08, core: 0.12, hips: 0.16, thighs: 0.06, calves: 0.04 },
}

// And how the sets should mix: hard work, heart rate, loosening up, stretching.
const KINDS: Record<Goal, Record<Kind, number>> = {
  fitness: { strength: 0.45, cardio: 0.15, mobility: 0.25, stretch: 0.15 },
  weight: { strength: 0.35, cardio: 0.35, mobility: 0.15, stretch: 0.15 },
  strength: { strength: 0.65, cardio: 0.05, mobility: 0.15, stretch: 0.15 },
  posture: { strength: 0.25, cardio: 0.05, mobility: 0.4, stretch: 0.3 },
}

const FOCUS_BOOST = 1.8
const NO_REPEAT = ['push', 'pull', 'squat', 'hinge', 'core', 'rotate']

/** The goal's shares, with the regions the person asked for weighted up. */
export const shares = (goal: Goal, focus: Region[]): Record<Region, number> => {
  const raw = Object.fromEntries(REGIONS.map(r => [r, SHARE[goal][r] * (focus.includes(r) ? FOCUS_BOOST : 1)])) as Record<Region, number>
  const sum = REGIONS.reduce((n, r) => n + raw[r], 0)

  return Object.fromEntries(REGIONS.map(r => [r, raw[r] / sum])) as Record<Region, number>
}

/** Feedback pushes the level one step up or down once it is clear. */
export const shiftOf = (tweak: number): number => (tweak >= 3 ? 1 : tweak <= -3 ? -1 : 0)

export const levelFor = (p: Profile, tweak = 0): Level => {
  const base = p.abilities.length >= 4 ? 2 : p.abilities.length >= 2 ? 1 : 0

  return LEVELS[Math.min(2, Math.max(0, base + shiftOf(tweak)))] ?? 'beginner'
}

const bmi = (p: Profile): number | null =>
  p.heightCm ? p.weightKg / (p.heightCm / 100) ** 2 : null

/** Older users and higher body mass get lower impact and slightly shorter sets. */
const isGentle = (p: Profile): boolean => p.age >= 55 || (bmi(p) ?? 0) >= 30

export const secondsFor = (ex: Exercise, p: Profile): number =>
  Math.max(15, Math.round((ex.seconds * (isGentle(p) ? 0.8 : 1)) / 5) * 5)

const allowed = (ex: Exercise, p: Profile, prog: Progress, now: number, place: Place): boolean =>
  ex.places.includes(place) &&
  ex.equipment.every(q => p.equipment.includes(q)) &&
  RANK[ex.level] <= RANK[levelFor(p, prog.tweak)] &&
  ex.needs.every(n => p.abilities.includes(n)) &&
  !ex.avoidIf.some(l => p.limits.includes(l)) &&
  !(p.isQuiet && !ex.isQuiet) &&
  !(isGentle(p) && ex.isHighImpact) &&
  (prog.pain[ex.area] ?? 0) <= now

const EFFORT_BASE: Record<Level, number> = { beginner: 2, intermediate: 3, advanced: 3.5 }

const noise = (seed: string): number => {
  let h = 2166136261

  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)

  return ((h >>> 0) % 1000) / 1000
}

type Context = {
  share: Record<Region, number>
  kinds: Record<Kind, number>
  actual: Record<Region, number>
  kindNow: Record<Kind, number>
  load: Partial<Record<Region, number>>
  last: Exercise | undefined
  pushPull: number
  ideal: number
  level: Level
  /** While Claude works there is no time to catch your breath: hard moves are held back. */
  isDuringTurn: boolean
  /** 0 for a move not done lately, down to -0.8 for one done just now. */
  fresh: (id: string) => number
}

const contextOf = (p: Profile, prog: Progress, now: number, focus: Region[], isDuringTurn = false): Context => {
  const day = dayKey(now)
  const week = weekRegions(prog, day)
  const total = REGIONS.reduce((n, r) => n + (week[r] ?? 0), 0)
  const recent = prog.recent.map(id => byId(id)).filter((x): x is Exercise => x !== undefined)
  const last = recent[recent.length - 1]
  const [yesterday = day, today = day] = lastDays(day, 2)
  const kindNow = { strength: 0, cardio: 0, mobility: 0, stretch: 0 }

  for (const x of recent) kindNow[x.kind] += 1 / Math.max(recent.length, 1)

  const load: Partial<Record<Region, number>> = {}

  for (const r of REGIONS) load[r] = (prog.loads[today]?.[r] ?? 0) + 0.5 * (prog.loads[yesterday]?.[r] ?? 0)

  const pulls = recent.filter(x => x.pattern === 'pull').length
  const pushes = recent.filter(x => x.pattern === 'push').length
  const level = levelFor(p, prog.tweak)
  const wave = last ? (last.effort >= 4 ? -1.5 : last.effort <= 1 ? 0.5 : 0) : 0

  return {
    share: shares(p.goal, focus),
    kinds: KINDS[p.goal],
    actual: Object.fromEntries(REGIONS.map(r => [r, total > 0 ? (week[r] ?? 0) / total : 0])) as Record<Region, number>,
    kindNow,
    load,
    last,
    pushPull: Math.max(-3, Math.min(3, pulls - pushes)),
    fresh: id => {
      const at = prog.recent.lastIndexOf(id)

      return at === -1 ? 0.2 : -0.8 * (at / Math.max(prog.recent.length - 1, 1))
    },
    ideal: EFFORT_BASE[level] + wave + (prog.today.sets === 0 ? -1 : 0) - (isDuringTurn ? 1 : 0),
    level,
    isDuringTurn,
  }
}

/** How far behind its share a region is this week; negative when it has had more than its share. */
const gap = (c: Context, r: Region): number => c.share[r] - c.actual[r]

const scoreOf = (ex: Exercise, c: Context, seed: string): number => {
  const cr = credit(ex.muscles)
  let need = 0
  let tired = 0

  for (const r of REGIONS) {
    const n = cr[r] ?? 0

    need += n * (Math.max(-0.15, gap(c, r)) * 5 + Math.max(-0.5, Math.min(1, gap(c, r) / Math.max(c.share[r], 0.05))) * 0.4)
    tired += n * Math.min(c.load[r] ?? 0, 4)
  }

  const rest = ex.kind === 'strength' || ex.kind === 'cardio' ? tired * 0.35 : 0
  const mix = (c.kinds[ex.kind] - c.kindNow[ex.kind]) * 3
  const balance = ex.pattern === 'push' ? c.pushPull * 0.2 : ex.pattern === 'pull' ? -c.pushPull * 0.2 : 0
  const effort = -Math.abs(ex.effort - c.ideal) * 0.35 - (c.isDuringTurn && ex.effort >= 4 ? 1 : 0)
  const fit = (ex.level === c.level ? 0.4 : 0) + (ex.equipment.length > 0 ? 0.15 : 0)

  return need - rest + mix + balance + effort + fit + c.fresh(ex.id) + noise(seed) * 0.5
}

export type Blocker =
  | { kind: 'place'; place: Place }
  | { kind: 'gear'; gear: Equipment[] }
  | { kind: 'ability'; ability: Ability[] }
  | { kind: 'limit'; limit: Limit[] }
  | { kind: 'level' }
  | { kind: 'quiet' }
  | { kind: 'impact' }
  | { kind: 'pain' }

/** Why a move is not in this person's plan right now; empty when it is. */
export const blockers = (ex: Exercise, p: Profile, prog: Progress, now: number, place: Place): Blocker[] => {
  const out: Blocker[] = []
  const gear = ex.equipment.filter(q => !p.equipment.includes(q))
  const ability = ex.needs.filter(n => !p.abilities.includes(n))
  const limit = ex.avoidIf.filter(l => p.limits.includes(l))

  if (!ex.places.includes(place)) out.push({ kind: 'place', place: ex.places[0] ?? 'home' })
  if (gear.length > 0) out.push({ kind: 'gear', gear })
  if (RANK[ex.level] > RANK[levelFor(p, prog.tweak)]) out.push({ kind: 'level' })
  if (ability.length > 0) out.push({ kind: 'ability', ability })
  if (limit.length > 0) out.push({ kind: 'limit', limit })
  if (p.isQuiet && !ex.isQuiet) out.push({ kind: 'quiet' })
  if (isGentle(p) && ex.isHighImpact) out.push({ kind: 'impact' })
  if ((prog.pain[ex.area] ?? 0) > now) out.push({ kind: 'pain' })

  return out
}

export const pick = (
  p: Profile,
  prog: Progress,
  now: number,
  skip: string[] = [],
  place: Place = 'office',
  focus: Region[] = [],
  isDuringTurn = false,
): Exercise => {
  const all = CATALOG.filter(ex => allowed(ex, p, prog, now, place))
  const fresh = all.filter(ex => !skip.includes(ex.id))
  const list = fresh.length > 0 ? fresh : all.length > 0 ? all : CATALOG.filter(ex => ex.id === 'eye-20')
  const c = contextOf(p, prog, now, focus, isDuringTurn)
  const recent = prog.recent.slice(-8)
  const last = c.last

  // From strict to loose: stop at the first rule set that leaves something to choose from.
  const rules: ((ex: Exercise) => boolean)[] = [
    ex => !recent.includes(ex.id) && !(last && NO_REPEAT.includes(ex.pattern) && ex.pattern === last.pattern) && !(last && topRegion(ex.muscles) === topRegion(last.muscles)),
    ex => !recent.includes(ex.id) && !(last && topRegion(ex.muscles) === topRegion(last.muscles)),
    ex => !recent.includes(ex.id),
    ex => ex.id !== last?.id,
    () => true,
  ]
  const pool = (rules.map(r => list.filter(r)).find(l => l.length > 0) ?? list)
  const seed = `${dayKey(now)}|${prog.today.sets}|${skip.join(',')}`

  let best = pool[0] ?? CATALOG[0]!
  let bestScore = -Infinity

  for (const ex of pool) {
    const score = scoreOf(ex, c, `${seed}|${ex.id}`)

    if (score > bestScore) {
      best = ex
      bestScore = score
    }
  }

  return best
}

/** The next few moves in order, each planned as if the one before was done. */
export const program = (
  p: Profile,
  prog: Progress,
  now: number,
  place: Place,
  count: number,
  focus: Region[] = [],
): Exercise[] => {
  const out: Exercise[] = []
  const day = dayKey(now)
  let cur = prog

  for (let i = 0; i < count; i++) {
    const ex = pick(p, cur, now, [], place, focus)

    out.push(ex)
    cur = { ...withCredit(cur, ex, day), today: { ...cur.today, sets: cur.today.sets + 1 } }
  }

  return out
}

export type Why = { text: string; region?: Region }

/** One line on why this move, for the card. */
export const why = (ex: Exercise, p: Profile, prog: Progress, now: number, focus: Region[] = []): Why => {
  const c = contextOf(p, prog, now, focus)
  const cr = credit(ex.muscles)
  const mains = REGIONS.filter(r => (cr[r] ?? 0) >= 1)
  const wanted = mains.find(r => focus.includes(r) && gap(c, r) > 0)

  if (wanted) return { text: 'You asked for extra {region} work', region: wanted }

  const behind = [...mains].sort((a, b) => gap(c, b) - gap(c, a))[0]

  if (behind && gap(c, behind) > 0.05) return { text: 'Your {region} is behind this week', region: behind }
  if (c.last && c.last.effort >= 4 && ex.effort <= 2) return { text: 'An easy one after the hard set' }
  if (prog.today.sets === 0 && ex.effort <= 2) return { text: 'A gentle start to the day' }

  return { text: 'Keeps your week balanced' }
}
