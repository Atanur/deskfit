import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type {
  Ability,
  ActiveSet,
  Equipment,
  Exercise,
  Draft,
  BoardRow,
  Goal,
  Identity,
  LastResult,
  Library,
  Limit,
  Place,
  Profile,
  Progress,
  Region,
  Screen,
  Sex,
  DeskSettings,
  Social,
} from '../types'
import {
  badgesSvg,
  barsSvg,
  regionBarsSvg,
  confettiSvg,
  avatarSvg,
  celebrateSvg,
  emptySvg,
  figureSvg,
  figureText,
  flameSvg,
  iconSvg,
  ICON_TEXT,
  levelBarSvg,
  logoSvg,
  medalSvg,
  podiumSvg,
  rankSvg,
  ringSvg,
  setTheme,
  stepsSvg,
  timerSvg,
  weekDotsSvg,
  xpBarSvg,
} from './art'
import type { IconName } from './art'
import { BADGES, award, badgeName } from './badges'
import { byId, CATALOG } from './catalog'
import { fmtKcal, fmtMinutes, kcalFor } from './calories'
import {
  clock,
  dayKey,
  emptyProgress,
  levelOf,
  liveStreak,
  normalize,
  recordSet,
  rollDay,
  weekAreas,
  weekRegions,
  xpForLevel,
} from './game'
import { decodeRecovery, encodeRecovery, randomHex, signHeaders } from './net'
import { tr } from './i18n'
import type { Vars } from './i18n'
import { mainRegions, REGION_LABEL, REGIONS, topRegion } from './muscles'
import { blockers, levelFor, pick, program, secondsFor, shares, why } from './planner'
import {
  ACCENTS,
  CM_PER_IN,
  DAILY_GOALS,
  DEFAULT_SETTINGS,
  ILLUSTRATIONS,
  KG_PER_LB,
  LANGUAGES,
  NUDGE_DELAYS,
  TOASTS,
  UNITS,
  withDefaults,
} from './settings'
import { soundOf } from './sound'
import type { SoundKind } from './sound'

const PANE = 'deskfit'
const WEEK_MS = 7 * 86400000

type Dollar = EngineInterface
type Rating = 'easy' | 'right' | 'hard' | 'hurts'

const emptyDraft: Draft = {
  step: 0,
  age: '',
  weight: '',
  height: '',
  sex: 'unspecified',
  goal: 'fitness',
  abilities: [],
  limits: [],
  dailySets: 5,
  isQuiet: false,
  places: ['office', 'home'],
  equipment: [],
  error: null,
}

const screen = atom({ plugin: 'deskfit', key: 'screen' } as const, 'onboarding' as Screen)
const isLoaded = atom({ plugin: 'deskfit', key: 'isLoaded' } as const, false)
const profile = atom({ plugin: 'deskfit', key: 'profile' } as const, null as Profile | null)
const progress = atom({ plugin: 'deskfit', key: 'progress' } as const, emptyProgress('') as Progress)
const draft = atom({ plugin: 'deskfit', key: 'draft' } as const, emptyDraft)
const current = atom({ plugin: 'deskfit', key: 'current' } as const, null as ActiveSet | null)
const result = atom({ plugin: 'deskfit', key: 'result' } as const, null as LastResult | null)
const isBusy = atom({ plugin: 'deskfit', key: 'isBusy' } as const, false)
const nudge = atom({ plugin: 'deskfit', key: 'nudge' } as const, null as string | null)
const focusUntil = atom({ plugin: 'deskfit', key: 'focusUntil' } as const, null as number | null)

const emptySocial: Social = {
  tab: 'week',
  view: 'board',
  rows: [],
  teams: [],
  activeTeam: null,
  teamInfo: null,
  teamTotal: 0,
  teamPeriod: 'week',
  isConfirmingDisband: false,
  me: null,
  isLoading: false,
  error: null,
  notice: null,
  form: { nickname: '', teamName: '', invite: '', recovery: '' },
  recoveryCode: null,
  isConfirmingDelete: false,
}

const settings = atom({ plugin: 'deskfit', key: 'prefs' } as const, withDefaults(undefined, {}))
const upNext = atom({ plugin: 'deskfit', key: 'upNext' } as const, null as string | null)
const identity = atom({ plugin: 'deskfit', key: 'identity' } as const, null as Identity | null)
const social = atom({ plugin: 'deskfit', key: 'social' } as const, emptySocial)
const library = atom({ plugin: 'deskfit', key: 'library' } as const, { region: 'all', place: 'all', isMine: false, shown: 4 } as Library)

/** Moves the person has passed on since the last set, so a shuffle never goes back to them. */
let passed: string[] = []

const GOALS: { value: Goal; label: string }[] = [
  { value: 'fitness', label: 'General fitness' },
  { value: 'weight', label: 'Lose weight' },
  { value: 'strength', label: 'Build strength' },
  { value: 'posture', label: 'Posture and desk pain' },
]

const ABILITIES: { value: Ability; label: string }[] = [
  { value: 'pushup', label: 'Full push-ups' },
  { value: 'squat', label: 'Bodyweight squats' },
  { value: 'plank', label: 'Plank for 30 seconds' },
  { value: 'lunge', label: 'Lunges' },
  { value: 'jump', label: 'Jumping (jacks, jumps)' },
]

const LIMITS: { value: Limit; label: string }[] = [
  { value: 'knees', label: 'Knees' },
  { value: 'back', label: 'Lower back' },
  { value: 'wrists', label: 'Wrists' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'neck', label: 'Neck' },
]

const RATINGS: { value: Rating; label: string; hotkey: string }[] = [
  { value: 'easy', label: 'Too easy', hotkey: 'e' },
  { value: 'right', label: 'Just right', hotkey: 'j' },
  { value: 'hard', label: 'Too hard', hotkey: 'h' },
  { value: 'hurts', label: 'It hurt', hotkey: 'p' },
]

const PLACES: { value: Place; label: string }[] = [
  { value: 'office', label: 'Office' },
  { value: 'home', label: 'At home' },
]

const EQUIPMENT: { value: Equipment; label: string }[] = [
  { value: 'dumbbell', label: 'Dumbbells' },
  { value: 'band', label: 'Resistance band' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'bar', label: 'Pull-up bar' },
  { value: 'mat', label: 'Exercise mat' },
]

const SEXES: { value: Sex; label: string }[] = [
  { value: 'unspecified', label: 'Prefer not to say' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
]

/** welcome, about you, body, goal, what you can do, place and gear, your plan */
const STEPS = 7

const GOAL_HINTS: Record<Goal, string> = {
  fitness: 'Stay active and keep your energy up through the day.',
  weight: 'More movement and more calories burned, steady and low impact.',
  strength: 'Build strength with push, leg and core work.',
  posture: 'Ease the neck, back and wrist strain from sitting.',
}

/** Shared layout: rows of buttons breathe and wrap, cards get a border. */
const actions = { gap: 2, flexWrap: 'wrap', marginTop: 1 } as const
const card = { flexDirection: 'column', gap: 1, borderStyle: 'round', paddingX: 2, paddingY: 1 } as const
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const KIND_LABEL = { strength: 'Strength', cardio: 'Cardio', mobility: 'Mobility', stretch: 'Stretch' } as const

const placeTag = (ex: Exercise): string =>
  ex.places.length > 1 ? 'Office and home' : ex.places[0] === 'home' ? 'Home only' : 'Office only'

const intensityOf = (ex: Exercise): string => (ex.effort <= 2 ? 'light' : ex.effort === 3 ? 'moderate' : 'intense')

const toggle = <T,>(list: T[], v: T): T[] =>
  list.includes(v) ? list.filter(x => x !== v) : [...list, v]

const dots = (done: number, goal: number): string =>
  Array.from({ length: Math.max(goal, 1) }, (_, i) => (i < done ? '●' : '○')).join(' ')

/** "2h", "30m" or "off" to milliseconds; null when it is none of those. */
const parseFocus = (text: string): number | null => {
  const m = /^(\d{1,3})\s*([mh])$/.exec(text.trim())

  return m ? Number(m[1]) * (m[2] === 'h' ? 3600000 : 60000) : null
}

let isDebug = false
let ticker: Timer | null = null
let nudgeTimer: Timer | null = null
let seed: Partial<DeskSettings> = {}

const stopTimer = () => {
  ticker?.cancel()
  ticker = null
}

const stopNudge = () => {
  nudgeTimer?.cancel()
  nudgeTimer = null
}

const persist = async ($: Dollar) => {
  await $.store.set('profile', await read($, profile))
  await $.store.set('progress', await read($, progress))
}

/** The server in use: the person's own setting, else the plugin's configured default. */
/** Bumped when the look changes in a way saved settings should follow once (5: Ink & Signal, 6: the public board is on by default). */
const UI_VERSION = 6

/** Server addresses an early build saved as the default; they no longer serve the API. */
const RETIRED_BACKENDS = ['https://deskfit.atanur.dev', 'https://api.deskfit.atanur.dev']

const backendFor = (st: DeskSettings): string => st.backendUrl.trim().replace(/\/+$/, '')

/** Only https, or http to this machine: the sign-up sends the account secret, so it must never cross a network in the clear. */
const isSecureUrl = (url: string): boolean => /^https:\/\/[^\s/]+/i.test(url) || /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i.test(url)

const saveSettings = async ($: Dollar, change: Partial<DeskSettings>) => {
  const next = { ...(await read($, settings)), ...change }

  await update($, settings, () => next)
  await $.store.set('settings', next)
  setTheme(next.accent)
}

/** Text in the person's language: the English text is the key, `{name}` marks a value from `vars`. */
const tx = async ($: Dollar, text: string, vars?: Vars): Promise<string> => tr((await read($, settings)).language, text, vars)

/** Shows a toast, in the person's language, unless they turned that level of message off. */
const notify = async ($: Dollar, text: string, isImportant = false, vars?: Vars) => {
  const st = await read($, settings)

  if (st.toasts === 'none' || (st.toasts === 'important' && !isImportant)) return

  $.ui.toast(tr(st.language, text, vars))
}

const chime = async ($: Dollar, kind: SoundKind) => {
  if (!(await read($, settings)).sound) return

  try {
    await $.audio.play({ base64: soundOf(kind), mime: 'audio/wav' }, { gain: 0.6 })
  } catch {
    // no player on this machine: stay silent
  }
}

const editProfile = async ($: Dollar) => {
  const prof = await read($, profile)
  const imperial = (await read($, settings)).units === 'imperial'

  if (prof) {
    await update($, draft, () => ({
      step: 1,
      age: String(prof.age),
      weight: String(imperial ? Math.round(prof.weightKg / KG_PER_LB) : prof.weightKg),
      height: prof.heightCm === null ? '' : String(imperial ? Math.round(prof.heightCm / CM_PER_IN) : prof.heightCm),
      sex: prof.sex,
      goal: prof.goal,
      abilities: prof.abilities,
      limits: prof.limits,
      dailySets: prof.dailySets,
      isQuiet: prof.isQuiet,
      places: prof.places,
      equipment: prof.equipment,
      error: null,
    }))
  }

  await update($, screen, () => 'onboarding')
}

const changeProfile = async ($: Dollar, change: Partial<Profile>) => {
  const prof = await read($, profile)

  if (!prof) return

  await update($, profile, () => ({ ...prof, ...change }))
  await persist($)
  await rollNext($)
}

const exportData = async ($: Dollar, surface: 'terminal' | 'desktop' | 'vscode' | 'mobile') => {
  const data = {
    profile: await read($, profile),
    progress: await read($, progress),
    settings: await read($, settings),
  }
  const res = await $.ui.copy({ text: JSON.stringify(data, null, 2), surface })

  await notify($, res.isCopied ? 'Your data was copied to the clipboard.' : 'Could not reach the clipboard here.', true)
}

const rollNext = async ($: Dollar, skip: string[] = []) => {
  if (skip.length === 0) passed = []

  const prof = await read($, profile)

  if (!prof) {
    await update($, upNext, () => null)

    return
  }

  const now = await $.clock.now()
  const prog = rollDay(await read($, progress), dayKey(now))

  const place = await activePlace($)
  const focus = (await read($, settings)).focus

  await update($, upNext, () => pick(prof, prog, now, skip, place, focus).id)
}

const fireNudge = async ($: Dollar) => {
  const prof = await read($, profile)
  const now = await $.clock.now()
  const until = await read($, focusUntil)

  if (!prof || !(await read($, isBusy)) || (await read($, current))) return
  if (until !== null && until > now) return

  const prog = rollDay(await read($, progress), dayKey(now))

  if (prog.today.sets >= prof.dailySets) return

  const ex = pick(prof, prog, now, [], await activePlace($), (await read($, settings)).focus, true)

  await update($, nudge, () => ex.id)
  await update($, upNext, () => ex.id)
  const lang = (await read($, settings)).language

  await notify($, 'Claude is working. {secs}s of {name}? Open /workout', false, {
    secs: secondsFor(ex, prof),
    name: lang === 'tr' ? tr(lang, ex.name) : ex.name.toLowerCase(),
  })
}

const begin = async ($: Dollar) => {
  const cur = await read($, current)

  if (!cur || cur.phase === 'running') return

  await update($, current, c => (c ? { ...c, phase: 'running' as const } : c))
  await update($, nudge, () => null)
  void chime($, 'start')
  ticker = $.clock.every(1000, async () => {
    const c = await read($, current)

    if (!c || c.phase !== 'running') return

    const remaining = c.remaining - 1
    const ex = byId(c.exerciseId)

    const lang = (await read($, settings)).language

    $.ui.status(`💪 ${ex ? tr(lang, ex.name) : tr(lang, 'Workout')} ${clock(Math.max(remaining, 0))}`)

    if (remaining <= 0) {
      await finish($, c.total)
    } else {
      if (remaining <= 3) void chime($, 'tick')
      await update($, current, x => (x ? { ...x, remaining } : x))
    }
  })
}

const finish = async ($: Dollar, seconds: number) => {
  const c = await read($, current)
  const prof = await read($, profile)

  stopTimer()
  $.ui.status(undefined)

  if (!c || !prof) return

  const ex = byId(c.exerciseId)

  if (ex) {
    const now = await $.clock.now()
    const day = dayKey(now)
    const before = await read($, progress)
    const kcal = kcalFor(ex.id, seconds, prof)
    const done = recordSet(before, ex, seconds, prof.dailySets, day, {
      hour: new Date(now).getHours(),
      isDuringTurn: await read($, isBusy),
      kcal,
    })
    const awarded = award(done.progress, day)
    const levelAfter = levelOf(awarded.progress.xp)
    const levelUp = levelAfter > levelOf(before.xp) ? levelAfter : null

    await update($, progress, () => awarded.progress)
    await update($, result, () => ({
      exerciseId: ex.id,
      seconds,
      xpGained: done.xpGained,
      kcal,
      newBadges: awarded.earned,
      isGoalReached: done.isGoalReached,
      levelUp,
      isRated: false,
    }))
    await persist($)
    await enqueue($, ex.id, seconds, now)
    await notify(
      $,
      done.isGoalReached ? 'Daily goal done! {streak} day streak · +{xp} XP' : 'Set done · +{xp} XP',
      done.isGoalReached,
      { streak: awarded.progress.streak, xp: done.xpGained },
    )
    void chime($, done.isGoalReached ? 'goal' : 'done')
  }

  await update($, current, () => null)
  await rollNext($)
  await update($, screen, () => 'result')
}

const rate = async ($: Dollar, rating: Rating) => {
  const res = await read($, result)
  const ex = res ? byId(res.exerciseId) : undefined

  if (!res || !ex || res.isRated) return

  const now = await $.clock.now()
  const delta = rating === 'easy' ? 1 : rating === 'right' ? 0 : -1

  await update($, progress, p => ({
    ...p,
    tweak: Math.max(-3, Math.min(3, p.tweak + delta)),
    pain: rating === 'hurts' ? { ...p.pain, [ex.area]: now + WEEK_MS } : p.pain,
  }))
  await update($, result, r => (r ? { ...r, isRated: true } : r))
  await persist($)
  await rollNext($)

  if (rating === 'hurts') {
    const lang = (await read($, settings)).language

    await notify($, 'Skipping {area} moves for a week. If it keeps hurting, see a doctor.', true, { area: lang === 'tr' ? tr(lang, ex.area).charAt(0).toUpperCase() + tr(lang, ex.area).slice(1) : ex.area })
  } else if (rating === 'easy') {
    await notify($, 'Noted, next sets get a bit harder.')
  } else if (rating === 'hard') {
    await notify($, 'Noted, next sets get a bit easier.')
  }
}

const cancelSet = async ($: Dollar) => {
  stopTimer()
  $.ui.status(undefined)
  await update($, current, () => null)
  await update($, screen, () => 'home')
}

const startSet = async ($: Dollar, skip: string[] = [], preferId?: string) => {
  const prof = await read($, profile)

  if (!prof) {
    await update($, screen, () => 'onboarding')

    return
  }

  const now = await $.clock.now()
  const wanted = preferId ?? (skip.length === 0 ? ((await read($, upNext)) ?? undefined) : undefined)
  const ex = (wanted ? byId(wanted) : undefined) ?? pick(prof, await read($, progress), now, skip, await activePlace($), (await read($, settings)).focus)
  const total = secondsFor(ex, prof)

  stopTimer()
  await update($, nudge, () => null)
  await update($, current, () => ({ exerciseId: ex.id, phase: 'ready' as const, total, remaining: total }))
  await update($, screen, () => 'workout')
}

/** A profile saved by an older release gets the newer fields. */
const withGear = (p: Profile): Profile => ({
  ...p,
  sex: p.sex ?? 'unspecified',
  places: p.places?.length ? p.places : ['office', 'home'],
  equipment: p.equipment ?? [],
})

/** Where the person is now: their pick if that is a place they train at, else the first one they do. */
const activePlace = async ($: Dollar): Promise<Place> => {
  const prof = await read($, profile)
  const chosen = (await read($, settings)).place

  return prof && !prof.places.includes(chosen) ? (prof.places[0] ?? 'office') : chosen
}

const setPlace = async ($: Dollar, place: Place) => {
  await saveSettings($, { place })
  await rollNext($)
}

/** Marks a text for translation without translating it yet. */
const msg = (text: string): string => text

/** The problem with what was entered on a step, as English text to translate, or null. */
const validateStep = async ($: Dollar, step: number): Promise<string | null> => {
  const d = await read($, draft)
  const imperial = (await read($, settings)).units === 'imperial'

  if (step === 1) {
    const age = Number(d.age)

    if (!Number.isFinite(age) || age < 16 || age > 90) return msg('DeskFit is for ages 16 to 90.')
  }

  if (step === 2) {
    const weightKg = imperial ? Number(d.weight) * KG_PER_LB : Number(d.weight)
    const heightCm = d.height.trim() === '' ? null : imperial ? Number(d.height) * CM_PER_IN : Number(d.height)

    if (!Number.isFinite(weightKg) || weightKg < 30 || weightKg > 300) return msg('Weight should be 30 to 300 kg.')
    if (heightCm !== null && (!Number.isFinite(heightCm) || heightCm < 120 || heightCm > 230)) {
      return msg('Height should be 120 to 230 cm, or left empty.')
    }
  }

  if (step === 5 && d.places.length === 0) return msg('Pick at least one place.')

  return null
}

const submitOnboarding = async ($: Dollar) => {
  // Every earlier step is checked again, so a profile is never saved half valid.
  for (const step of [1, 2, 5]) {
    const message = await validateStep($, step)

    if (message) {
      const error = await tx($, message)

      await update($, draft, x => ({ ...x, step, error }))

      return
    }
  }

  const d = await read($, draft)
  const imperial = (await read($, settings)).units === 'imperial'
  const weightKg = imperial ? Number(d.weight) * KG_PER_LB : Number(d.weight)
  const heightCm = d.height.trim() === '' ? null : imperial ? Number(d.height) * CM_PER_IN : Number(d.height)
  const prof: Profile = {
    age: Number(d.age),
    weightKg: Math.round(weightKg * 10) / 10,
    heightCm: heightCm === null ? null : Math.round(heightCm),
    sex: d.sex,
    goal: d.goal,
    abilities: d.abilities,
    limits: d.limits,
    dailySets: d.dailySets,
    isQuiet: d.isQuiet,
    places: d.places,
    equipment: d.equipment,
  }
  const day = dayKey(await $.clock.now())

  await update($, profile, () => prof)
  await update($, progress, p => rollDay(p.today.day === '' ? emptyProgress(day) : p, day))
  await persist($)
  await update($, draft, () => emptyDraft)
  await rollNext($)
  await update($, screen, () => 'home')

  const lang = (await read($, settings)).language

  await notify($, 'You are set. {level} workouts are ready.', true, { level: tr(lang, levelFor(prof)) })
}

const nextStep = async ($: Dollar) => {
  const d = await read($, draft)
  const message = await validateStep($, d.step)

  if (message) {
    const error = await tx($, message)

    await update($, draft, x => ({ ...x, error }))

    return
  }

  if (d.step >= STEPS - 1) {
    await submitOnboarding($)
  } else {
    await update($, draft, x => ({ ...x, step: x.step + 1, error: null }))
  }
}

const setFocus = async ($: Dollar, ms: number | null) => {
  const until = ms === null ? null : (await $.clock.now()) + ms

  await update($, focusUntil, () => until)
  await update($, nudge, () => null)
  await $.store.set('focusUntil', until)
}

type Creds = { userId: string; secret: string }
type Reply = { ok: boolean; status: number; data: any }
type Queued = { id: string; exercise: string; seconds: number; at: number }

const patch = ($: Dollar, p: Partial<Social>) => update($, social, s => ({ ...s, ...p }))

const credentials = async ($: Dollar): Promise<Creds | null> => {
  const who = await read($, identity)
  const secret = (await $.store.get('secret')) as string | undefined

  return who && secret ? { userId: who.userId, secret } : null
}

/** One request to the backend. `creds` undefined signs with the stored account, null sends unsigned. */
const call = async ($: Dollar, method: string, path: string, body?: unknown, creds?: Creds | null): Promise<Reply> => {
  const st = await read($, settings)
  const backendUrl = backendFor(st)

  if (!backendUrl) return { ok: false, status: 0, data: { error: tr(st.language, 'No backend is configured.') } }
  if (!isSecureUrl(backendUrl)) return { ok: false, status: 0, data: { error: tr(st.language, 'The server address must start with https:// (http:// only works for localhost).') } }

  const text = body === undefined ? '' : JSON.stringify(body)
  const c = creds === undefined ? await credentials($) : creds
  const headers: Record<string, string> = { 'content-type': 'application/json' }

  if (c) {
    Object.assign(
      headers,
      await signHeaders(c.userId, c.secret, method, path, text, await $.clock.now(), randomHex(12)),
    )
  }

  try {
    const res = await $.http.fetch(backendUrl + path, { method, headers, body: text === '' ? undefined : text })
    let data: any = null

    try {
      data = JSON.parse(res.text)
    } catch {
      data = null
    }

    if (data && typeof data.error === 'string') data.error = tr(st.language, data.error)

    return { ok: res.ok, status: res.status, data }
  } catch {
    return { ok: false, status: 0, data: { error: tr(st.language, 'Could not reach the leaderboard server.') } }
  }
}

const flush = async ($: Dollar) => {
  for (let round = 0; round < 5; round++) {
    if (!(await read($, identity))) return

    const queue = ((await $.store.get('queue')) as Queued[] | undefined) ?? []

    if (queue.length === 0) return

    const batch = queue.slice(0, 20)
    const reply = await call($, 'POST', '/v1/events', { events: batch })

    if (!reply.ok) return

    const sent = new Set(batch.map(b => b.id))

    await $.store.set('queue', queue.filter(q => !sent.has(q.id)))
  }
}

const enqueue = async ($: Dollar, exercise: string, seconds: number, at: number) => {
  if (!backendFor(await read($, settings)) || !(await read($, identity))) return

  const queue = ((await $.store.get('queue')) as Queued[] | undefined) ?? []

  await $.store.set('queue', [...queue, { id: crypto.randomUUID(), exercise, seconds, at }].slice(-200))
  void flush($)
}

const refreshBoard = async ($: Dollar) => {
  const who = await read($, identity)
  const s = await read($, social)

  await patch($, { isLoading: true, error: null })

  let me = s.me
  let teams = s.teams
  let activeTeam = s.activeTeam
  let teamInfo = s.teamInfo
  let teamTotal = s.teamTotal

  if (who) {
    const mine = await call($, 'GET', '/v1/me')

    if (mine.ok) {
      me = { weekPoints: mine.data.weekPoints, allPoints: mine.data.allPoints, weekRank: mine.data.weekRank }
      teams = mine.data.teams ?? []
      if (!teams.some(t => t.id === activeTeam)) activeTeam = teams[0]?.id ?? null
    } else if (mine.status === 401) {
      await patch($, { isLoading: false, error: await tx($, 'This device is not signed in anymore. Use your recovery code.') })

      return
    }
  }

  let rows: BoardRow[] = []
  let error: string | null = null

  if (s.tab === 'teams') {
    if (activeTeam) {
      const r = await call($, 'GET', `/v1/teams/${activeTeam}/leaderboard?period=${s.teamPeriod}`)

      if (r.ok) {
        rows = r.data.rows
        teamInfo = r.data.team ?? null
        teamTotal = r.data.total ?? 0
      } else {
        error = r.data?.error ?? (await tx($, 'Could not load the team board.'))
      }
    } else {
      teamInfo = null
    }
  } else {
    const r = await call($, 'GET', `/v1/leaderboard?period=${s.tab}&limit=20`, undefined, null)

    if (r.ok) rows = r.data.rows
    else error = r.data?.error ?? (await tx($, 'Could not load the leaderboard.'))
  }

  await patch($, { isLoading: false, error, rows, me, teams, activeTeam, teamInfo, teamTotal })
}

const openBoard = async ($: Dollar) => {
  await update($, screen, () => 'board')
  await patch($, { view: 'board', notice: null, error: null, recoveryCode: null, isConfirmingDelete: false })
  void flush($)

  if (backendFor(await read($, settings))) await refreshBoard($)
}

const setTab = async ($: Dollar, tab: Social['tab']) => {
  await patch($, { tab, rows: [] })
  await refreshBoard($)
}

const signup = async ($: Dollar) => {
  const nickname = (await read($, social)).form.nickname.trim()

  if (!/^[A-Za-z0-9_-]{3,20}$/.test(nickname)) {
    await patch($, { error: await tx($, 'Nickname: 3-20 letters, digits, _ or -. Pick something that is not your real name.') })

    return
  }

  const secret = randomHex(32)
  const reply = await call($, 'POST', '/v1/register', { nickname, secret }, null)

  if (!reply.ok) {
    await patch($, { error: reply.data?.error ?? (await tx($, 'Sign-up failed.')) })

    return
  }

  const who: Identity = { userId: reply.data.userId, nickname }

  await $.store.set('secret', secret)
  await $.store.set('identity', who)
  await update($, identity, () => who)
  await patch($, { error: null, notice: await tx($, 'Welcome, {name}! Save your recovery code from Account.', { name: nickname }) })
  await refreshBoard($)
}

const recover = async ($: Dollar) => {
  const decoded = decodeRecovery((await read($, social)).form.recovery)

  if (!decoded) {
    await patch($, { error: await tx($, 'That recovery code is not valid.') })

    return
  }

  const reply = await call($, 'GET', '/v1/me', undefined, { userId: decoded.userId, secret: decoded.secret })

  if (!reply.ok) {
    await patch($, { error: reply.data?.error ?? (await tx($, 'Recovery failed.')) })

    return
  }

  const who: Identity = { userId: decoded.userId, nickname: reply.data.nickname }

  await $.store.set('secret', decoded.secret)
  await $.store.set('identity', who)
  await update($, identity, () => who)
  await patch($, { error: null, notice: await tx($, 'Welcome back, {name}.', { name: who.nickname }) })
  await refreshBoard($)
}

const showRecovery = async ($: Dollar) => {
  const who = await read($, identity)
  const secret = (await $.store.get('secret')) as string | undefined

  if (who && secret) await patch($, { recoveryCode: encodeRecovery(who.userId, secret) })
}

const createTeam = async ($: Dollar) => {
  const name = (await read($, social)).form.teamName.trim()
  const reply = await call($, 'POST', '/v1/teams', { name })

  if (!reply.ok) {
    await patch($, { error: reply.data?.error ?? (await tx($, 'Could not create the team.')) })

    return
  }

  await patch($, {
    activeTeam: reply.data.id,
    notice: await tx($, 'Team created. Invite code: {code}', { code: reply.data.inviteCode }),
    error: null,
    form: { ...(await read($, social)).form, teamName: '' },
  })
  await refreshBoard($)
}

const joinTeam = async ($: Dollar) => {
  const inviteCode = (await read($, social)).form.invite.trim()
  const reply = await call($, 'POST', '/v1/teams/join', { inviteCode })

  if (!reply.ok) {
    await patch($, { error: reply.data?.error ?? (await tx($, 'Could not join the team.')) })

    return
  }

  await patch($, {
    activeTeam: reply.data.id,
    notice: await tx($, 'Joined {name}.', { name: reply.data.name }),
    error: null,
    form: { ...(await read($, social)).form, invite: '' },
  })
  await refreshBoard($)
}

const leaveTeam = async ($: Dollar, id: string) => {
  const reply = await call($, 'DELETE', `/v1/teams/${id}`)

  await patch(
    $,
    reply.ok ? { activeTeam: null, notice: await tx($, 'You left the team.'), error: null } : { error: await tx($, 'Could not leave.') },
  )
  await refreshBoard($)
}

const setTeamPeriod = async ($: Dollar, teamPeriod: Social['teamPeriod']) => {
  await patch($, { teamPeriod, rows: [] })
  await refreshBoard($)
}

const copyInvite = async ($: Dollar, surface: 'terminal' | 'desktop' | 'vscode' | 'mobile') => {
  const code = (await read($, social)).teamInfo?.inviteCode

  if (!code) return

  const res = await $.ui.copy({ text: code, surface })

  await patch($, { notice: await tx($, res.isCopied ? 'Invite code copied.' : 'Could not reach the clipboard here.') })
}

const rotateInvite = async ($: Dollar) => {
  const id = (await read($, social)).activeTeam

  if (!id) return

  const reply = await call($, 'POST', `/v1/teams/${id}/rotate-code`, {})

  if (!reply.ok) {
    await patch($, { error: reply.data?.error ?? (await tx($, 'Could not do that.')) })

    return
  }

  await patch($, { notice: await tx($, 'New invite code: {code}', { code: reply.data.inviteCode }), error: null })
  await refreshBoard($)
}

const removeFromTeam = async ($: Dollar, nickname: string) => {
  const id = (await read($, social)).activeTeam

  if (!id) return

  const reply = await call($, 'POST', `/v1/teams/${id}/remove`, { nickname })

  await patch(
    $,
    reply.ok
      ? { notice: await tx($, '{name} was removed.', { name: nickname }), error: null }
      : { error: reply.data?.error ?? (await tx($, 'Could not do that.')) },
  )
  await refreshBoard($)
}

const disbandTeam = async ($: Dollar) => {
  const soc = await read($, social)

  if (!soc.activeTeam) return

  if (!soc.isConfirmingDisband) {
    await patch($, { isConfirmingDisband: true })

    return
  }

  const reply = await call($, 'DELETE', `/v1/teams/${soc.activeTeam}?disband=1`)

  await patch(
    $,
    reply.ok
      ? { activeTeam: null, teamInfo: null, isConfirmingDisband: false, notice: await tx($, 'Team closed.'), error: null }
      : { isConfirmingDisband: false, error: reply.data?.error ?? (await tx($, 'Could not do that.')) },
  )
  await refreshBoard($)
}

const deleteAccount = async ($: Dollar) => {
  if (!(await read($, social)).isConfirmingDelete) {
    await patch($, { isConfirmingDelete: true })

    return
  }

  const reply = await call($, 'DELETE', '/v1/me')

  if (!reply.ok) {
    await patch($, { error: reply.data?.error ?? (await tx($, 'Could not delete the account.')), isConfirmingDelete: false })

    return
  }

  await $.store.delete('secret')
  await $.store.delete('identity')
  await $.store.delete('queue')
  await update($, identity, () => null)
  const notice = await tx($, 'Your leaderboard account and its data were deleted.')

  await update($, social, () => ({ ...emptySocial, notice }))
}

/**
 * Opens the pane and asks for the keyboard. The first request is refused while the
 * slash command still sits in the composer, so it is asked again once that is empty;
 * without the keyboard the first click only focuses the pane and does not press.
 */
const openPane = async ($: Dollar) => {
  await $.ui.open({ id: PANE, title: 'DeskFit', focus: true, closeOnEscape: true })
  $.clock.after(400, () => void $.ui.open({ id: PANE, title: 'DeskFit', focus: true, closeOnEscape: true }))
}

export const register: Register = (on, options) => {
  const seconds = Number(options.nudgeAfterSeconds)

  // an admin's `backendUrl` option replaces the built-in public server; left empty it falls back to it
  const configured = String(options.backendUrl ?? '').trim()

  seed = {
    ...(configured ? { backendUrl: configured } : {}),
    ...(Number.isFinite(seconds) && seconds >= 5 ? { nudgeAfterSeconds: seconds } : {}),
  }

  on('session.start', async ($, e, next) => {
    const stored = (await $.store.get('profile')) as Profile | undefined
    const saved = (await $.store.get('progress')) as Progress | undefined
    const focus = (await $.store.get('focusUntil')) as number | null | undefined
    const day = dayKey(await $.clock.now())
    const prefs = withDefaults((await $.store.get('settings')) as Partial<DeskSettings> | undefined, seed)

    // The look changed in this release: a colour saved by an older one gives way once.
    const uiVersion = Number((await $.store.get('uiVersion')) ?? 0)

    if (uiVersion < UI_VERSION) {
      // Ink & Signal arrived in version 5: everyone starts with its colour, and can switch in Settings
      if (uiVersion < 5) prefs.accent = 'signal'

      // the shared board is connected from the first launch (version 6); an address saved empty by an older build gives way once
      if (!prefs.backendUrl) prefs.backendUrl = seed.backendUrl ?? DEFAULT_SETTINGS.backendUrl

      // line art arrived in version 4: everyone starts with it, and can switch back in Settings
      if (uiVersion < 4) prefs.illustrations = 'line'
      await $.store.set('settings', prefs)
      await $.store.set('uiVersion', UI_VERSION)
    }

    // The first public build pointed at the website's own address; the API lives on its own host now.
    if (RETIRED_BACKENDS.includes(backendFor(prefs))) {
      prefs.backendUrl = seed.backendUrl ?? ''
      await $.store.set('settings', prefs)
    }

    await $.command.register({
      name: 'workout',
      description: tr(prefs.language, 'DeskFit: micro-workouts while Claude works (/workout, stats, board, settings, focus 2h, reset)'),
    })
    await update($, settings, () => prefs)
    setTheme(prefs.accent)
    await update($, profile, () => (stored ? withGear(stored) : null))
    await update($, progress, () => normalize(saved, day))
    await update($, focusUntil, () => focus ?? null)
    const savedIdentity = ((await $.store.get('identity')) as Identity | undefined) ?? null

    await update($, identity, () => savedIdentity)
    void flush($)
    // the shared board is ready before the first look at it
    if (backendFor(prefs)) void refreshBoard($)
    await rollNext($)
    await update($, screen, () => (stored ? 'home' : 'onboarding'))
    await update($, isLoaded, () => true)

    return next(e)
  })

  on('session.end', async ($, e, next) => {
    stopTimer()
    stopNudge()
    $.ui.status(undefined)

    return next(e)
  })

  on('ui.press', { plugin: 'deskfit' }, async ($, e, next) => {
    if (isDebug) $.ui.log(`deskfit press: ${e.element} from ${e.surface}`)

    return next(e)
  })

  on('ui.focus', { requestId: PANE }, async ($, e, next) => {
    if (isDebug) $.ui.log(`deskfit focus: ${e.element ?? '(engine)'} by ${e.origin.kind}`)

    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    await update($, isBusy, () => true)
    await update($, nudge, () => null)
    stopNudge()

    const st = await read($, settings)

    if (st.nudges) nudgeTimer = $.clock.after(st.nudgeAfterSeconds * 1000, () => void fireNudge($))

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId) return next(e)

    stopNudge()
    await update($, isBusy, () => false)
    await update($, nudge, () => null)

    if ((await read($, current))?.phase === 'running') {
      await notify($, 'Claude finished. Wrap up your set, then check the answer.')
    }

    return next(e)
  })

  on('command.run', { command: 'workout' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()

    if (arg === 'reset') {
      stopTimer()
      $.ui.status(undefined)
      await $.store.delete('profile')
      await $.store.delete('progress')
      await $.store.delete('focusUntil')
      await $.store.delete('secret')
      await $.store.delete('identity')
      await $.store.delete('queue')
      await update($, identity, () => null)
      await update($, social, () => emptySocial)
      await update($, upNext, () => null)
      await update($, profile, () => null)
      await update($, progress, () => emptyProgress(dayKey(Date.now())))
      await update($, draft, () => emptyDraft)
      await update($, current, () => null)
      await update($, result, () => null)
      await update($, focusUntil, () => null)
      await update($, screen, () => 'onboarding')
      await openPane($)

      return { text: await tx($, 'DeskFit data erased from this device. Starting over.') }
    }

    if (arg.startsWith('focus')) {
      const what = arg.slice(5).trim()

      if (what === 'off') {
        await setFocus($, null)

        return { text: await tx($, 'Focus mode off. DeskFit may suggest sets again.') }
      }

      const ms = parseFocus(what)

      if (ms === null) return { text: await tx($, 'Usage: /workout focus 90m, /workout focus 2h or /workout focus off') }

      await setFocus($, ms)

      return { text: await tx($, 'Focus mode on for {time}. No suggestions until then.', { time: what }) }
    }

    if (arg === 'debug') {
      isDebug = !isDebug

      return { text: await tx($, isDebug ? 'DeskFit debug on: clicks and focus moves are logged.' : 'DeskFit debug off.') }
    }

    if (arg === 'home') await update($, screen, () => 'home')
    if (arg === 'moves') await update($, screen, () => 'moves')
    if (arg === 'stats') await update($, screen, () => 'stats')
    if (arg === 'board') await openBoard($)
    if (arg === 'settings') await update($, screen, () => 'settings')

    await openPane($)

    return { text: await tx($, 'DeskFit opened.') }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button, Input, Select, Svg } = $.ui.resolve(e) as any
    const hasSvg = e.surface !== 'terminal'
    const st = await read($, settings)
    const backendUrl = backendFor(st)
    const isImperial = st.units === 'imperial'

    setTheme(st.accent)

    const T = (text: string, vars?: Vars): string => tr(st.language, text, vars)
    const opts = <O extends { label: string }>(list: O[]): O[] => list.map(o => ({ ...o, label: T(o.label) }))
    /** Line art is square, the figures from the rig are 6:5. */
    const figH = (w: number): number => (st.illustrations === 'line' ? w : Math.round((w * 100) / 120))

    /** An icon (drawn on surfaces with Svg, a glyph elsewhere) beside a title. */
    const head = (icon: IconName, text: string, isBold = true) => (
      <Box gap={1} alignItems="center">
        {hasSvg ? <Svg source={iconSvg(icon, 18)} alt={text} /> : <Text>{ICON_TEXT[icon]}</Text>}
        <Text bold={isBold}>{text}</Text>
      </Box>
    )

    if (!(await read($, isLoaded))) return <Text dimColor>{T('Loading DeskFit…')}</Text>

    const scr = await read($, screen)
    const prof = await read($, profile)
    const prog = await read($, progress)
    const now = Date.now()
    const day = dayKey(now)
    const today = prog.today.day === day ? prog.today : { day, sets: 0, seconds: 0 }

    const navItems: { id: Screen; label: string; hotkey: string; go: () => unknown }[] = [
      { id: 'home', label: T('Home'), hotkey: 'h', go: () => update($, screen, () => 'home') },
      { id: 'moves', label: T('Moves'), hotkey: 'm', go: () => update($, screen, () => 'moves') },
      { id: 'stats', label: T('Stats'), hotkey: 't', go: () => update($, screen, () => 'stats') },
      { id: 'board', label: T('Board'), hotkey: 'l', go: () => openBoard($) },
      { id: 'settings', label: T('Settings'), hotkey: 'o', go: () => update($, screen, () => 'settings') },
    ]
    const navBar = (
      <Box gap={1} alignItems="center" flexWrap="wrap">
        {hasSvg && <Svg source={logoSvg(22)} alt="DeskFit" />}
        <Text bold>DeskFit</Text>
        {navItems.map(item => (
          <Button
            key={`nav-${item.id}`}
            hotkey={item.hotkey}
            variant={scr === item.id ? 'primary' : undefined}
            {...(scr === item.id ? { autoFocus: true as const } : {})}
            label={item.label}
            onPress={item.go}
          />
        ))}
      </Box>
    )

    if (scr === 'onboarding' || !prof) {
      const d = await read($, draft)
      const isEditing = prof !== null
      const hasInput = d.step === 1 || d.step === 2
      const titles = [
        T('Welcome to DeskFit'),
        T('About you'),
        T('Your body'),
        T('Your goal'),
        T('What you can do'),
        T('Where you train'),
        T('Your plan'),
      ]
      const icons: IconName[] = ['bolt', 'user', 'heart', 'target', 'check', 'sliders', 'trophy']
      const pick1 = (key: string, label: string, isOn: boolean, hint: string | null, choose: () => unknown) => (
        <Box key={key} flexDirection="column">
          <Button plain label={`${isOn ? '◉' : '○'} ${label}`} onPress={() => choose()} />
          {hint && <Text dimColor>   {hint}</Text>}
        </Box>
      )

      return (
        <Box flexDirection="column" gap={1}>
          <Box justifyContent="space-between" alignItems="center" width="100%">
            {head(icons[d.step] ?? 'user', titles[d.step] ?? '')}
            {hasSvg ? (
              <Svg source={stepsSvg(d.step, STEPS, 120)} alt={T('Step {n} of {total}', { n: d.step + 1, total: STEPS })} />
            ) : (
              <Text dimColor>
                {d.step + 1}/{STEPS}
              </Text>
            )}
          </Box>

          {d.step === 0 && (
            <Box flexDirection="column" gap={1}>
              {hasSvg && (
                <Box justifyContent="center" width="100%">
                  <Svg source={figureSvg('jumping-jacks', 200, undefined, st.animations, st.illustrations)} alt={T('A stick figure warming up')} width={200} height={figH(200)} isInteractive={st.animations} />
                </Box>
              )}
              <Text>{T('Short exercise breaks while Claude works. Everything stays on this device.')}</Text>
              {head('bolt', T('Sets of about 30 seconds, right while Claude is busy.'), false)}
              {head('target', T('A daily goal, streaks and badges keep you going.'), false)}
              {head('shield', T('Your data never leaves this device unless you join a leaderboard.'), false)}
              <Text dimColor>
                {T('DeskFit gives general fitness suggestions, not medical advice. Stop if anything hurts and check with a doctor if you have a health condition.')}
              </Text>
            </Box>
          )}

          {d.step === 1 && (
            <Box flexDirection="column" gap={1}>
              <Text dimColor>{T('Your age and sex tune the intensity and the calorie estimates.')}</Text>
              <Input
                key="age"
                label={T('Age')}
                placeholder={T('e.g. 32')}
                value={d.age}
                autoFocus
                onInput={(v: string) => update($, draft, x => ({ ...x, age: v, error: null }))}
                onSubmit={() => nextStep($)}
                submitLabel="↵"
              />
              <Select
                key="sex"
                label={T('Sex (only used for calorie estimates): ')}
                options={opts(SEXES)}
                value={d.sex}
                onSelect={(v: string) => update($, draft, x => ({ ...x, sex: v as Sex }))}
              />
            </Box>
          )}

          {d.step === 2 && (
            <Box flexDirection="column" gap={1}>
              <Text dimColor>{T('Body measurements tune set length and impact. They never leave this device.')}</Text>
              <Select
                key="units"
                label={T('Units: ')}
                options={opts(UNITS)}
                value={st.units}
                onSelect={(v: string) => saveSettings($, { units: v as DeskSettings['units'] })}
              />
              <Input
                key="weight"
                label={isImperial ? T('Weight (lb)') : T('Weight (kg)')}
                placeholder={isImperial ? T('e.g. 160') : T('e.g. 72')}
                value={d.weight}
                autoFocus
                onInput={(v: string) => update($, draft, x => ({ ...x, weight: v, error: null }))}
                onSubmit={() => nextStep($)}
                submitLabel="↵"
              />
              <Input
                key="height"
                label={isImperial ? T('Height (in, optional)') : T('Height (cm, optional)')}
                placeholder={isImperial ? T('e.g. 70') : T('e.g. 178')}
                value={d.height}
                onInput={(v: string) => update($, draft, x => ({ ...x, height: v, error: null }))}
                onSubmit={() => nextStep($)}
                submitLabel="↵"
              />
            </Box>
          )}

          {d.step === 3 && (
            <Box flexDirection="column" gap={1}>
              <Text dimColor>{T('Pick what matters most. It decides which moves come up more often.')}</Text>
              {GOALS.map(g =>
                pick1(`goal-${g.value}`, T(g.label), d.goal === g.value, T(GOAL_HINTS[g.value]), () =>
                  update($, draft, x => ({ ...x, goal: g.value })),
                ),
              )}
            </Box>
          )}

          {d.step === 4 && (
            <Box flexDirection="column" gap={1}>
              <Text dimColor>{T('Moves you cannot do yet are left out, and so are moves that strain a sore spot.')}</Text>
              <Box {...card}>
                <Text bold>{T('What can you do comfortably?')}</Text>
                {ABILITIES.map(a => (
                  <Button
                    key={`ab-${a.value}`}
                    plain
                    label={`${d.abilities.includes(a.value) ? '▣' : '▢'} ${T(a.label)}`}
                    onPress={() => update($, draft, x => ({ ...x, abilities: toggle(x.abilities, a.value) }))}
                  />
                ))}
              </Box>
              <Box {...card}>
                <Text bold>{T('Anything that bothers you?')}</Text>
                {LIMITS.map(l => (
                  <Button
                    key={`lim-${l.value}`}
                    plain
                    label={`${d.limits.includes(l.value) ? '▣' : '▢'} ${T(l.label)}`}
                    onPress={() => update($, draft, x => ({ ...x, limits: toggle(x.limits, l.value) }))}
                  />
                ))}
              </Box>
            </Box>
          )}

          {d.step === 5 && (
            <Box flexDirection="column" gap={1}>
              <Text dimColor>{T('Moves are picked to fit the room. Tell DeskFit where you train and what gear you own.')}</Text>
              <Box {...card}>
                <Text bold>{T('Where do you work out?')}</Text>
                {PLACES.map(pl => (
                  <Button
                    key={`place-${pl.value}`}
                    plain
                    label={`${d.places.includes(pl.value) ? '▣' : '▢'} ${T(pl.label)}`}
                    onPress={() => update($, draft, x => ({ ...x, places: toggle(x.places, pl.value), error: null }))}
                  />
                ))}
                <Text dimColor>{T('Office: quiet, small moves with a chair, desk or wall; a resistance band works too. Home: floor work, bigger moves, dumbbells, a kettlebell or a pull-up bar.')}</Text>
              </Box>
              <Box {...card}>
                <Text bold>{T('Gear you have')}</Text>
                {EQUIPMENT.map(q => (
                  <Button
                    key={`gear-${q.value}`}
                    plain
                    label={`${d.equipment.includes(q.value) ? '▣' : '▢'} ${T(q.label)}`}
                    onPress={() => update($, draft, x => ({ ...x, equipment: toggle(x.equipment, q.value) }))}
                  />
                ))}
                <Text dimColor>{T('No gear is fine: there are plenty of moves without any.')}</Text>
              </Box>
            </Box>
          )}

          {d.step === 6 && (
            <Box flexDirection="column" gap={1}>
              <Text dimColor>{T('Each set takes about 30 to 40 seconds. You can change all of this later in Settings.')}</Text>
              <Text bold>{T('Sets per day')}</Text>
              <Box {...actions} marginTop={0}>
                {[3, 5, 8, 12].map(n => (
                  <Button
                    key={`goal-${n}`}
                    variant={d.dailySets === n ? 'primary' : undefined}
                    label={String(n)}
                    onPress={() => update($, draft, x => ({ ...x, dailySets: n }))}
                  />
                ))}
              </Box>
              <Button
                key="quiet"
                plain
                label={`${d.isQuiet ? '▣' : '▢'} ${T('Quiet mode (no jumping, good for open offices)')}`}
                onPress={() => update($, draft, x => ({ ...x, isQuiet: !x.isQuiet }))}
              />
              <Button
                key="nudges"
                plain
                label={`${st.nudges ? '▣' : '▢'} ${T('Suggest a set while Claude is working')}`}
                onPress={() => saveSettings($, { nudges: !st.nudges })}
              />
            </Box>
          )}

          {d.error && <Text color="red">{d.error}</Text>}

          <Box {...actions}>
            {d.step > 0 && (
              <Button
                key="back"
                label={isEditing && d.step === 1 ? T('✕ Cancel') : T('← Back')}
                onPress={() =>
                  isEditing && d.step === 1
                    ? update($, screen, () => 'settings')
                    : update($, draft, x => ({ ...x, step: x.step - 1, error: null }))
                }
              />
            )}
            <Button
              key="next"
              variant="primary"
              {...(hasInput ? {} : { autoFocus: true as const })}
              label={d.step === 0 ? T('Get started') : d.step === STEPS - 1 ? T('Finish') : T('Next →')}
              onPress={() => nextStep($)}
            />
          </Box>
        </Box>
      )
    }

    if (scr === 'workout') {
      const c = await read($, current)
      const ex = c ? byId(c.exerciseId) : undefined

      if (!c || !ex) {
        return (
          <Box flexDirection="column" gap={1}>
            <Text dimColor>{T('No set in progress.')}</Text>
            <Button key="home" autoFocus label={T('← Back')} onPress={() => update($, screen, () => 'home')} />
          </Box>
        )
      }

      return (
        <Box flexDirection="column" gap={1}>
          <Box justifyContent="space-between" alignItems="center" width="100%">
            {c.phase === 'ready' ? (
              <Button key="back-set" hotkey="b" label={T('← Back')} onPress={() => cancelSet($)} />
            ) : (
              <Text dimColor>{T('In progress')}</Text>
            )}
            {hasSvg ? (
              <Svg
                source={stepsSvg(Math.min(today.sets, Math.max(prof.dailySets - 1, 0)), prof.dailySets, 110)}
                alt={T('Set {n} of {total}', { n: today.sets + 1, total: prof.dailySets })}
              />
            ) : (
              <Text dimColor>{T('set {n}/{total}', { n: today.sets + 1, total: prof.dailySets })}</Text>
            )}
          </Box>
          <Box flexDirection="column">
            <Text bold>{T(ex.name)}</Text>
            <Text dimColor>
              {mainRegions(ex.muscles).map(r => T(REGION_LABEL[r])).join(' · ')} · {T(intensityOf(ex))} · {T('{n}s', { n: c.total })}
            </Text>
            <Text dimColor>{T(KIND_LABEL[ex.kind])} · {T(ex.level)}</Text>
          </Box>
          <Box gap={3} alignItems="center" flexWrap="wrap">
            {hasSvg ? (
              figureSvg(ex.id, 250, undefined, st.animations, st.illustrations) ? (
                <Svg source={figureSvg(ex.id, 250, undefined, st.animations, st.illustrations)} alt={T('{name} demonstration', { name: T(ex.name) })} width={250} height={figH(250)} isInteractive={st.animations} />
              ) : null
            ) : (
              <Box flexDirection="column">
                {figureText(ex.id, c.phase === 'running' && c.remaining % 2 === 1 ? 1 : 0, 32).map((row, i) => (
                  <Text key={`fig-${i}`}>
                    {row}
                  </Text>
                ))}
              </Box>
            )}
            {hasSvg && <Svg source={timerSvg(c.remaining, c.total, c.phase, 108)} alt={T('Countdown timer')} />}
          </Box>
          {!hasSvg && (
            <Text bold >
              {c.phase === 'ready' ? T('Ready for {time}?', { time: clock(c.total) }) : clock(Math.max(c.remaining, 0))}
            </Text>
          )}
          <Text>{T(ex.howto)}</Text>
          {c.phase === 'ready' ? (
            <Box {...actions}>
              <Button key="go" hotkey="g" variant="primary" autoFocus label={T('▶ Start')} onPress={() => begin($)} />
              <Button key="swap" hotkey="s" label={T('⇄ Another')} onPress={() => { passed = [...passed, ex.id]; return startSet($, passed) }} />
            </Box>
          ) : (
            <Box {...actions}>
              <Button key="finish" hotkey="f" variant="primary" autoFocus label={T('✓ Finish now')} onPress={() => finish($, c.total - c.remaining)} />
              <Button key="cancel" hotkey="c" label={T('✕ Cancel')} onPress={() => cancelSet($)} />
            </Box>
          )}
        </Box>
      )
    }

    if (scr === 'result') {
      const res = await read($, result)
      const ex = res ? byId(res.exerciseId) : undefined

      if (!res || !ex) {
        return (
          <Box flexDirection="column" gap={1}>
            <Text dimColor>{T('No finished set to show.')}</Text>
            <Button key="home" autoFocus label={T('← Back')} onPress={() => update($, screen, () => 'home')} />
          </Box>
        )
      }

      const left = Math.max(prof.dailySets - today.sets, 0)

      return (
        <Box flexDirection="column" gap={1}>
          <Box flexDirection="column" alignItems="center" gap={1}>
            {hasSvg ? (
              <Svg source={st.animations ? celebrateSvg(96) : iconSvg('check', 48)} alt={T('Set complete')} width={96} height={96} isInteractive={st.animations} />
            ) : (
              <Text bold>✓</Text>
            )}
            <Text bold>{T('Set complete')}</Text>
            <Text bold>{T('+{xp} XP', { xp: res.xpGained })}</Text>
            <Text dimColor>
              {T('{name} · {secs}s · {kcal} kcal', { name: T(ex.name), secs: res.seconds, kcal: fmtKcal(res.kcal) })}
            </Text>
          </Box>
          {hasSvg && res.isGoalReached && st.animations && <Svg source={confettiSvg(300)} alt={T('Confetti')} width={300} height={80} isInteractive />}
          {hasSvg && (
            <Svg
              source={ringSvg(today.sets, prof.dailySets, 96, st.animations)}
              alt={T('{n} of {total} sets today', { n: today.sets, total: prof.dailySets })}
              width={96}
              height={96}
              isInteractive={st.animations}
            />
          )}
          {!hasSvg && (
            <Text>
              {T('{n}/{total} today', { n: today.sets, total: prof.dailySets })} {dots(Math.min(today.sets, prof.dailySets), prof.dailySets)}
            </Text>
          )}
          {res.isGoalReached && (
            <Box gap={1} alignItems="center">
              {hasSvg ? <Svg source={flameSvg(liveStreak(prog, day), 26, st.animations)} alt={T('Streak')} width={26} height={26} isInteractive={st.animations} /> : <Text>{ICON_TEXT.flame}</Text>}
              <Text bold>{T('Daily goal reached · {n} day streak', { n: liveStreak(prog, day) })}</Text>
            </Box>
          )}
          {res.levelUp !== null && <Text>{T('Level up: you are level {n}', { n: res.levelUp })}</Text>}
          {res.newBadges.map(id => (
            <Box key={id} gap={2} alignItems="center">
              {hasSvg && (
                <Svg source={medalSvg(id, 56, st.animations)} alt={T(badgeName(id))} width={56} height={56} isInteractive={st.animations} />
              )}
              <Box flexDirection="column">
                <Text bold>{T('Badge unlocked')}</Text>
                <Text dimColor>{T(badgeName(id))}</Text>
              </Box>
            </Box>
          ))}
          {res.isRated ? (
            <Text dimColor>{T('Thanks, feedback saved.')}</Text>
          ) : (
            <Box flexDirection="column">
              <Text>{T('How was it?')}</Text>
              <Box {...actions}>
                {RATINGS.map(r => (
                  <Button key={`rate-${r.value}`} hotkey={r.hotkey} label={T(r.label)} onPress={() => rate($, r.value)} />
                ))}
              </Box>
            </Box>
          )}
          <Box {...actions}>
            {left > 0 && (
              <Button key="again" hotkey="n" variant="primary" autoFocus label={T('▶ Next set')} onPress={() => startSet($)} />
            )}
            <Button key="done" hotkey="d" autoFocus label={T('✓ Done')} onPress={() => update($, screen, () => 'home')} />
          </Box>
        </Box>
      )
    }

    if (scr === 'settings') {
      const who = await read($, identity)
      const row = (label: string, control: unknown, hint?: string) => (
        <Box key={label} flexDirection="column">
          <Box gap={2} alignItems="center" flexWrap="wrap">
            <Text>{label}</Text>
            {control}
          </Box>
          {hint && <Text dimColor>{hint}</Text>}
        </Box>
      )
      const check = (key: string, isOn: boolean, label: string, change: () => unknown) => (
        <Button key={key} plain label={`${isOn ? '▣' : '▢'} ${label}`} onPress={() => change()} />
      )
      const choose = (key: string, value: string, options: { value: string; label: string }[], onSelect: (v: string) => unknown) => (
        <Select key={key} options={options} value={value} onSelect={(v: string) => onSelect(v)} />
      )

      return (
        <Box flexDirection="column" gap={1}>
          {navBar}
          {head('sliders', T('Settings'))}

          <Box {...card}>
            {head('user', T('Profile'))}
            <Text dimColor>
              {T('{n} years', { n: prof.age })} · {isImperial ? `${Math.round(prof.weightKg / KG_PER_LB)} lb` : `${prof.weightKg} kg`}
              {prof.heightCm === null ? '' : ` · ${isImperial ? `${Math.round(prof.heightCm / CM_PER_IN)} in` : `${prof.heightCm} cm`}`} · {T(GOALS.find(g => g.value === prof.goal)?.label ?? prof.goal)}
            </Text>
            <Box {...actions} marginTop={0}>
              <Button key="edit" hotkey="e" label={T('✎ Edit profile')} onPress={() => editProfile($)} />
            </Box>
          </Box>

          <Box {...card}>
            {head('sliders', T('Place and gear'))}
            {PLACES.map(pl =>
              check(`place-${pl.value}`, prof.places.includes(pl.value), T(pl.label), () =>
                prof.places.includes(pl.value) && prof.places.length === 1
                  ? undefined
                  : changeProfile($, { places: toggle(prof.places, pl.value) }),
              ),
            )}
            {EQUIPMENT.map(q =>
              check(`gear-${q.value}`, prof.equipment.includes(q.value), T(q.label), () =>
                changeProfile($, { equipment: toggle(prof.equipment, q.value) }),
              ),
            )}
            <Text dimColor>{T('Office: quiet, small moves with a chair, desk or wall; a resistance band works too. Home: floor work, bigger moves, dumbbells, a kettlebell or a pull-up bar.')}</Text>
            {!prof.places.includes('home') && prof.equipment.some(q => q === 'dumbbell' || q === 'kettlebell' || q === 'bar') && (
              <Text dimColor>{T('Your dumbbells, kettlebell or bar are only used for home moves. Turn on At home to use them.')}</Text>
            )}
          </Box>

          <Box {...card}>
            {head('target', T('Workouts'))}
            {row(T('Daily goal'), choose('goal', String(prof.dailySets), DAILY_GOALS.map(o => ({ ...o, label: T('{n} sets a day', { n: o.value }) })), v => changeProfile($, { dailySets: Number(v) })))}
            {check('quiet', prof.isQuiet, T('Quiet mode: no jumping or loud moves'), () => changeProfile($, { isQuiet: !prof.isQuiet }))}
            {check('nudges', st.nudges, T('Suggest a set while Claude is working'), () => saveSettings($, { nudges: !st.nudges }))}
            {st.nudges &&
              row(T('Suggest'), choose('delay', String(st.nudgeAfterSeconds), NUDGE_DELAYS.map(o => ({ ...o, label: T('after {n} seconds', { n: o.value }) })), v => saveSettings($, { nudgeAfterSeconds: Number(v) })), T('How long Claude must be busy first.'))}
          </Box>

          <Box {...card}>
            {head('target', T('Focus regions'))}
            {REGIONS.map(r => check(`focus-${r}`, st.focus.includes(r), T(REGION_LABEL[r]), () => saveSettings($, { focus: toggle(st.focus, r as Region) })))}
            <Text dimColor>{T('Picked regions get extra weight when DeskFit chooses your next move. Leave empty to follow your goal.')}</Text>
          </Box>

          <Box {...card}>
            {head('speaker', T('Look and sound'))}
            {row(T('Accent colour'), choose('accent', st.accent, opts(ACCENTS), v => saveSettings($, { accent: v as DeskSettings['accent'] })))}
            {row(T('Illustrations'), choose('art', st.illustrations === 'stick' || st.illustrations === 'bold' ? st.illustrations : 'line', opts(ILLUSTRATIONS), v => saveSettings($, { illustrations: v === 'stick' ? 'stick' : v === 'bold' ? 'bold' : 'line' })), T('Line art by Bryl Lim, based on Everkinetic (CC BY-SA 4.0). Moves without a drawing show none.'))}
            {check('anim', st.animations, T('Animations: moving figures and confetti'), () => saveSettings($, { animations: !st.animations }))}
            {check('sound', st.sound, T('Sound effects'), () => saveSettings($, { sound: !st.sound }))}
            {st.sound && <Button key="test-sound" label={T('Play a test sound')} onPress={() => chime($, 'done')} />}
            {row(T('Messages'), choose('toasts', st.toasts, opts(TOASTS), v => saveSettings($, { toasts: v as DeskSettings['toasts'] })), T('Pop-up notes like "Set done".'))}
            {check('band', st.bandVisible, T('Show the DeskFit line above the prompt'), () => saveSettings($, { bandVisible: !st.bandVisible }))}
          </Box>

          <Box {...card}>
            {head('globe', T('Language and units'))}
            {row(T('Language'), choose('lang', st.language, LANGUAGES, v => saveSettings($, { language: v === 'tr' ? 'tr' : 'en' })), T('More languages are planned.'))}
            {row(T('Units'), choose('units', st.units, opts(UNITS), v => saveSettings($, { units: v as DeskSettings['units'] })))}
          </Box>

          <Box {...card}>
            {head('trophy', T('Leaderboard'))}
            {Input && (
              <Input
                key="backend"
                label={T('Server URL')}
                placeholder={T('https://… (empty = off)')}
                value={st.backendUrl}
                onInput={(v: string) => saveSettings($, { backendUrl: v })}
                onSubmit={(v: string) => saveSettings($, { backendUrl: v.trim() })}
                submitLabel={T('save')}
              />
            )}
            <Text dimColor>
              {backendUrl ? T('Using {url}', { url: backendUrl }) : T('No server set: leaderboards are off and nothing leaves this device.')}
            </Text>
            {backendUrl && !isSecureUrl(backendUrl) && (
              <Text color="red">{T('The server address must start with https:// (http:// only works for localhost).')}</Text>
            )}
            {backendUrl && !who && <Text dimColor>{T('Only the public board is downloaded. Nothing about you is sent until you join.')}</Text>}
            <Text dimColor>{T('A company can host its own server; paste its URL here.')}</Text>
            {who && <Button key="account" label={T('Account ({name})', { name: who.nickname })} onPress={async () => { await openBoard($); await patch($, { view: 'account' }) }} />}
          </Box>

          <Box {...card}>
            {head('shield', T('Your data'))}
            <Text dimColor>{T('Everything is stored on this device only, unless you joined a leaderboard.')}</Text>
            <Box {...actions} marginTop={0}>
              <Button key="export" label={T('Copy my data (JSON)')} onPress={() => exportData($, e.surface)} />
              <Button key="reset" label={T('Erase everything…')} onPress={() => notify($, 'Type /workout reset to erase all DeskFit data.', true)} />
            </Box>
          </Box>

        </Box>
      )
    }

    if (scr === 'board') {
      const who = await read($, identity)
      const soc = await read($, social)
      if (!backendUrl) {
        return (
          <Box flexDirection="column" gap={1}>
            {navBar}
            <Box justifyContent="center" width="100%">
              {hasSvg && <Svg source={emptySvg('offline', 190)} alt={T('Leaderboards are off')} />}
            </Box>
            <Text bold>{T('Leaderboards are off')}</Text>
            <Text>
              {T('Add a DeskFit server URL in Settings to compete on a public board or inside your company. DeskFit works fully without it.')}
            </Text>
            <Box {...actions}>
              <Button key="to-settings" variant="primary" autoFocus label={T('Open Settings')} onPress={() => update($, screen, () => 'settings')} />
            </Box>
          </Box>
        )
      }

      const tabs: { id: Social['tab']; label: string; hotkey: string }[] = [
        { id: 'week', label: T('Weekly'), hotkey: 'w' },
        { id: 'all', label: T('All time'), hotkey: 'a' },
        { id: 'teams', label: T('Teams'), hotkey: 'm' },
      ]
      const boardRows = (
        <Box flexDirection="column" gap={1}>
          {hasSvg && soc.rows.length >= 3 && <Svg source={podiumSvg(soc.rows.slice(0, 3), 300)} alt={T('Top three on the board')} />}
          {soc.rows.length === 0 && !soc.isLoading && (
            <Box flexDirection="column" alignItems="center" gap={1}>
              {hasSvg && <Svg source={emptySvg(soc.tab === 'teams' ? 'team' : 'board', 180)} alt={T('Nothing here yet')} />}
              <Text dimColor>
                {soc.tab === 'teams' ? T('No team board yet. Create a team or join with a code.') : T('No one has scored this period yet. Be first!')}
              </Text>
            </Box>
          )}
          {soc.rows.map(r => (
            <Box key={`row-${r.rank}-${r.nickname}`} gap={2} alignItems="center">
              {hasSvg && <Svg source={rankSvg(r.rank, 22)} alt={T('Rank {n}', { n: r.rank })} />}
              {hasSvg && <Svg source={avatarSvg(r.nickname, 26)} alt={r.nickname} />}
              {!hasSvg && <Text>{String(r.rank).padStart(2)}.</Text>}
              <Box width={22}>
                <Text bold={r.nickname === who?.nickname} inverse={r.nickname === who?.nickname}>
                  {r.nickname}
                </Text>
              </Box>
              <Text dimColor>
                {T('{pts} pts · {sets} sets', { pts: r.points, sets: r.sets })}
              </Text>
              {who && soc.tab === 'teams' && soc.teamInfo?.isOwner && r.nickname !== who.nickname && (
                <Button key={`rm-${r.nickname}`} plain label="✕" onPress={() => removeFromTeam($, r.nickname)} />
              )}
            </Box>
          ))}
        </Box>
      )

      // Not joined yet: the shared board is already on screen, with the way to join right under it.
      if (!who) {
        return (
          <Box flexDirection="column" gap={1}>
            {navBar}
            {head('trophy', T('Leaderboard'))}
            <Box {...actions}>
              {tabs.filter(t => t.id !== 'teams').map(t => (
                <Button
                  key={`tab-${t.id}`}
                  hotkey={t.hotkey}
                  variant={soc.tab === t.id ? 'primary' : undefined}
                  label={t.label}
                  onPress={() => setTab($, t.id)}
                />
              ))}
              <Button key="refresh" hotkey="r" label={T('↻ Refresh')} onPress={() => refreshBoard($)} />
            </Box>
            {soc.isLoading && <Text dimColor>{T('Loading…')}</Text>}
            {soc.tab !== 'teams' && boardRows}
            {head('user', T('Join the leaderboard'))}
            <Text dimColor>
              {T('Shared: your nickname, points, sets and finish times. Never shared: age, weight, height, goal or health details. You can delete your account any time.')}
            </Text>
            <Input
              key="nick"
              label={T('Nickname')}
              placeholder={T('3-20 letters, digits, _ or -')}
              value={soc.form.nickname}
              onInput={(v: string) => update($, social, x => ({ ...x, form: { ...x.form, nickname: v } }))}
              onSubmit={() => signup($)}
              submitLabel={T('join')}
            />
            <Input
              key="recovery"
              label={T('Or recovery code')}
              placeholder="XXXX-XXXX-…"
              value={soc.form.recovery}
              onInput={(v: string) => update($, social, x => ({ ...x, form: { ...x.form, recovery: v } }))}
              onSubmit={() => recover($)}
              submitLabel={T('restore')}
            />
            {soc.error && <Text color="red">{soc.error}</Text>}
            {soc.notice && <Text>{soc.notice}</Text>}
            <Box {...actions}>
              <Button key="join" variant="primary" label={T('Join')} onPress={() => signup($)} />
            </Box>
          </Box>
        )
      }

      if (soc.view === 'account') {
        return (
          <Box flexDirection="column" gap={1}>
            {navBar}
            <Text bold>{T('Account · {name}', { name: who.nickname })}</Text>
            <Text dimColor>{T('id {id} · data lives on this device and on {url}', { id: who.userId, url: backendUrl })}</Text>
            {soc.recoveryCode ? (
              <Box flexDirection="column">
                <Text>{T('Recovery code (keep it private, it is the key to your account):')}</Text>
                <Text bold>{soc.recoveryCode}</Text>
                <Text dimColor>{T('Enter it on a new device under "Or recovery code" to restore your points and teams.')}</Text>
              </Box>
            ) : (
              <Button key="show-code" hotkey="r" label={T('Show recovery code')} onPress={() => showRecovery($)} />
            )}
            <Button
              key="delete"
              hotkey="d"
              label={soc.isConfirmingDelete ? T('Press again to delete everything') : T('Delete my leaderboard account')}
              onPress={() => deleteAccount($)}
            />
            {soc.error && <Text color="red">{soc.error}</Text>}
            <Button key="to-board" autoFocus label={T('Back to board')} onPress={() => patch($, { view: 'board', recoveryCode: null, isConfirmingDelete: false })} />
          </Box>
        )
      }

      const team = soc.teams.find(t => t.id === soc.activeTeam)

      return (
        <Box flexDirection="column" gap={1}>
          {navBar}
          {head('trophy', T('Leaderboard · {name}', { name: who.nickname }))}
          <Text dimColor>
            
            {soc.me ? `${T('{n} pts this week', { n: soc.me.weekPoints })}${soc.me.weekRank ? ` (#${soc.me.weekRank})` : ''}` : ''}
          </Text>
          <Box {...actions}>
            {tabs.map(t => (
              <Button
                key={`tab-${t.id}`}
                hotkey={t.hotkey}
                variant={soc.tab === t.id ? 'primary' : undefined}
                label={t.label}
                onPress={() => setTab($, t.id)}
              />
            ))}
            <Button key="refresh" hotkey="r" label={T('↻ Refresh')} onPress={() => refreshBoard($)} />
            <Button key="account" hotkey="c" label={T('Account')} onPress={() => patch($, { view: 'account', error: null })} />
          </Box>
          {soc.notice && <Text>{soc.notice}</Text>}
          {soc.error && <Text color="red">{soc.error}</Text>}
          {soc.isLoading && <Text dimColor>{T('Loading…')}</Text>}
          {soc.tab === 'teams' && (
            <Box flexDirection="column" gap={1}>
              {soc.teams.length === 0 && <Text dimColor>{T('You are not in a team yet. Create one or join with a code.')}</Text>}
              {soc.teams.length > 1 && (
                <Box {...actions} marginTop={0}>
                  {soc.teams.map(t => (
                    <Button
                      key={`team-${t.id}`}
                      plain
                      label={`${t.id === soc.activeTeam ? '●' : '○'} ${t.name} (${t.members})`}
                      onPress={async () => {
                        await patch($, { activeTeam: t.id, rows: [], teamInfo: null, isConfirmingDisband: false })
                        await refreshBoard($)
                      }}
                    />
                  ))}
                </Box>
              )}
              {soc.teamInfo && (
                <Box {...card}>
                  <Text bold>{soc.teamInfo.name}</Text>
                  <Text dimColor>{T('{n} members · {pts} pts', { n: soc.teamInfo.members, pts: soc.teamTotal })}</Text>
                  <Box {...actions} marginTop={0}>
                    <Button
                      key="tp-week"
                      variant={soc.teamPeriod === 'week' ? 'primary' : undefined}
                      label={T('Weekly')}
                      onPress={() => setTeamPeriod($, 'week')}
                    />
                    <Button
                      key="tp-all"
                      variant={soc.teamPeriod === 'all' ? 'primary' : undefined}
                      label={T('All time')}
                      onPress={() => setTeamPeriod($, 'all')}
                    />
                  </Box>
                  <Text dimColor>{T('Invite code {code} · share it with teammates', { code: soc.teamInfo.inviteCode })}</Text>
                  <Box {...actions} marginTop={0}>
                    <Button key="copy-code" label={T('Copy code')} onPress={() => copyInvite($, e.surface)} />
                    {soc.teamInfo.isOwner && <Button key="new-code" label={T('New code')} onPress={() => rotateInvite($)} />}
                    {soc.teamInfo.isOwner && (
                      <Button
                        key="disband"
                        label={soc.isConfirmingDisband ? T('Press again to close the team') : T('Close team…')}
                        onPress={() => disbandTeam($)}
                      />
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          )}
          {boardRows}
          {soc.tab === 'teams' && (
            <Box flexDirection="column">
              <Text dimColor>{T('Make a private board for your company or friends. Everyone who joins with your code sees the same scores, just in their own list.')}</Text>
              <Input
                key="team-name"
                label={T('New team')}
                placeholder={T('team name')}
                value={soc.form.teamName}
                onInput={(v: string) => update($, social, x => ({ ...x, form: { ...x.form, teamName: v } }))}
                onSubmit={() => createTeam($)}
                submitLabel={T('create')}
              />
              <Input
                key="team-code"
                label={T('Join with code')}
                placeholder={T('8-character code')}
                value={soc.form.invite}
                onInput={(v: string) => update($, social, x => ({ ...x, form: { ...x.form, invite: v } }))}
                onSubmit={() => joinTeam($)}
                submitLabel={T('join')}
              />
              {team && <Button key="leave" label={T('Leave {name}', { name: team.name })} onPress={() => leaveTeam($, team.id)} />}
            </Box>
          )}
        </Box>
      )
    }

    if (scr === 'moves') {
      const lib = await read($, library)
      const here: Place = prof.places.includes(st.place) ? st.place : (prof.places[0] ?? 'office')
      const order = (x: Exercise) => REGIONS.indexOf(topRegion(x.muscles))
      const fits = (x: Exercise) => blockers(x, prof, prog, now, here).length === 0
      const matching = CATALOG.filter(
        x =>
          (lib.region === 'all' || mainRegions(x.muscles).includes(lib.region)) &&
          (lib.place === 'all' || x.places.includes(lib.place)) &&
          (!lib.isMine || fits(x)),
      ).sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name))
      const shown = matching.slice(0, lib.shown)
      const why1 = (b: ReturnType<typeof blockers>[number]): string => {
        switch (b.kind) {
          case 'place': return T(b.place === 'home' ? 'Home only' : 'Office only')
          case 'gear': return T('Needs {gear}', { gear: b.gear.map(q => T(EQUIPMENT.find(x => x.value === q)?.label ?? q).toLowerCase()).join(', ') })
          case 'ability': return T('Needs {ability}', { ability: b.ability.map(a => T(ABILITIES.find(x => x.value === a)?.label ?? a).toLowerCase()).join(', ') })
          case 'limit': return T('Hard on your {limit}', { limit: b.limit.map(l => T(LIMITS.find(x => x.value === l)?.label ?? l).toLowerCase()).join(', ') })
          case 'level': return T('Too advanced for now')
          case 'quiet': return T('Not quiet')
          case 'impact': return T('High impact')
          case 'pain': return T('Resting after a painful set')
        }
      }
      const filter = (label: string, isOn: boolean, change: () => unknown, key: string) => (
        <Button key={key} variant={isOn ? 'primary' : undefined} label={label} onPress={() => change()} />
      )
      const set = (change: Partial<Library>) => update($, library, l => ({ ...l, shown: 4, ...change }))

      return (
        <Box flexDirection="column" gap={1}>
          {navBar}
          {head('target', T('All moves'))}
          <Box gap={1} alignItems="center" flexWrap="wrap">
            {filter(T('All'), lib.region === 'all', () => set({ region: 'all' }), 'r-all')}
            {REGIONS.map(r => filter(T(REGION_LABEL[r]), lib.region === r, () => set({ region: r }), `r-${r}`))}
          </Box>
          <Box gap={1} alignItems="center" flexWrap="wrap">
            {filter(T('Anywhere'), lib.place === 'all', () => set({ place: 'all' }), 'p-all')}
            {PLACES.map(pl => filter(T(pl.label), lib.place === pl.value, () => set({ place: pl.value }), `p-${pl.value}`))}
            {<Button key="mine" plain label={`${lib.isMine ? '▣' : '▢'} ${T('Only what fits my plan')}`} onPress={() => set({ isMine: !lib.isMine })} />}
          </Box>
          <Text dimColor>{T('{n} moves', { n: matching.length })}</Text>
          {shown.map(x => {
            const why2 = blockers(x, prof, prog, now, here)

            return (
              <Box key={`m-${x.id}`} {...card}>
                <Box gap={3} alignItems="center">
                  {hasSvg && figureSvg(x.id, 84, 0.5, false, st.illustrations) !== '' && (
                    <Svg source={figureSvg(x.id, 84, 0.5, false, st.illustrations)} alt={T('{name} demonstration', { name: T(x.name) })} width={84} height={figH(84)} />
                  )}
                  <Box flexDirection="column">
                    <Text bold>{T(x.name)}</Text>
                    <Text dimColor>
                      {mainRegions(x.muscles).map(r => T(REGION_LABEL[r])).join(' · ')} · {T(KIND_LABEL[x.kind])} · {T(intensityOf(x))} · {T(x.level)}
                    </Text>
                    <Text dimColor>
                      {T(placeTag(x))}
                      {x.equipment.length > 0 ? ` · ${x.equipment.map(q => T(EQUIPMENT.find(g => g.value === q)?.label ?? q)).join(', ')}` : ''}
                      {x.isQuiet ? '' : ` · ${T('Not quiet')}`}
                    </Text>
                    <Text dimColor>{why2.length === 0 ? T('Fits your plan') : `${T('Not in your plan')}: ${why2.map(why1).join(' · ')}`}</Text>
                  </Box>
                </Box>
                <Box {...actions} marginTop={0}>
                  <Button key={`go-${x.id}`} label={T('▶ Try it')} onPress={() => startSet($, [], x.id)} />
                </Box>
              </Box>
            )
          })}
          {matching.length > shown.length && (
            <Box {...actions}>
              <Button key="more" label={T('Show more ({n} left)', { n: matching.length - shown.length })} onPress={() => update($, library, l => ({ ...l, shown: l.shown + 4 }))} />
            </Box>
          )}
        </Box>
      )
    }

    if (scr === 'stats') {
      const level = levelOf(prog.xp)
      const days = Array.from({ length: 7 }, (_, i) => dayKey(now - (6 - i) * 86400000))
      const setsOn = (k: string) => (k === day ? today.sets : (prog.history[k] ?? 0))
      const secondsOn = (k: string) => (k === day ? Math.max(today.seconds, prog.secondsByDay[k] ?? 0) : (prog.secondsByDay[k] ?? 0))
      const week = weekRegions(prog, day)
      const weekTotal = REGIONS.reduce((n, r) => n + (week[r] ?? 0), 0)
      const want = shares(prof.goal, st.focus)
      const regionRows = REGIONS.map(r => ({ region: r, actual: weekTotal > 0 ? (week[r] ?? 0) / weekTotal : 0, target: want[r] }))

      return (
        <Box flexDirection="column" gap={1}>
          {navBar}
          {head('chart', T('Your stats'))}
          <Box gap={4} flexWrap="wrap">
            {[
              [T('Level'), String(level)],
              [T('Streak'), T('{n} d', { n: liveStreak(prog, day) })],
              [T('Best'), T('{n} d', { n: prog.bestStreak })],
              [T('Sets'), String(prog.totalSets)],
              [T('Active min'), fmtMinutes(prog.totalSeconds)],
              [T('kcal'), fmtKcal(prog.totalKcal)],
            ].map(([label, value]) => (
              <Box key={label} flexDirection="column">
                <Text bold>{value}</Text>
                <Text dimColor>{label}</Text>
              </Box>
            ))}
          </Box>
          <Text dimColor>
            {T('{xp} XP · level {next} at {at} · {sets} sets while Claude worked', { xp: prog.xp, next: level + 1, at: xpForLevel(level + 1), sets: prog.turnSets })}
          </Text>
          <Text dimColor>
            {T('This week: {min} min · {kcal} kcal', { min: fmtMinutes(days.reduce((n, k) => n + secondsOn(k), 0)), kcal: fmtKcal(days.reduce((n, k) => n + (prog.kcalByDay[k] ?? 0), 0)) })}
          </Text>
          <Text dimColor>{T('Sets per day')}</Text>
          {hasSvg ? (
            <Svg
              source={barsSvg(days.map(k => ({ label: T(WEEKDAYS[new Date(`${k}T12:00:00`).getDay()] ?? ''), sets: setsOn(k) })), prof.dailySets, 320)}
              alt={T('Sets per day over the last week')}
            />
          ) : (
            days.map(k => (
              <Text key={`s-${k}`}>
                {k.slice(5)} {'█'.repeat(Math.min(setsOn(k), 20))} {setsOn(k)}
              </Text>
            ))
          )}
          <Text dimColor>{T('Active minutes per day')}</Text>
          {hasSvg ? (
            <Svg
              source={barsSvg(
                days.map(k => ({ label: T(WEEKDAYS[new Date(`${k}T12:00:00`).getDay()] ?? ''), sets: Math.round((secondsOn(k) / 60) * 10) / 10 })),
                0,
                320,
                v => v.toFixed(1),
              )}
              alt={T('Active minutes per day over the last week')}
            />
          ) : (
            days.map(k => (
              <Text key={`m-${k}`}>
                {k.slice(5)} {'█'.repeat(Math.min(Math.round(secondsOn(k) / 30), 20))} {T('{min} min · {kcal} kcal', { min: fmtMinutes(secondsOn(k)), kcal: fmtKcal(prog.kcalByDay[k] ?? 0) })}
              </Text>
            ))
          )}
          <Text dimColor>{T('This week by body region')}</Text>
          {weekTotal === 0 ? (
            <Text>{T('No sets yet.')}</Text>
          ) : hasSvg ? (
            <Svg
              source={regionBarsSvg(regionRows.map(x => ({ label: T(REGION_LABEL[x.region]), actual: x.actual, target: x.target, isFocus: st.focus.includes(x.region) })), true, 330)}
              alt={T('Share of this week by body region, with your goal share marked')}
            />
          ) : (
            regionRows.map(x => (
              <Text key={`r-${x.region}`}>
                {T(REGION_LABEL[x.region])} {'█'.repeat(Math.round(x.actual * 40))} {Math.round(x.actual * 100)}% / {Math.round(x.target * 100)}%
              </Text>
            ))
          )}
          <Text dimColor>{T('The tick is your goal share. Highlighted regions are behind, and the next moves favour them.')}</Text>
          <Text dimColor>
            {T('Calories are active kcal (above resting), estimated from MET values in the 2024 Compendium of Physical Activities and your age, weight, height and sex. Treat them as rough: they can be off by 20-30%.')}
          </Text>
          <Text dimColor>
            {T('Badges {n}/{total}', { n: prog.badges.length, total: BADGES.length })}
          </Text>
          {hasSvg && (
            <Svg
              source={badgesSvg(BADGES.map(b => ({ id: b.id, name: T(b.name), earned: prog.badges.includes(b.id) })), 4, 340)}
              alt={T('Badges, earned ones in colour')}
            />
          )}
          {BADGES.map(b => (
            <Text key={b.id} dimColor={!prog.badges.includes(b.id)}>
              {prog.badges.includes(b.id) ? '★' : '☆'} {T(b.name)} · {T(b.desc)}
            </Text>
          ))}
        </Box>
      )
    }

    const here: Place = prof.places.includes(st.place) ? st.place : (prof.places[0] ?? 'office')
    const until = await read($, focusUntil)
    const isFocused = until !== null && until > now
    const suggestion = await read($, nudge)
    const next = byId((await read($, upNext)) ?? '')
    const reason = next ? why(next, prof, prog, now, st.focus) : null
    const upcoming = next && today.sets < prof.dailySets ? program(prof, prog, now, here, 4, st.focus).slice(1).filter(x => x.id !== next.id) : []
    const painful = Object.entries(prog.pain).filter(([, t]) => (t ?? 0) > now).map(([a]) => a)
    const isDone = today.sets >= prof.dailySets
    const level = levelOf(prog.xp)
    const span = xpForLevel(level + 1) - xpForLevel(level)
    const days = Array.from({ length: 7 }, (_, i) => dayKey(now - (6 - i) * 86400000))
    const setsOn = (k: string) => (k === day ? today.sets : (prog.history[k] ?? 0))

    return (
      <Box flexDirection="column" gap={1}>
        {navBar}
        <Box gap={3} alignItems="center">
          {hasSvg && <Svg source={ringSvg(today.sets, prof.dailySets, 128, st.animations)} alt={T('{n} of {total} sets today', { n: today.sets, total: prof.dailySets })} />}
          <Box flexDirection="column" gap={1}>
            {hasSvg ? (
              <Svg
                source={levelBarSvg(level, (prog.xp - xpForLevel(level)) / span, 170, T('Level').toUpperCase())}
                alt={T('Level {n}', { n: level })}
              />
            ) : (
              <Box gap={1} alignItems="center">
                <Text>{ICON_TEXT.bolt}</Text>
                <Text bold>{T('Level {n}', { n: level })}</Text>
              </Box>
            )}
            <Text dimColor>{T('{xp} XP to level {next}', { xp: xpForLevel(level + 1) - prog.xp, next: level + 1 })}</Text>
            <Box gap={1} alignItems="center">
              {hasSvg ? <Svg source={flameSvg(liveStreak(prog, day), 28, st.animations, 36)} alt={T('Streak')} width={36} height={36} isInteractive={st.animations} /> : <Text>{ICON_TEXT.flame}</Text>}
              <Text bold>{T('{n} day streak', { n: liveStreak(prog, day) })}</Text>
            </Box>
            {hasSvg && <Svg source={weekDotsSvg(days.map(k => setsOn(k) >= prof.dailySets))} alt={T('Last 7 days')} />}
            <Box gap={1} alignItems="center">
              {hasSvg ? <Svg source={iconSvg('medal', 18, undefined, 36)} alt={T('Badges')} /> : <Text>{ICON_TEXT.medal}</Text>}
              <Text dimColor>{T('{n}/{total} badges', { n: prog.badges.length, total: BADGES.length })}</Text>
            </Box>
            <Text dimColor>
              {T('Today: {min} min · {kcal} kcal', { min: fmtMinutes(Math.max(today.seconds, prog.secondsByDay[day] ?? 0)), kcal: fmtKcal(prog.kcalByDay[day] ?? 0) })}
            </Text>
            {!hasSvg && (
              <Text>
                {T('Today')} {dots(Math.min(today.sets, prof.dailySets), prof.dailySets)} {today.sets}/{prof.dailySets}
              </Text>
            )}
            {isDone && <Text bold>{T('Daily goal reached')}</Text>}
          </Box>
        </Box>
        {prof.places.length > 1 && (
          <Box gap={2} alignItems="center" flexWrap="wrap">
            <Text dimColor>{T('Where are you?')}</Text>
            {prof.places.map(pl => (
              <Button
                key={`here-${pl}`}
                variant={here === pl ? 'primary' : undefined}
                label={T(PLACES.find(x => x.value === pl)?.label ?? pl)}
                onPress={() => setPlace($, pl)}
              />
            ))}
          </Box>
        )}
        {next ? (
          <Box {...card}>
            {head('target', suggestion ? T('Claude is working, a good moment for') : T('Up next'), false)}
            <Box gap={3} alignItems="center">
              {hasSvg && figureSvg(next.id, 150, undefined, st.animations, st.illustrations) !== '' && (
                <Svg source={figureSvg(next.id, 150, undefined, st.animations, st.illustrations)} alt={T('{name} demonstration', { name: T(next.name) })} width={150} height={figH(150)} isInteractive={st.animations} />
              )}
              <Box flexDirection="column">
                <Text bold>{T(next.name)}</Text>
                <Text dimColor>
                  {mainRegions(next.muscles).map(r => T(REGION_LABEL[r])).join(' · ')} · {T(intensityOf(next))} · {T('{n}s', { n: secondsFor(next, prof) })}
                  {next.places.length === 1 ? ` · ${T(placeTag(next))}` : ''}
                  {next.equipment.length > 0 ? ` · ${next.equipment.map(q => T(EQUIPMENT.find(x => x.value === q)?.label ?? q)).join(', ')}` : ''}
                </Text>
                {reason && <Text dimColor>{T(reason.text, { region: reason.region ? T(REGION_LABEL[reason.region]).toLowerCase() : '' })}</Text>}
              </Box>
            </Box>
            {upcoming.length > 0 && <Text dimColor>{T('Then: {moves}', { moves: upcoming.slice(0, 3).map(x => T(x.name)).join(' · ') })}</Text>}
            <Box {...actions} marginTop={0}>
              <Button key="start" hotkey="s" variant="primary" label={T('▶ Start')} onPress={() => startSet($, [], next.id)} />
              <Button key="shuffle" hotkey="n" label={T('⇄ Shuffle')} onPress={() => { passed = [...passed, next.id]; return rollNext($, passed) }} />
            </Box>
          </Box>
        ) : (
          <Box {...actions}>
            <Button key="start" hotkey="s" variant="primary" label={T('▶ Start a set')} onPress={() => startSet($)} />
          </Box>
        )}
        {hasSvg && (
          <Box flexDirection="column">
            <Text dimColor>{T('This week')}</Text>
            <Svg
              source={barsSvg(days.map(k => ({ label: T(WEEKDAYS[new Date(`${k}T12:00:00`).getDay()] ?? ''), sets: setsOn(k) })), prof.dailySets, 340)}
              alt={T('Sets per day over the last week')}
            />
          </Box>
        )}
        {isFocused && (
          <Text dimColor>{T('Focus mode until {time}. No suggestions.', { time: new Date(until).toTimeString().slice(0, 5) })}</Text>
        )}
        {painful.length > 0 && <Text dimColor>{T('Resting: {areas} (a week after a painful set)', { areas: painful.map(a => T(a)).join(', ') })}</Text>}
        <Text dimColor>{T('Stored only on this device. /workout focus 2h pauses suggestions.')}</Text>
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)

    if (!(await read($, isLoaded)) || !(await read($, settings)).bandVisible) return next(e)

    const { Box, Text, Button } = $.ui.resolve(e) as any
    const lang = (await read($, settings)).language
    const prof = await read($, profile)

    if (!prof) {
      return (
        <Box>
          <Text dimColor>{tr(lang, 'DeskFit: type /workout to set up')} </Text>
        </Box>
      )
    }

    const prog = await read($, progress)
    const day = dayKey(Date.now())
    const sets = prog.today.day === day ? prog.today.sets : 0
    const c = await read($, current)
    const suggestion = await read($, nudge)
    const hint = suggestion && !c ? byId(suggestion) : undefined

    return (
      <Box>
        <Text dimColor>
          DeskFit · {tr(lang, '{n} d', { n: liveStreak(prog, day) })} · {sets}/{prof.dailySets}{' '}
          {c?.phase === 'running' ? `· ${clock(Math.max(c.remaining, 0))} ` : ''}
        </Text>
        <Button
          key="band-open"
          variant={hint ? 'primary' : undefined}
          label={hint ? tr(lang, 'Claude is busy: {name}?', { name: tr(lang, hint.name) }) : c ? tr(lang, 'Open') : tr(lang, 'Start a set')}
          onPress={async () => {
            if (!c) await startSet($, [], hint?.id)
            await openPane($)
          }}
        />
      </Box>
    )
  })
}
