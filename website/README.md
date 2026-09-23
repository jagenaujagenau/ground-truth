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

The URL cache, the per-visitor rate limit and the daily cap live in Redis (`src/lib/store.ts`), so
every function instance shares them. Connect an Upstash store to the Vercel project and it sets
`KV_REST_API_URL` and `KV_REST_API_TOKEN`. Without them, as in local dev, each instance keeps its own
in memory, and they hold within an instance but drift apart across them.

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

A YouTube link is read too: `src/lib/youtube.ts` takes an InnerTube key off the watch page, asks the
player endpoint for the video as the Android client, and reads the caption track it names. That
sequence is ported from [youtube-transcript-plus](https://github.com/ericmmartin/youtube-transcript-plus)
(MIT) rather than depended on. Videos without captions, and live ones, say so.

Some outlets refuse automated readers (AP and Politico return 403, for instance) and some pages
carry too little prose to judge — both land in the panel's own error and empty states, which is what
the extension does too.

## Article classification is source-blind

The classifier is given the article and nothing else:

```js
state: {title, text}
```

The publication's name, domain, URL, favicon, reputation and past classifications never reach it.
That is a property of the code, not an instruction to the model: `stateFor()` in
`src/lib/typesafe.ts` builds the payload by destructuring the two fields it is allowed to see, and
it is the only place a payload is built. The questions no longer mention `source` either, because
naming a field the state does not carry only invites the model to reason about something it cannot
see.

The reason is measurable. Told in words to ignore a domain it could see, the model still moved: the
same neutral wire story filed under jacobin.com picked up 29 points of "Lean Left" that it did not
have under an unknown domain, and a mildly right-leaning piece flipped from Center to Lean Right
purely by being filed under foxnews.com.

Everything else keeps the metadata. `url` and `source` still drive caching, rate limiting,
favicons, the Sites allowlist and what the panel shows; they simply stop at the service.

There is no weighting between source reputation and article classification, and there is no
combined score. If source-level analysis is ever added it stays a separate dimension, and it must
not touch the article-level distribution.

Two checks hold the line:

- `npm test` asserts the payload carries nothing but title and text, that two copies of an article
  filed under opposite mastheads produce the same request, and that no question names `source`.
- `npm run eval:source-blind` puts it to the live model: one article under foxnews.com,
  nytimes.com, theguardian.com and jacobin.com. Since `jev-latest` is not deterministic — the
  identical request comes back up to three points apart — the run first measures that noise with
  repeated source-free reads, then requires every masthead to land on the same level within it.

This is architectural blindness, not laundering: the article text may still name its paper, quote
its columnists or read like its house style, and this change does not try to scrub that.

### The extension talks to it too

`POST /api/analyze` takes either `{"url": "..."}` (the site, which then fetches the page) or
`{"article": {url, source, title, text}}` (the extension, which already read the page in your tab —
better text, and no outlet can block it). The route answers cross-origin, so the extension needs no
host permission; posted text is cached against a fingerprint of the text rather than the URL alone.

| File | What it is |
|------|------------|
| `src/pages/api/analyze.ts` | The read: URL guard, rate limit, cache, TypeSafe call. |
| `src/lib/store.ts` | Where the cache and the counters are kept: Redis if configured, else memory. |
| `src/pages/api/pick.ts` | Resolves an outlet's newest *readable* story from its RSS feed. |
| `src/lib/youtube.ts` | Turns a YouTube link into an article: its caption track as the text, the video's own title and channel. |
| `src/lib/fetch-article.ts` | Fetches a page and extracts it, mirroring the extension's content script; blocks private addresses. |
| `src/lib/typesafe.ts` | The five questions, copied from `../src/typesafe.ts`. |
| `src/sim/panel.ts` | A port of `../src/sidebar/scripts.ts`: same markup, same copy, same states. |
| `src/sim/panel.css` | **A copy of `../src/sidebar/styles.css`.** Re-copy it when the panel's styles change. |
| `src/sim/typesafe.ts` | `leanShares`, `topLevel`, `leanSide`, `drawMark` and the domain helpers, copied from `../src/`. |

The panel lives in a shadow root so the extension's stylesheet and the site's stylesheet cannot
reach each other. `:root` has no meaning inside a shadow tree, so the token block is rewritten onto
`:host` when the CSS is injected.

## Example outlets

`src/lib/outlets.ts` lists the papers offered as one-click examples, per language: Spanish readers
get Clarín and La Nación, German readers taz and FAZ. Each set spans the spectrum where the feeds
allow it. Only outlets whose feeds list real articles and whose pages can be read are in there;
Le Monde, Welt and Expresso all refuse automated readers.

`npm run icons` collects their favicons into `public/outlets/` and writes the map the page reads.
They are served from this site rather than hotlinked, so opening a page about not being watched
doesn't announce the visit to twenty-two mastheads.

## Support

`src/components/Support.astro` is the footer's support dialog: Patreon, Buy Me a Coffee, PayPal and
a Bitcoin address, ported from tktk.lol into a plain `<dialog>`.

## Social cards

`public/og/<lang>.png` is a 1200x630 card per language, drawn from that language's own headline so
the two never drift. `npm run og` redraws them with whatever Chrome it finds (`CHROME_PATH`
overrides); they are committed, so a build never needs a browser. The same script draws
`apple-touch-icon.png` from `mark.svg`.

## Seven languages

The page is published in English, Spanish, German, French, Italian, Portuguese and Polish. English
sits at `/`, the rest under `/es/`, `/de/`, `/fr/`, `/it/`, `/pt/`, `/pl/`, with `hreflang`
alternates and a switcher in the header.

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
