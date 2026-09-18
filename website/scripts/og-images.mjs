// Draws the social cards in public/og/<lang>.png, one per language, from the same copy the pages
// use. The images are committed; re-run this when the hero line changes:
//
//   npm run og
//
// It shoots an HTML card with whatever Chrome it can find (CHROME_PATH, the system Chrome, or a
// Playwright download). No browser, no images: the pages fall back to the card already in git.
import {build} from 'esbuild'
import {execFileSync} from 'node:child_process'
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const out = join(root, 'public/og')

const CHROMES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ...(process.env.HOME
    ? [
        `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
      ]
    : []),
  '/usr/bin/google-chrome',
  '/usr/bin/chromium'
].filter(Boolean)

const chrome = CHROMES.find((p) => existsSync(p))
if (!chrome) {
  console.error('No Chrome found. Set CHROME_PATH=/path/to/chrome and run again.')
  process.exit(1)
}

// The dictionaries are TypeScript, so bundle them before importing.
const bundle = join(mkdtempSync(join(tmpdir(), 'og-')), 'i18n.mjs')
await build({
  entryPoints: [join(root, 'src/i18n/index.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: bundle,
  loader: {'.json': 'json'}
})
const {LOCALES, panel, site} = await import(bundle)

const mark = readFileSync(join(root, 'public/mark.svg'), 'utf8').replace(/<\?xml.*?\?>/, '')
const esc = (s) => s.replace(/[&<>]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'})[c])

/** The card: the mark, the language's own headline, and the split bar the panel draws. */
const card = (lang) => {
  const copy = site(lang)
  const t = panel(lang)
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;box-sizing:border-box}
  body{width:1200px;height:630px;display:flex;flex-direction:column;justify-content:space-between;
    padding:72px 80px;background:#f5f3ee;color:#16181d;
    font:16px/1.5 -apple-system,BlinkMacSystemFont,'Inter','Segoe UI',system-ui,sans-serif;
    -webkit-font-smoothing:antialiased}
  .brand{display:flex;align-items:center;gap:16px}
  .brand svg{width:56px;height:56px}
  .brand span{font:600 30px/1 'Iowan Old Style','Charter',Georgia,serif;letter-spacing:-.01em}
  h1{max-width:19ch;font:600 66px/1.08 'Iowan Old Style','Charter',Georgia,serif;
    letter-spacing:-.03em;text-wrap:balance}
  .foot{display:flex;align-items:flex-end;justify-content:space-between;gap:40px}
  .split{flex:1;max-width:660px}
  .bar{display:flex;gap:5px;height:16px}
  .bar i{border-radius:999px}
  .bar i:nth-child(1){flex:52;background:#2f63e0}
  .bar i:nth-child(2){flex:33;background:#9d978a}
  .bar i:nth-child(3){flex:15;background:#d8412f}
  .legend{display:flex;gap:28px;margin-top:16px;font-size:20px;color:#4a4d55}
  .legend b{color:#16181d;font-variant-numeric:tabular-nums}
  .legend i{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:9px}
  .url{font-size:22px;color:#6b6e76;white-space:nowrap;padding-bottom:4px}
  </style></head><body>
  <div class="brand">${mark}<span>Ground Truth</span></div>
  <h1>${esc(copy.heroTitle)}</h1>
  <div class="foot">
    <div class="split">
      <div class="bar"><i></i><i></i><i></i></div>
      <div class="legend">
        <span><i style="background:#2f63e0"></i>${esc(t('sideLeft'))} <b>52%</b></span>
        <span><i style="background:#9d978a"></i>${esc(t('sideCenter'))} <b>33%</b></span>
        <span><i style="background:#d8412f"></i>${esc(t('sideRight'))} <b>15%</b></span>
      </div>
    </div>
    <div class="url">groundtruth.click</div>
  </div>
  </body></html>`
}

mkdirSync(out, {recursive: true})
const work = mkdtempSync(join(tmpdir(), 'og-cards-'))

for (const {code} of LOCALES) {
  const page = join(work, `${code}.html`)
  writeFileSync(page, card(code))
  execFileSync(
    chrome,
    [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--window-size=1200,630',
      '--virtual-time-budget=2000',
      `--screenshot=${join(out, `${code}.png`)}`,
      `file://${page}`
    ],
    {stdio: 'ignore'}
  )
  console.log(`og/${code}.png`)
}

// One 180x180 touch icon from the same mark.
const iconPage = join(work, 'icon.html')
writeFileSync(
  iconPage,
  `<!doctype html><meta charset="utf-8"><style>*{margin:0}body{width:180px;height:180px}
   svg{width:180px;height:180px;display:block}</style>${mark}`
)
execFileSync(
  chrome,
  [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--window-size=180,180',
    '--virtual-time-budget=2000',
    `--screenshot=${join(root, 'public/apple-touch-icon.png')}`,
    `file://${iconPage}`
  ],
  {stdio: 'ignore'}
)
console.log('apple-touch-icon.png')

rmSync(work, {recursive: true, force: true})
