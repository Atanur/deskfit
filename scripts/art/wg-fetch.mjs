// Downloads the frames of the mapped moves from the Workout Guide repository into art-work/workout-guide/assets.
//   npx tsx scripts/art/wg-fetch.mjs            (about 2 MB)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { WG } from './wg-map.mjs'

const BASE = 'https://raw.githubusercontent.com/bryllim/workout-guide/main/packages/workout-guide'
const manifest = JSON.parse(readFileSync('art-work/workout-guide/manifest.json', 'utf8'))
const bySlug = new Map(manifest.map(e => [e.slug, e]))
let bytes = 0
let missing = 0

for (const [id, slug] of Object.entries(WG)) {
  const entry = bySlug.get(slug)

  if (!entry) { console.log(`${id}: no "${slug}" in the manifest`); missing++; continue }

  for (const frame of entry.frames) {
    const file = `art-work/workout-guide/${frame.path}`

    if (existsSync(file)) continue

    mkdirSync(file.slice(0, file.lastIndexOf('/')), { recursive: true })

    const res = await fetch(`${BASE}/${frame.path}`)

    if (!res.ok) { console.log(`${frame.path}: HTTP ${res.status}`); missing++; continue }

    const text = await res.text()

    writeFileSync(file, text)
    bytes += text.length
  }

  console.log(`${id.padEnd(20)} ${slug.padEnd(36)} ${entry.frames.length} frames`)
}

console.log(`\ndownloaded ${Math.round(bytes / 1024)} KB, ${missing} problem(s)`)
