# Changelog

Notable changes to Ground Truth. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the versions are the extension's own, as they appear in `src/manifest.json`.

## [Unreleased]

### Changed

- **Article classification is source-blind.** The classifier receives `{title, text}` and nothing
  else: the publication, domain, URL, favicon and reputation never reach it, and the questions no
  longer mention `source`. Previously the domain was in the state with an instruction to ignore it,
  which the model did not honour — the same neutral story filed under jacobin.com picked up 29
  points of "Lean Left", and a mildly right-leaning piece flipped from Center to Lean Right under
  foxnews.com. Metadata still drives caching, rate limiting, favicons, the Sites list and the panel;
  it stops at the service. Source-level analysis, if it ever arrives, stays a separate dimension:
  no weighting, no combined score.

### Added

- `npm test` in `website/` asserts the payload carries only the content, and
  `npm run eval:source-blind` checks the same article under four mastheads against the live model,
  measuring its run-to-run noise first.

## [1.1.0] — 2026-09-18

### Added

- **A reading service instead of a bundled key.** The extension posts the article it extracted to
  the address in `EXTENSION_PUBLIC_API_URL` and gets the judgment back, so the five questions and
  the TypeSafe key both live on the service. Published builds point at
  `https://groundtruth.click/api/analyze`; **Settings → Reading service** takes any other address.
- **Six languages** — English, Spanish (Rioplatense), German, French, Italian and Portuguese. The
  panel follows the browser's own language; there is no setting. `src/i18n.test.ts` keeps the
  catalogs from drifting apart.
- **[groundtruth.click](https://groundtruth.click)** — a site whose demo is the extension's real
  panel. Paste a link, or take an outlet's current lead story, and it reads it in front of you. The
  page is published in all six languages.
- **YouTube videos, read through their captions.** A watch page has no prose in it, so
  `website/src/lib/youtube.ts` reads the caption track instead: sound cues dropped, speaker changes
  turned into paragraph breaks, the rest grouped into paragraphs.
- Social cards per language, canonical URLs, `hreflang` alternates, a sitemap and `robots.txt`.

### Changed

- **The extension asks for no host permissions.** `https://api.typesafe.ai/*` is gone from the
  manifest; the service answers cross-origin instead.
- The `nokey` state is now `nourl`, and Settings asks for a service address rather than an API key.
- `leanLabel()` returns `{level, mixed}` instead of an English string, so the toolbar tooltip can be
  worded in the reader's language.

### Fixed

- Refresh in the panel re-reads the page instead of handing back the cached result.
- A reading posted for one URL is cached against the text it was read from, so two different
  readings of the same address can't be confused for each other.

### Known issues

- YouTube refuses datacenter addresses, so the deployed service answers *"YouTube won't serve videos
  to this server."* Reading videos works from a laptop or a self-hosted service.
- The demo's rate limit and daily cap live in memory, so on serverless each instance counts its own.

## [1.0.0] — 2026-09-17

### Added

- Every page you open is checked automatically: the toolbar icon becomes a Left / Center / Right
  stripe with an `L`, `C`, `R` or `MIX` badge.
- The side panel shows the framing verdict, the five-level spectrum behind it, the piece type, the
  topic and how loaded the language is, with mixed signals called out rather than averaged away.
- A Sites list to narrow what gets read, subdomains included.
- Pages with under 800 characters of prose are skipped before anything is sent, and results are
  cached per URL for the session.
- Store listing copy, permission justifications, reviewer notes and a privacy policy.

[Unreleased]: https://github.com/jagenaujagenau/ground-truth/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/jagenaujagenau/ground-truth/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/jagenaujagenau/ground-truth/releases/tag/v1.0.0
