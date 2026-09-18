// The demo runs the extension's own panel, so two things are copies rather than imports: the
// panel's stylesheet and the message catalogs. This re-copies them. Run it after either changes.
import {copyFileSync, mkdirSync, readdirSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')

copyFileSync(join(root, 'src/sidebar/styles.css'), join(here, '../src/sim/panel.css'))
console.log('panel.css')

const locales = join(root, '_locales')
mkdirSync(join(here, '../src/i18n/messages'), {recursive: true})
for (const code of readdirSync(locales)) {
  copyFileSync(join(locales, code, 'messages.json'), join(here, `../src/i18n/messages/${code}.json`))
  console.log(`messages/${code}.json`)
}
