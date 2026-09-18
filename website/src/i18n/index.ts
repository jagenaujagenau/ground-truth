import de from './messages/de.json'
import en from './messages/en.json'
import es from './messages/es.json'
import fr from './messages/fr.json'
import it from './messages/it.json'
import pt from './messages/pt.json'
import {SITE, type SiteCopy} from './site'

/** The languages the site is published in. `en` is the default and lives at the root. */
export const LOCALES = [
  {code: 'en', name: 'English'},
  {code: 'es', name: 'Español'},
  {code: 'de', name: 'Deutsch'},
  {code: 'fr', name: 'Français'},
  {code: 'it', name: 'Italiano'},
  {code: 'pt', name: 'Português'}
] as const

export type Locale = (typeof LOCALES)[number]['code']
export const DEFAULT_LOCALE: Locale = 'en'
export const isLocale = (value: string): value is Locale =>
  LOCALES.some((l) => l.code === value)

// The panel's strings are the extension's own catalogs, copied by scripts/sync-extension.mjs.
type Catalog = Record<string, {message: string}>
const CATALOGS: Record<Locale, Catalog> = {en, es, de, fr, it, pt} as Record<Locale, Catalog>

/** chrome.i18n.getMessage, for a page that has no chrome.i18n. */
export type T = (key: string, ...subs: (string | number)[]) => string

export function panel(locale: Locale): T {
  const catalog = CATALOGS[locale] ?? CATALOGS[DEFAULT_LOCALE]
  return (key, ...subs) => {
    const message = (catalog[key] ?? CATALOGS[DEFAULT_LOCALE][key])?.message ?? key
    return subs.reduce<string>((out, sub, i) => out.replaceAll(`$${i + 1}`, String(sub)), message)
  }
}

/** The whole catalog as plain strings, for handing to the browser in one go. */
export const panelStrings = (locale: Locale): Record<string, string> =>
  Object.fromEntries(
    Object.keys(CATALOGS[DEFAULT_LOCALE]).map((key) => [key, panel(locale)(key)])
  )

export const site = (locale: Locale): SiteCopy => SITE[locale] ?? SITE[DEFAULT_LOCALE]

/** `/` for English, `/de/` for the rest — and the same shape for any sub-path. */
export const localePath = (locale: Locale, path = '/') =>
  locale === DEFAULT_LOCALE ? path : `/${locale}${path}`
