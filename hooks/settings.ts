import type { DeskSettings } from '../types'

export const DEFAULT_SETTINGS: DeskSettings = {
  language: 'en',
  units: 'metric',
  nudges: true,
  nudgeAfterSeconds: 20,
  sound: true,
  animations: true,
  illustrations: 'line',
  accent: 'signal',
  toasts: 'all',
  bandVisible: true,
  place: 'office',
  focus: [],
  // the shared public board; the person can clear or replace it in Settings, an admin can set another with the plugin option
  backendUrl: 'https://deskfit-api.atanur.dev',
}

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'tr', label: 'Türkçe' },
]

export const UNITS = [
  { value: 'metric', label: 'Metric (kg, cm)' },
  { value: 'imperial', label: 'Imperial (lb, in)' },
]

export const NUDGE_DELAYS = [10, 20, 30, 60].map(n => ({ value: String(n), label: `after ${n} seconds` }))

export const ACCENTS = [
  { value: 'signal', label: 'Signal' },
  { value: 'mono', label: 'Monochrome' },
  { value: 'teal', label: 'Teal' },
  { value: 'violet', label: 'Violet' },
  { value: 'rose', label: 'Rose' },
  { value: 'blue', label: 'Blue' },
  { value: 'amber', label: 'Amber' },
]

export const ILLUSTRATIONS = [
  { value: 'line', label: 'Line art' },
  { value: 'bold', label: 'Abstract' },
  { value: 'stick', label: 'Stick figure' },
]

export const TOASTS = [
  { value: 'all', label: 'All messages' },
  { value: 'important', label: 'Only important' },
  { value: 'none', label: 'None' },
]

export const DAILY_GOALS = [3, 5, 8, 12].map(n => ({ value: String(n), label: `${n} sets a day` }))

/** Merges what was saved over the defaults; the plugin's `userConfig` seeds the defaults. */
export const withDefaults = (saved: Partial<DeskSettings> | undefined, seed: Partial<DeskSettings>): DeskSettings => ({
  ...DEFAULT_SETTINGS,
  ...seed,
  ...saved,
})

export const KG_PER_LB = 0.45359237
export const CM_PER_IN = 2.54
