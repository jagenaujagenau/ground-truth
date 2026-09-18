import assert from 'node:assert/strict'
import {readFileSync, readdirSync} from 'node:fs'
import {join} from 'node:path'

const LOCALES = join(import.meta.dirname, '..', '_locales')
const read = (code: string) =>
  JSON.parse(readFileSync(join(LOCALES, code, 'messages.json'), 'utf8')) as Record<string, {message: string}>

const codes = readdirSync(LOCALES).sort()
assert.deepEqual(codes, ['de', 'en', 'es', 'fr', 'it', 'pl', 'pt'])

const en = read('en')
const placeholders = (m: string) => (m.match(/\$\d/g) ?? []).sort().join('')

for (const code of codes) {
  const catalog = read(code)
  assert.deepEqual(
    Object.keys(catalog).sort(),
    Object.keys(en).sort(),
    `${code}: message keys drifted from en`
  )
  for (const [key, {message}] of Object.entries(catalog)) {
    assert.ok(message.trim(), `${code}.${key}: empty message`)
    assert.equal(
      placeholders(message),
      placeholders(en[key].message),
      `${code}.${key}: placeholders differ from en`
    )
  }
}

// Every key the code asks for must exist, and every key in the catalog must be asked for. Keys
// built at runtime (level<Key>Short and friends) are listed here because a scan cannot see them.
const source = ['background.ts', 'sidebar/scripts.ts', 'manifest.json']
  .map((f) => readFileSync(join(import.meta.dirname, f), 'utf8'))
  .join('\n')

const used = new Set<string>()
for (const m of source.matchAll(/\bt\('([A-Za-z0-9_]+)'/g)) used.add(m[1])
for (const m of source.matchAll(/getMessage\('([A-Za-z0-9_]+)'/g)) used.add(m[1])
for (const m of source.matchAll(/__MSG_([A-Za-z0-9_]+)__/g)) used.add(m[1])
for (const level of ['FarLeft', 'Left', 'Center', 'Right', 'FarRight'])
  for (const suffix of ['', 'Short', 'Blurb']) used.add(`level${level}${suffix}`)
for (const level of ['Neutral', 'Somewhat', 'Highly']) {
  used.add(`lang${level}`)
  used.add(`lang${level}Blurb`)
}
// chip() builds these from the model's own answers
for (const kind of ['News', 'Analysis', 'Opinion']) used.add(`kind${kind}`)
for (const topic of ['Politics', 'World', 'Business', 'Technology', 'Health', 'Climate', 'Sports', 'Entertainment', 'Other'])
  used.add(`topic${topic}`)

for (const key of used) assert.ok(key in en, `code uses ${key}, which no catalog defines`)
for (const key of Object.keys(en)) assert.ok(used.has(key), `${key} is defined but never used`)

console.log('ok')
