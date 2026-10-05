import type { Area, Exercise, Progress, Region } from '../types'
import { credit } from './muscles'

const pad = (n: number) => String(n).padStart(2, '0')

export const dayKey = (ms: number): string => {
  const d = new Date(ms)

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const prevDay = (key: string): string => {
  const [y = 1970, m = 1, d = 1] = key.split('-').map(Number)

  return dayKey(new Date(y, m - 1, d - 1).getTime())
}

export const emptyProgress = (day: string): Progress => ({
  xp: 0,
  totalSets: 0,
  totalSeconds: 0,
  streak: 0,
  bestStreak: 0,
  lastGoalDay: null,
  today: { day, sets: 0, seconds: 0 },
  history: {},
  recent: [],
  areas: {},
  pain: {},
  tweak: 0,
  badges: [],
  turnSets: 0,
  earlyBirds: 0,
  totalKcal: 0,
  kcalByDay: {},
  secondsByDay: {},
  regions: {},
  loads: {},
})

/** Fills fields added by later versions into progress saved by an older one. */
export const normalize = (saved: Partial<Progress> | undefined, day: string): Progress =>
  rollDay({ ...emptyProgress(day), ...saved }, day)

/** The last `n` day keys ending at `day`, oldest first. */
export const lastDays = (day: string, n: number): string[] => {
  const out = [day]

  while (out.length < n) out.unshift(prevDay(out[0] ?? day))

  return out
}

/** Sets per body area over the last seven days. */
export const weekAreas = (p: Progress, day: string): Partial<Record<Area, number>> => {
  const total: Partial<Record<Area, number>> = {}

  for (const k of lastDays(day, 7)) {
    for (const [a, n] of Object.entries(p.areas[k] ?? {})) {
      total[a as Area] = (total[a as Area] ?? 0) + (n ?? 0)
    }
  }

  return total
}

/** Starts a new day's counters when the date has changed. */
export const rollDay = (p: Progress, day: string): Progress =>
  p.today.day === day ? p : { ...p, today: { day, sets: 0, seconds: 0 } }

/** The streak as it stands today: a missed day ends it. */
export const liveStreak = (p: Progress, day: string): number =>
  p.lastGoalDay === day || p.lastGoalDay === prevDay(day) ? p.streak : 0

export const levelOf = (xp: number): number => 1 + Math.floor(Math.sqrt(xp / 50))
export const xpForLevel = (level: number): number => (level - 1) ** 2 * 50

export type RecordContext = { hour: number; isDuringTurn: boolean; kcal: number }

export type Recorded = { progress: Progress; xpGained: number; isGoalReached: boolean }

type RegionMap = Record<string, Partial<Record<Region, number>>>

const addCredit = (map: RegionMap, day: string, ex: Exercise): RegionMap => {
  const now = { ...map[day] }

  for (const [r, n] of Object.entries(credit(ex.muscles))) now[r as Region] = (now[r as Region] ?? 0) + n

  const next = { ...map, [day]: now }
  const keep = Object.keys(next).sort().slice(-14)

  return Object.fromEntries(keep.map(k => [k, next[k] ?? {}]))
}

/** Adds a finished move's credit to the region history. Strength and cardio also add to the load that needs rest. */
export const withCredit = (p: Progress, ex: Exercise, day: string): Progress => ({
  ...p,
  regions: addCredit(p.regions, day, ex),
  loads: ex.kind === 'strength' || ex.kind === 'cardio' ? addCredit(p.loads, day, ex) : p.loads,
  recent: [...p.recent, ex.id].slice(-30),
})

/** Region credit over the last 7 days. */
export const weekRegions = (p: Progress, day: string): Partial<Record<Region, number>> => {
  const total: Partial<Record<Region, number>> = {}

  for (const k of lastDays(day, 7)) {
    for (const [r, n] of Object.entries(p.regions[k] ?? {})) total[r as Region] = (total[r as Region] ?? 0) + (n ?? 0)
  }

  return total
}

export const recordSet = (
  before: Progress,
  ex: Exercise,
  seconds: number,
  dailySets: number,
  day: string,
  ctx: RecordContext,
): Recorded => {
  const p = rollDay(before, day)
  const sets = p.today.sets + 1
  const isGoalReached = sets === dailySets
  let streak = liveStreak(p, day)
  let lastGoalDay = p.lastGoalDay

  if (isGoalReached && lastGoalDay !== day) {
    streak += 1
    lastGoalDay = day
  }

  const xpGained = 10 + Math.round(seconds / 6) + (isGoalReached ? 25 : 0)
  const history = { ...p.history, [day]: sets }
  const keep = Object.keys(history).sort().slice(-60)
  const areas = { ...p.areas, [day]: { ...p.areas[day], [ex.area]: (p.areas[day]?.[ex.area] ?? 0) + 1 } }
  const keepAreas = Object.keys(areas).sort().slice(-14)
  const kcalByDay = { ...p.kcalByDay, [day]: Math.round(((p.kcalByDay[day] ?? 0) + ctx.kcal) * 100) / 100 }
  const credited = withCredit(p, ex, day)
  const secondsByDay = { ...p.secondsByDay, [day]: (p.secondsByDay[day] ?? 0) + seconds }
  const keepDays = Object.keys(secondsByDay).sort().slice(-60)

  return {
    xpGained,
    isGoalReached,
    progress: {
      ...p,
      xp: p.xp + xpGained,
      totalSets: p.totalSets + 1,
      totalSeconds: p.totalSeconds + seconds,
      streak,
      bestStreak: Math.max(p.bestStreak, streak),
      lastGoalDay,
      today: { day, sets, seconds: p.today.seconds + seconds },
      history: Object.fromEntries(keep.map(k => [k, history[k] ?? 0])),
      regions: credited.regions,
      loads: credited.loads,
      recent: credited.recent,
      areas: Object.fromEntries(keepAreas.map(k => [k, areas[k] ?? {}])),
      turnSets: p.turnSets + (ctx.isDuringTurn ? 1 : 0),
      earlyBirds: p.earlyBirds + (ctx.hour < 9 ? 1 : 0),
      totalKcal: Math.round((p.totalKcal + ctx.kcal) * 100) / 100,
      kcalByDay: Object.fromEntries(keepDays.map(k => [k, kcalByDay[k] ?? 0])),
      secondsByDay: Object.fromEntries(keepDays.map(k => [k, secondsByDay[k] ?? 0])),
    },
  }
}

export const clock = (s: number): string => `${Math.floor(s / 60)}:${pad(s % 60)}`
