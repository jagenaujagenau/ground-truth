// The extension's questions, verbatim from ../../../src/typesafe.ts. The site asks TypeSafe exactly
// what the extension asks, so a URL read here and the same page read in the browser agree.
/**
 * What the classifier is allowed to see. Nothing in here says who published it.
 *
 * Article classification is source-blind: the publication's name, domain, URL, reputation and past
 * classifications never reach the model. Told in words to ignore a domain it can see, the model
 * still moves — a neutral wire story labelled jacobin.com picks up 29 points of "Lean Left" that
 * the same words under an unknown domain do not. So the domain is not sent at all.
 *
 * (The text itself may still name the paper, quote its columnists or read like its house style.
 * That is the article talking, and this change does not try to scrub it.)
 */
export type ArticleContent = {title: string; text: string}

/** Who published it. For caching, favicons, the Sites list and the panel — never for judging. */
export type ArticleMetadata = {
  url: string
  source: string
  favicon?: string
  /** A still to show with it, when the thing read was a video. */
  image?: string
}

export type Article = ArticleContent & ArticleMetadata

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
      true: 'A news story, report, analysis, or op-ed, including the transcript of a broadcast or video report',
      false:
        'Not an article: a homepage, product page, search results, social feed, docs, or other non-news content'
    }
  },
  lean: {
    type: 'score',
    instructions:
      'Judge the political slant of how this article (`title` and `text`) frames its subject, based on framing, word choice, and which perspectives are included or left out.',
    criteria: LEAN_LEVELS
  },
  loaded: {
    type: 'score',
    instructions: 'How emotionally loaded or sensational is the language in `title` and `text`?',
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

/**
 * The whole state Jev ever receives. Destructuring is the guard: whatever an Article carries
 * besides these two fields cannot reach the model through here, and this is the only place the
 * payload is built. src/lib/typesafe.test.ts holds it to that.
 */
export const stateFor = ({title, text}: ArticleContent) => ({title, text})

export async function analyze(
  content: ArticleContent,
  apiKey: string,
  signal?: AbortSignal
): Promise<Analysis> {
  const res = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST',
    headers: {Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({model: 'jev-latest', state: stateFor(content), questions: QUESTIONS}),
    signal
  })
  if (!res.ok) throw new Error(`TypeSafe ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const {answers: a} = await res.json()
  return {
    isNews: (a.is_news as NoulAnswer).noul,
    lean: a.lean,
    loaded: a.loaded,
    kind: a.kind,
    topic: a.topic
  }
}
