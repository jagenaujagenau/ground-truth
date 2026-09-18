# Store metadata

Everything the stores ask for at submission time, kept next to the code so it
stays current. Copy from here into the submission forms.

Last updated: 17 September 2026

## Listing

- Name: Ground Truth
- Summary (132 char max): See how the news article you're reading is framed — Left, Center or Right — without leaving the page.
- Category: News & Weather
- Language: English (United States)
- Privacy policy URL: https://github.com/jagenaujagenau/ground-truth/blob/main/PRIVACY.md
- Homepage URL: https://github.com/jagenaujagenau/ground-truth
- Support URL: https://github.com/jagenaujagenau/ground-truth/issues

### Description

Ground Truth reads the news article in your current tab and shows you how it is
framed. Open a story and the toolbar icon turns into a Left / Center / Right
stripe with an L, C, R or MIX badge, so you get the gist without clicking
anything. Open the side panel for the full picture.

The panel shows a Left / Center / Right split of the framing, the full spectrum
of readings with a probability on each one, whether the piece is news, analysis
or opinion, its topic, and how emotionally loaded the language is. It rates the
article in front of you — its word choice, its sourcing, which perspectives it
includes and leaves out — not the outlet's reputation. Two stories from the same
site can land in very different places, and a story with genuinely mixed framing
is marked as mixed instead of being flattened into a single label.

You stay in control of what it reads. By default it checks every news story you
open; add domains under Settings and it checks only those sites. Pages without
enough article text are skipped before anything is sent. Ground Truth requests no
access to your browsing history or your tab list, stores results only for the
current browser session, and sends articles only to the reading service you point it at.

### Languages

The interface is available in English, Spanish, German, French, Italian and Portuguese, and
follows the browser's own language setting. `default_locale` is `en`.

### Screenshots

1280x800 PNGs, in `docs/store/`:

1. `1-automatic.png` — Every story you open, rated automatically
2. `2-spectrum.png` — The whole spectrum, not a single label
3. `3-sites.png` — You decide which sites it reads

Store icon: `src/images/icon-128.png` (128x128).

## Privacy and data use

- Ground Truth transmits the page title, paragraph text (up to 6,000 characters),
  URL and domain of pages you open to the reading service configured in the extension,
  which passes them to the TypeSafe API for analysis. Nothing else leaves the device.
- Results and article text live in `chrome.storage.session` (erased when the browser
  closes). The site list, the service address and cached favicons live in
  `chrome.storage.local`.
- No analytics, no telemetry, no advertising, no tracking, no data sale.
- The Firefox manifest declares `data_collection_permissions: ["websiteContent"]`,
  which matches this behavior. If the data flow changes, update the declaration,
  this section and PRIVACY.md in the same change.

### Chrome Web Store data disclosures

Answer the "Privacy practices" form as follows:

- Website content: **Yes** — article text and URLs are sent to TypeSafe to produce
  the analysis the user asked for.
- Personally identifiable information, health, financial, authentication, personal
  communications, location, web history, user activity: **No**.
- Certify: data is not sold or transferred to third parties beyond the approved use
  case; not used or transferred for purposes unrelated to the item's single purpose;
  not used to determine creditworthiness or for lending.

## Chrome Web Store

### Single purpose

Ground Truth analyzes the news article in the user's current tab and displays how
it is framed politically.

### Permissions justification

- `sidePanel`: Renders the analysis — bias bar, spectrum, piece type, topic and
  language meter — in the browser side panel, which is the extension's main interface.
- `storage`: Stores the user's site list and the reading service address (`storage.local`),
  and the per-tab analysis results that the panel renders (`storage.session`).
- No host permissions: the extension calls one configured service endpoint, which allows
  the request with CORS. No other host is contacted.
- Content script on `<all_urls>`: The user can open a news article on any site, and the
  content script is what reads that page's title and paragraph text. It is a passive
  message responder — it extracts text only when the extension asks, and only for the
  page the user is looking at. Users can narrow this themselves with the Sites list.
- Not requested: `tabs`. The extension deliberately does not read tab URLs or browsing
  history.

### Reviewer notes

The extension needs the address of a reading service to return results; the submitted
build points at https://groundtruth.click/api/analyze, so nothing needs pasting. If a build without one is under review,
the address goes in "Test credentials" and is entered under Settings → Reading service,
or the reviewer will only see the "Not connected yet" screen. To exercise it: install,
open any news article (for example an NPR or Reuters story), wait a few seconds for the
toolbar icon to show a Left / Center / Right stripe, then click the icon to open the side
panel.

## Firefox Add-ons

### Reviewer notes

Needs the reading service address, bundled in the submitted build or entered under
Settings → Reading service in the sidebar panel. The build is
bundled, so AMO requires a source archive: install with `npm install`, build with
`npm run build:firefox`, and the `dist/firefox` output matches the upload. Node 20+ and
npm 11 were used for the submitted build.

### Release notes

Initial release.

## Edge Add-ons

### Certification notes

Same as the Chrome reviewer notes above: the extension reads through a service whose
address is bundled in the build, and can also be set under Settings in the side panel.
Open any news article and the toolbar icon shows the Left / Center / Right stripe within
a few seconds.

## Version history

- 1.0.0 (unreleased): initial version. Not yet submitted to any store.
