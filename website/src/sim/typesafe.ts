// Copied from ../../../src/typesafe.ts and ../../../src/mark.ts so the demo scores articles
// exactly the way the extension does. Keep in sync when the extension's maths changes.

export type Probs = Record<string, number>

/** Collapse the 5 lean levels into Ground News style Left / Center / Right shares (sum to 1). */
export function leanShares(p: Probs) {
  const g = (k: string) => p[k] ?? 0
  const left = g('0') + g('1')
  const center = g('2')
  const right = g('3') + g('4')
  const total = left + center + right || 1
  return {left: left / total, center: center / total, right: right / total}
}

/** Index of the most likely Score level (ties go to the lower level). */
export function topLevel(p: Probs, levels: number) {
  let best = 0
  for (let i = 1; i < levels; i++) if ((p[i] ?? 0) > (p[best] ?? 0)) best = i
  return best
}

const isMixed = (p: Probs) => {
  const s = leanShares(p)
  return Math.min(s.left, s.right) >= 0.25
}

/** Short side code for the toolbar badge. */
export function leanSide(p: Probs): 'L' | 'C' | 'R' | 'MIX' {
  if (isMixed(p)) return 'MIX'
  const top = topLevel(p, 5)
  return top < 2 ? 'L' : top > 2 ? 'R' : 'C'
}

export type Shares = {left: number; center: number; right: number}

export const MARK = {tile: '#16181d', left: '#3d74ff', center: '#e7e1d3', right: '#ff5a45'}

/**
 * Brand mark: three bars on an ink tile. With shares, bar heights follow the Left / Center / Right
 * split (tallest bar = full height), so the toolbar icon itself shows the article's lean.
 */
export function drawMark(g: CanvasRenderingContext2D, size: number, s?: Shares) {
  const bars: [number, string][] = s
    ? [
        [s.left, MARK.left],
        [s.center, MARK.center],
        [s.right, MARK.right]
      ]
    : [
        [0.6, MARK.left],
        [1, MARK.center],
        [0.8, MARK.right]
      ]
  const max = Math.max(...bars.map(([v]) => v)) || 1
  const pad = Math.round(size * 0.2)
  const gap = Math.max(1, Math.round(size * 0.07))
  const w = Math.floor((size - pad * 2 - gap * 2) / 3)
  const x0 = Math.round((size - (w * 3 + gap * 2)) / 2)
  const span = size - pad * 2

  g.clearRect(0, 0, size, size)
  g.fillStyle = MARK.tile
  g.beginPath()
  g.roundRect(0, 0, size, size, size * 0.24)
  g.fill()
  bars.forEach(([v, color], i) => {
    const h = Math.max(Math.round(span * 0.18), Math.round(span * (v / max)))
    g.fillStyle = color
    g.beginPath()
    g.roundRect(x0 + i * (w + gap), size - pad - h, w, h, Math.min(w / 2, size * 0.05))
    g.fill()
  })
}

/** Domain helpers, copied from ../../../src/domains.ts. */
export function parseDomains(input: string): string[] {
  const domains = input
    .split(/[\s,]+/)
    .map((d) =>
      d
        .trim()
        .toLowerCase()
        .replace(/^[a-z]+:\/\//, '')
        .replace(/[/:?#].*$/, '')
        .replace(/^www\./, '')
    )
    .filter((d) => d.includes('.'))
  return [...new Set(domains)]
}

/** Empty list = every site. A domain also covers its subdomains. */
export function isAllowed(hostname: string, domains: string[]) {
  const host = hostname.toLowerCase().replace(/^www\./, '')
  return domains.length === 0 || domains.some((d) => host === d || host.endsWith(`.${d}`))
}
