import assert from 'node:assert/strict'
import {QUESTIONS, stateFor, type Article} from './typesafe.ts'

// An article as the rest of the system carries it: content, and everything known about who ran it.
const ARTICLE: Article = {
  url: 'https://www.foxnews.com/politics/senate-advances-stopgap-spending-bill',
  source: 'foxnews.com',
  favicon: 'https://www.foxnews.com/favicon.ico',
  image: 'https://i.ytimg.com/vi/abc/hqdefault.jpg',
  title: 'Senate advances stopgap spending bill',
  text: 'The Senate voted 62 to 35 on Thursday to advance a stopgap spending bill.'
}

// The classifier sees the article, not the masthead.
const state = stateFor(ARTICLE)
assert.deepEqual(Object.keys(state).sort(), ['text', 'title'], 'state carries more than the content')
assert.equal(state.title, ARTICLE.title)
assert.equal(state.text, ARTICLE.text)

// Nothing about the publisher survives anywhere in the payload, under any key.
const payload = JSON.stringify({model: 'jev-latest', state, questions: QUESTIONS})
for (const trace of ['foxnews', 'favicon', 'ytimg', 'https://'])
  assert.ok(!payload.includes(trace), `payload leaks ${trace}`)

// Two copies of one article, filed under opposite mastheads, are the same request.
const guardian: Article = {...ARTICLE, url: 'https://www.theguardian.com/x', source: 'theguardian.com'}
const times: Article = {...ARTICLE, url: 'https://www.nytimes.com/x', source: 'nytimes.com'}
const left = stateFor(guardian)
const right = stateFor(times)
const bare = stateFor({title: ARTICLE.title, text: ARTICLE.text})
assert.deepEqual(left, right, 'the masthead changed the request')
assert.deepEqual(left, bare, 'a source-less article asks something different')

// No question may name a field the state does not carry: an instruction about `source` would be
// telling the model to reason about something it cannot see.
for (const [name, question] of Object.entries(QUESTIONS)) {
  const words = JSON.stringify(question)
  for (const field of ['`source`', '`url`', '`favicon`'])
    assert.ok(!words.includes(field), `question ${name} refers to ${field}`)
}

console.log('ok')
