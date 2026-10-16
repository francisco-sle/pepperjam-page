// Geometry for lifting a photo off a scrapbook page and into the lightbox.
//
// The photo and the lightbox frame are different shapes, so the transition
// lines them up on their *subject*: the doodle on a placeholder, otherwise
// the picture itself. Each measurement says where that subject sits (from
// the box's top-left corner) and how big it is.

const doodleOf = (el) => el.querySelector('.artwork__doodle')

/** Where a gallery photo sits on screen right now, or null if it isn't shown. */
export function measurePhoto(el) {
  const r = el.getBoundingClientRect()
  if (!r.width || !r.height) return null
  // A photo on the page is rotated (and, while hovered, scaled and nudged up),
  // so its bounding box isn't its real size: read its own transform instead.
  const style = getComputedStyle(el)
  const m = style.transform === 'none' ? new DOMMatrix() : new DOMMatrix(style.transform)
  const angle = Math.atan2(m.b, m.a)
  const own = Math.hypot(m.a, m.b)
  const w = el.offsetWidth
  const h = el.offsetHeight
  // whatever the page around it is scaled by
  const outer = r.width / (own * (w * Math.abs(Math.cos(angle)) + h * Math.abs(Math.sin(angle))))
  const scale = own * outer
  // Layout values only: the doodle has its own hover wiggle, which mustn't
  // count. It sits in the middle of the picture (there's no label on the page).
  const art = el.querySelector('.artwork')
  const doodle = doodleOf(el)
  return {
    cx: r.left + r.width / 2,
    cy: r.top + r.height / 2,
    w: w * scale,
    h: h * scale,
    rotate: (angle * 180) / Math.PI,
    fontSize: parseFloat(style.fontSize) * scale,
    subject: {
      x: (el.clientLeft + art.offsetLeft + art.offsetWidth / 2) * scale,
      y: (el.clientTop + art.offsetTop + art.offsetHeight / 2) * scale,
      w: (doodle ? parseFloat(getComputedStyle(doodle).width) : art.offsetWidth) * scale,
    },
    mount: el.dataset.mount,
  }
}

/** The photo for gallery piece `index` on the open spread, if it's showing. */
export function findPhoto(index) {
  const all = document.querySelectorAll(`[data-art-index="${index}"]`)
  for (const el of all) {
    const visible = el.checkVisibility ? el.checkVisibility({ visibilityProperty: true }) : el.getClientRects().length > 0
    if (!visible) continue
    const r = el.getBoundingClientRect()
    if (r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight) return el
  }
  return null
}

/** The lightbox frame (it never rotates). */
export function measureFrame(el) {
  const r = el.getBoundingClientRect()
  const s = (doodleOf(el) ?? el.querySelector('.artwork') ?? el).getBoundingClientRect()
  return {
    cx: r.left + r.width / 2,
    cy: r.top + r.height / 2,
    w: r.width,
    h: r.height,
    subject: { x: s.left + s.width / 2 - r.left, y: s.top + s.height / 2 - r.top, w: s.width },
  }
}
