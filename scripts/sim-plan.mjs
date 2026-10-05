// Plays the planner for 14 simulated days per profile and checks the plan is varied and balanced.
// Usage: npx tsx scripts/sim-plan.mjs [--verbose]
import { CATALOG } from '../hooks/catalog.ts'
import { dayKey, emptyProgress, rollDay, withCredit } from '../hooks/game.ts'
import { pick, shares } from '../hooks/planner.ts'
import { REGIONS, credit, topRegion } from '../hooks/muscles.ts'

const verbose = process.argv.includes('--verbose')
const ALL_GEAR = ['dumbbell', 'band', 'kettlebell', 'bar', 'mat']
const base = { age: 35, weightKg: 75, heightCm: 175, sex: 'unspecified', goal: 'fitness', abilities: [], limits: [], dailySets: 6, isQuiet: false, places: ['office'], equipment: [] }

const PROFILES = [
  ['office beginner, fitness', { ...base }],
  ['office quiet, posture', { ...base, goal: 'posture', isQuiet: true, abilities: ['squat'] }],
  ['office, weight loss, 8 sets', { ...base, goal: 'weight', dailySets: 8, abilities: ['squat', 'lunge'] }],
  ['home advanced, strength, all gear', { ...base, goal: 'strength', places: ['home'], equipment: ALL_GEAR, abilities: ['pushup', 'squat', 'plank', 'lunge', 'jump'], dailySets: 8 }],
  ['home intermediate, weight', { ...base, goal: 'weight', places: ['home'], abilities: ['pushup', 'squat', 'plank'] }],
  ['senior 62, knees and back', { ...base, age: 62, goal: 'posture', places: ['office', 'home'], limits: ['knees', 'back'], abilities: ['squat'], dailySets: 5 }],
  ['office with dumbbells+band', { ...base, goal: 'strength', equipment: ['dumbbell', 'band'], abilities: ['squat', 'pushup'] }],
]

const START = new Date(2026, 0, 5, 9).getTime()
let failures = 0
const fail = (name, msg) => { failures++; console.log(`  FAIL ${name}: ${msg}`) }

for (const [name, p] of PROFILES) {
  for (const place of p.places) {
    const label = `${name} @ ${place}`
    const log = []
    let prog = emptyProgress(dayKey(START))

    for (let d = 0; d < 14; d++) {
      const now = START + d * 86400000 + 9 * 3600000
      const day = dayKey(now)

      prog = rollDay(prog, day)

      for (let i = 0; i < p.dailySets; i++) {
        const ex = pick(p, prog, now, [], place, [])

        log.push(ex)
        prog = { ...withCredit(prog, ex, day), today: { ...prog.today, sets: prog.today.sets + 1 } }
      }
    }

    // pressing Shuffle ten times in a row must show ten different moves
    {
      const now = START
      const fresh = rollDay(emptyProgress(dayKey(now)), dayKey(now))
      const seen = []
      let ex = pick(p, fresh, now, [], place, [])

      for (let i = 0; i < 10; i++) {
        seen.push(ex.id)
        ex = pick(p, fresh, now, [...seen], place, [])
      }
      if (new Set(seen).size !== seen.length) fail(label, `shuffle repeats a move: ${seen.join(', ')}`)
    }

    const allowedIds = new Set(CATALOG.filter(ex => ex.places.includes(place) && ex.equipment.every(q => p.equipment.includes(q))).map(x => x.id))
    const used = new Map()
    for (const ex of log) used.set(ex.id, (used.get(ex.id) ?? 0) + 1)

    let sameId = 0, sameTop = 0, samePattern = 0
    for (let i = 1; i < log.length; i++) {
      if (log[i].id === log[i - 1].id) sameId++
      if (topRegion(log[i].muscles) === topRegion(log[i - 1].muscles)) sameTop++
      if (log[i].pattern === log[i - 1].pattern && ['push', 'pull', 'squat', 'hinge', 'core', 'rotate'].includes(log[i].pattern)) samePattern++
    }

    const total = Object.fromEntries(REGIONS.map(r => [r, 0]))
    for (const ex of log) for (const [r, n] of Object.entries(credit(ex.muscles))) total[r] += n
    const sum = REGIONS.reduce((n, r) => n + total[r], 0)
    const target = shares(p.goal, [])
    const dist = REGIONS.reduce((n, r) => n + Math.abs(total[r] / sum - target[r]), 0) / 2
    const maxShare = Math.max(...used.values()) / log.length
    const kinds = { strength: 0, cardio: 0, mobility: 0, stretch: 0 }
    for (const ex of log) kinds[ex.kind]++
    const efforts = [0, 0, 0, 0, 0, 0]
    for (const ex of log) efforts[ex.effort]++
    const unused = [...allowedIds].filter(id => !used.has(id))
    const transitions = log.length - 1

    console.log(`${label}: ${log.length} sets, ${used.size}/${allowedIds.size} moves used, region gap ${(dist * 100).toFixed(0)}%, top move ${(maxShare * 100).toFixed(0)}%, same-region-in-a-row ${sameTop}/${transitions}, same-pattern ${samePattern}`)
    if (verbose) {
      console.log('   kinds', JSON.stringify(kinds), 'effort', efforts.slice(1).join('/'), 'unused', unused.join(',') || '-')
      console.log('   regions', REGIONS.map(r => `${r} ${(total[r] / sum * 100).toFixed(0)}%(${(target[r] * 100).toFixed(0)})`).join(' '))
    }

    if (sameId > 0) fail(label, `${sameId} move(s) twice in a row`)
    if (sameTop / transitions > 0.12) fail(label, `same region back to back in ${sameTop} of ${transitions} sets`)
    if (samePattern / transitions > 0.08) fail(label, `same movement pattern back to back in ${samePattern} sets`)
    if (dist > 0.22) fail(label, `week mix is ${(dist * 100).toFixed(0)}% away from the goal's shares`)
    if (maxShare > 0.12) fail(label, `one move makes up ${(maxShare * 100).toFixed(0)}% of all sets`)
    if (used.size < Math.min(allowedIds.size, 10) ) fail(label, `only ${used.size} different moves in 14 days`)
  }
}

console.log(failures === 0 ? '\nplan ok' : `\n${failures} problem(s)`)
process.exit(failures === 0 ? 0 : 1)
