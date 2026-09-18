import type {APIRoute} from 'astro'
import {fetchArticle} from '../../lib/fetch-article'
import {feedOf} from '../../lib/outlets'

export const prerender = false

// The quick picks hand you whatever that outlet is leading with right now, so the demo never points
// at an article that has since gone stale. Which outlets belong to which language: lib/outlets.ts.
const TTL = 10 * 60 * 1000
const cache = new Map<string, {at: number; url: string}>()

const links = (xml: string) => {
  const items = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) ?? []
  return items.map(itemLink).filter((l): l is string => Boolean(l))
}

const itemLink = (item: string) => {
  const tag = item.match(/<link[^>]*>([^<]+)<\/link>/i)?.[1]
  const href = item.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1]
  const guid = item.match(/<guid[^>]*>(https?:[^<]+)<\/guid>/i)?.[1]
  const link = (tag || href || guid)?.trim()
  // Feed XML escapes the query string, so &amp; has to come back before the URL is usable.
  return link
    ?.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#3[49];/g, "'")
}

export const GET: APIRoute = async ({url}) => {
  const feed = feedOf(url.searchParams.get('outlet') ?? '')
  if (!feed) return new Response(JSON.stringify({message: 'Unknown outlet.'}), {status: 400})

  const hit = cache.get(feed)
  if (hit && Date.now() - hit.at < TTL)
    return Response.json({url: hit.url}, {headers: {'cache-control': 'no-store'}})

  try {
    const res = await fetch(feed, {
      headers: {'User-Agent': 'GroundTruth/1.0 (+https://github.com/jagenaujagenau/ground-truth)'},
      signal: AbortSignal.timeout(8000)
    })
    const candidates = links(await res.text()).slice(0, 4)
    // Feeds carry 200-word briefs and photo galleries too, so the pick is the first item that
    // actually has an article on the end of it.
    let chosen: string | undefined
    for (const link of candidates) {
      try {
        await fetchArticle(link)
        chosen = link
        break
      } catch {
        continue
      }
    }
    if (!chosen) throw new Error('no readable items')
    cache.set(feed, {at: Date.now(), url: chosen})
    return Response.json({url: chosen}, {headers: {'cache-control': 'no-store'}})
  } catch {
    return new Response(JSON.stringify({message: 'That outlet’s feed didn’t answer. Paste a link instead.'}), {
      status: 502,
      headers: {'content-type': 'application/json'}
    })
  }
}
