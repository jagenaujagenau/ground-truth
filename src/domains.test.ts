import assert from 'node:assert/strict'
import {isAllowed, parseDomains} from './domains.ts'

assert.deepEqual(parseDomains('https://www.NYTimes.com/section/politics\nbbc.co.uk, npr.org:443  nytimes.com junk'), [
  'nytimes.com',
  'bbc.co.uk',
  'npr.org'
])
assert.deepEqual(parseDomains('  '), [])

const list = ['nytimes.com', 'bbc.co.uk']
assert.ok(isAllowed('www.nytimes.com', list))
assert.ok(isAllowed('cooking.nytimes.com', list))
assert.ok(!isAllowed('notnytimes.com', list))
assert.ok(!isAllowed('npr.org', list))
assert.ok(isAllowed('anything.example', []))
console.log('ok')
