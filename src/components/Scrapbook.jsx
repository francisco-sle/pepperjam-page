import { useLayoutEffect, useRef, useState } from 'react'
import './Scrapbook.css'

// Bits of a scrapbook page: torn paper scraps and the things that hold
// photos down (tape, photo corners, a pin, a paper clip).
//
// Everything here is drawn with plain CSS / SVG (no CSS filters), so it can
// live inside the pages while they turn.

// Small seeded random, so a scrap tears the same way on every render.
function random(seed) {
  let s = seed * 9301 + 49297
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

/**
 * Outline of a w × h rectangle with ragged, torn edges on the given sides
 * ('top', 'right', 'bottom', 'left'), as [x, y] points in px.
 * `depth` is how far the tear bites in.
 */
function tornOutline(sides, seed, w, h, depth = 6) {
  const rnd = random(seed)
  const pts = []
  const edge = (side, from, to, len) => {
    const steps = Math.max(4, Math.round(len / 11))
    for (let i = 0; i < steps; i++) {
      const t = from + ((to - from) * i) / steps
      const d = sides.includes(side) ? (0.25 + rnd() * 0.75) * depth : 0
      if (side === 'top') pts.push([t, d])
      if (side === 'right') pts.push([w - d, t])
      if (side === 'bottom') pts.push([t, h - d])
      if (side === 'left') pts.push([d, t])
    }
  }
  edge('top', 0, w, w)
  edge('right', 0, h, h)
  edge('bottom', w, 0, w)
  edge('left', h, 0, h)
  return pts
}

/**
 * A scrap of paper: lined notebook paper, grid paper, a sticky note or plain
 * paper, outlined in ink like everything else in the book. Torn sides get a
 * ragged edge (cut with clip-path, then traced by an SVG outline, so the
 * scrap measures itself). A scrap with no torn sides is a plain card.
 * `label` sits on the top edge, outside the paper, so the tear doesn't cut it.
 */
export function Scrap({ kind = 'lined', torn = ['top'], seed = 1, label, className = '', style, children }) {
  const paperRef = useRef(null)
  const [size, setSize] = useState(null)
  const ragged = torn.length > 0

  useLayoutEffect(() => {
    if (!ragged) return
    const el = paperRef.current
    const measure = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      setSize((s) => (s && s.w === w && s.h === h ? s : { w, h }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ragged])

  const pts = ragged && size?.w ? tornOutline(torn, seed, size.w, size.h) : null
  const clipPath = pts ? `polygon(${pts.map(([x, y]) => `${x}px ${y}px`).join(',')})` : undefined

  return (
    <div className={`scrap scrap--${kind} ${ragged ? 'scrap--torn' : ''} ${className}`} style={style}>
      <div className="scrap__shadow" style={{ clipPath }} aria-hidden="true" />
      <div ref={paperRef} className="scrap__paper" style={{ clipPath }}>
        {children}
      </div>
      {pts && (
        <svg className="scrap__outline" width={size.w} height={size.h} aria-hidden="true">
          <polygon points={pts.map((p) => p.join(',')).join(' ')} />
        </svg>
      )}
      {label}
    </div>
  )
}

const CLIP = 'M15 18 V44 A5 5 0 0 1 5 44 V10 A7 7 0 0 1 19 10 V40 A2 2 0 0 1 15 40'

/**
 * What holds a photo to the page.
 * kind: 'tape' | 'corners' | 'pin' | 'clip'
 */
export function Mount({ kind = 'tape', color = 'var(--peach)' }) {
  if (kind === 'tape') return <span className="tape" style={{ '--tape': color }} aria-hidden="true" />
  if (kind === 'corners') {
    return (
      <span className="photo-corners" style={{ '--corner': color }} aria-hidden="true">
        {['tl', 'tr', 'br', 'bl'].map((c) => (
          <svg key={c} className={`photo-corner photo-corner--${c}`} viewBox="0 0 24 24">
            <path d="M2 2 H22 L2 22Z" />
          </svg>
        ))}
      </span>
    )
  }
  if (kind === 'pin') {
    return (
      <svg className="push-pin" viewBox="0 0 32 40" style={{ '--pin': color }} aria-hidden="true">
        <path className="push-pin__needle" d="M16 22 L17 36" />
        <ellipse className="push-pin__base" cx="16" cy="21" rx="11" ry="4" />
        <path className="push-pin__head" d="M9 21 C9 14 11 12 12 6 H20 C21 12 23 14 23 21Z" />
        <ellipse className="push-pin__top" cx="16" cy="6" rx="7" ry="3.2" />
      </svg>
    )
  }
  return (
    <svg className="paper-clip" viewBox="0 0 22 56" aria-hidden="true">
      <path className="paper-clip__ink" d={CLIP} />
      <path className="paper-clip__wire" d={CLIP} />
    </svg>
  )
}
