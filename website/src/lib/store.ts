import {KV_REST_API_TOKEN, KV_REST_API_URL} from 'astro:env/server'

// Counters and the read cache have to be shared: on Vercel every function instance and every cold
// start would otherwise keep its own, and the daily cap on the shared key would not hold. So they
// live in Redis over Upstash's REST API (what Vercel's KV/Upstash integration sets up, with
// KV_REST_API_URL and KV_REST_API_TOKEN). Without those, as in local dev, or if Redis is down, it
// falls back to this instance's memory, which is how it worked before.
const memory = new Map<string, {until: number; value: string}>()
const MEMORY_MAX = 1000

async function redis(commands: (string | number)[][]) {
  const res = await fetch(`${KV_REST_API_URL}/pipeline`, {
    method: 'POST',
    headers: {authorization: `Bearer ${KV_REST_API_TOKEN}`},
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(2000)
  })
  if (!res.ok) throw new Error(`store: HTTP ${res.status}`)
  const replies = (await res.json()) as {result?: unknown; error?: string}[]
  const failed = replies.find((r) => r.error)
  if (failed) throw new Error(`store: ${failed.error}`)
  return replies.map((r) => r.result)
}

async function shared<T>(remote: () => Promise<T>, local: () => T) {
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) return local()
  try {
    return await remote()
  } catch (e) {
    console.error('[store]', (e as Error).message)
    return local()
  }
}

function recall(key: string) {
  const hit = memory.get(key)
  if (hit && hit.until > Date.now()) return hit
  memory.delete(key)
}

function remember(key: string, value: string, ttlMs: number) {
  memory.set(key, {until: Date.now() + ttlMs, value})
  if (memory.size > MEMORY_MAX) memory.delete(memory.keys().next().value!)
}

/** Adds one to a counter that starts at its first hit and expires ttlMs later; returns the new count. */
export const increment = (key: string, ttlMs: number) =>
  shared(
    async () => {
      const [, count] = await redis([
        ['SET', key, 0, 'PX', ttlMs, 'NX'],
        ['INCR', key]
      ])
      return Number(count)
    },
    () => {
      const hit = recall(key)
      const count = Number(hit?.value ?? 0) + 1
      if (hit) hit.value = String(count)
      else remember(key, String(count), ttlMs)
      return count
    }
  )

export const get = (key: string) =>
  shared(
    async () => {
      const [value] = await redis([['GET', key]])
      return typeof value === 'string' ? value : undefined
    },
    () => recall(key)?.value
  )

export const set = (key: string, value: string, ttlMs: number) =>
  shared(
    async () => void (await redis([['SET', key, value, 'PX', ttlMs]])),
    () => remember(key, value, ttlMs)
  )
