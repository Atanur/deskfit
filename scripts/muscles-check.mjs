// Checks the muscle table: every move has a row, and for moves with a Workout Guide twin the
// muscles roughly agree with that library's primary and secondary muscles.
import { readFileSync } from 'node:fs'
import { CATALOG } from '../hooks/catalog.ts'
import { MUSCLES } from '../hooks/muscles.ts'
import { WG } from './art/wg-map.mjs'

const manifest = JSON.parse(readFileSync(new URL('../art-work/workout-guide/manifest.json', import.meta.url), 'utf8'))
const bySlug = Object.fromEntries(manifest.map(m => [m.slug, m]))
const NAME = {
  Chest: ['chest'], Shoulders: ['shoulders'], 'Rear Delts': ['shoulders', 'upperBack'], 'Upper Back': ['upperBack'],
  'Posterior Chain': ['glutes', 'hamstrings', 'lowBack'], Hamstrings: ['hamstrings'], Back: ['upperBack', 'lowBack'],
  Lats: ['upperBack'], Biceps: ['arms'], Quads: ['quads'], Glutes: ['glutes'], Calves: ['calves'], Forearms: ['wrists'],
  Triceps: ['arms'], Core: ['abs'], Legs: ['quads', 'hamstrings', 'glutes'], 'Lower Back': ['lowBack'], Adductors: ['hips'],
  Mobility: ['hips', 'shoulders'], Hips: ['hips'], Grip: ['wrists'], Cardio: ['quads'], Groin: ['hips'],
}
let bad = 0

for (const ex of CATALOG) {
  if (!MUSCLES[ex.id]) { console.log('MISSING row:', ex.id); bad++ }
}

// at the office only a resistance band is allowed as gear
for (const ex of CATALOG) {
  if (ex.places.includes('office') && ex.equipment.some(q => q !== 'band' && q !== 'mat')) {
    console.log(`OFFICE: ${ex.id} needs ${ex.equipment.join(', ')} but is allowed at the office (only a band is)`)
    bad++
  }
}

for (const [id, slug] of Object.entries(WG)) {
  const m = bySlug[slug]
  const row = MUSCLES[id]

  if (!m || !row) continue

  const ours = new Set([...row[2], ...row[3]])
  const theirs = [m.primaryMuscle, ...m.secondaryMuscles].flatMap(x => NAME[x] ?? [])
  const shared = theirs.filter(x => ours.has(x))

  if (!shared.includes(NAME[m.primaryMuscle]?.[0]) && !NAME[m.primaryMuscle]?.some(x => ours.has(x))) {
    console.log(`CHECK ${id} (${slug}): library primary ${m.primaryMuscle} not in ours [${[...ours]}]`)
    bad++
  }
  if ((m.isStretch ? 'stretch' : null) && row[0] !== 'stretch') console.log(`note ${id}: library calls it a stretch, ours is ${row[0]}`)
}

console.log(bad === 0 ? 'muscle table ok' : `${bad} thing(s) to look at`)
process.exit(bad === 0 ? 0 : 1)
