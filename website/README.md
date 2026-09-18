# Ground Truth — website

The site for the [Ground Truth](../README.md) extension, live at
[groundtruth.click](https://groundtruth.click). The page is static; one server route does
the reading, so the demo works on whatever article a visitor hands it.

```sh
npm install
cp .env.example .env    # set TYPESAFE_API_KEY
npm run dev             # http://localhost:4321
npm run build           # .vercel/output
```

It deploys to Vercel (`@astrojs/vercel`): the page is prerendered, `/api/analyze` and `/api/pick`
run as functions. `vercel deploy` from this directory, with `TYPESAFE_API_KEY` set on the project —
the key is an `astro:env` secret, read from the environment at request time and never written into
the build. `site` comes from `SITE_URL`, falling back to Vercel's own production URL, so the
`hreflang` links are absolute without configuring anything.

One thing to know about running on functions: the URL cache, the per-visitor rate limit and the
daily cap all live in memory, so each function instance keeps its own. They hold within an instance
and drift apart across them. A shared store would fix that if the demo ever needs a real ceiling.

## The demo reads real articles

`src/components/Simulator.astro` is a browser mock — tab, omnibox, toolbar icon — with the
extension's **real side panel** inside it. Paste a link (or take an outlet's current lead story) and:

1. `POST /api/analyze` fetches the page, pulls the article out of it and asks TypeSafe the
   extension's five questions.
2. The page pane shows the extracted story; the panel renders the verdict; the toolbar icon repaints
   itself from the Left / Center / Right split.

**The key never leaves the server.** The browser talks to `/api/analyze`, and that route talks to
TypeSafe. Because one key pays for everyone, the route caches each URL for six hours, allows twelve
reads per visitor per five minutes, and stops at `DAILY_READ_LIMIT` reads a day.

Some outlets refuse automated readers (AP and Politico return 403, for instance) and some pages
carry too little prose to judge — both land in the panel's own error and empty states, which is what
the extension does too.

### The extension talks to it too

`POST /api/analyze` takes either `{"url": "..."}` (the site, which then fetches the page) or
`{"article": {url, source, title, text}}` (the extension, which already read the page in your tab —
better text, and no outlet can block it). The route answers cross-origin, so the extension needs no
host permission; posted text is cached against a fingerprint of the text rather than the URL alone.

| File | What it is |
|------|------------|
| `src/pages/api/analyze.ts` | The read: URL guard, rate limit, cache, TypeSafe call. |
| `src/pages/api/pick.ts` | Resolves an outlet's newest *readable* story from its RSS feed. |
| `src/lib/fetch-article.ts` | Fetches a page and extracts it, mirroring the extension's content script; blocks private addresses. |
| `src/lib/typesafe.ts` | The five questions, copied from `../src/typesafe.ts`. |
| `src/sim/panel.ts` | A port of `../src/sidebar/scripts.ts`: same markup, same copy, same states. |
| `src/sim/panel.css` | **A copy of `../src/sidebar/styles.css`.** Re-copy it when the panel's styles change. |
| `src/sim/typesafe.ts` | `leanShares`, `topLevel`, `leanSide`, `drawMark` and the domain helpers, copied from `../src/`. |

The panel lives in a shadow root so the extension's stylesheet and the site's stylesheet cannot
reach each other. `:root` has no meaning inside a shadow tree, so the token block is rewritten onto
`:host` when the CSS is injected.

## Six languages

The page is published in English, Spanish, German, French, Italian and Portuguese. English sits at
`/`, the rest under `/es/`, `/de/`, `/fr/`, `/it/`, `/pt/`, with `hreflang` alternates and a
switcher in the header.

The site's own copy is `src/i18n/site.ts`. Spanish is Rioplatense and Portuguese is European, and every language is written on its own terms rather than translated phrase by phrase — so the headline, for instance, lands differently in each. The panel's copy is **not** — it comes from the
extension's catalogs, copied in by `npm run sync` alongside `panel.css`, so a string reads the same
in the demo as it does in the extension. `/api/analyze` answers with an error `code`, never a
sentence, and the page words it in the reader's language.

Set `SITE_URL` when building so the `hreflang` links point at the real domain.

## Structure

```
src/
├── components/Simulator.astro   # browser mock + the demo's client script
├── lib/                         # server only: fetching, extraction, TypeSafe
├── pages/
│   ├── api/{analyze,pick}.ts    # on-demand routes
│   └── index.astro              # the page: hero, demo, features, privacy
├── i18n/                        # site copy + the extension's catalogs (copies)
├── sim/                         # the panel, running in the browser
└── styles/global.css            # site styles; tokens mirror the extension's
public/mark.svg                  # favicon
```
