export type Shares = {left: number; center: number; right: number}

export const MARK = {tile: '#16181d', left: '#3d74ff', center: '#e7e1d3', right: '#ff5a45'}

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

/**
 * Brand mark: three bars on an ink tile. With shares, bar heights follow the Left / Center / Right
 * split (tallest bar = full height), so the toolbar icon itself shows the article's lean.
 */
export function drawMark(g: Ctx, size: number, s?: Shares) {
  const bars: [number, string][] = s
    ? [[s.left, MARK.left], [s.center, MARK.center], [s.right, MARK.right]]
    : [[0.6, MARK.left], [1, MARK.center], [0.8, MARK.right]]
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
