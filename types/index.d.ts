export type Screen = 'home' | 'onboarding' | 'workout' | 'result' | 'stats' | 'board' | 'settings' | 'moves'

export type Goal = 'fitness' | 'weight' | 'strength' | 'posture'
export type Level = 'beginner' | 'intermediate' | 'advanced'
export type Area = 'legs' | 'core' | 'upper' | 'back' | 'neck' | 'wrists' | 'eyes' | 'full'
export type Ability = 'pushup' | 'squat' | 'plank' | 'lunge' | 'jump'
export type Place = 'office' | 'home'
export type Equipment = 'dumbbell' | 'band' | 'kettlebell' | 'bar' | 'mat'
export type Sex = 'female' | 'male' | 'unspecified'
export type Limit = 'knees' | 'back' | 'wrists' | 'shoulders' | 'neck'
export type Muscle =
  | 'neck' | 'eyes' | 'shoulders' | 'chest' | 'upperBack' | 'arms' | 'wrists'
  | 'abs' | 'lowBack' | 'hips' | 'glutes' | 'quads' | 'hamstrings' | 'calves'
/** Body regions the planner balances; each groups one or two muscles. */
export type Region = 'neck' | 'shoulders' | 'back' | 'arms' | 'core' | 'hips' | 'thighs' | 'calves'
export type Kind = 'strength' | 'cardio' | 'mobility' | 'stretch'
export type Pattern = 'push' | 'pull' | 'squat' | 'hinge' | 'core' | 'rotate' | 'move' | 'release'

export type Exercise = {
  id: string
  name: string
  area: Area
  level: Level
  seconds: number
  howto: string
  isQuiet: boolean
  isHighImpact: boolean
  needs: Ability[]
  avoidIf: Limit[]
  /** Where it suits: an office needs quiet and small moves, a home has floor and room. */
  places: Place[]
  /** Gear the move needs, if any. */
  equipment: Equipment[]
  /** Muscles worked: the main ones count fully, the helpers half. */
  muscles: { main: Muscle[]; assist: Muscle[] }
  kind: Kind
  pattern: Pattern
  /** 1 (gentle) to 5 (all out), from the move's MET value. */
  effort: 1 | 2 | 3 | 4 | 5
}

export type Profile = {
  age: number
  weightKg: number
  heightCm: number | null
  sex: Sex
  goal: Goal
  abilities: Ability[]
  limits: Limit[]
  dailySets: number
  isQuiet: boolean
  /** Where this person works out, and the gear they own. */
  places: Place[]
  equipment: Equipment[]
}

export type Draft = {
  step: number
  age: string
  weight: string
  height: string
  sex: Sex
  goal: Goal
  abilities: Ability[]
  limits: Limit[]
  dailySets: number
  isQuiet: boolean
  places: Place[]
  equipment: Equipment[]
  error: string | null
}

export type Progress = {
  xp: number
  totalSets: number
  totalSeconds: number
  streak: number
  bestStreak: number
  lastGoalDay: string | null
  today: { day: string; sets: number; seconds: number }
  history: Record<string, number>
  recent: string[]
  areas: Record<string, Partial<Record<Area, number>>>
  pain: Partial<Record<Area, number>>
  tweak: number
  badges: string[]
  turnSets: number
  earlyBirds: number
  totalKcal: number
  kcalByDay: Record<string, number>
  secondsByDay: Record<string, number>
  /** Credit per body region per day, from every set. */
  regions: Record<string, Partial<Record<Region, number>>>
  /** Credit per region per day from strength and cardio sets only, which need rest. */
  loads: Record<string, Partial<Record<Region, number>>>
}

export type LastResult = {
  exerciseId: string
  seconds: number
  xpGained: number
  kcal: number
  newBadges: string[]
  isGoalReached: boolean
  levelUp: number | null
  isRated: boolean
}

export type ActiveSet = {
  exerciseId: string
  phase: 'ready' | 'running'
  total: number
  remaining: number
}

export type DeskSettings = {
  language: 'en' | 'tr'
  units: 'metric' | 'imperial'
  nudges: boolean
  nudgeAfterSeconds: number
  sound: boolean
  animations: boolean
  /** Hand-drawn art where a move has it, or the stick figure. */
  illustrations: 'drawn' | 'stick' | 'bold' | 'line'
  accent: 'signal' | 'mono' | 'teal' | 'violet' | 'rose' | 'blue' | 'amber'
  toasts: 'all' | 'important' | 'none'
  bandVisible: boolean
  /** Where the person is right now; picks the moves that suit the room. */
  place: Place
  /** Regions the person wants extra work on. */
  focus: Region[]
  backendUrl: string
}

export type Library = {
  region: Region | 'all'
  place: Place | 'all'
  /** Only the moves that fit this person's plan right now. */
  isMine: boolean
  shown: number
}

export type Identity = { userId: string; nickname: string }
export type BoardRow = { rank: number; nickname: string; points: number; sets: number }
export type TeamInfo = { id: string; name: string; inviteCode: string; members: number }
export type TeamDetail = { id: string; name: string; inviteCode: string; isOwner: boolean; members: number }
export type MeInfo = { weekPoints: number; allPoints: number; weekRank: number | null }

export type Social = {
  tab: 'week' | 'all' | 'teams'
  view: 'board' | 'account'
  rows: BoardRow[]
  teams: TeamInfo[]
  activeTeam: string | null
  teamInfo: TeamDetail | null
  teamTotal: number
  teamPeriod: 'week' | 'all'
  isConfirmingDisband: boolean
  me: MeInfo | null
  isLoading: boolean
  error: string | null
  notice: string | null
  form: { nickname: string; teamName: string; invite: string; recovery: string }
  recoveryCode: string | null
  isConfirmingDelete: boolean
}

declare module 'claude-code' {
  interface PluginState {
    deskfit: {
      screen: Screen
      isLoaded: boolean
      profile: Profile | null
      progress: Progress
      draft: Draft
      current: ActiveSet | null
      result: LastResult | null
      isBusy: boolean
      nudge: string | null
      focusUntil: number | null
      upNext: string | null
      prefs: DeskSettings
      identity: Identity | null
      social: Social
      library: Library
    }
  }
}
