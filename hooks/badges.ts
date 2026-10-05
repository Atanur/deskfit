import type { Progress } from '../types'
import { weekAreas } from './game'

export type Badge = {
  id: string
  name: string
  desc: string
  test: (p: Progress, day: string) => boolean
}

export const BADGES: Badge[] = [
  { id: 'first-set', name: 'First step', desc: 'Finish your first set', test: p => p.totalSets >= 1 },
  { id: 'ten-sets', name: 'Warm engine', desc: '10 sets in total', test: p => p.totalSets >= 10 },
  { id: 'hundred-sets', name: 'Century', desc: '100 sets in total', test: p => p.totalSets >= 100 },
  { id: 'streak-3', name: 'On a roll', desc: '3 day streak', test: p => p.bestStreak >= 3 },
  { id: 'streak-7', name: 'Full week', desc: '7 day streak', test: p => p.bestStreak >= 7 },
  { id: 'streak-30', name: 'Habit formed', desc: '30 day streak', test: p => p.bestStreak >= 30 },
  { id: 'build-break', name: 'Build break', desc: 'Do a set while Claude is working', test: p => p.turnSets >= 1 },
  { id: 'compile-conquer', name: 'Compile and conquer', desc: '10 sets while Claude is working', test: p => p.turnSets >= 10 },
  { id: 'all-rounder', name: 'All-rounder', desc: '5 different body areas in one week', test: (p, day) => Object.keys(weekAreas(p, day)).length >= 5 },
  { id: 'early-bird', name: 'Early bird', desc: 'A set before 9 am', test: p => p.earlyBirds >= 1 },
  { id: 'hour-power', name: 'Hour of power', desc: '60 active minutes in total', test: p => p.totalSeconds >= 3600 },
]

export const badgeName = (id: string): string => BADGES.find(b => b.id === id)?.name ?? id

/** Adds every badge newly earned; returns the updated progress and the new ids. */
export const award = (p: Progress, day: string): { progress: Progress; earned: string[] } => {
  const earned = BADGES.filter(b => !p.badges.includes(b.id) && b.test(p, day)).map(b => b.id)

  return earned.length === 0 ? { progress: p, earned } : { progress: { ...p, badges: [...p.badges, ...earned] }, earned }
}
