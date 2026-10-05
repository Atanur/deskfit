// Design mockups of the desktop pane, built from the real SVG components.
// Usage: npx tsx scripts/mockups.mjs  ->  .claude/preview/mockups.html
import { writeFileSync, mkdirSync } from 'node:fs'
import {
  figureSvg, ringSvg, timerSvg, barsSvg, badgesSvg, podiumSvg, xpBarSvg, iconSvg, avatarSvg, rankSvg,
  levelBadgeSvg, flameSvg, stepsSvg, emptySvg, logoSvg, celebrateSvg, confettiSvg, setTheme,
} from '../hooks/art.ts'

mkdirSync('.claude/preview', { recursive: true })
setTheme(process.argv[2] ?? 'mono')

const btn = (t, o = '') => `<span class="btn ${o}">${t}</span>`
const tabs = active =>
  `<div class="tabs"><span class="brand">${logoSvg(22)}<b>DeskFit</b></span>${['Home', 'Stats', 'Board', 'Settings']
    .map(t => btn(t, t === active ? 'primary' : '')).join('')}</div>`

const home = `${tabs('Home')}
<div class="row" style="gap:14px">${ringSvg(3, 5, 104)}
  <div class="col"><div class="row">${levelBadgeSvg(3, 0.62, 36)}<div class="col"><b>Level 3</b><span class="dim">62 XP to level 4</span></div></div>
  <div class="row">${flameSvg(5, 28, true, 36)}<span><b>5</b> day streak</span></div>
  <div class="row dim">${iconSvg('medal', 18, undefined, 36)}<span>4/11 badges</span></div></div></div>
<div class="card"><div class="row dim">${iconSvg('target', 16)}<span>Claude is working, a good moment for</span></div>
  <div class="row" style="gap:14px">${figureSvg('chair-squat', 150)}<div class="col"><b>Chair squats</b><span class="dim">legs · 40s · beginner</span></div></div>
  <div class="row">${btn('▶ Start', 'primary')}${btn('⇄ Shuffle')}</div></div>
<div class="dim small">Week</div>${barsSvg([{label:'Mo',sets:3},{label:'Tu',sets:5},{label:'We',sets:6},{label:'Th',sets:2},{label:'Fr',sets:5},{label:'Sa',sets:0},{label:'Su',sets:3}], 5, 360)}`

const workout = `<div class="row between"><span class="dim">${btn('← Back')}</span>${stepsSvg(1, 5, 110)}</div>
<div class="col"><b>Chair squats</b><span class="dim">legs · beginner · 40s</span></div>
<div class="row" style="gap:10px">${figureSvg('chair-squat', 230)}${timerSvg(27, 40, 'running', 96)}</div>
<div>Stand in front of your chair, sit back until you touch it, stand up. Keep your chest tall.</div>
<div class="row">${btn('✓ Finish now', 'primary')}${btn('✕ Cancel')}</div>`

const result = `<div class="center">${celebrateSvg(96)}<b class="big">Set complete</b><span class="dim">Chair squats · +24 XP</span></div>
<div class="row center" style="gap:18px">${ringSvg(5, 5, 96)}<div class="col">${`<div class="row">${flameSvg(6, 24)}<span><b>6</b> day streak</span></div>`}<span style="color:#f59e0b">Daily goal reached</span></div></div>
<div class="card center"><span class="dim">Badge unlocked</span>${badgesSvg([{ id: 'streak-3', name: 'On a roll', earned: true }], 1, 90)}</div>
<div class="dim">How was it?</div><div class="row wrap">${btn('Too easy')}${btn('Just right')}${btn('Too hard')}${btn('It hurt')}</div>
<div class="row">${btn('▶ Next set', 'primary')}${btn('✓ Done')}</div>`

const boardRows = [['ann', 340, 1], ['bobby_t', 280, 2], ['cem', 120, 3], ['dilek', 95, 4], ['you', 60, 5]]
const board = `${tabs('Board')}
<div class="row">${btn('Weekly', 'primary')}${btn('All time')}${btn('Teams')}${btn('↻')}</div>
${podiumSvg(boardRows.slice(0, 3).map(r => ({ nickname: r[0], points: r[1] })), 330)}
${boardRows.map(([n, p, r]) => `<div class="row line ${n === 'you' ? 'me' : ''}">${rankSvg(r, 22)}${avatarSvg(n, 26)}<b style="flex:1">${n}</b><span class="dim">${p} pts</span></div>`).join('')}`

const onboarding = `<div class="row between"><b>Set up DeskFit</b>${stepsSvg(1, 5, 110)}</div>
<div class="center">${figureSvg('jumping-jacks', 200)}</div>
<div>Short exercise breaks while Claude works. Everything stays on this device.</div>
<div class="field">Age <span class="dim">32</span></div><div class="row">${btn('← Back')}${btn('Next', 'primary')}</div>`

const empties = ['board', 'team', 'offline', 'rest', 'new'].map(k => `<div class="card center">${emptySvg(k, 170)}<span class="dim">${k}</span></div>`).join('')

const pane = (theme, inner, title) => `<div class="pane ${theme}"><div class="ptitle">${title}</div>${inner}</div>`
const set = (inner, title) => `<div class="pair">${pane('dark', inner, title)}${pane('light', inner, title)}</div>`

const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:16px;font-family:-apple-system,system-ui,sans-serif;background:#0f1013;color:#ddd}
.pair{display:flex;gap:16px;margin-bottom:22px;flex-wrap:wrap}
.pane{width:440px;border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:12px;font-size:14px}
.pane.dark{background:#1b1c20;color:#eaeaea;border:1px solid #2c2e34;--b:#2d2f36;--p:#f3f4f6;--bd:#3a3d46;--d:#9ca3af}
.pane.light{background:#fff;color:#1f2937;border:1px solid #e5e7eb;--b:#eef0f3;--bd:#d6dae0;--d:#6b7280}
.ptitle{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--d)}
.row{display:flex;align-items:center;gap:8px}.col{display:flex;flex-direction:column;gap:3px}.between{justify-content:space-between}
.center{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}.wrap{flex-wrap:wrap}
.dim{color:var(--d)}.small{font-size:12px}.big{font-size:18px}
.btn{background:var(--b);border-radius:9px;padding:6px 12px;font-size:13px}
.dark .btn.primary{background:#f3f4f6;color:#111827}.light .btn.primary{background:#111827;color:#fff}
.tabs{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.brand{display:flex;gap:6px;align-items:center;margin-right:8px}
.card{border:1px solid var(--bd);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:10px}
.line{padding:5px 8px;border-radius:9px}.line.me{background:#9ca3af26;outline:1px solid #9ca3af66}
.field{border:1px solid var(--bd);border-radius:9px;padding:8px 10px;display:flex;justify-content:space-between}
</style>
<script>const t=new URLSearchParams(location.search).get('theme');addEventListener('DOMContentLoaded',()=>{if(t){document.querySelectorAll('.pane.'+(t==='dark'?'light':'dark')).forEach(e=>e.remove());document.body.style.background=t==='dark'?'#0f1013':'#f3f4f6'}})</script>
<h2>Home</h2>${set(home, 'Home')}
<h2>Workout</h2>${set(workout, 'Workout')}
<h2>Result</h2>${set(result, 'Result')}
<h2>Leaderboard</h2>${set(board, 'Board')}
<h2>Onboarding</h2>${set(onboarding, 'Onboarding')}
<h2>Empty states</h2><div class="pair">${pane('dark', empties, 'Empty states')}${pane('light', empties, 'Empty states')}</div>`
writeFileSync('.claude/preview/mockups.html', html)
console.log('wrote mockups', html.length)
