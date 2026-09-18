import assert from 'node:assert/strict'
import {youtubeId} from './youtube.ts'

// Every shape a YouTube link arrives in
assert.equal(youtubeId('https://www.youtube.com/watch?v=jNQXAC9IVRw'), 'jNQXAC9IVRw')
assert.equal(youtubeId('https://youtube.com/watch?v=jNQXAC9IVRw&t=42s'), 'jNQXAC9IVRw')
assert.equal(youtubeId('https://m.youtube.com/watch?v=jNQXAC9IVRw'), 'jNQXAC9IVRw')
assert.equal(youtubeId('https://youtu.be/jNQXAC9IVRw?si=abc'), 'jNQXAC9IVRw')
assert.equal(youtubeId('https://www.youtube.com/shorts/jNQXAC9IVRw'), 'jNQXAC9IVRw')
assert.equal(youtubeId('https://www.youtube.com/live/jNQXAC9IVRw'), 'jNQXAC9IVRw')
assert.equal(youtubeId('https://www.youtube.com/embed/jNQXAC9IVRw'), 'jNQXAC9IVRw')

// Not a video: the rest of YouTube, and the rest of the web
assert.equal(youtubeId('https://www.youtube.com/'), undefined)
assert.equal(youtubeId('https://www.youtube.com/@BBCNews'), undefined)
assert.equal(youtubeId('https://www.youtube.com/watch?v=too-short'), undefined)
assert.equal(youtubeId('https://www.youtube.com/results?search_query=news'), undefined)
assert.equal(youtubeId('https://notyoutube.com/watch?v=jNQXAC9IVRw'), undefined)
assert.equal(youtubeId('https://evil.com/youtu.be/jNQXAC9IVRw'), undefined)
assert.equal(youtubeId('not a url'), undefined)

console.log('ok')
