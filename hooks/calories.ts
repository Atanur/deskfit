// Active calories for a set, from MET values and the person's own body data.
//
// MET values: 2024 Adult Compendium of Physical Activities (pacompendium.com), conditioning exercise:
//   02020 vigorous calisthenics (push-ups, sit-ups, jumping jacks, burpees) 7.5
//   02022 moderate calisthenics (push-ups, sit-ups, pull-ups, lunges)       3.8
//   02024 light calisthenics (curl-ups, crunches, plank)                    2.8
//   02056 body weight resistance, general (squat, lunge, push-up, crunch)    3.0
//   02057 body weight resistance, high intensity                             6.5
//   02101 stretching, mild / 02150 yoga, hatha                               2.3
//   02054 resistance training, multiple exercises, 8-15 reps (dumbbells, bands) 3.5
//   02058 kettlebell swings                                                   9.8
//   02064 home exercise, general                                              3.8
// Marching in place is not listed there: 3.5 is an estimate from brisk walking.
// Standing quietly counts as 1.3 (the eye break).
//
// Formula: active kcal = (MET - 1) x resting kcal per hour x hours.
// Resting rate comes from the Mifflin-St Jeor equation; 1 MET is one person's resting rate, so
// scaling by it fits the estimate to age, weight, height and sex. Without a height it falls
// back to the standard 1 kcal per kg per hour. Estimates are good to roughly +/- 20-30%.
import type { Profile } from '../types'

const MET: Record<string, number> = {
  'chair-squat': 3.0,
  squat: 3.8,
  'jump-squat': 6.5,
  'calf-raise': 2.8,
  'wall-sit': 3.0,
  'reverse-lunge': 3.8,
  'glute-bridge-stand': 2.8,
  'desk-pushup': 3.0,
  pushup: 3.8,
  'diamond-pushup': 3.8,
  'chair-dip': 3.0,
  'wall-angel': 2.3,
  plank: 2.8,
  'knee-plank': 2.8,
  'seated-knee-lift': 2.8,
  'mountain-climber': 7.5,
  'standing-crunch': 2.8,
  'chair-twist': 2.3,
  'cat-cow-seated': 2.3,
  'hip-hinge': 2.8,
  'neck-roll': 2.3,
  'chin-tuck': 2.3,
  'shoulder-roll': 2.3,
  'wrist-circles': 2.3,
  'prayer-stretch': 2.3,
  'eye-20': 1.3,
  'jumping-jacks': 7.5,
  march: 3.5,
  burpee: 7.5,
  // office
  'seated-leg-extension': 2.8,
  'figure-four': 2.3,
  'quad-stretch': 2.3,
  'glute-kickback': 2.8,
  'wall-pushup': 2.8,
  'wall-chest-stretch': 2.3,
  'overhead-reach': 2.3,
  'calf-stretch': 2.3,
  'scapula-squeeze': 2.8,
  'y-raise': 2.8,
  // home
  'glute-bridge': 3.0,
  crunch: 2.8,
  'bicycle-crunch': 3.0,
  'leg-raise': 2.8,
  'sit-up': 3.8,
  superman: 2.8,
  'bird-dog': 2.8,
  'childs-pose': 2.3,
  'downward-dog': 2.3,
  'knee-pushup': 3.0,
  'shoulder-taps': 3.8,
  inchworm: 3.8,
  'forward-lunge': 3.8,
  'high-knees': 7.5,
  // equipment
  'db-curl': 3.5,
  'db-press': 3.5,
  'db-goblet-squat': 3.5,
  'db-row': 3.5,
  'db-rdl': 3.5,
  'db-tricep-ext': 3.5,
  'band-row': 3.5,
  'band-curl': 3.5,
  'kb-swing': 9.8,
  pullup: 3.8,
  'dead-hang': 2.8,
}

export const metFor = (exerciseId: string): number => MET[exerciseId] ?? 2.8

/** Resting energy use in kcal per hour (Mifflin-St Jeor); one hour at 1 MET. */
export const restingKcalPerHour = (p: Profile): number => {
  if (p.heightCm === null) return p.weightKg

  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age
  const offset = p.sex === 'male' ? 5 : p.sex === 'female' ? -161 : -78

  return Math.max(base + offset, 800) / 24
}

/** Active kcal, above what the body would have burned resting anyway. */
export const kcalFor = (exerciseId: string, seconds: number, p: Profile): number =>
  Math.round(Math.max(metFor(exerciseId) - 1, 0) * restingKcalPerHour(p) * (seconds / 3600) * 100) / 100

export const fmtKcal = (kcal: number): string => (kcal < 10 ? kcal.toFixed(1) : String(Math.round(kcal)))

export const fmtMinutes = (seconds: number): string => {
  const min = seconds / 60

  return min < 10 ? min.toFixed(1) : String(Math.round(min))
}
