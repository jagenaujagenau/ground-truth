// @ts-check
import {defineConfig, envField} from 'astro/config'
import sitemap from '@astrojs/sitemap'
import vercel from '@astrojs/vercel'

// The page itself is static; /api/analyze and /api/pick run on the server so the TypeSafe key stays
// there. Declaring the key as a secret keeps it out of the build output too: it is read from the
// environment at request time, never baked into a bundle.
export default defineConfig({
  // Canonical, hreflang and og:image all need absolute URLs, so the site knows where it lives:
  // SITE_URL if set, else the Vercel deployment's own domain, else where it actually lives.
  site:
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    'https://groundtruth.click',
  adapter: vercel(),
  // sitemap-index.xml, with the six languages cross-referenced as alternates.
  integrations: [
    sitemap({
      i18n: {defaultLocale: 'en', locales: {en: 'en', es: 'es', de: 'de', fr: 'fr', it: 'it', pt: 'pt', pl: 'pl'}}
    })
  ],
  // The extension calls /api/analyze from whatever page you are reading. The route sets its own
  // CORS headers; this is only so the dev server answers the preflight the same way.
  vite: {
    server: {cors: {origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['content-type']}}
  },
  // English lives at /, the rest under /es/, /de/ and so on.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'de', 'fr', 'it', 'pt', 'pl'],
    routing: {prefixDefaultLocale: false}
  },
  env: {
    schema: {
      TYPESAFE_API_KEY: envField.string({context: 'server', access: 'secret', optional: true}),
      EXTENSION_PUBLIC_TYPESAFE_API_KEY: envField.string({context: 'server', access: 'secret', optional: true}),
      DAILY_READ_LIMIT: envField.number({context: 'server', access: 'secret', optional: true, default: 400}),
      KV_REST_API_URL: envField.string({context: 'server', access: 'secret', optional: true}),
      KV_REST_API_TOKEN: envField.string({context: 'server', access: 'secret', optional: true})
    }
  }
})
