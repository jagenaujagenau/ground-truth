// Where the "Mixed" cutoff should sit, measured against the live model.
//
//   npm run eval:mixed
//
// The toolbar badge reads MIX instead of L / C / R when the smaller of an article's Left and Right
// shares reaches MIXED_CUTOFF (../../src/typesafe.ts). That number began as a guess from one
// article. This reads a handful of hand-labelled ones — pieces written to tilt one way, to tilt
// neither, or to pull hard both ways — and reports the range of cutoffs that sorts them correctly.
//
// The labels are by construction, not by opinion: each article was written to be what it says. Add
// a real one whenever the badge gets an article wrong, labelled by a person who read it.
//
// jev-latest drifts a few points between identical requests, so a cutoff at the very edge of the
// range is not safer than one in the middle of it. Fails if the current cutoff misfiles any article.
//
// Costs one read per article against the configured TypeSafe key.
import {readFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {analyze} from '../src/lib/typesafe.ts'
import {leanShares, MIXED_CUTOFF} from '../../src/typesafe.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const key =
  process.env.TYPESAFE_API_KEY ??
  readFileSync(join(root, '.env'), 'utf8').match(/TYPESAFE_API_KEY=(.+)/)?.[1]?.trim()

if (!key) {
  console.error('No TYPESAFE_API_KEY, in the environment or in website/.env.')
  process.exit(1)
}

const ARTICLES = [
  {
    mixed: false,
    label: 'lean left',
    title: 'Workers struggle as minimum wage stays frozen for a sixteenth year',
    text: `The federal minimum wage has not risen since 2009, and for millions of low-paid workers the gap between their pay and the cost of rent, food and childcare has never been wider. Economists at the Economic Policy Institute estimate that a raise to 17 dollars would lift pay for 22 million people.
Maria Delgado, who cleans offices in Phoenix, said she works two jobs and still falls behind on rent. "Every year they tell us to wait," she said. Business lobbies argue a raise would cost jobs, a claim that recent research in states that raised their own minimums has largely failed to bear out.`
  },
  {
    mixed: false,
    label: 'lean right',
    title: 'Small businesses brace for another round of costly federal rules',
    text: `Owners of small manufacturers say a new package of federal reporting rules will add thousands of dollars in compliance costs at a time when many are still recovering from years of inflation. The National Federation of Independent Business estimates the paperwork alone will take the average firm 60 hours a year.
"Washington writes these rules for companies with legal departments," said Tom Keller, who runs a 30-person machine shop in Ohio. Supporters of the rules say they improve transparency, though critics note that the agency has not published an estimate of what that transparency is worth.`
  },
  {
    mixed: false,
    label: 'center',
    title: 'Senate advances stopgap spending bill',
    text: `The Senate voted 62 to 35 on Thursday to advance a stopgap spending bill, clearing a procedural hurdle four days before funding for the federal government runs out. The measure would hold spending at current levels through 19 December. Eight Republicans joined every Democrat present in favour.
The bill leaves unresolved the two-year extension of the nutrition assistance programme that has divided negotiators for a fortnight. Republican negotiators say the extension belongs in a separate bill and should be offset with cuts elsewhere. Democrats say the programme has never before been used as leverage in a funding fight.`
  },
  {
    mixed: false,
    label: 'center',
    title: 'City council approves new bus routes after two-year study',
    text: `The city council voted 9 to 2 on Tuesday to approve a redesign of the bus network, adding four routes and increasing frequency on six others starting in March. The plan follows a two-year study by the transit authority and three rounds of public meetings.
Supporters said the changes would shorten average commutes by about seven minutes. The two council members who voted against it said the authority had not explained how it would pay for the extra drivers. The transit authority said it would present a budget in January.`
  },
  {
    mixed: true,
    label: 'mixed',
    title: 'Both parties have sold out the working class',
    text: `Wall Street banks and the billionaires who own them have written our tax code for forty years, and ordinary families have paid for it with stagnant wages and gutted pensions. Corporate greed, not workers, drove the inflation that hollowed out paycheques, and the lobbyists who protect it deserve to be run out of Washington.
At the same time, open borders have flooded the labour market and driven wages down further, and a bloated federal bureaucracy strangles the small businesses that actually hire people. The elites in both parties love cheap labour and big government because neither costs them anything. Secure the border, break up the banks, and cut the regulators down to size.`
  },
  {
    mixed: true,
    label: 'mixed',
    title: 'Gun rights and climate action: the case a rural county is making',
    text: `Commissioners in Harlan County passed two resolutions this week. The first declares the county a Second Amendment sanctuary, pledging not to enforce any new federal gun law that infringes the constitutional right of law-abiding citizens to defend themselves. "Gun control punishes the innocent," one commissioner said.
The second commits the county to net-zero emissions by 2040, calling the climate crisis an existential threat driven by fossil-fuel companies that spent decades lying to the public. Commissioners praised federal clean-energy subsidies and called for a ban on new drilling leases on public land.`
  },
  {
    mixed: true,
    label: 'mixed',
    title: 'Two views on the new immigration bill',
    text: `For: The bill finally restores order at a border that has been overrun for years. Illegal crossings have strained schools, hospitals and police in towns that never agreed to absorb them, and the new detention funding and faster deportations are exactly what voters asked for.
Against: The bill is a cruel betrayal of families who fled violence to seek asylum. It pours billions into detention camps while slashing legal pathways, and it will tear children from their parents. Immigrants have built this country, and treating them as criminals is a moral stain.`
  }
]

const pct = (x) => Math.round(x * 100)
const rows = []
for (const a of ARTICLES) {
  const {lean} = await analyze(a, key)
  const s = leanShares(lean.probabilities)
  const split = Math.min(s.left, s.right)
  rows.push({...a, split})
  console.log(
    `  ${a.label.padEnd(10)} L${pct(s.left)} C${pct(s.center)} R${pct(s.right)}  split ${pct(split)}%  ${a.title}`
  )
}

// A cutoff c files an article as mixed when split >= c. It sorts every article correctly when it
// sits above every single-sided split and at or below every mixed one.
const highestSingle = Math.max(...rows.filter((r) => !r.mixed).map((r) => r.split))
const lowestMixed = Math.min(...rows.filter((r) => r.mixed).map((r) => r.split))
const wrong = rows.filter((r) => r.split >= MIXED_CUTOFF !== r.mixed)

console.log(`\nSingle-sided articles split up to ${pct(highestSingle)}%, mixed ones from ${pct(lowestMixed)}%.`)
if (highestSingle < lowestMixed)
  console.log(
    `Any cutoff above ${pct(highestSingle)}% and up to ${pct(lowestMixed)}% sorts them all; the middle is ${pct((highestSingle + lowestMixed) / 2)}%.`
  )
else console.log('No cutoff sorts them all: the labelled sets overlap.')

if (wrong.length) {
  console.error(`\nFAIL — the current cutoff, ${pct(MIXED_CUTOFF)}%, misfiles:`)
  for (const r of wrong) console.error(`  ${r.label}: split ${pct(r.split)}%, ${r.title}`)
  process.exit(1)
}

console.log(`\nok — the current cutoff, ${pct(MIXED_CUTOFF)}%, sorts all ${rows.length} articles`)
