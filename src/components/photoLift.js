// Geometry for lifting a photo off a scrapbook page and into the lightbox.
//
// A photo on the page is rotated (and, while hovered, scaled and nudged up),
// so its bounding box isn't its real size. This reads the element's own
// transform to get back its true centre, size and angle on screen.

/** Where a gallery photo sits on screen right now, or null if it isn't shown. */
export function measurePhoto(el) {
  const r = el.getBoundingClientRect()
  if (!r.width || !r.height) return null
  const style = getComputedStyle(el)
  const m = style.transform === 'none' ? new DOMMatrix() : new DOMMatrix(style.transform)
  const angle = Math.atan2(m.b, m.a)
  const own = Math.hypot(m.a, m.b)
  const w = el.offsetWidth
  const h = el.offsetHeight
  // whatever the page around it is scaled by
  const outer = r.width / (own * (w * Math.abs(Math.cos(angle)) + h * Math.abs(Math.sin(angle))))
  const scale = own * outer
  const caption = el.querySelector('.polaroid__caption')
  return {
    cx: r.left + r.width / 2,
    cy: r.top + r.height / 2,
    w: w * scale,
    h: h * scale,
    rotate: (angle * 180) / Math.PI,
    fontSize: parseFloat(style.fontSize) * scale,
    radius: parseFloat(style.borderTopLeftRadius) * scale,
    captionH: (caption?.offsetHeight ?? 0) * scale,
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

/** The lightbox frame's box (it never rotates). */
export function measureFrame(el) {
  const r = el.getBoundingClientRect()
  return {
    cx: r.left + r.width / 2,
    cy: r.top + r.height / 2,
    w: r.width,
    h: r.height,
    radius: parseFloat(getComputedStyle(el).borderTopLeftRadius),
  }
}
