// Saves each example outlet's icon under public/outlets/, so the buttons load from this site rather
// than from twenty-two newspapers. A page about not being watched should not make the reader's
// browser announce itself to every masthead on it.
//
//   npm run icons
//
// The files and the map are committed; re-run this when the outlet list changes.
import {build} from 'esbuild'
import {mkdirSync, mkdtempSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const out = join(root, 'public/outlets')
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'

const bundle = join(mkdtempSync(join(tmpdir(), 'icons-')), 'outlets.mjs')
await build({
  entryPoints: [join(root, 'src/lib/outlets.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: bundle
})
const {OUTLETS, iconSource} = await import(bundle)

/**
 * An .ico is a directory of images. Modern ones store each as a PNG, so the right entry can simply
 * be lifted out — no decoding, no dependency. Entries that are raw bitmaps are left alone.
 */
function pngInsideIco(buf) {
  if (buf.readUInt16LE(0) !== 0 || buf.readUInt16LE(2) !== 1) return
  const count = buf.readUInt16LE(4)
  let best
  for (let i = 0; i < count; i++) {
    const entry = 6 + i * 16
    const width = buf[entry] || 256
    const size = buf.readUInt32LE(entry + 8)
    const offset = buf.readUInt32LE(entry + 12)
    if (offset + size > buf.length) continue
    const payload = buf.subarray(offset, offset + size)
    const isPng = payload.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    if (!isPng) continue
    // Closest to the 32px the buttons draw at, preferring a little larger over a little smaller.
    const score = Math.abs(width - 32) - (width >= 32 ? 0.5 : 0)
    if (!best || score < best.score) best = {score, payload}
  }
  return best?.payload
}

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, no) => setTimeout(() => no(new Error('timed out')), ms))])

/**
 * A site's own <link rel="icon"> list is usually kinder than /favicon.ico: a 32px PNG instead of a
 * 38KB multi-size .ico. Only consulted when the outlet does not name its icon itself.
 */
async function declaredIcon(site) {
  const res = await withTimeout(fetch(`https://${site}/`, {headers: {'User-Agent': UA}}), 15000)
  if (!res.ok) return
  const html = await withTimeout(res.text(), 15000)
  const links = [...html.matchAll(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*>/gi)]
    .map((m) => ({
      href: m[0].match(/href=["']([^"']+)["']/i)?.[1],
      size: parseInt(m[0].match(/sizes=["'](\d+)/i)?.[1] ?? '0', 10)
    }))
    .filter((l) => l.href && /\.(png|svg)(\?|$)/i.test(l.href))
  if (!links.length) return
  // Closest to 32px, and a declared size beats an unknown one.
  const best = links.sort((a, b) => Math.abs((a.size || 180) - 32) - Math.abs((b.size || 180) - 32))[0]
  return new URL(best.href, `https://${site}/`).href
}

async function fetchIcon(source, site) {
  const res = await withTimeout(
    fetch(source, {headers: {'User-Agent': UA, Referer: `https://${site}/`}}),
    15000
  )
  const type = res.headers.get('content-type') ?? ''
  if (!res.ok || !/image|octet-stream/i.test(type)) throw new Error(`${res.status} ${type.split(';')[0]}`)
  return {raw: Buffer.from(await withTimeout(res.arrayBuffer(), 15000)), type}
}

async function save(outlet) {
  // What the outlet names, then what its page declares, then the old reliable place.
  const sources = [
    outlet.icon,
    await declaredIcon(outlet.site).catch(() => undefined),
    iconSource(outlet)
  ].filter(Boolean)

  let last
  for (const source of sources) {
    try {
      const {raw, type} = await fetchIcon(source, outlet.site)
      const png = /png/i.test(type) ? raw : pngInsideIco(raw)
      const ext = /svg/i.test(type) ? 'svg' : png ? 'png' : 'ico'
      writeFileSync(join(out, `${outlet.id}.${ext}`), png ?? raw)
      return {file: `${outlet.id}.${ext}`, bytes: (png ?? raw).length}
    } catch (e) {
      last = e
    }
  }
  throw last ?? new Error('no icon')
}

mkdirSync(out, {recursive: true})
const outlets = Object.values(OUTLETS).flat()
const saved = await Promise.all(
  outlets.map(async (outlet) => {
    try {
      const {file, bytes} = await save(outlet)
      console.log(`${outlet.id.padEnd(12)} ${file.padEnd(18)} ${bytes}B`)
      return [outlet.id, file]
    } catch (e) {
      console.log(`${outlet.id.padEnd(12)} skipped (${String(e.message).slice(0, 40)})`)
      return undefined
    }
  })
)

// The map the page reads: an outlet with no entry simply shows no icon.
writeFileSync(
  join(root, 'src/lib/outlet-icons.json'),
  `${JSON.stringify(Object.fromEntries(saved.filter(Boolean)), null, 2)}\n`
)
console.log(`\n${saved.filter(Boolean).length}/${outlets.length} icons`)
