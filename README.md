# Ground Truth

Ground News style bias check for the article in your current tab, powered by [TypeSafe](https://docs.typesafe.ai) and built with [Extension.js](https://extension.js.org).

Every page you load is checked automatically: the toolbar icon turns into a Left / Center / Right stripe with an L, C, R or MIX badge (hover for the label). Pages with under 800 characters of paragraph text are skipped without an API call. To limit checks to specific sites, list their domains under **Settings → Sites** in the panel (subdomains included; empty = every site). Open the side panel to see a Left / Center / Right bias bar, piece type (news/analysis/opinion), topic, and how loaded the language is. All five judgments come from one TypeSafe `jev-latest` call (`src/typesafe.ts`).

## Setup

```sh
cp .env.example .env   # set EXTENSION_PUBLIC_TYPESAFE_API_KEY
npm install
npm run dev            # Chromium with the extension loaded
npm run build          # dist/chromium; build:firefox / build:edge also available
node src/typesafe.test.ts && node src/domains.test.ts
```

The `.env` key is bundled into the build, so anyone with the build can read it. For shared builds, leave `.env` empty and paste a key under **Settings** in the panel (stored in `chrome.storage.local`).
