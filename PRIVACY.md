# Privacy Policy — Ground Truth

Last updated: 17 September 2026

Ground Truth is a browser extension that rates how a news article is framed. This
policy describes exactly what it does with your data.

## What is sent off your device

When you open a page that Ground Truth checks, it extracts the page's title, its
paragraph text (up to 6,000 characters), the page URL and the site's domain, and
sends them to the reading service the build is pointed at, which you can change under
**Settings → Reading service**. Published builds point at `https://groundtruth.click`,
run by the developer of Ground Truth. That service asks the TypeSafe API at
`https://api.typesafe.ai` to analyze them and returns the judgment. It keeps the
result in memory for a few hours so the same article is not re-read, and keeps
nothing else. No credential of yours is involved: the key belongs to whoever
runs the service.

Nothing else leaves your device. There is no analytics, no telemetry, no
advertising, and no tracking of any kind. You choose the service, so you choose who
receives that article text — run your own and the answer is nobody but you.

## What is stored on your device

- **Analysis results and extracted article text** are kept in `chrome.storage.session`
  and are erased when you close the browser.
- **Your list of sites, the reading service address and cached site icons** are kept
  in `chrome.storage.local` and stay on your device until you remove them or uninstall
  the extension.

## What is not read

Ground Truth requests no `tabs` permission and never reads your browsing history, your
open tab list or your tab URLs. It only ever sees a page you actually opened, and only
while that page is open.

## Pages that are never sent

A page is analyzed only if it has at least 800 characters of paragraph text. If you have
added sites under **Settings → Sites**, only pages on those domains and their subdomains
are analyzed and everything else is ignored. Pages you never open are never touched.

## Third-party processing

Article text is passed to TypeSafe by the reading service, and TypeSafe operates under
its own terms and privacy policy: https://typesafe.ai. The operator of the service you
point Ground Truth at also sees the article text you send it.

## Data sharing and sale

Your data is not sold, rented, or transferred to anyone. It is not used to build profiles,
train models, or for any purpose unrelated to showing you the analysis of the article in
front of you.

## Removing your data

Uninstalling the extension deletes everything it stored. You can also clear the site list
and the service address at any time under **Settings** in the panel.

## Contact

Questions or requests: open an issue at
https://github.com/jagenaujagenau/ground-truth/issues
