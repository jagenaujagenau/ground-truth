export type Article = {
  url: string
  source: string
  title: string
  text: string
  favicon?: string
  /** A video: the service reads its transcript, so there is no text to send. */
  video?: boolean
}

type ScoreAnswer = {score: number; confidence: number; probabilities: Record<string, number>}
type ChoiceAnswer = {choice: string; confidence: number; probabilities: Record<string, number>}

export type Analysis = {
  isNews: number
  lean: ScoreAnswer
  loaded: ScoreAnswer
  kind: ChoiceAnswer
  topic: ChoiceAnswer
}

/**
 * Ask the reading service for this article's judgment. The five questions and the TypeSafe key
 * both live on the service (see website/src/lib/typesafe.ts), so nothing secret ships in the build.
 */
export async function analyze(
  {url, source, title, text, video}: Article,
  endpoint: string
): Promise<Analysis> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    // A page we could read, we send. A video we hand over by address: its words are captions, and
    // fetching those is the service's job.
    body: JSON.stringify(
      video ? {url, lang: chrome.i18n.getUILanguage()} : {article: {url, source, title, text}}
    )
  })
  if (!res.ok) throw new Error(`Reading service ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = (await res.json()) as {analysis?: Analysis; message?: string}
  if (!data.analysis) throw new Error(data.message || 'The reading service sent no result back.')
  return data.analysis
}

/** Collapse the 5 lean levels into Ground News style Left / Center / Right shares (sum to 1). */
export function leanShares(p: Record<string, number>) {
  const g = (k: string) => p[k] ?? 0
  const left = g('0') + g('1')
  const center = g('2')
  const right = g('3') + g('4')
  const total = left + center + right || 1
  return {left: left / total, center: center / total, right: right / total}
}

/** Index of the most likely Score level (ties go to the lower level). */
export function topLevel(p: Record<string, number>, levels: number) {
  let best = 0
  for (let i = 1; i < levels; i++) if ((p[i] ?? 0) > (p[best] ?? 0)) best = i
  return best
}

/**
 * Which of the five levels to label this with, and whether it is a split decision. Taken from the
 * most likely level, not the Score mean: a split like Lean Left 47% / Lean Right 36% averages to
 * "Center", the level the model gave the least weight. Callers put the words on it, in the
 * reader's own language.
 */
export function leanLabel(p: Record<string, number>): {level: number; mixed: boolean} {
  return {level: topLevel(p, 5), mixed: isMixed(p)}
}

/**
 * A reading is "mixed" when the smaller of its Left and Right shares reaches this. `npm run eval:mixed`
 * in website/ scores it against hand-labelled articles and says where it should sit.
 */
export const MIXED_CUTOFF = 0.25

const isMixed = (p: Record<string, number>) => {
  const s = leanShares(p)
  return Math.min(s.left, s.right) >= MIXED_CUTOFF
}

/** Short side code for the toolbar badge. */
export function leanSide(p: Record<string, number>): 'L' | 'C' | 'R' | 'MIX' {
  if (isMixed(p)) return 'MIX'
  const top = topLevel(p, 5)
  return top < 2 ? 'L' : top > 2 ? 'R' : 'C'
}
