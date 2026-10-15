// Layering of a page while it turns (or while its corner is lifted).
//
// PageFlip draws a turn as three pages: the front of the turning page, left
// whole underneath; the page below it, on top of that, clipped to the part the
// fold has uncovered; and the folded flap. That only works while all of them
// lie at the same place. Here every sheet has its own place in the pile, so
// the page below is a step lower and further out: the whole front would peek
// out past it, and its clipped edge would leave a gap at the fold.
//
// So for as long as the page is turning this flips the two around: the page
// below is drawn whole underneath, and the front on top of it, cut down to
// the part that is still lying flat (everything on the spine side of the fold).
//
// The shadow the turning sheet casts starts at its fold, so it moves with the
// sheet, and PageFlip keeps it within the turning page's outline. The page
// below lies a step lower and further out, so the shadow is also cut to that
// page here, or it would fall past its top and spine edges onto the cover.

const EPS = 0.5

/**
 * @param {import('page-flip').PageFlip} book
 * @returns {{ start(): void, stop(): void }}
 */
export function trackTurnLayers(book) {
  let raf = 0
  let front = null
  let under = null

  // PageFlip finds its shadow once and keeps restyling it, so it can be moved
  // into a layer of our own that does the cutting (once PageFlip has built it)
  const shadowClip = document.createElement('div')
  shadowClip.className = 'pf-shadow-clip'
  const adoptShadow = (block) => {
    const shadow = block.querySelector('.stf__outerShadow')
    if (!shadow || shadow.parentElement === shadowClip) return
    block.appendChild(shadowClip)
    shadowClip.appendChild(shadow)
  }

  const release = () => {
    front?.classList.remove('pf-turn-front')
    front?.firstElementChild?.style.removeProperty('clip-path')
    under?.classList.remove('pf-turn-under')
    front = under = null
  }

  const frame = () => {
    raf = requestAnimationFrame(frame)
    const block = book.getUI().getDistElement()
    adoptShadow(block)
    const render = book.getRender()
    // PageFlip keeps these private, but they're plain fields at runtime
    const forward = render.direction === 0
    const portrait = render.orientation === 'portrait'
    const f = (forward ? render.rightPage : portrait ? null : render.leftPage)?.getElement?.()
    const u = render.bottomPage?.getElement?.()
    if (f !== front || u !== under) {
      release()
      if (!f || !u) return
      front = f
      under = u
      front.classList.add('pf-turn-front')
      under.classList.add('pf-turn-under')
    }
    // a single page turning forward folds over a copy of itself: mark it,
    // so it shows the back of the paper instead of the page again
    if (portrait && forward) render.flippingPage?.getElement?.()?.classList.add('pf-page-back')
    if (!front) return
    const flat = flatPart(under.style.clipPath, front.offsetWidth, front.offsetHeight)
    front.firstElementChild?.style.setProperty('clip-path', flat ?? 'none')
    shadowClip.style.clipPath = paperUnder(under, portrait ? 'single' : forward ? 'right' : 'left', block)
  }

  return {
    start() {
      if (!raf) raf = requestAnimationFrame(frame)
    },
    stop() {
      cancelAnimationFrame(raf)
      raf = 0
      shadowClip.style.removeProperty('clip-path')
      release()
    },
  }
}

/**
 * The outline of the page below on a layer covering `block`, as a clip-path
 * inset() with the paper's rounded corners (as in Book.css).
 */
const CORNERS = { left: '14px 3px 3px 14px', right: '3px 14px 14px 3px', single: '6px 14px 14px 6px' }

function paperUnder(under, layout, block) {
  const b = block.getBoundingClientRect()
  const r = under.getBoundingClientRect()
  return `inset(${r.top - b.top}px ${b.right - r.right}px ${b.bottom - r.bottom}px ${r.left - b.left}px round ${CORNERS[layout]})`
}

/**
 * The part of a w×h page not inside `uncovered` (the page below's clip-path,
 * a polygon of page corners plus the two points where the fold crosses the
 * page's edges), as a CSS polygon, or null if it can't be worked out.
 */
function flatPart(uncovered, w, h) {
  const near = (a, b) => Math.abs(a - b) < EPS
  // (PageFlip closes the polygon by repeating its first point)
  const pts = [...(uncovered || '').matchAll(/(-?[\d.e+-]+)px\s+(-?[\d.e+-]+)px/g)]
    .map((m) => [+m[1], +m[2]])
    .filter((p, i, all) => all.findIndex((q) => near(q[0], p[0]) && near(q[1], p[1])) === i)
  if (pts.length < 3) return null
  const isCorner = ([x, y]) => (near(x, 0) || near(x, w)) && (near(y, 0) || near(y, h))
  const fold = pts.filter((p) => !isCorner(p))
  if (fold.length !== 2) return null

  // keep the side of the fold line away from the uncovered area
  const [[x1, y1], [x2, y2]] = fold
  const side = ([x, y]) => (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length
  const away = -Math.sign(side([cx, cy])) || 1
  const keep = (p) => side(p) * away >= 0
  const cross = (a, b) => {
    const t = side(a) / (side(a) - side(b))
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  }

  // clip the page rectangle by that half-plane (Sutherland–Hodgman, one edge)
  const rect = [[0, 0], [w, 0], [w, h], [0, h]]
  const out = []
  rect.forEach((a, i) => {
    const b = rect[(i + 1) % rect.length]
    if (keep(a)) out.push(a)
    if (keep(a) !== keep(b)) out.push(cross(a, b))
  })
  if (out.length < 3) return 'polygon(0 0, 0 0, 0 0)'
  return `polygon(${out.map(([x, y]) => `${x.toFixed(2)}px ${y.toFixed(2)}px`).join(', ')})`
}
