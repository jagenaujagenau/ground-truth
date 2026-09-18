// Source independence, checked against the live model rather than against our own payload.
//
//   npm run eval:source-blind
//
// One article, filed under four mastheads that would pull in different directions if the model
// could see them. Because the domain never reaches Jev, every reading must agree.
//
// "Agree" is not "match exactly": jev-latest is not deterministic, and the identical request comes
// back up to three points apart per level. So the run measures that noise first, by asking the same
// question several times with no source at all, and then requires the mastheads to stay inside it.
// The effect this guards against was an order of magnitude larger — a neutral wire story filed
// under jacobin.com used to pick up 29 points of "Lean Left" — so the band is wide enough to be
// quiet and tight enough to catch a leak.
//
// Costs one read per row against the configured TypeSafe key.
import {readFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {analyze} from '../src/lib/typesafe.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const key =
  process.env.TYPESAFE_API_KEY ??
  readFileSync(join(root, '.env'), 'utf8').match(/TYPESAFE_API_KEY=(.+)/)?.[1]?.trim()

if (!key) {
  console.error('No TYPESAFE_API_KEY, in the environment or in website/.env.')
  process.exit(1)
}

const CONTROL_RUNS = 4
const FLOOR = 4 // points, when the measured noise is smaller than this

// Deliberately middling copy: a masthead moves a reading like this one furthest.
const ARTICLE = {
  title: 'Senate advances stopgap spending bill',
  text: `The Senate voted 62 to 35 on Thursday to advance a stopgap spending bill, clearing a procedural hurdle four days before funding for the federal government runs out. The measure would hold spending at current levels through 19 December. Eight Republicans joined every Democrat present in favour.
The bill leaves unresolved the two-year extension of the nutrition assistance programme that has divided negotiators for a fortnight. Republican negotiators say the extension belongs in a separate bill and should be offset with cuts elsewhere. Democrats say the programme has never before been used as leverage in a funding fight.
The Congressional Budget Office estimates the extension would cost 14 billion dollars over two years. A vote on final passage is expected on Saturday.`
}

const MASTHEADS = [
  {source: 'foxnews.com', url: 'https://www.foxnews.com/politics/senate-advances-stopgap'},
  {source: 'nytimes.com', url: 'https://www.nytimes.com/2026/09/18/us/senate-advances-stopgap.html'},
  {source: 'theguardian.com', url: 'https://www.theguardian.com/us-news/2026/sep/18/senate-stopgap'},
  {source: 'jacobin.com', url: 'https://jacobin.com/2026/09/senate-advances-stopgap'}
]

const LEVELS = ['Far L', 'Lean L', 'Center', 'Lean R', 'Far R']
const percent = (p) => [0, 1, 2, 3, 4].map((i) => Math.round((p[i] ?? 0) * 100))
const top = (dist) => LEVELS[dist.indexOf(Math.max(...dist))]
const show = (label, dist) => console.log(`  ${label.padEnd(20)} ${JSON.stringify(dist).padEnd(22)} ${top(dist)}`)

// What the model does when nothing changes at all.
console.log(`Control: the same article, no source, ${CONTROL_RUNS} times`)
const control = []
for (let i = 0; i < CONTROL_RUNS; i++) {
  const {lean} = await analyze(ARTICLE, key)
  control.push(percent(lean.probabilities))
  show(`run ${i + 1}`, control.at(-1))
}

const mean = LEVELS.map((_, i) => control.reduce((sum, run) => sum + run[i], 0) / control.length)
const noise = Math.max(
  ...LEVELS.map((_, i) => Math.max(...control.map((r) => r[i])) - Math.min(...control.map((r) => r[i])))
)
const budget = Math.max(noise, FLOOR)
const controlTop = top(mean.map(Math.round))
console.log(`\nNoise across identical requests: ${noise} points. Allowed drift: ${budget}.`)

// The same article, filed under mastheads the model would recognise.
console.log('\nFiled under:')
const failures = []
for (const filed of MASTHEADS) {
  // Exactly what the service does: the metadata stays behind, the content goes to the model.
  const {lean} = await analyze({...ARTICLE, ...filed}, key)
  const dist = percent(lean.probabilities)
  show(filed.source, dist)

  const drift = Math.max(...dist.map((v, i) => Math.abs(v - mean[i])))
  if (top(dist) !== controlTop)
    failures.push(`${filed.source}: reads ${top(dist)}, control reads ${controlTop}`)
  else if (drift > budget)
    failures.push(`${filed.source}: ${drift.toFixed(0)} points from the control, past the ${budget} allowed`)
}

if (failures.length) {
  console.error(`\nFAIL — the masthead is reaching the classifier:`)
  for (const f of failures) console.error(`  ${f}`)
  process.exit(1)
}

console.log(`\nok — ${MASTHEADS.length} mastheads, one reading (${controlTop}), all within ${budget} points`)
