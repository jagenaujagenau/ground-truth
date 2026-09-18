// A port of ../../../src/sidebar/scripts.ts: same markup, same copy, same states. The difference is
// where the data comes from — /api/analyze instead of chrome.storage.
import {leanShares, leanSide, topLevel, type Probs} from './typesafe'
import type {T} from '../i18n'

export type Article = {url: string; source: string; title: string; text?: string; favicon?: string}
export type Analysis = {
  isNews: number
  lean: {probabilities: Probs}
  loaded: {probabilities: Probs}
  kind: {choice: string}
  topic: {choice: string}
}

// ---- Tiny escaped templating: every interpolation is escaped unless it is already Html ----
export type Html = {__html: string}
export const raw = (s: string): Html => ({__html: s})
const toHtml = (v: unknown): string =>
  v == null || v === false
    ? ''
    : Array.isArray(v)
      ? v.map(toHtml).join('')
      : typeof v === 'object' && '__html' in (v as object)
        ? (v as Html).__html
        : String(v).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
export const html = (strings: TemplateStringsArray, ...values: unknown[]): Html =>
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
  alert: svg('M12 8.5v4.5M12 16.5v.01M10.3 4l-7.6 13.2A2 2 0 0 0 4.4 20h15.2a2 2 0 0 0 1.7-2.8L13.7 4a2 2 0 0 0-3.4 0z')
}

export const mark = (cls = 'mark') => html`<svg class="${cls}" viewBox="0 0 32 32" aria-hidden="true">
  <rect width="32" height="32" rx="8" class="mark-tile" />
  <rect x="7" y="14" width="5" height="11" rx="1.5" class="mark-l" />
  <rect x="13.5" y="7" width="5" height="18" rx="1.5" class="mark-c" />
  <rect x="20" y="11" width="5" height="14" rx="1.5" class="mark-r" />
</svg>`

// Site icon; if the image fails to load, the error listener in the simulator removes it and CSS
// falls back to the letter tile.
const favicon = (domain: string, src?: string) => html`<span class="favicon" data-letter="${domain[0]}" aria-hidden="true">
  <img src="${src || `https://${domain}/favicon.ico`}" alt="" referrerpolicy="no-referrer" /></span>`

// ---- Copy: the extension's own catalogs, via i18n/messages ----
const LEVEL_KEYS = ['FarLeft', 'Left', 'Center', 'Right', 'FarRight'] as const
const SIDE_OF_LEVEL = ['left', 'left', 'center', 'right', 'right'] as const
const LANG_KEYS = ['Neutral', 'Somewhat', 'Highly'] as const
const pct = (n: number) => `${Math.round(n * 100)}%`

const levels = (t: T) =>
  LEVEL_KEYS.map((key, i) => ({
    short: t(`level${key}Short`),
    label: t(`level${key}`),
    blurb: t(`level${key}Blurb`),
    side: SIDE_OF_LEVEL[i]
  }))

// The model answers in English; the chips show it in the reader's language.
const chip = (t: T, kind: 'kind' | 'topic', choice: string) =>
  t(`${kind}${choice.charAt(0).toUpperCase()}${choice.slice(1)}`) || choice

export type PanelState = {
  t: T
  view: 'page' | 'settings'
  status: 'idle' | 'analyzing' | 'done' | 'off' | 'empty' | 'error'
  article?: Article
  analysis?: Analysis
  message?: string
  domains: string[]
}

// ---- Views ----
function header(s: PanelState) {
  const t = s.t
  if (s.view === 'settings') {
    return html`<header class="appbar">
      <button class="icon-btn" data-action="back" aria-label="${t('backAria')}">${I.back}</button>
      <h1 class="appbar-title">${t('settingsTitle')}</h1>
    </header>`
  }
  const busy = s.status === 'analyzing'
  return html`<header class="appbar">
    <div class="brand">${mark()}<span class="wordmark">${t('extName')}</span></div>
    <div class="appbar-actions">
      <button class="icon-btn ${busy ? 'is-spinning' : ''}" data-action="refresh" aria-label="${t('refreshAria')}" ${raw(busy || !s.article ? 'disabled' : '')}>${I.refresh}</button>
      <button class="icon-btn" data-action="settings" aria-label="${t('settingsTitle')}">${I.sliders}</button>
    </div>
  </header>`
}

const story = (a: Article, chips: string[] = []) => html`<header class="story">
  <p class="story-meta"><span class="source">${favicon(a.source, a.favicon)}${a.source}</span>${chips.map((c) => html`<span class="chip">${c}</span>`)}</p>
  <h2 class="headline">${a.title}</h2>
</header>`

function result(t: T, a: Article, r: Analysis) {
  const LEVELS = levels(t)
  const p = r.lean.probabilities
  const top = LEVELS[topLevel(p, 5)]
  const mixed = leanSide(p) === 'MIX'
  const shares = leanShares(p)
  const lang = topLevel(r.loaded.probabilities, 3)
  const max = Math.max(...LEVELS.map((_, i) => p[i] ?? 0)) || 1
  const sides = [
    ['left', t('sideLeft')],
    ['center', t('sideCenter')],
    ['right', t('sideRight')]
  ] as const

  return html`<article class="result">
    ${story(a, [chip(t, 'kind', r.kind.choice), chip(t, 'topic', r.topic.choice)])}

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
      <div class="card-head"><p class="eyebrow">${t('cardLanguage')}</p><p class="hint strong">${t(`lang${LANG_KEYS[lang]}`)}</p></div>
      <div class="meter" data-level="${lang}" aria-hidden="true"><span></span><span></span><span></span></div>
      <p class="card-body">${t(`lang${LANG_KEYS[lang]}Blurb`)}</p>
    </section>

    <a class="cta" href="https://news.google.com/search?q=${encodeURIComponent(a.title)}" target="_blank" rel="noopener noreferrer">
      <span class="cta-text"><b>${t('ctaTitle')}</b><small>${t('ctaBody')}</small></span>
      <span class="cta-icon">${I.arrow}</span>
    </a>
    <p class="fineprint">${t('fineprint', a.source)}</p>
  </article>`
}

const loading = (t: T, a?: Article) => html`<div class="result is-loading" aria-busy="true">
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

function page(s: PanelState) {
  const t = s.t
  const a = s.article
  switch (s.status) {
    case 'analyzing':
      return loading(t, a)
    case 'done':
      if (a && s.analysis && s.analysis.isNews >= 0.5) return result(t, a, s.analysis)
      return empty({
        art: I.page,
        title: t('notNewsTitle'),
        body: t('notNewsBody', a?.source ?? '')
      })
    case 'off':
      return empty({
        art: I.pause,
        tone: 'paused',
        title: t('pausedTitle', a?.source ?? ''),
        body: t('pausedBody'),
        actions: html`<button class="btn btn-primary" data-action="add-site" data-domain="${a?.source}">${I.plus}${t('addSite', a?.source ?? '')}</button>
          <button class="btn btn-ghost" data-action="settings">${t('manageSites')}</button>`
      })
    case 'empty':
      return empty({
        art: I.page,
        title: t('emptyTitle'),
        body: s.message ?? t('emptyBody')
      })
    case 'error':
      return empty({
        art: I.alert,
        tone: 'error',
        title: t('errorTitle'),
        body: s.message ?? t('errorBody', a?.source ?? ''),
        actions: a ? html`<button class="btn btn-primary" data-action="refresh">${I.refresh}${t('tryAgain')}</button>` : undefined
      })
    default:
      // Idle: the site's own wording, merged into the catalog by the simulator.
      return empty({
        art: I.page,
        title: t('idleTitle'),
        body: t('idleBody')
      })
  }
}

function settings(s: PanelState) {
  const t = s.t
  const current = s.article?.source
  const domains = s.domains
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

    <section class="group">
      <h2 class="group-title">${t('privacyTitle')}</h2>
      <p class="group-body">${t('privacyBody')}</p>
    </section>
  </main>`
}

export const renderPanel = (s: PanelState) =>
  html`${header(s)}${s.view === 'settings' ? settings(s) : html`<main>${page(s)}</main>`}`.__html
