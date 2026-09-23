import type {APIRoute} from 'astro'
import {fetchArticle, MIN_CHARS, ReadError, safeUrl} from '../../lib/fetch-article'
import {fetchVideo, youtubeId} from '../../lib/youtube'
import {analyze, type Analysis, type Article} from '../../lib/typesafe'
import * as store from '../../lib/store'
import {DAILY_READ_LIMIT, EXTENSION_PUBLIC_TYPESAFE_API_KEY, TYPESAFE_API_KEY} from 'astro:env/server'

export const prerender = false

// The key is read here and never sent to the browser: the page asks this route, the route asks
// TypeSafe. Set TYPESAFE_API_KEY in website/.env (EXTENSION_PUBLIC_TYPESAFE_API_KEY also works, so
// the extension's own .env can be reused).
const API_KEY = TYPESAFE_API_KEY || EXTENSION_PUBLIC_TYPESAFE_API_KEY || ''

// It is one shared key paying for every read, so: same URL is answered from the cache, each visitor
// gets a handful of reads a minute, and the whole site has a daily ceiling. All three sit in the
// shared store (lib/store.ts), so they hold across function instances.
const CACHE_TTL = 6 * 60 * 60 * 1000
const PER_IP = {reads: 12, windowMs: 5 * 60 * 1000}
const DAILY_MAX = DAILY_READ_LIMIT

type Result = {article: Article; analysis: Analysis}

// The extension calls this route from whatever page you are reading, so it answers cross-origin.
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-max-age': '86400'
}

export const OPTIONS: APIRoute = () => new Response(null, {status: 204, headers: CORS})

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {'content-type': 'application/json', 'cache-control': 'no-store', ...CORS}
  })

const fail = (status: number, status_: string, code: string, message: string) =>
  json({status: status_, code, message}, status)

// A window opens at a visitor's first read and closes windowMs later.
const allowed = async (ip: string) => (await store.increment(`rate:${ip}`, PER_IP.windowMs)) <= PER_IP.reads

// Counted by UTC day. The increment is the check, so instances racing each other can't overshoot.
const underDailyCap = async () =>
  (await store.increment(`daily:${new Date().toISOString().slice(0, 10)}`, 25 * 60 * 60 * 1000)) <= DAILY_MAX

async function cached(key: string) {
  const hit = await store.get(`read:${key}`)
  return hit ? (JSON.parse(hit) as Result) : undefined
}

export const POST: APIRoute = async ({request, clientAddress}) => {
  if (!API_KEY)
    return fail(503, 'error', 'service', 'This site has no TypeSafe key configured, so it can’t read anything.')

  const body = (await request.json().catch(() => ({}))) as {
    url?: unknown
    article?: unknown
    lang?: unknown
    force?: unknown
  }
  const lang = typeof body.lang === 'string' ? body.lang.slice(0, 5) : undefined

  // The extension sends the article it already has: it read the page in the tab, which beats
  // anything this server could fetch. The site sends a URL and the fetching happens here.
  const sent = asArticle(body.article)
  const url = sent?.url ?? body.url
  if (typeof url !== 'string' || !url.trim())
    return fail(400, 'error', 'address', 'Paste a link to an article.')

  // Posted text is keyed by what was actually read, not just the address: two people on the same
  // live-blog URL, or the same URL an hour apart, are not looking at the same article.
  const key = url.trim().replace(/#.*$/, '') + (sent ? `#${fingerprint(sent.text)}` : '')
  // Refresh in the panel means read it again, not hand back what is already in memory.
  const hit = body.force === true ? undefined : await cached(key)
  if (hit) return json({status: 'done', cached: true, ...hit})

  // Only a URL this server will go and fetch has to be checked; a posted article is already read,
  // so nothing here reaches out. The check runs before the rate limit, so a typo costs no one a read.
  if (!sent && !youtubeId(key)) {
    try {
      await safeUrl(key)
    } catch (e) {
      const err = e as ReadError
      return json({status: 'error', code: err.kind ?? 'unknown', message: err.message}, 200)
    }
  }

  const ip = clientAddress ?? 'unknown'
  if (!(await allowed(ip)))
    return fail(429, 'error', 'rate', 'That’s a lot of articles in a row. Give it a few minutes and try again.')

  let article: Article
  const video = sent ? undefined : youtubeId(key)
  if (sent) {
    article = sent
  } else {
    try {
      // A YouTube page is all chrome and no prose; the words are in the caption track.
      article = video ? await fetchVideo(video, lang) : await fetchArticle(key)
    } catch (e) {
      if (e instanceof ReadError)
        return json({status: e.kind === 'thin' ? 'empty' : 'error', code: e.kind, message: e.message}, 200)
      return fail(502, 'error', 'unknown', 'That page couldn’t be read.')
    }
  }

  // Checked here, where the key is about to be spent, so a page that can't be fetched costs nothing.
  if (!(await underDailyCap()))
    return fail(429, 'error', 'daily', 'The demo has hit its reading limit for today. It resets tomorrow.')

  try {
    const analysis = await analyze(article, API_KEY, AbortSignal.timeout(30_000))
    const result = {article, analysis}
    await store.set(`read:${key}`, JSON.stringify(result), CACHE_TTL)
    return json({status: 'done', ...result})
  } catch (e) {
    console.error('[analyze]', (e as Error).message)
    return json({status: 'error', code: 'service', article, message: 'The reading itself failed. It’s usually temporary.'}, 200)
  }
}

/** Cheap content fingerprint (FNV-1a), so a cache entry belongs to the text it was read from. */
function fingerprint(text: string) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

/** An article posted by a client, trimmed to the same ceilings the server's own reader works to. */
function asArticle(value: unknown): Article | undefined {
  if (!value || typeof value !== 'object') return
  const {url, source, title, text} = value as Record<string, unknown>
  if (typeof url !== 'string' || typeof text !== 'string' || text.length < MIN_CHARS) return
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return
  }
  return {
    url: parsed.href,
    source: typeof source === 'string' && source ? source.slice(0, 120) : parsed.hostname.replace(/^www\./, ''),
    title: typeof title === 'string' ? title.slice(0, 300) : parsed.hostname,
    text: text.slice(0, 6000)
  }
}
