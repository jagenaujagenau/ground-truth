// Answers the sidebar's request for the current page's article text.
const MAX_CHARS = 6000

const paragraphsIn = (root: Element) =>
  [...root.querySelectorAll('p')].map((p) => p.innerText.trim()).filter((t) => t.length > 40)

// The icon the page declares, preferring one crisp enough for a 2x display.
function favicon() {
  const links = [...document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"], link[rel="apple-touch-icon"]')]
  const size = (l: HTMLLinkElement) => parseInt(l.sizes?.value ?? '') || (l.href.endsWith('.svg') ? 512 : 16)
  const best = links.filter((l) => /^https?:/.test(l.href)).sort((a, b) => Math.abs(size(a) - 64) - Math.abs(size(b) - 64))[0]
  return best?.href
}

function readArticle() {
  // The first <article> is often a widget (e.g. a radio player): use the tightest container
  // holding most of the page's prose, falling back to the whole body.
  const all = paragraphsIn(document.body)
  const total = all.join('').length
  const paragraphs =
    [...document.querySelectorAll('[itemprop="articleBody"], article, main')]
      .map(paragraphsIn)
      .filter((ps) => ps.join('').length >= total * 0.6)
      .sort((a, b) => a.join('').length - b.join('').length)[0] ?? all
  const text = (paragraphs.length ? paragraphs.join('\n\n') : document.body.innerText).slice(0, MAX_CHARS)
  const title =
    document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content ||
    document.querySelector('h1')?.textContent?.trim() ||
    document.title
  return {url: location.href, source: location.hostname.replace(/^www\./, ''), title, text, favicon: favicon()}
}

export default function initial() {
  const listener = (
    message: {type?: string},
    _sender: unknown,
    sendResponse: (r: unknown) => void
  ) => {
    if (message?.type === 'getArticle') sendResponse(readArticle())
  }
  chrome.runtime.onMessage.addListener(listener)
  return () => chrome.runtime.onMessage.removeListener(listener)
}
