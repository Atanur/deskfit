// What each move works, how, and how hard. The planner balances body regions with this.
//
// Muscle lists follow the primary and secondary muscle groups of standard exercise references
// (the Workout Guide manifest for the moves it covers, anatomy for the rest). A main muscle counts
// fully, a helper half. `arms` is the upper arm (biceps, triceps); `wrists` is the forearm and grip;
// `hips` is the hip flexors and the hip joint; `abs` also covers the obliques.
import type { Kind, Muscle, Pattern, Region } from '../types'

type Row = [Kind, Pattern, Muscle[], Muscle[]]

export const MUSCLES: Record<string, Row> = {
  // ---- legs and glutes
  'chair-squat': ['strength', 'squat', ['quads', 'glutes'], ['hamstrings', 'abs']],
  squat: ['strength', 'squat', ['quads', 'glutes'], ['hamstrings', 'abs', 'lowBack']],
  'jump-squat': ['cardio', 'squat', ['quads', 'glutes'], ['calves', 'hamstrings']],
  'calf-raise': ['strength', 'squat', ['calves'], ['quads']],
  'wall-sit': ['strength', 'squat', ['quads'], ['glutes', 'abs']],
  'reverse-lunge': ['strength', 'squat', ['quads', 'glutes'], ['hamstrings', 'calves', 'abs']],
  'forward-lunge': ['strength', 'squat', ['quads', 'glutes'], ['hamstrings', 'calves']],
  'glute-bridge-stand': ['strength', 'hinge', ['glutes'], ['hamstrings', 'lowBack']],
  'glute-bridge': ['strength', 'hinge', ['glutes'], ['hamstrings', 'lowBack', 'abs']],
  'glute-kickback': ['strength', 'hinge', ['glutes'], ['hamstrings', 'lowBack']],
  'seated-leg-extension': ['strength', 'squat', ['quads'], ['hips']],
  'figure-four': ['stretch', 'release', ['hips', 'glutes'], ['lowBack']],
  'quad-stretch': ['stretch', 'release', ['quads'], ['hips']],
  'hip-hinge': ['strength', 'hinge', ['glutes', 'hamstrings'], ['lowBack']],
  // ---- chest, arms, shoulders
  'desk-pushup': ['strength', 'push', ['chest', 'arms'], ['shoulders', 'abs']],
  pushup: ['strength', 'push', ['chest', 'arms'], ['shoulders', 'abs']],
  'diamond-pushup': ['strength', 'push', ['arms', 'chest'], ['shoulders', 'abs']],
  'knee-pushup': ['strength', 'push', ['chest', 'arms'], ['shoulders', 'abs']],
  'wall-pushup': ['strength', 'push', ['chest', 'arms'], ['shoulders']],
  'chair-dip': ['strength', 'push', ['arms'], ['chest', 'shoulders']],
  'wall-angel': ['mobility', 'pull', ['upperBack', 'shoulders'], ['neck']],
  'wall-chest-stretch': ['stretch', 'release', ['chest'], ['shoulders']],
  'shoulder-roll': ['mobility', 'release', ['shoulders'], ['upperBack', 'neck']],
  'overhead-reach': ['stretch', 'release', ['shoulders', 'upperBack'], ['abs']],
  'calf-stretch': ['stretch', 'release', ['calves'], ['hamstrings']],
  'scapula-squeeze': ['strength', 'pull', ['upperBack'], ['shoulders', 'arms']],
  'y-raise': ['strength', 'pull', ['upperBack', 'shoulders'], ['neck']],
  // ---- core
  plank: ['strength', 'core', ['abs'], ['shoulders', 'glutes', 'lowBack']],
  'knee-plank': ['strength', 'core', ['abs'], ['shoulders', 'glutes', 'lowBack']],
  'seated-knee-lift': ['strength', 'core', ['abs'], ['hips']],
  'standing-crunch': ['strength', 'core', ['abs'], ['hips']],
  crunch: ['strength', 'core', ['abs'], ['hips']],
  'bicycle-crunch': ['strength', 'rotate', ['abs'], ['hips']],
  'leg-raise': ['strength', 'core', ['abs', 'hips'], ['quads']],
  'sit-up': ['strength', 'core', ['abs'], ['hips']],
  'bird-dog': ['strength', 'core', ['abs', 'lowBack'], ['glutes', 'shoulders']],
  'shoulder-taps': ['strength', 'core', ['abs', 'shoulders'], ['chest', 'arms']],
  'mountain-climber': ['cardio', 'core', ['abs', 'shoulders'], ['quads', 'hips', 'chest']],
  // ---- back and spine
  'chair-twist': ['mobility', 'rotate', ['lowBack', 'abs'], ['upperBack']],
  'cat-cow-seated': ['mobility', 'release', ['lowBack', 'upperBack'], ['abs', 'neck']],
  superman: ['strength', 'hinge', ['lowBack', 'glutes'], ['upperBack', 'shoulders']],
  'childs-pose': ['stretch', 'release', ['lowBack', 'hips'], ['shoulders', 'upperBack']],
  'downward-dog': ['stretch', 'release', ['shoulders', 'hamstrings'], ['calves', 'upperBack', 'wrists']],
  // ---- neck, wrists, eyes
  'neck-roll': ['mobility', 'release', ['neck'], ['shoulders']],
  'chin-tuck': ['mobility', 'release', ['neck'], ['upperBack']],
  'wrist-circles': ['mobility', 'release', ['wrists'], ['arms']],
  'prayer-stretch': ['stretch', 'release', ['wrists'], ['arms']],
  'eye-20': ['mobility', 'release', ['eyes'], []],
  // ---- whole body
  'jumping-jacks': ['cardio', 'move', ['quads', 'shoulders'], ['calves', 'glutes']],
  march: ['cardio', 'move', ['hips', 'quads'], ['calves', 'abs']],
  burpee: ['cardio', 'move', ['quads', 'chest'], ['abs', 'shoulders', 'arms', 'glutes']],
  'high-knees': ['cardio', 'move', ['hips', 'quads'], ['calves', 'abs']],
  inchworm: ['mobility', 'move', ['hamstrings', 'abs'], ['shoulders', 'chest', 'calves']],
  // ---- with gear
  'db-curl': ['strength', 'pull', ['arms'], ['shoulders', 'wrists']],
  'db-press': ['strength', 'push', ['shoulders', 'arms'], ['chest', 'abs']],
  'db-goblet-squat': ['strength', 'squat', ['quads', 'glutes'], ['abs', 'upperBack', 'hamstrings']],
  'db-row': ['strength', 'pull', ['upperBack', 'arms'], ['lowBack', 'shoulders']],
  'db-rdl': ['strength', 'hinge', ['hamstrings', 'glutes'], ['lowBack', 'upperBack', 'wrists']],
  'db-tricep-ext': ['strength', 'push', ['arms'], ['shoulders']],
  'band-row': ['strength', 'pull', ['upperBack'], ['arms', 'shoulders']],
  'band-curl': ['strength', 'pull', ['arms'], ['wrists']],
  'kb-swing': ['strength', 'hinge', ['glutes', 'hamstrings'], ['lowBack', 'shoulders', 'abs']],
  pullup: ['strength', 'pull', ['upperBack', 'arms'], ['shoulders', 'abs']],
  'dead-hang': ['mobility', 'pull', ['wrists', 'shoulders'], ['upperBack', 'arms']],
}

export const REGIONS: Region[] = ['neck', 'shoulders', 'back', 'arms', 'core', 'hips', 'thighs', 'calves']

const REGION_OF: Record<Muscle, Region> = {
  neck: 'neck',
  eyes: 'neck',
  shoulders: 'shoulders',
  chest: 'shoulders',
  upperBack: 'back',
  lowBack: 'back',
  arms: 'arms',
  wrists: 'arms',
  abs: 'core',
  hips: 'hips',
  glutes: 'hips',
  quads: 'thighs',
  hamstrings: 'thighs',
  calves: 'calves',
}

/** Credit a move gives each region: 1 for a main muscle, 0.5 for a helper, the best one per region. */
export const credit = (muscles: { main: Muscle[]; assist: Muscle[] }): Partial<Record<Region, number>> => {
  const out: Partial<Record<Region, number>> = {}

  for (const m of muscles.assist) out[REGION_OF[m]] = Math.max(out[REGION_OF[m]] ?? 0, 0.5)
  for (const m of muscles.main) out[REGION_OF[m]] = 1

  return out
}

/** The region a move works most; ties go to the first main muscle. */
export const topRegion = (muscles: { main: Muscle[]; assist: Muscle[] }): Region =>
  REGION_OF[muscles.main[0] ?? muscles.assist[0] ?? 'abs']

export const effortOf = (met: number): 1 | 2 | 3 | 4 | 5 => (met <= 2.3 ? 1 : met <= 3 ? 2 : met <= 3.8 ? 3 : met <= 7.5 ? 4 : 5)

export const REGION_LABEL: Record<Region, string> = {
  neck: 'Neck and eyes',
  shoulders: 'Shoulders and chest',
  back: 'Back',
  arms: 'Arms',
  core: 'Core',
  hips: 'Hips and glutes',
  thighs: 'Thighs',
  calves: 'Calves',
}

/** The regions a move works fully, in order. */
export const mainRegions = (muscles: { main: Muscle[]; assist: Muscle[] }): Region[] =>
  REGIONS.filter(r => (credit(muscles)[r] ?? 0) >= 1)
