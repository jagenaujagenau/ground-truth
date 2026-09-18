import './styles.css'
import {leanShares, leanSide, topLevel, type Analysis, type Article} from '../typesafe'
import {envApiUrl, tabKey, type TabState} from '../shared'
import {isAllowed, parseDomains} from '../domains'

// ---- Tiny escaped templating: every interpolation is escaped unless it is already Html ----
type Html = {__html: string}
const raw = (s: string): Html => ({__html: s})
const toHtml = (v: unknown): string =>
  v == null || v === false
    ? ''
    : Array.isArray(v)
      ? v.map(toHtml).join('')
      : typeof v === 'object' && '__html' in v
        ? (v as Html).__html
        : String(v).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
const html = (strings: TemplateStringsArray, ...values: unknown[]): Html =>
  raw(strings.reduce((out, s, i) => out + s + (i < values.length ? toHtml(values[i]) : ''), ''))

const svg = (d: string) =>
  html`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" /></svg>`
const I = {
  refresh: svg('M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5'),
  sliders: svg('M4 8h9M17 8h3M4 16h3M11 16h9M15 6v4M9 14v4'),
  back: svg('M15 18l-6-6 6-6'),
  arrow: svg('M7 17L17 7M9 7h8v8'),
  plus: svg('M12 5v14M5 12h14'),
  x: svg('M7 7l10 10M17 7L7 17'),
  pause: svg('M9.5 7v10M14.5 7v10'),
  page: svg('M7 3.5h7l4 4v13H7zM14 3.5v4h4M10 12h5M10 15.5h5'),
  key: svg('M14.5 9.5a4 4 0 1 1-1.2 2.85L5 20.5 3.5 19l1-1 1.5 1.5L8 17.5 6.5 16l6.8-6.8a4 4 0 0 1 1.2.3z'),
  alert: svg('M12 8.5v4.5M12 16.5v.01M10.3 4l-7.6 13.2A2 2 0 0 0 4.4 20h15.2a2 2 0 0 0 1.7-2.8L13.7 4a2 2 0 0 0-3.4 0z')
}

const mark = (cls = 'mark') => html`<svg class="${cls}" viewBox="0 0 32 32" aria-hidden="true">
  <rect width="32" height="32" rx="8" class="mark-tile" />
  <rect x="7" y="14" width="5" height="11" rx="1.5" class="mark-l" />
  <rect x="13.5" y="7" width="5" height="18" rx="1.5" class="mark-c" />
  <rect x="20" y="11" width="5" height="14" rx="1.5" class="mark-r" />
</svg>`

// Site icon; if the image fails to load, the error listener below removes it and CSS shows the letter.
const favicon = (domain: string, src?: string) => html`<span class="favicon" data-letter="${domain[0]}" aria-hidden="true">
  <img src="${src || favicons[domain] || `https://${domain}/favicon.ico`}" alt="" referrerpolicy="no-referrer" /></span>`

// ---- Copy: every string comes from _locales/<lang>/messages.json ----
const t = (key: string, ...subs: (string | number)[]) =>
  chrome.i18n.getMessage(key, subs.map(String))

const LEVELS = [
  {key: 'FarLeft', side: 'left'},
  {key: 'Left', side: 'left'},
  {key: 'Center', side: 'center'},
  {key: 'Right', side: 'right'},
  {key: 'FarRight', side: 'right'}
].map(({key, side}) => ({
  short: t(`level${key}Short`),
  label: t(`level${key}`),
  blurb: t(`level${key}Blurb`),
  side
}))
const LANGUAGE = ['Neutral', 'Somewhat', 'Highly'].map((key) => ({
  label: t(`lang${key}`),
  blurb: t(`lang${key}Blurb`)
}))
// The model answers in English; the chips show it in the reader's language.
const chip = (kind: 'kind' | 'topic', choice: string) =>
  t(`${kind}${choice.charAt(0).toUpperCase()}${choice.slice(1)}`) || choice

const SIDES = [
  ['left', t('sideLeft')],
  ['center', t('sideCenter')],
  ['right', t('sideRight')]
] as const
const pct = (n: number) => `${Math.round(n * 100)}%`

// ---- State ----
const app = document.getElementById('app')!
let view: 'page' | 'settings' = 'page'
let tabId: number | undefined
let tab: TabState | undefined
let domains: string[] = []
let hasSavedUrl = false
let favicons: Record<string, string> = {}
let lastHtml = ''

// ---- Views ----
function header() {
  if (view === 'settings') {
    return html`<header class="appbar">
      <button class="icon-btn" data-action="back" aria-label="${t('backAria')}">${I.back}</button>
      <h1 class="appbar-title">${t('settingsTitle')}</h1>
    </header>`
  }
  const busy = tab?.status === 'analyzing'
  return html`<header class="appbar">
    <div class="brand">${mark()}<span class="wordmark">${t('extName')}</span></div>
    <div class="appbar-actions">
      <button class="icon-btn ${busy ? 'is-spinning' : ''}" data-action="refresh" aria-label="${t('refreshAria')}" ${raw(tabId === undefined || busy ? 'disabled' : '')}>${I.refresh}</button>
      <button class="icon-btn" data-action="settings" aria-label="${t('settingsTitle')}">${I.sliders}</button>
    </div>
  </header>`
}

const story = (a: Article, chips: string[] = []) => html`<header class="story">
  <p class="story-meta"><span class="source">${favicon(a.source, a.favicon)}${a.source}</span>${chips.map((c) => html`<span class="chip">${c}</span>`)}</p>
  <h2 class="headline">${a.title}</h2>
</header>`

function result(a: Article, r: Analysis) {
  const p = r.lean.probabilities
  const top = LEVELS[topLevel(p, 5)]
  const mixed = leanSide(p) === 'MIX'
  const shares = leanShares(p)
  const lang = topLevel(r.loaded.probabilities, 3)
  const max = Math.max(...LEVELS.map((_, i) => p[i] ?? 0)) || 1
  const sides = SIDES

  return html`<article class="result">
    ${story(a, [chip('kind', r.kind.choice), chip('topic', r.topic.choice)])}

    <section class="card verdict" aria-labelledby="verdict">
      <p class="eyebrow">${t('cardFraming')}</p>
      <p class="verdict-label" id="verdict" data-side="${top.side}">${top.label}</p>
      ${mixed && html`<p class="flag"><span class="flag-dot"></span>${t('mixedFlag')}</p>`}
      <p class="verdict-blurb">${mixed ? t('mixedBlurb') : top.blurb}</p>
      <div class="split" role="img" aria-label="${sides.map(([k, n]) => `${n} ${pct(shares[k])}`).join(', ')}">
        ${sides.filter(([k]) => shares[k] >= 0.005).map(([k], i) => html`<span class="split-seg" data-side="${k}" style="flex-grow:${shares[k].toFixed(3)};--i:${i}"></span>`)}
      </div>
      <ul class="legend">
        ${sides.map(([k, n]) => html`<li><span class="dot" data-side="${k}"></span>${n}<b>${pct(shares[k])}</b></li>`)}
      </ul>
    </section>

    <section class="card">
      <div class="card-head"><p class="eyebrow">${t('cardSpectrum')}</p><p class="hint">${t('spectrumHint')}</p></div>
      <div class="histo" role="img" aria-label="${LEVELS.map((l, i) => `${l.label} ${pct(p[i] ?? 0)}`).join(', ')}">
        ${LEVELS.map(
          (l, i) => html`<div class="col ${l === top ? 'is-top' : ''}" data-side="${l.side}" style="--h:${((p[i] ?? 0) / max).toFixed(3)};--i:${i}">
            <span class="col-pct">${pct(p[i] ?? 0)}</span>
            <span class="col-track"><span class="col-fill"></span></span>
            <span class="col-name">${l.short}</span>
          </div>`
        )}
      </div>
    </section>

    <section class="card">
      <div class="card-head"><p class="eyebrow">${t('cardLanguage')}</p><p class="hint strong">${LANGUAGE[lang].label}</p></div>
      <div class="meter" data-level="${lang}" aria-hidden="true"><span></span><span></span><span></span></div>
      <p class="card-body">${LANGUAGE[lang].blurb}</p>
    </section>

    <a class="cta" href="https://news.google.com/search?q=${encodeURIComponent(a.title)}" target="_blank" rel="noopener noreferrer">
      <span class="cta-text"><b>${t('ctaTitle')}</b><small>${t('ctaBody')}</small></span>
      <span class="cta-icon">${I.arrow}</span>
    </a>
    <p class="fineprint">${t('fineprint', a.source)}</p>
  </article>`
}

const loading = (a?: Article) => html`<div class="result is-loading" aria-busy="true">
  ${a ? story(a) : html`<div class="story"><span class="skel skel-meta"></span><span class="skel skel-title"></span><span class="skel skel-title short"></span></div>`}
  <section class="card verdict">
    <p class="eyebrow">${t('loadingTitle')}<span class="ellipsis"></span></p>
    <span class="skel skel-verdict"></span>
    <span class="skel skel-line"></span>
    <span class="skel skel-bar"></span>
  </section>
  <section class="card"><span class="skel skel-histo"></span></section>
</div>`

const empty = (o: {art: Html; tone?: string; title: string; body: Html | string; actions?: Html; extra?: Html}) => html`<section class="empty" data-tone="${o.tone ?? 'neutral'}">
  <div class="empty-art">${mark('mark mark-lg')}<span class="empty-badge">${o.art}</span></div>
  <h2 class="empty-title">${o.title}</h2>
  <p class="empty-body">${o.body}</p>
  ${o.actions && html`<div class="empty-actions">${o.actions}</div>`}
  ${o.extra}
</section>`

function page() {
  const s = tab
  if (tabId === undefined || !s) return loading()
  switch (s.status) {
    case 'analyzing':
      return loading(s.article)
    case 'done':
      if (s.analysis.isNews >= 0.5) return result(s.article, s.analysis)
      return empty({
        art: I.page,
        title: t('notNewsTitle'),
        body: t('notNewsBody', s.article.source),
        actions: html`<button class="btn btn-ghost" data-action="refresh">${I.refresh}${t('checkAgain')}</button>`
      })
    case 'off':
      return empty({
        art: I.pause,
        tone: 'paused',
        title: t('pausedTitle', s.article.source),
        body: t('pausedBody'),
        actions: html`<button class="btn btn-primary" data-action="add-site" data-domain="${s.article.source}">${I.plus}${t('addSite', s.article.source)}</button>
          <button class="btn btn-ghost" data-action="settings">${t('manageSites')}</button>`,
        extra: html`<figure class="empty-quote"><figcaption class="source">${favicon(s.article.source, s.article.favicon)}${s.article.source}</figcaption><blockquote>“${s.article.title}”</blockquote></figure>`
      })
    case 'empty':
      return empty({
        art: I.page,
        title: t('emptyTitle'),
        body: t('emptyBody'),
        actions: html`<button class="btn btn-ghost" data-action="refresh">${I.refresh}${t('checkAgain')}</button>`,
        extra: html`<p class="empty-note">${t('emptyNote')}</p>`
      })
    case 'nourl':
      return empty({
        art: I.key,
        title: t('notConnectedTitle'),
        body: t('notConnectedBody'),
        actions: html`<button class="btn btn-primary" data-action="settings">${t('notConnectedAction')}</button>`
      })
    case 'error':
      return empty({
        art: I.alert,
        tone: 'error',
        title: t('errorTitle'),
        body: t('errorBody', s.article.source),
        actions: html`<button class="btn btn-primary" data-action="refresh">${I.refresh}${t('tryAgain')}</button>`,
        extra: html`<details class="empty-details"><summary>${t('details')}</summary><code>${s.message}</code></details>`
      })
  }
}

function settings() {
  const current = tab && 'article' in tab ? tab.article.source : undefined
  const n = domains.length
  return html`<main class="settings">
    <section class="group">
      <div class="group-head">
        <h2 class="group-title">${t('sitesTitle')}</h2>
        <span class="pill ${n ? '' : 'pill-accent'}">${n ? (n === 1 ? t('sitesOne') : t('sitesMany', n)) : t('sitesEvery')}</span>
      </div>
      <p class="group-body">${n ? t('sitesBodySome') : t('sitesBodyAll')}</p>
      <form class="field-row" data-form="domain" novalidate>
        <label class="sr-only" for="domain">${t('addSiteLabel')}</label>
        <input id="domain" name="domain" placeholder="nytimes.com" autocomplete="off" spellcheck="false" autocapitalize="off" aria-describedby="domain-error" />
        <button class="btn btn-primary" type="submit">${t('add')}</button>
      </form>
      <p class="field-error" id="domain-error" role="alert"></p>
      ${current && !domains.includes(current) && html`<button class="suggest" data-action="add-site" data-domain="${current}">
        <span class="suggest-plus">${I.plus}</span><span>${t('addCurrentSite', current)}</span></button>`}
      ${n > 0 && html`<ul class="sites">${domains.map(
        (d) => html`<li class="site">
          ${favicon(d)}
          <span class="site-name">${d}</span>
          <button class="icon-btn icon-btn-sm" data-action="remove-site" data-domain="${d}" aria-label="${t('removeSiteAria', d)}">${I.x}</button>
        </li>`
      )}</ul>`}
    </section>

    ${!envApiUrl && html`<section class="group">
      <div class="group-head">
        <h2 class="group-title">${t('serviceTitle')}</h2>
        <span class="pill ${hasSavedUrl ? 'pill-ok' : ''}">${hasSavedUrl ? t('serviceConnected') : t('serviceNotSet')}</span>
      </div>
      <p class="group-body">${t('serviceBody')}</p>
      <form class="field-row" data-form="url" novalidate>
        <label class="sr-only" for="service">${t('serviceLabel')}</label>
        <input id="service" name="service" type="url" autocomplete="off" spellcheck="false" placeholder="https://example.com/api/analyze" aria-describedby="service-error" />
        <button class="btn btn-primary" type="submit">${t('save')}</button>
      </form>
      <p class="field-error" id="service-error" role="alert"></p>
    </section>`}

    <section class="group">
      <h2 class="group-title">${t('privacyTitle')}</h2>
      <p class="group-body">${t('privacyBody')}</p>
    </section>
  </main>`
}

function render() {
  const out = html`${header()}${view === 'settings' ? settings() : html`<main>${page()}</main>`}`.__html
  if (out === lastHtml) return
  // Keep typing and focus intact when a background update re-renders the view.
  const active = document.activeElement as HTMLInputElement | null
  const keep = active?.id && app.contains(active) ? {id: active.id, value: active.value} : undefined
  lastHtml = out
  app.innerHTML = out
  if (keep) {
    const el = document.getElementById(keep.id) as HTMLInputElement | null
    if (el) {
      if (keep.value !== undefined) el.value = keep.value
      el.focus()
    }
  }
}

// ---- Data ----
async function activeTabId() {
  const [t] = await chrome.tabs.query({active: true, currentWindow: true})
  return t?.id
}

const requestCheck = (force = false) =>
  tabId !== undefined && chrome.runtime.sendMessage({type: 'analyze', tabId, force}).catch(() => {})

async function load() {
  tabId = await activeTabId()
  const key = tabId === undefined ? '' : tabKey(tabId)
  const [session, local] = await Promise.all([
    key ? chrome.storage.session.get(key) : Promise.resolve({} as Record<string, unknown>),
    chrome.storage.local.get(['domains', 'apiUrl', 'favicons'])
  ])
  tab = session[key] as TabState | undefined
  domains = (local.domains as string[] | undefined) ?? []
  hasSavedUrl = Boolean(local.apiUrl)
  favicons = (local.favicons as Record<string, string> | undefined) ?? {}
  // Not checked yet (tab predates the extension), or its site was added in another tab since.
  if (!tab || (tab.status === 'off' && isAllowed(tab.article.source, domains))) requestCheck()
  render()
}

async function saveDomains(next: string[]) {
  domains = [...new Set(next)]
  await chrome.storage.local.set({domains})
  requestCheck(true)
  render()
}

// ---- Events ----
app.addEventListener('click', async (e) => {
  const el = (e.target as Element).closest<HTMLElement>('[data-action]')
  if (!el || (el as HTMLButtonElement).disabled) return
  const {action, domain} = el.dataset
  if (action === 'settings' || action === 'back') {
    view = action === 'settings' ? 'settings' : 'page'
    render()
    if (e.detail === 0) app.querySelector<HTMLElement>(view === 'settings' ? '[data-action=back]' : '[data-action=settings]')?.focus()
  } else if (action === 'refresh') requestCheck(true)
  else if (action === 'add-site' && domain) {
    view = 'page'
    await saveDomains([...domains, domain])
  } else if (action === 'remove-site' && domain) await saveDomains(domains.filter((d) => d !== domain))
})

app.addEventListener('submit', async (e) => {
  e.preventDefault()
  const form = e.target as HTMLFormElement
  const input = form.querySelector('input')!
  if (form.dataset.form === 'domain') {
    const added = parseDomains(input.value)
    if (!added.length) {
      app.querySelector('#domain-error')!.textContent = t('domainError')
      return input.focus()
    }
    input.value = ''
    await saveDomains([...domains, ...added])
  } else if (form.dataset.form === 'url') {
    const address = input.value.trim()
    if (!/^https?:\/\/\S+$/.test(address)) {
      app.querySelector('#service-error')!.textContent = t('serviceError')
      return input.focus()
    }
    await chrome.storage.local.set({apiUrl: address})
    input.value = ''
    hasSavedUrl = true
    requestCheck(true)
    render()
  }
})

app.addEventListener(
  'error',
  (e) => {
    const img = e.target as HTMLElement
    if (img.parentElement?.classList.contains('favicon')) img.remove()
  },
  true
)

app.addEventListener('input', (e) => {
  const id = (e.target as HTMLElement).id
  if (id === 'domain') app.querySelector('#domain-error')!.textContent = ''
  if (id === 'service') app.querySelector('#service-error')!.textContent = ''
})

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && view === 'settings') app.querySelector<HTMLElement>('[data-action=back]')?.dispatchEvent(new MouseEvent('click', {bubbles: true, detail: 0}))
})

chrome.tabs.onActivated.addListener(() => load())
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'session' && tabId !== undefined && tabKey(tabId) in changes) {
    tab = changes[tabKey(tabId)].newValue as TabState | undefined
    render()
  }
  if (area === 'local' && ('domains' in changes || 'favicons' in changes)) {
    if (changes.domains) domains = (changes.domains.newValue as string[] | undefined) ?? []
    if (changes.favicons) favicons = (changes.favicons.newValue as Record<string, string> | undefined) ?? {}
    render()
  }
})

load()
