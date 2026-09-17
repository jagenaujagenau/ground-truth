# Privacy Policy — Ground Truth

Last updated: 17 September 2026

Ground Truth is a browser extension that rates how a news article is framed. This
policy describes exactly what it does with your data.

## What is sent off your device

When you open a page that Ground Truth checks, it extracts the page's title, its
paragraph text (up to 6,000 characters), the page URL and the site's domain, and
sends them to the TypeSafe API at `https://api.typesafe.ai` to be analyzed. That
request carries your TypeSafe API key so TypeSafe can attribute it to your account.

Nothing else leaves your device. There is no analytics, no telemetry, no
advertising, and no tracking of any kind. The developer of Ground Truth operates no
server and receives no data about you or the pages you visit.

## What is stored on your device

- **Analysis results and extracted article text** are kept in `chrome.storage.session`
  and are erased when you close the browser.
- **Your list of sites, your API key (if you paste one) and cached site icons** are kept
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

Article text is processed by TypeSafe, which operates under its own terms and privacy
policy: https://typesafe.ai. Your use of Ground Truth is subject to those terms, because
your own TypeSafe API key makes the request.

## Data sharing and sale

Your data is not sold, rented, or transferred to anyone. It is not used to build profiles,
train models, or for any purpose unrelated to showing you the analysis of the article in
front of you.

## Removing your data

Uninstalling the extension deletes everything it stored. You can also clear the site list
and API key at any time under **Settings** in the panel.

## Contact

Questions or requests: open an issue at
https://github.com/jagenaujagenau/ground-truth/issues
