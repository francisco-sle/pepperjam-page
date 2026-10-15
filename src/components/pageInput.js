// Pointer handling for the sketchbook.
//
// PageFlip's built-in mouse handling treats plain hovering near a corner as a
// fold that follows the cursor, and any press on a page as the start of a drag,
// which makes clicking things inside pages unreliable. So it runs with
// `useMouseEvents: false` and this module feeds it only deliberate gestures:
//
//  - Mouse: the outer edge of a page is a "grab" zone (custom hand cursor).
//    Hovering its corner lifts the corner a little (fixed, it doesn't follow the
//    cursor), clicking the corner turns the page, pressing + dragging folds the
//    page under the cursor. A press only becomes a drag once the pointer moves,
//    so clicks (on buttons, photos or anywhere else) are just clicks.
//  - Touch / pen: a horizontal swipe anywhere turns the page; starting at the
//    outer edge drags the fold under the finger. Vertical swipes still scroll.

const INTERACTIVE = 'a, button, input, select, textarea, label, [role="button"], [data-no-flip]'
const DRAG_START = 8 // px before a press becomes a drag
const SWIPE = 50 // px for a touch swipe to turn the page
const FLICK = 0.5 // px/ms for a quick flick to finish the turn

/**
 * @param {import('page-flip').PageFlip} book
 * @param {HTMLElement} host   element PageFlip was mounted on
 * @param {object} o
 * @param {() => number} o.spread        current spread index
 * @param {() => number} o.lastSpread    last spread index
 * @param {(dir: 1|-1) => void} o.turn   navigate one spread forward/back
 */
export function attachPageInput(book, host, o) {
  const fc = book.getFlipController()
  const block = () => book.getUI().getDistElement()
  const rect = () => book.getRender().getRect() // { left, top, width, height, pageWidth }
  const portrait = () => book.getOrientation() === 'portrait'
  const local = (e) => {
    const r = block().getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  // Visible page area in PageFlip coordinates (portrait shows only the right half).
  const area = () => {
    const r = rect()
    return { x0: portrait() ? r.left + r.pageWidth : r.left, x1: r.left + 2 * r.pageWidth, y0: r.top, y1: r.top + r.height, W: r.pageWidth }
  }

  const canTurn = (dir) => (dir > 0 ? o.spread() < o.lastSpread() : o.spread() > 0)

  // Which way the page under `p` would turn, if it can be grabbed there.
  const zoneAt = (p, touch) => {
    const a = area()
    if (p.x < a.x0 || p.x > a.x1 || p.y < a.y0 || p.y > a.y1) return 0
    const band = touch ? (portrait() ? a.W / 2 : a.W) : Math.min(140, Math.max(60, a.W * 0.22))
    if (p.x > a.x1 - band && canTurn(1)) return 1
    if (p.x < a.x0 + band && canTurn(-1)) return -1
    return 0
  }

  // Outer page corner under `p` (mouse only), as the point PageFlip should fold from.
  const cornerAt = (p, dir) => {
    if (!dir) return null
    const a = area()
    const c = Math.min(90, a.W * 0.2)
    const x = dir > 0 ? a.x1 : a.x0
    if (Math.abs(p.x - x) > c) return null
    if (p.y > a.y1 - c) return { key: `${dir}b`, dir, x: x - dir, y: a.y1 - 1 }
    if (p.y < a.y0 + c) return { key: `${dir}t`, dir, x: x - dir, y: a.y0 + 1 }
    return null
  }

  // ---------- hover: cursor + corner lift ----------

  let peeled = null
  let settling = 0 // timestamp until which an un-peel animation is still running

  const setCursor = (mode) => {
    if (mode) host.dataset.grab = mode
    else delete host.dataset.grab
  }

  const peel = (corner) => {
    if (peeled?.key === corner.key) return
    if (peeled) return unpeel()
    // portrait can't lift the left (back) corner, PageFlip has no page there
    if (portrait() && corner.dir < 0) return
    if (book.getState() !== 'read' || performance.now() < settling) return
    fc.showCorner({ x: corner.x, y: corner.y })
    peeled = corner
  }

  const unpeel = () => {
    if (!peeled) return
    peeled = null
    if (book.getState() === 'fold_corner') {
      const r = rect()
      // a point away from every corner tells PageFlip to drop the corner back
      fc.showCorner({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
      settling = performance.now() + 450
    }
  }

  // ---------- press / drag ----------

  let drag = null
  let suppressClick = false

  const onDown = (e) => {
    if (e.button !== 0 || drag) return
    const state = book.getState()
    if (state === 'flipping' || state === 'user_fold') return
    const touch = e.pointerType !== 'mouse'
    const p = local(e)
    const dir = zoneAt(p, touch)
    if (!dir) return
    // Presses on buttons/photos still become clicks unless the pointer
    // actually moves, so a drag can start anywhere in the edge zone.
    const interactive = !!e.target.closest(INTERACTIVE)
    drag = {
      id: e.pointerId,
      dir,
      touch,
      start: p,
      edge: touch ? zoneAt(p, false) === dir : true,
      corner: touch || interactive ? null : cornerAt(p, dir),
      started: false,
      trail: [[performance.now(), e.clientX]],
      sx: e.clientX,
      sy: e.clientY,
    }
  }

  const onMove = (e) => {
    if (!drag) {
      if (e.pointerType !== 'mouse') return
      if (book.getState() === 'flipping') return setCursor(null)
      const p = local(e)
      const dir = e.target.closest(INTERACTIVE) ? 0 : zoneAt(p, false)
      setCursor(dir ? 'grab' : null)
      const corner = cornerAt(p, dir)
      if (corner) peel(corner)
      else unpeel()
      return
    }
    if (e.pointerId !== drag.id) return
    const dx = e.clientX - drag.sx
    const dy = e.clientY - drag.sy

    if (!drag.started) {
      if (Math.hypot(dx, dy) < DRAG_START) return
      if (drag.touch && Math.abs(dy) > Math.abs(dx)) {
        drag = null // vertical: let the page scroll
        return
      }
      if (Math.sign(dx) !== -drag.dir) return // pulling the wrong way
      drag.started = true
      host.setPointerCapture?.(e.pointerId)
      document.documentElement.classList.add('pj-grabbing')
      if (drag.edge) {
        book.startUserTouch(drag.start)
      }
    }

    drag.trail.push([performance.now(), e.clientX])
    if (drag.trail.length > 6) drag.trail.shift()
    if (drag.edge) book.userMove(local(e), false)
  }

  const end = (e, cancelled = false) => {
    const d = drag
    drag = null
    if (!d || (e && e.pointerId !== d.id)) return
    document.documentElement.classList.remove('pj-grabbing')

    if (!d.started) {
      // a plain click on a lifted corner turns the page
      if (!cancelled && d.corner) {
        unpeel()
        o.turn(d.dir)
      }
      return
    }

    suppressClick = true
    setTimeout(() => (suppressClick = false), 0)

    const dx = e ? e.clientX - d.sx : 0
    if (!d.edge) {
      // touch swipe
      if (!cancelled && Math.abs(dx) > SWIPE) o.turn(d.dir)
      return
    }

    const [t0, x0] = d.trail[0]
    const v = e ? (e.clientX - x0) / Math.max(1, performance.now() - t0) : 0
    const flick = v * d.dir < -FLICK
    // PageFlip only finishes a turn once the fold crosses the spine. A single
    // page has no spine in view, so pulling it a third of the way is enough.
    const farEnough = portrait() && -dx * d.dir > rect().pageWidth / 3
    if (!cancelled && (flick || farEnough) && book.getState() === 'user_fold') {
      // carry the fold past the spine so PageFlip finishes the turn
      const r = rect()
      const spine = r.left + r.pageWidth
      book.userMove({ x: spine - d.dir * r.pageWidth * 0.25, y: d.start.y }, false)
    }
    book.userStop(e ? local(e) : d.start)
    peeled = null
  }

  const onUp = (e) => end(e)
  const onCancel = (e) => end(e, true)
  const onLeave = (e) => {
    if (e.pointerType !== 'mouse' || drag) return
    setCursor(null)
    unpeel()
  }
  const onClick = (e) => {
    if (suppressClick) {
      e.stopPropagation()
      e.preventDefault()
    }
  }

  host.addEventListener('pointerdown', onDown)
  host.addEventListener('pointermove', onMove)
  host.addEventListener('pointerup', onUp)
  host.addEventListener('pointercancel', onCancel)
  host.addEventListener('pointerleave', onLeave)
  host.addEventListener('click', onClick, true)

  return {
    /** drop a lifted corner (e.g. before a programmatic turn) */
    unpeel,
    destroy() {
      host.removeEventListener('pointerdown', onDown)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerup', onUp)
      host.removeEventListener('pointercancel', onCancel)
      host.removeEventListener('pointerleave', onLeave)
      host.removeEventListener('click', onClick, true)
      document.documentElement.classList.remove('pj-grabbing')
      delete host.dataset.grab
    },
  }
}
