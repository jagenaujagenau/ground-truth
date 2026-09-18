/**
 * A video's words live in its caption track, and YouTube hands those out only to its own players.
 * The way in is to pose as one: take an InnerTube key off the watch page, ask the player endpoint
 * for the video as the Android client, and read the caption track it names. Fetching the caption
 * URL straight from the watch page does not work — those URLs want a token the web player mints.
 *
 * The sequence is ported from youtube-transcript-plus (MIT, github.com/ericmmartin/youtube-transcript-plus).
 */
import {ReadError} from './fetch-article.ts'
import type {Article} from './typesafe.ts'

const MAX_CHARS = 6000
// Captions run shorter than prose, so the article floor would throw away real news clips. This one
// only keeps the API call from being spent on a video with a handful of words in it.
const MIN_CHARS = 400
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'
const ANDROID_CLIENT = {clientName: 'ANDROID', clientVersion: '20.10.38'}
const TIMEOUT_MS = 12_000

/** The video id in any of the shapes YouTube hands out, or nothing if this isn't a video link. */
export function youtubeId(input: string): string | undefined {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    return
  }
  const host = url.hostname.replace(/^www\.|^m\./, '')
  const id = (value: string | null | undefined) => (value && /^[\w-]{11}$/.test(value) ? value : undefined)

  if (host === 'youtu.be') return id(url.pathname.slice(1).split('/')[0])
  if (host !== 'youtube.com' && host !== 'music.youtube.com') return
  if (url.pathname === '/watch') return id(url.searchParams.get('v'))
  const [, section, rest] = url.pathname.split('/')
  if (['shorts', 'live', 'embed', 'v'].includes(section)) return id(rest)
}

type CaptionTrack = {baseUrl?: string; url?: string; languageCode?: string; kind?: string}
type Player = {
  playabilityStatus?: {status?: string; reason?: string}
  videoDetails?: {title?: string; author?: string; isLiveContent?: boolean}
  captions?: {playerCaptionsTracklistRenderer?: {captionTracks?: CaptionTrack[]}}
}

const get = (url: string, init?: RequestInit) =>
  fetch(url, {
    ...init,
    headers: {'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', ...init?.headers},
    signal: AbortSignal.timeout(TIMEOUT_MS)
  }).catch((e: Error) => {
    throw new ReadError(
      'unreachable',
      e.name === 'TimeoutError' ? 'YouTube took too long to answer.' : 'YouTube couldn’t be reached.'
    )
  })

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#39;': "'"
}
// Caption text arrives double-escaped: &amp;#39; in the XML is one apostrophe on screen. Decode
// named entities, then anything numeric that the first pass uncovered.
const decode = (s: string) =>
  s
    .replace(/&(?:amp|lt|gt|quot|apos|#39);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&(?:amp|lt|gt|quot|apos);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))

/** Break a run of words into pieces of roughly `size`, on word boundaries. */
function chunks(text: string, size: number) {
  const out: string[] = []
  let cur = ''
  for (const word of text.split(' ')) {
    cur += `${word} `
    if (cur.length >= size) {
      out.push(cur)
      cur = ''
    }
  }
  if (cur.trim()) out.push(cur)
  return out
}

/**
 * Captions arrive a few words at a time, which reads as one endless line. Group them into
 * paragraphs: by sentence where the captions are punctuated, by length where they are not.
 */
function paragraphs(cues: string[]) {
  const text = cues
    .join(' ')
    .replace(/\[[^\]]{1,24}\]/g, ' ') // [Music], [Applause] and other sound cues
    .replace(/\s+/g, ' ')
    .trim()

  // Broadcast captions mark a change of speaker with ">>". That is a paragraph break already.
  const speakers = text
    .split(/\s*>>+\s*/)
    .map((s) => s.trim())
    .filter(Boolean)

  const out: string[] = []
  for (const turn of speakers) {
    const sentences = turn.match(/[^.!?]+[.!?]+["')\]]*\s*/g) ?? []
    const parts = sentences.length > 3 ? sentences : chunks(turn, 260)
    let para = ''
    for (const part of parts) {
      para += part
      if (para.length >= 420) {
        out.push(para.trim())
        para = ''
      }
    }
    if (para.trim()) out.push(para.trim())
  }
  return out.join('\n\n')
}

/** Prefer the viewer's language, then English, then whatever the video actually has. */
function pick(tracks: CaptionTrack[], lang?: string) {
  const wanted = lang?.slice(0, 2).toLowerCase()
  const by = (code: string) => tracks.find((t) => t.languageCode?.toLowerCase().startsWith(code))
  return (wanted && by(wanted)) || by('en') || tracks[0]
}

/** The video as an Article: the caption track as its text, the video's own title and channel. */
export async function fetchVideo(id: string, lang?: string): Promise<Article> {
  const watch = await get(`https://www.youtube.com/watch?v=${id}`)
  if (!watch.ok) throw new ReadError('unreachable', `YouTube answered ${watch.status} for that video.`)
  const page = await watch.text()
  if (page.includes('class="g-recaptcha"'))
    throw new ReadError('blocked', 'YouTube is asking this server to prove it is human.')

  const key = page.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1]
  if (!key) throw new ReadError('captions', 'That video’s page didn’t load in a readable form.')

  const res = await get(`https://www.youtube.com/youtubei/v1/player?key=${key}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({context: {client: ANDROID_CLIENT}, videoId: id})
  })
  if (!res.ok) throw new ReadError('unreachable', 'That video couldn’t be opened.')
  const player = (await res.json()) as Player

  const status = player.playabilityStatus?.status
  const reason = player.playabilityStatus?.reason ?? ''
  // YouTube turns datacenter addresses away ("Sign in to confirm you're not a bot"), which is
  // about where this server sits, not about the video.
  if (status === 'LOGIN_REQUIRED' || /bot|sign in/i.test(reason))
    throw new ReadError('blocked', 'YouTube won’t serve videos to this server.')
  if (status && status !== 'OK')
    throw new ReadError('captions', reason || 'That video can’t be played here.')

  const tracks = player.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []
  if (!tracks.length)
    throw new ReadError(
      'captions',
      player.videoDetails?.isLiveContent
        ? 'That video is live, so there is no transcript yet.'
        : 'That video has no captions, so there is nothing to read.'
    )

  const track = pick(tracks, lang)
  const url = (track.baseUrl ?? track.url ?? '').replace(/&fmt=[^&]+/, '')
  if (!url) throw new ReadError('captions', 'That video has no captions, so there is nothing to read.')

  const caption = await get(url)
  const xml = caption.ok ? await caption.text() : ''
  // <text start="0.5" dur="3.1">the words</text>, one per caption cue
  const cues = [...xml.matchAll(/<text start="[^"]*" dur="[^"]*">([^<]*)<\/text>/g)]
    .map((m) => decode(m[1]).replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  const text = paragraphs(cues)
  if (!text) throw new ReadError('captions', 'That video’s captions came back empty.')
  if (text.length < MIN_CHARS)
    throw new ReadError('thin', 'That video’s transcript is too short to read anything into.')

  const details = player.videoDetails
  // YouTube titles often carry the channel already ("… | BBC News"); don't say it twice.
  const title = details?.title ?? 'YouTube video'
  const author = details?.author
  return {
    url: `https://www.youtube.com/watch?v=${id}`,
    source: 'youtube.com',
    title: author && !title.toLowerCase().includes(author.toLowerCase()) ? `${title} · ${author}` : title,
    text: text.slice(0, MAX_CHARS),
    favicon: 'https://www.youtube.com/favicon.ico',
    image: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
  }
}
