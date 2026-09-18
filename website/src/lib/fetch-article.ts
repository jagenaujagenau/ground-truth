import {parseHTML} from 'linkedom'
import dns from 'node:dns/promises'
import net from 'node:net'
import type {Article} from './typesafe.ts'

/** Same ceilings the extension's content script works to. */
const MAX_CHARS = 6000
export const MIN_CHARS = 800

const MAX_BYTES = 3_000_000
const FETCH_TIMEOUT_MS = 12_000
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 GroundTruth/1.0 (+https://github.com/jagenaujagenau/ground-truth)'

/** What went wrong, as a code the caller can word in its own language. */
export type ReadCode = 'address' | 'blocked' | 'unreachable' | 'notpage' | 'thin' | 'captions'

export class ReadError extends Error {
  // Written out rather than a constructor parameter property, so node can run these files directly.
  readonly kind: ReadCode

  constructor(kind: ReadCode, message: string) {
    super(message)
    this.kind = kind
  }
}

/** Reject anything that isn't a plain public web page: no file://, no LAN, no metadata endpoints. */
export async function safeUrl(input: string) {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    throw new ReadError('address', 'That doesn’t look like a web address.')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    throw new ReadError('address', 'Only http and https addresses can be read.')
  if (!url.hostname.includes('.') || url.hostname.endsWith('.local'))
    throw new ReadError('address', 'That address isn’t a public website.')

  const literal = net.isIP(url.hostname)
  const addresses = literal
    ? [url.hostname]
    : await dns
        .lookup(url.hostname, {all: true})
        .then((rs) => rs.map((r) => r.address))
        .catch(() => {
          throw new ReadError('unreachable', 'That site couldn’t be found.')
        })
  if (!addresses.length || addresses.some(isPrivate))
    throw new ReadError('address', 'That address isn’t a public website.')
  return url
}

function isPrivate(address: string): boolean {
  if (net.isIPv4(address)) {
    const [a, b] = address.split('.').map(Number)
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    )
  }
  const v6 = address.toLowerCase()
  if (v6 === '::' || v6 === '::1') return true
  if (v6.startsWith('fe80') || v6.startsWith('fc') || v6.startsWith('fd')) return true
  // ::ffff:10.0.0.1 and friends
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  return mapped ? isPrivate(mapped[1]) : false
}

async function download(url: URL) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  }).catch((e: Error) => {
    throw new ReadError(
      'unreachable',
      e.name === 'TimeoutError' ? 'That site took too long to answer.' : 'That site couldn’t be reached.'
    )
  })

  // A redirect can land somewhere private, so the final host is checked too.
  await safeUrl(res.url || url.href)

  if (!res.ok)
    throw new ReadError(
      res.status === 403 || res.status === 401 ? 'blocked' : 'unreachable',
      res.status === 403 || res.status === 401
        ? 'That site turned us away — many outlets block automated readers.'
        : `That site answered ${res.status}.`
    )
  const type = res.headers.get('content-type') ?? ''
  if (!/text\/html|application\/xhtml/i.test(type))
    throw new ReadError('notpage', 'That address isn’t a web page.')

  const reader = res.body?.getReader()
  if (!reader) throw new ReadError('unreachable', 'That site sent nothing back.')
  const chunks: Uint8Array[] = []
  let size = 0
  while (size < MAX_BYTES) {
    const {done, value} = await reader.read()
    if (done) break
    chunks.push(value)
    size += value.length
  }
  await reader.cancel().catch(() => {})
  return {html: new TextDecoder().decode(concat(chunks, size)), finalUrl: new URL(res.url || url.href)}
}

function concat(chunks: Uint8Array[], size: number) {
  const out = new Uint8Array(size)
  let at = 0
  for (const c of chunks) {
    const room = Math.min(c.length, size - at)
    out.set(c.subarray(0, room), at)
    at += room
  }
  return out
}

/** Outlets that render the story client-side still ship it as schema.org JSON-LD. */
function jsonLd(document: Document) {
  let body = ''
  let headline = ''
  for (const tag of document.querySelectorAll('script[type="application/ld+json"]')) {
    let data: unknown
    try {
      data = JSON.parse(tag.textContent ?? '')
    } catch {
      continue
    }
    const queue = Array.isArray(data) ? [...data] : [data]
    while (queue.length) {
      const node = queue.shift() as Record<string, unknown> | undefined
      if (!node || typeof node !== 'object') continue
      if (Array.isArray(node['@graph'])) queue.push(...(node['@graph'] as unknown[]))
      const article = node.articleBody
      if (typeof article === 'string' && article.length > body.length) {
        body = article
        if (typeof node.headline === 'string') headline = node.headline
      }
    }
  }
  return {body: body.replace(/\r\n?/g, '\n').trim(), headline: headline.trim()}
}

/** The extension's readArticle(), run over a fetched page instead of the open tab. */
function readArticle(html: string, url: URL): Article {
  const {document} = parseHTML(html)
  const ld = jsonLd(document)
  document.querySelectorAll('script, style, noscript, template, figure figcaption, aside').forEach((el) => el.remove())

  const paragraphsIn = (root: Element) =>
    [...root.querySelectorAll('p')].map((p) => text(p)).filter((t) => t.length > 40)

  const all = paragraphsIn(document.body)
  const total = all.join('').length
  const paragraphs =
    [...document.querySelectorAll('[itemprop="articleBody"], article, main')]
      .map(paragraphsIn)
      .filter((ps) => ps.join('').length >= total * 0.6)
      .sort((a, b) => a.join('').length - b.join('').length)[0] ?? all

  const prose = (paragraphs.length ? paragraphs : all).slice(0, 40).join('\n\n')
  // Pages whose body never reaches the HTML lose the paragraph race to their own JSON-LD copy.
  const body = ld.body.length > prose.length ? ld.body : prose
  const title =
    document.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() ||
    text(document.querySelector('h1')) ||
    ld.headline ||
    document.title?.trim() ||
    url.hostname

  return {
    url: url.href,
    source: url.hostname.replace(/^www\./, ''),
    title,
    text: body.slice(0, MAX_CHARS),
    favicon: favicon(document, url)
  }
}

const text = (el: Element | null) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim()

function favicon(document: Document, url: URL) {
  const links = [...document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')]
  const size = (l: Element) => {
    const href = l.getAttribute('href') ?? ''
    return parseInt(l.getAttribute('sizes') ?? '') || (href.endsWith('.svg') ? 512 : 16)
  }
  const best = links.sort((a, b) => Math.abs(size(a) - 64) - Math.abs(size(b) - 64))[0]
  const href = best?.getAttribute('href')
  const resolved = href ? URL.parse(href, url.href) : undefined
  return resolved && /^https?:$/.test(resolved.protocol) ? resolved.href : new URL('/favicon.ico', url.origin).href
}

/** Fetch a page and pull the article out of it. Throws ReadError with copy fit for the panel. */
export async function fetchArticle(input: string) {
  const url = await safeUrl(input)
  const {html, finalUrl} = await download(url)
  const article = readArticle(html, finalUrl)
  if (article.text.length < MIN_CHARS)
    throw new ReadError('thin', 'There isn’t enough article text on that page to read.')
  return article
}
