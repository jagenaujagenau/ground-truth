export type Article = {url: string; source: string; title: string; text: string; favicon?: string}

type ScoreAnswer = {score: number; confidence: number; probabilities: Record<string, number>}
type ChoiceAnswer = {choice: string; confidence: number; probabilities: Record<string, number>}
type NoulAnswer = {noul: number}

export type Analysis = {
  isNews: number
  lean: ScoreAnswer
  loaded: ScoreAnswer
  kind: ChoiceAnswer
  topic: ChoiceAnswer
}

const LEAN_LEVELS = [
  'Far left: consistently frames the story from a progressive viewpoint, e.g. treats conservative positions as illegitimate, emphasizes only sources and facts that favor the left',
  'Lean left: mostly factual but word choice, story selection, or quoted sources tilt toward progressive viewpoints',
  'Center: balanced framing, presents relevant sides fairly, neutral word choice, or the story has no political dimension',
  'Lean right: mostly factual but word choice, story selection, or quoted sources tilt toward conservative viewpoints',
  'Far right: consistently frames the story from a conservative viewpoint, e.g. treats progressive positions as illegitimate, emphasizes only sources and facts that favor the right'
]

export const QUESTIONS = {
  is_news: {
    type: 'noul',
    instructions:
      'Is `title` and `text` a news article, analysis, or opinion piece about current events or public affairs?',
    criteria: {
      true: 'A news story, report, analysis, or op-ed',
      false: 'Not an article: a homepage, product page, search results, social feed, docs, or other non-news content'
    }
  },
  lean: {
    type: 'score',
    instructions:
      'Judge the political slant of how this article (`title` and `text`) frames its subject, based on framing, word choice, and which perspectives are included or left out. Judge the article itself, not what you know about `source`.',
    criteria: LEAN_LEVELS
  },
  loaded: {
    type: 'score',
    instructions:
      'How emotionally loaded or sensational is the language in `title` and `text`?',
    criteria: [
      'Neutral: plain, descriptive language; claims are attributed',
      'Somewhat loaded: occasional charged adjectives or dramatic framing',
      'Highly loaded: sensational headline, emotionally charged or inflammatory language throughout'
    ]
  },
  kind: {
    type: 'choice',
    instructions: 'What kind of piece is `title` and `text`?',
    criteria: {
      news: 'Straight news reporting of events',
      analysis: 'Explanatory or analytical reporting that interprets events',
      opinion: 'Opinion, editorial, column, or commentary arguing a position'
    }
  },
  topic: {
    type: 'choice',
    instructions: 'What is the main topic of `title` and `text`?',
    criteria: {
      politics: 'Government, elections, policy, law',
      world: 'International affairs, conflicts, diplomacy',
      business: 'Economy, markets, companies',
      technology: 'Tech, science, AI',
      health: 'Health and medicine',
      climate: 'Environment and climate',
      sports: null,
      entertainment: 'Culture, celebrities, media',
      other: 'None of the above'
    }
  }
} as const

export async function analyze({url, source, title, text}: Article, apiKey: string): Promise<Analysis> {
  const res = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST',
    headers: {Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({model: 'jev-latest', state: {url, source, title, text}, questions: QUESTIONS})
  })
  if (!res.ok) throw new Error(`TypeSafe ${res.status}: ${await res.text()}`)
  const {answers: a} = await res.json()
  return {
    isNews: (a.is_news as NoulAnswer).noul,
    lean: a.lean,
    loaded: a.loaded,
    kind: a.kind,
    topic: a.topic
  }
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
 * Label from the most likely level, not the Score mean: a split like Lean Left 47% / Lean Right 36%
 * averages to "Center", the level the model gave the least weight.
 */
export function leanLabel(p: Record<string, number>) {
  const labels = ['Far Left', 'Lean Left', 'Center', 'Lean Right', 'Far Right']
  const top = labels[topLevel(p, labels.length)]
  return isMixed(p) ? `${top} (mixed signals)` : top
}

// ponytail: 0.25 cutoff is a guess from one article; tune on more examples
const isMixed = (p: Record<string, number>) => {
  const s = leanShares(p)
  return Math.min(s.left, s.right) >= 0.25
}

/** Short side code for the toolbar badge. */
export function leanSide(p: Record<string, number>): 'L' | 'C' | 'R' | 'MIX' {
  if (isMixed(p)) return 'MIX'
  const top = topLevel(p, 5)
  return top < 2 ? 'L' : top > 2 ? 'R' : 'C'
}
