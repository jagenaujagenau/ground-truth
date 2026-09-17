import assert from 'node:assert/strict'
import {leanShares, leanLabel, leanSide, topLevel} from './typesafe.ts'

const s = leanShares({'0': 0.1, '1': 0.2, '2': 0.4, '3': 0.2, '4': 0.1})
assert.ok(Math.abs(s.left - 0.3) < 1e-9 && Math.abs(s.center - 0.4) < 1e-9 && Math.abs(s.right - 0.3) < 1e-9)
assert.deepEqual(leanShares({}), {left: 0, center: 0, right: 0})
assert.equal(leanLabel({'0': 0.99, '1': 0.01}), 'Far Left')
assert.equal(leanLabel({'1': 0.01, '2': 0.98, '3': 0.01}), 'Center')
assert.equal(leanLabel({'3': 0.3, '4': 0.7}), 'Far Right')
// Daily Beast / Vance article: bimodal, mean lands on Center but Center is the least likely side
assert.equal(leanLabel({'0': 0.03, '1': 0.47, '2': 0.08, '3': 0.36, '4': 0.06}), 'Lean Left (mixed signals)')
// Language: split Neutral 48% / Highly loaded 42% averages to "Somewhat loaded" (10%)
assert.equal(topLevel({'0': 0.48, '1': 0.1, '2': 0.42}, 3), 0)
assert.equal(topLevel({'0': 0.1, '1': 0.2, '2': 0.7}, 3), 2)
assert.equal(topLevel({}, 3), 0)
assert.equal(leanSide({'0': 0.03, '1': 0.47, '2': 0.08, '3': 0.36, '4': 0.06}), 'MIX')
assert.equal(leanSide({'1': 0.8, '2': 0.2}), 'L')
assert.equal(leanSide({'2': 0.9, '3': 0.1}), 'C')
assert.equal(leanSide({'3': 0.3, '4': 0.6, '2': 0.1}), 'R')
console.log('ok')
