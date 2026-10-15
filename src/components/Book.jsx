import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useReducedMotion } from 'motion/react'
import { PageFlip } from 'page-flip'
import { attachPageInput } from './pageInput'
import { playFlip } from '../hooks/sound'
import './Book.css'

const FLIP_MS = 850 // a normal page turn
const RIFFLE_MS = 420 // each turn while jumping several spreads at once

/**
 * The sketchbook, powered by StPageFlip (https://github.com/Nodlik/StPageFlip):
 * realistic soft-page folding, corner peel on hover, drag/swipe to turn,
 * and a single-page layout on narrow screens.
 *
 * Each page's React content is rendered through a portal into its own <div>.
 * PageFlip owns those divs (it moves and clips them while turning), React only
 * owns what's inside, so both can work without stepping on each other.
 *
 * pages: [{ id, section, render(side) }]
 * page:  index of the page that should be visible (the left one in spread mode)
 */
export default function Book({ pages, page, single, onNavigate, children }) {
  const areaRef = useRef(null)
  const [size, setSize] = useState(null)
  const [hosts] = useState(() =>
    pages.map(() => {
      const el = document.createElement('div')
      el.className = 'pf-page'
      return el
    }),
  )
  // The spiral lives inside PageFlip's own layer, between the resting pages
  // (z 2–4) and the turning page (z 6), so a lifted page passes over the rings.
  const [ringHost] = useState(() => {
    const el = document.createElement('div')
    el.className = 'pf-rings'
    return el
  })
  const bookRef = useRef(null)
  const inputRef = useRef(null)
  const current = useRef(page) // page the book is showing
  const target = useRef(page) // page we were asked to show
  const navRef = useRef(onNavigate)
  navRef.current = onNavigate
  const reduce = useReducedMotion()
  const reduceRef = useRef(reduce)
  reduceRef.current = reduce

  const spreadOf = (p) => (single ? p : Math.floor(p / 2))

  // Measure the page area (debounced, PageFlip is rebuilt when it changes).
  useLayoutEffect(() => {
    const el = areaRef.current
    let timer
    const measure = () => {
      const w = Math.floor(single ? el.clientWidth : el.clientWidth / 2)
      const h = Math.floor(el.clientHeight)
      setSize((s) => (s && s.w === w && s.h === h ? s : { w, h }))
    }
    measure()
    const ro = new ResizeObserver(() => {
      clearTimeout(timer)
      timer = setTimeout(measure, 120)
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      clearTimeout(timer)
    }
  }, [single])

  // Walk towards `target` one spread at a time, so long jumps riffle through the pages.
  const step = () => {
    const book = bookRef.current
    if (!book) return
    // a corner lifted by hovering shouldn't block tabs / arrows / keys
    if (book.getState() === 'fold_corner') inputRef.current?.unpeel()
    if (book.getState() !== 'read') return
    const from = spreadOf(current.current)
    const to = spreadOf(target.current)
    if (from === to) return
    if (reduceRef.current) {
      book.turnToPage(target.current)
      current.current = target.current
      return
    }
    const settings = book.getSettings()
    settings.flippingTime = Math.abs(to - from) > 1 ? RIFFLE_MS : FLIP_MS
    // `disableFlipByClick` stops stray clicks on a page from turning it, but in
    // single-page mode it also blocks PageFlip's own flipPrev(), so lift it briefly.
    settings.disableFlipByClick = false
    if (to > from) book.flipNext('bottom')
    else book.flipPrev('bottom')
    settings.disableFlipByClick = true
  }

  // Build PageFlip for the current size.
  useEffect(() => {
    if (!size || !size.w || !size.h) return
    const host = document.createElement('div')
    host.className = 'pf-host'
    areaRef.current.prepend(host)

    const book = new PageFlip(host, {
      width: size.w,
      height: size.h,
      size: 'fixed',
      autoSize: false,
      usePortrait: true,
      showCover: false,
      startPage: current.current,
      flippingTime: FLIP_MS,
      drawShadow: true,
      maxShadowOpacity: 0.4,
      showPageCorners: false,
      disableFlipByClick: true,
      mobileScrollSupport: true,
      swipeDistance: 30,
      clickEventForward: true,
      // pointer input is handled by pageInput.js (see why there)
      useMouseEvents: false,
      startZIndex: 1,
    })

    book.on('flip', (e) => {
      const before = current.current
      current.current = e.data
      // A turn the reader made by hand (drag, swipe, corner): tell the app.
      const towardsTarget =
        Math.abs(spreadOf(target.current) - spreadOf(e.data)) < Math.abs(spreadOf(target.current) - spreadOf(before))
      if (!towardsTarget) {
        target.current = e.data
        navRef.current(e.data)
      }
    })
    book.on('changeState', (e) => {
      if (e.data === 'flipping') playFlip()
      if (e.data === 'read') setTimeout(step, 0)
    })

    book.loadFromHTML(hosts)
    book.getUI().getDistElement().appendChild(ringHost)
    bookRef.current = book

    const lastSpread = single ? pages.length - 1 : Math.ceil(pages.length / 2) - 1
    inputRef.current = attachPageInput(book, host, {
      spread: () => spreadOf(current.current),
      lastSpread: () => lastSpread,
      turn: (dir) => {
        const s = Math.max(0, Math.min(lastSpread, spreadOf(target.current) + dir))
        navRef.current(single ? s : s * 2)
      },
    })

    return () => {
      inputRef.current?.destroy()
      inputRef.current = null
      bookRef.current = null
      ringHost.remove()
      book.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, hosts])

  // Page requested from outside (tabs, pager, keys).
  useEffect(() => {
    target.current = page
    step()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const sideOf = (i) => (single ? 'single' : i % 2 === 0 ? 'left' : 'right')

  return (
    <div className={`book ${single ? 'book--single' : 'book--spread'}`}>
      <div className="book__cover" aria-hidden="true" />
      <div className="book__ribbon" aria-hidden="true" />
      <div className="book__stack" aria-hidden="true" />

      <div ref={areaRef} className="book__pages" />
      {createPortal(<Spiral single={single} />, ringHost)}

      {hosts.map((el, i) =>
        createPortal(
          <PageFrame side={sideOf(i)} number={i + 1}>
            {pages[i].render(sideOf(i))}
          </PageFrame>,
          el,
          pages[i].id,
        ),
      )}

      {children}
      <span className="sr-only" aria-live="polite">
        {`Page ${page + 1}${single ? '' : `–${Math.min(page + 2, pages.length)}`} of ${pages.length}`}
      </span>
    </div>
  )
}

export function PageFrame({ side, number, children }) {
  return (
    <div className={`page page--${side}`}>
      <div className="page__content">{children}</div>
      {number && <span className="page__num hand">~ {number} ~</span>}
    </div>
  )
}

function Spiral({ single }) {
  const rings = single ? 11 : 10
  return (
    <div className="spiral" aria-hidden="true">
      {Array.from({ length: rings }, (_, i) => (
        <svg key={i} className="spiral__ring" viewBox="0 0 48 20">
          <circle cx="8" cy="12" r="3.6" fill="var(--ink)" opacity="0.45" />
          <circle cx="40" cy="12" r="3.6" fill="var(--ink)" opacity="0.45" />
          <path d="M8 12 C8 0 40 0 40 12" fill="none" stroke="var(--ink)" strokeWidth="6.5" strokeLinecap="round" />
          <path d="M8 12 C8 0 40 0 40 12" fill="none" stroke="#f6eadb" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ))}
    </div>
  )
}
