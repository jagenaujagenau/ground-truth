import {analyze, leanLabel, leanShares, leanSide, type Analysis, type Article} from './typesafe'
import {apiKey, getDomains, tabKey, type TabState} from './shared'
import {isAllowed} from './domains'
import {drawMark} from './mark'

console.log(
  '[From the background context] Hello from the background worker/script!'
)

const isFirefoxLike =
  import.meta.env.EXTENSION_PUBLIC_BROWSER === 'firefox' ||
  import.meta.env.EXTENSION_PUBLIC_BROWSER === 'gecko-based'

const isSafariLike =
  import.meta.env.EXTENSION_PUBLIC_BROWSER === 'safari' ||
  import.meta.env.EXTENSION_PUBLIC_BROWSER === 'webkit-based'

// Safari has no side panel surface, so the sidebar page opens in a tab.
let sidebarTabId: number | undefined

function openSidebarTab() {
  const url = chrome.runtime.getURL('sidebar/index.html')

  const openNewTab = () => {
    chrome.tabs.create({url}, (tab) => {
      sidebarTabId = tab?.id
    })
  }

  // A repeat click focuses the tab already opened instead of a new copy.
  const knownTabId = sidebarTabId

  if (knownTabId === undefined) {
    openNewTab()

    return
  }

  chrome.tabs.update(knownTabId, {active: true}, () => {
    if (chrome.runtime.lastError) openNewTab()
  })
}

if (isFirefoxLike) {
  // Firefox refuses sidebarAction.open() outside a user input handler, and a
  // message listener is not one, so the toolbar click is the only route.
  browser.browserAction.onClicked.addListener(() => {
    browser.sidebarAction.open()
  })
}

if (isSafariLike) {
  // Safari never had setPanelBehavior, so the toolbar click needs a listener.
  chrome.action?.onClicked.addListener(() => {
    openSidebarTab()
  })

  chrome.runtime.onMessage.addListener((message) => {
    if (!message || message.type !== 'openSidebar') return

    openSidebarTab()
  })
}

if (!isFirefoxLike && !isSafariLike) {
  // setPanelBehavior only affects FUTURE action clicks, registering it
  // inside onClicked would swallow the first toolbar click.
  chrome.sidePanel?.setPanelBehavior({openPanelOnActionClick: true})

  // The side panel API only exists in Chromium. Firefox opens the sidebar in
  // the listener above, so this listener is compiled out of gecko builds.
  chrome.runtime.onMessage.addListener((message, sender) => {
    if (!message || message.type !== 'openSidebar') return

    // Every line here runs synchronously on purpose. sidePanel.open() is only
    // allowed inside the user gesture that the content-script click carries, and
    // a tabs.query callback outlives it: the panel then silently refuses to open.
    // sender.tab is the tab the click came from, so no lookup is needed at all.
    chrome.sidePanel?.setPanelBehavior({openPanelOnActionClick: true})

    const tabId = sender.tab?.id
    if (!chrome.sidePanel?.open || tabId === undefined) return

    try {
      chrome.sidePanel?.open({tabId})
    } catch (error) {
      console.error(error)
    }
  })
}

// ---- Automatic bias check: runs on every page load, paints the toolbar icon per tab ----

// ponytail: cheap length pre-filter so most non-article pages never hit the API; is_news handles the rest
const MIN_CHARS = 800
const action = chrome.action ?? chrome.browserAction
const DEFAULT_ICON = {16: 'images/icon-16.png', 32: 'images/icon-32.png'}
const BADGE = {L: '#2f63e0', C: '#5b5e66', R: '#d8412f', MIX: '#7c4fd6'}
const latestRun = new Map<number, number>()

async function getArticle(tabId: number): Promise<Article | undefined> {
  // The content script can still be registering right after the load event.
  for (let i = 0; i < 3; i++) {
    try {
      return await chrome.tabs.sendMessage(tabId, {type: 'getArticle'})
    } catch {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
}

function drawIcon(size: number, shares: {left: number; center: number; right: number}) {
  const g = new OffscreenCanvas(size, size).getContext('2d')!
  drawMark(g, size, shares)
  return g.getImageData(0, 0, size, size)
}

function paint(tabId: number, a?: Analysis) {
  if (!a || a.isNews < 0.5) {
    action.setIcon({tabId, path: DEFAULT_ICON})
    action.setBadgeText({tabId, text: ''})
    action.setTitle({tabId, title: 'Ground Truth'})
    return
  }
  const p = a.lean.probabilities
  const side = leanSide(p)
  action.setIcon({tabId, imageData: {16: drawIcon(16, leanShares(p)), 32: drawIcon(32, leanShares(p))}})
  action.setBadgeText({tabId, text: side})
  action.setBadgeBackgroundColor({tabId, color: BADGE[side]})
  action.setBadgeTextColor?.({tabId, color: '#ffffff'})
  action.setTitle({tabId, title: `Ground Truth: ${leanLabel(p)}`})
}

// Remember each site's real icon so Settings can show it for sites that aren't open.
async function rememberFavicon(source: string, url: string) {
  const {favicons = {}} = (await chrome.storage.local.get('favicons')) as {favicons?: Record<string, string>}
  if (favicons[source] !== url) await chrome.storage.local.set({favicons: {...favicons, [source]: url}})
}

async function check(tabId: number, force = false) {
  const run = Date.now()
  latestRun.set(tabId, run)
  const current = () => latestRun.get(tabId) === run
  const save = (state: TabState) => current() && chrome.storage.session.set({[tabKey(tabId)]: state})

  paint(tabId)
  const article = await getArticle(tabId)
  if (article?.favicon) rememberFavicon(article.source, article.favicon)
  if (article && !isAllowed(article.source, await getDomains())) return save({status: 'off', article})
  if (!article || article.text.length < MIN_CHARS) return save({status: 'empty'})
  const key = await apiKey()
  if (!key) return save({status: 'nokey'})

  const cacheKey = `url:${article.url}`
  let analysis = force ? undefined : ((await chrome.storage.session.get(cacheKey))[cacheKey] as Analysis | undefined)
  if (!analysis) {
    await save({status: 'analyzing', article})
    try {
      analysis = await analyze(article, key)
    } catch (e) {
      return save({status: 'error', article, message: (e as Error).message})
    }
    await chrome.storage.session.set({[cacheKey]: analysis})
  }
  if (!current()) return
  await save({status: 'done', article, analysis})
  paint(tabId, analysis)
}

// No "tabs" permission (it shows a browsing-history warning at install), so tab.url isn't read here;
// non-web pages have no content script and end up in the 'empty' state.
chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === 'complete') check(tabId)
})
chrome.tabs.onRemoved.addListener((tabId) => chrome.storage.session.remove(tabKey(tabId)))
chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'analyze') check(message.tabId, message.force)
})
