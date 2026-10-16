import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useReducedMotion } from 'motion/react'
import { PageFlip } from 'page-flip'
import { attachPageInput } from './pageInput'
import { trackTurnLayers } from './turnLayers'
import { playFlip } from '../hooks/sound'
import './Book.css'

const FLIP_MS = 850 // a normal page turn
const RIFFLE_MS = 420 // each turn while jumping several spreads at once
const RELEASE_MS = 380 // a let-go drag settling onto one pile or the other

/**
 * The sketchbook, powered by StPageFlip (https://github.com/Nodlik/StPageFlip):
 * realistic soft-page folding, corner peel on hover, drag/swipe to turn,
 * and a single-page layout on narrow screens.
 *
 * Each page's React content is rendered through a portal into its own <div>.
 * PageFlip owns those divs (it moves and clips them while turning), React only
 * owns what's inside, so both can work without stepping on each other.
 *
 * Every sheet has its own fixed place in the piles on either side of the
 * spine: the fewer sheets under it, the further down and out it lies. That
 * holds for the visible pages too (PageFlip lays them out, a CSS `translate`
 * puts each one at its place), so turning never moves the piles: lifting a
 * page uncovers the next one where it always lay, and the turning sheet
 * travels from the top of one pile to the top of the other.
 *
 * pages: [{ id, section, render(side) }]
 * page:  index of the page that should be visible (the left one in spread mode)
 */
export default function Book({ pages, page, single, onNavigate, children }) {
  const areaRef = useRef(null)
  const [size, setSize] = useState(null)
  const [hosts] = useState(() =>
    pages.map((_, i) => {
      const el = document.createElement('div')
      el.className = `pf-page pf-page--${i}`
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
  const lastSpread = single ? pages.length - 1 : Math.ceil(pages.length / 2) - 1
  const rings = single ? 11 : 10

  // Where sheets lie. `depth` is how far a sheet is from the top of a full
  // pile; deeper sheets lie lower and further out (dir: -1 left, 1 right).
  const STEP = single ? { x: 1.9, y: 2.7 } : { x: 3.5, y: 4.5 }
  const mid = lastSpread / 2
  const placeAt = (depth, dir) => ({ x: dir * (depth - mid) * STEP.x, y: (depth - mid) * STEP.y })
  // page i: right pages count down from the first spread, left pages up to the last
  const placeOf = (i) =>
    single ? placeAt(i, 1) : i % 2 ? placeAt((i - 1) / 2, 1) : placeAt(lastSpread - i / 2, -1)
  const [placeRules] = useState(() =>
    hosts
      .map((_, i) => {
        const { x, y } = placeOf(i)
        return `.pf-host .pf-page--${i}{translate:${x}px ${y}px}`
      })
      .join('\n'),
  )

  // The spread each pile is drawn for. A turn takes the page off its pile right
  // away and only adds it to the other pile once it lands. (A single page
  // swings back around the spiral, so it only has a pile on the right.)
  const [stacks, setStacks] = useState(() => ({ left: spreadOf(page), right: spreadOf(page) }))

  // The turning sheet is two PageFlip pages (its front and back), each placed
  // on its own pile. From the moment it's touched (even a corner lifted by
  // hovering) both are drawn together, along with PageFlip's shadows, and as
  // it turns they move from the front's place to the back's, driven by --turn
  // (0 → 1) on the page area. A single page's flap is a copy of the page
  // itself, so there only the shadows need moving to its place.
  const turning = useRef(null)
  const setTurn = (t, ms = 0) => {
    const el = areaRef.current
    if (!el) return
    el.style.transition = ms ? `--turn ${ms}ms ease-in-out` : 'none'
    el.style.setProperty('--turn', t)
  }
  const beginTurn = (dir) => {
    const s = spreadOf(current.current)
    const sheet = single ? [dir > 0 ? s : s - 1] : dir > 0 ? [2 * s + 1, 2 * s + 2] : [2 * s, 2 * s - 1]
    if (sheet.some((i) => !hosts[i])) return
    // already following this sheet (say a hovered corner that's now being turned)
    if (turning.current?.join() === sheet.join()) return
    endTurn()
    const from = placeOf(sheet[0])
    const to = placeOf(sheet[sheet.length - 1])
    const el = areaRef.current
    el.style.setProperty('--turn-x0', `${from.x}px`)
    el.style.setProperty('--turn-y0', `${from.y}px`)
    el.style.setProperty('--turn-x1', `${to.x}px`)
    el.style.setProperty('--turn-y1', `${to.y}px`)
    setTurn(0)
    getComputedStyle(el).getPropertyValue('--turn') // commit 0, so the next change animates
    el.classList.add('is-turning')
    if (!single) sheet.forEach((i) => hosts[i].classList.add('is-turning'))
    turning.current = sheet
  }
  const endTurn = () => {
    turning.current?.forEach((i) => hosts[i].classList.remove('is-turning'))
    turning.current = null
    areaRef.current?.classList.remove('is-turning')
    setTurn(0)
  }

  // The spiral follows the visible spread (its pages shift sideways a little
  // as the piles change), sliding along with a turning sheet.
  const placeRings = (s) => {
    ringHost.style.translate = `calc(${placeAt(s, 1).x}px + (var(--turn-x1, 0px) - var(--turn-x0, 0px)) * var(--turn, 0)) 0`
  }

  const lift = (dir) => {
    if (single && dir < 0) return
    beginTurn(dir)
    setStacks((s) => (dir > 0 ? { ...s, right: s.right + 1 } : { ...s, left: s.left - 1 }))
    // a single page is gone once lifted: the spiral moves to the one under it
    if (single) placeRings(spreadOf(current.current) + 1)
  }
  const settle = () => {
    endTurn()
    const at = spreadOf(current.current)
    placeRings(at)
    setStacks((s) => (s.left === at && s.right === at ? s : { left: at, right: at }))
  }

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
      settle()
      return
    }
    const settings = book.getSettings()
    settings.flippingTime = Math.abs(to - from) > 1 ? RIFFLE_MS : FLIP_MS
    // `disableFlipByClick` stops stray clicks on a page from turning it, but in
    // single-page mode it also blocks PageFlip's own flipPrev(), so lift it briefly.
    settings.disableFlipByClick = false
    lift(to > from ? 1 : -1)
    if (to > from) book.flipNext('bottom')
    else book.flipPrev('bottom')
    settings.disableFlipByClick = true
    setTurn(1, settings.flippingTime)
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
    const layers = trackTurnLayers(book)
    book.on('changeState', (e) => {
      if (e.data === 'flipping') playFlip()
      if (e.data === 'read') layers.stop()
      else {
        layers.start()
        // PageFlip has picked which way the page goes by now (0 = forward)
        beginTurn(book.getRender().direction === 0 ? 1 : -1)
      }
      if (e.data === 'read') {
        // also undoes the lift of a drag the reader let go of halfway
        settle()
        setTimeout(step, 0)
      }
    })

    book.loadFromHTML(hosts)
    book.getUI().getDistElement().appendChild(ringHost)
    placeRings(spreadOf(current.current))
    bookRef.current = book

    inputRef.current = attachPageInput(book, host, {
      spread: () => spreadOf(current.current),
      lastSpread: () => lastSpread,
      lift,
      settle,
      drag: (t) => turning.current && setTurn(t),
      release: (done) => turning.current && setTurn(done ? 1 : 0, RELEASE_MS),
      turn: (dir) => {
        const s = Math.max(0, Math.min(lastSpread, spreadOf(target.current) + dir))
        navRef.current(single ? s : s * 2)
      },
    })

    return () => {
      layers.stop()
      endTurn()
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
      <div className="book__cover" aria-hidden="true">
        <div className="book__spine" />
        {['tl', 'tr', 'bl', 'br'].map((at) => (
          <CoverCorner key={at} at={at} />
        ))}
      </div>
      <div className="book__ribbon" aria-hidden="true" />
      <style>{placeRules}</style>
      {!single && (
        <Stack
          side="left"
          sheets={Array.from({ length: lastSpread }, (_, m) => ({
            depth: lastSpread - m,
            on: m < stacks.left,
          }))}
          placeAt={placeAt}
        />
      )}
      <Stack
        side="right"
        sheets={Array.from({ length: lastSpread }, (_, j) => ({ depth: j + 1, on: j + 1 > stacks.right }))}
        placeAt={placeAt}
      />
      {!single && <div className="book__gutter" aria-hidden="true" />}

      <div ref={areaRef} className="book__pages" />
      {createPortal(<Spiral rings={rings} />, ringHost)}

      {hosts.map((el, i) =>
        createPortal(
          <PageFrame side={sideOf(i)} number={i + 1} holes={rings} holesY={-placeOf(i).y}>
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

export function PageFrame({ side, number, holes, holesY = 0, children }) {
  return (
    <div className={`page page--${side}`} style={holes ? { '--rings': holes } : undefined}>
      {holes > 0 && (
        // the spiral doesn't follow the pages up and down, so neither do the holes
        <div className="page__holes" style={{ translate: `0 ${holesY}px` }} aria-hidden="true">
          {Array.from({ length: holes }, (_, i) => (
            <span key={i} className="page__hole" style={{ '--i': i }} />
          ))}
        </div>
      )}
      <div className="page__content">{children}</div>
      {number && <span className="page__num hand">~ {number} ~</span>}
    </div>
  )
}

/**
 * The sheets piled under one side's visible page, each lying still at its own
 * place; a sheet only shows while it's in the pile and not the visible page.
 */
function Stack({ side, sheets, placeAt }) {
  const dir = side === 'left' ? -1 : 1
  return (
    <div className={`stack stack--${side}`} aria-hidden="true">
      {sheets.map(({ depth, on }) => {
        const { x, y } = placeAt(depth, dir)
        return (
          <div
            key={depth}
            className="stack__sheet"
            style={{
              zIndex: 100 - depth,
              translate: `${x}px ${y}px`,
              // sheets further down the pile sit in a little more shadow
              backgroundColor: `color-mix(in srgb, var(--sheet), var(--ink) ${depth * 3}%)`,
              visibility: on ? 'visible' : 'hidden',
            }}
          />
        )
      })}
    </div>
  )
}

// A brass corner guard riveted onto the leather cover (drawn for the top
// left corner, mirrored by CSS for the others).
function CoverCorner({ at }) {
  return (
    <svg className={`book__corner book__corner--${at}`} viewBox="0 0 60 60">
      <path d="M3 10 Q3 3 10 3 H56 L44 15 H22 Q15 15 15 22 V44 L3 56 Z" fill="var(--gold)" />
      <path d="M41 13.2 H22 Q13.2 13.2 13.2 22 V41" fill="none" stroke="var(--gold-dark)" strokeWidth="3" />
      <path d="M6.5 42 V11 Q6.5 6.5 11 6.5 H42" fill="none" stroke="var(--gold-light)" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 10 Q3 3 10 3 H56 L44 15 H22 Q15 15 15 22 V44 L3 56 Z" fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" />
      {[[9, 9, 3.3], [33, 9, 2.6], [9, 33, 2.6]].map(([x, y, r]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={r} fill="var(--gold-light)" stroke="var(--ink)" strokeWidth="1.5" />
          <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.32} fill="#fff" opacity="0.9" />
        </g>
      ))}
    </svg>
  )
}

function Spiral({ rings }) {
  return (
    <div className="spiral" aria-hidden="true">
      {Array.from({ length: rings }, (_, i) => (
        <svg key={i} className="spiral__ring" viewBox="0 0 48 20" overflow="visible">
          <circle cx="8" cy="12" r="3.3" fill="var(--ink)" opacity="0.75" />
          <circle cx="40" cy="12" r="3.3" fill="var(--ink)" opacity="0.75" />
          <path d="M8 12 C8 0 40 0 40 12" fill="none" stroke="var(--ink)" strokeWidth="8.5" strokeLinecap="round" />
          <path d="M8 12 C8 0 40 0 40 12" fill="none" stroke="#f6eadb" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      ))}
    </div>
  )
}
