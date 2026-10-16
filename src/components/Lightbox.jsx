import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform, useVelocity } from 'motion/react'
import { gallery } from '../content/gallery'
import { artAspect } from '../pages/Gallery'
import Artwork from './Artwork'
import Doodle from './Doodle'
import { findPhoto, measureFrame, measurePhoto } from './photoLift'
import { playPat, playPop } from '../hooks/sound'
import './Lightbox.css'

// A closer look at one artwork, styled like the item card in the main reference.
//
// Opening it from the gallery takes the photo off the page: it peels up from
// whatever holds it down, flies over and settles into the card's frame.
// Closing puts it back in its spot. `from` is where the photo was on screen
// when it was clicked (see photoLift.js); without it the card just pops up.
export default function Lightbox({ index, from, onClose, onChange, favorites, onToggleFavorite }) {
  const open = index != null
  const closeRef = useRef(null)
  const cardRef = useRef(null)
  const reduceMotion = useReducedMotion()
  // the photo in the air: { dir: 'in' | 'out', from, to, piece }
  const [flight, setFlight] = useState(null)
  const closeAfterLanding = useRef(false)

  // the print in the card (while flipping, the previous one is still on its
  // way out in there too)
  const frameEl = () => cardRef.current?.querySelector(`.lightbox__frame[data-piece="${gallery[index].id}"]`)

  // Before the first paint: hide the frame and put the photo where it was on the page.
  useLayoutEffect(() => {
    if (!open) return
    closeAfterLanding.current = false
    const frame = frameEl()
    if (from && frame && !reduceMotion) setFlight({ dir: 'in', from, to: measureFrame(frame), piece: gallery[index] })
    // only when it opens; flipping through pieces doesn't fly anything
  }, [open])

  // Put the photo back on the page, if its page is the one showing.
  const putBack = () => {
    const photo = reduceMotion ? null : findPhoto(index)
    const frame = frameEl()
    if (!photo || !frame) {
      setFlight(null)
      return onClose()
    }
    setFlight({ dir: 'out', from: measureFrame(frame), to: measurePhoto(photo), piece: gallery[index] })
  }

  const close = () => {
    if (flight?.dir === 'out') return
    // closed mid-flight: let it land first
    if (flight?.dir === 'in') closeAfterLanding.current = true
    else putBack()
  }

  const landed = () => {
    if (flight.dir === 'out') {
      setFlight(null)
      onClose()
    } else if (closeAfterLanding.current) {
      putBack()
    } else {
      setFlight(null)
    }
  }

  // Focus the close button on open, and hand focus back to the thumbnail on close.
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement
    closeRef.current?.focus()
    return () => opener?.focus?.()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') close()
      if (flight) return
      if (e.key === 'ArrowRight') onChange((index + 1) % gallery.length)
      if (e.key === 'ArrowLeft') onChange((index - 1 + gallery.length) % gallery.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const piece = open ? gallery[index] : null
  // the picture keeps the shape it has in the book (the card grows to fit)
  const aspect = useMemo(() => (open && artAspect(index)) || 4 / 3, [open, index])
  // counts openings, so each one starts with a fresh frame already the right
  // shape (only flipping between pieces animates it)
  const session = useRef(0)
  const wasOpen = useRef(false)
  if (open !== wasOpen.current) {
    if (open) session.current += 1
    wasOpen.current = open
  }
  const fav = piece && favorites.includes(piece.id)
  const go = (d) => {
    if (flight) return
    playPop(1.1)
    onChange((index + d + gallery.length) % gallery.length)
  }

  const leaving = flight?.dir === 'out'

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="lightbox"
            initial={{ opacity: 0 }}
            // pointer events come back explicitly: reopening while the last
            // close is still fading out reverses that exit, which would
            // otherwise leave the backdrop click-through
            animate={{ opacity: leaving ? 0 : 1, pointerEvents: 'auto' }}
            exit={{ opacity: 0, pointerEvents: 'none', transition: { duration: 0.2 } }}
            transition={{ duration: leaving ? 0.3 : 0.25 }}
            onClick={close}
          >
            <motion.div
              ref={cardRef}
              className="lightbox__card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="lightbox-title"
              // when the photo flies in, the card stays still so it has somewhere to land
              initial={from && !reduceMotion ? false : { scale: 0.85, y: 40, rotate: -3 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.92, y: 20, rotate: 2, opacity: 0, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="lightbox__ticket" aria-hidden="true" />
              <button ref={closeRef} className="lightbox__close" onClick={close} aria-label="Close">
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5 L15 15 M15 5 L5 15" /></svg>
              </button>

              <AnimatePresence mode="wait" initial={false}>
                <motion.h2
                  key={piece.id}
                  id="lightbox-title"
                  className="lightbox__title"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  {piece.title}
                </motion.h2>
              </AnimatePresence>

              <div className="lightbox__stage">
                <button className="chevron chevron--prev" onClick={() => go(-1)} aria-label="Previous artwork">
                  <Chevron />
                </button>
                <div
                  className="lightbox__viewport"
                  // the flying photo stands in for the frame until it lands
                  style={{ visibility: flight ? 'hidden' : undefined }}
                >
                  <Frame key={session.current} piece={piece} aspect={aspect} />
                </div>
                <button className="chevron chevron--next" onClick={() => go(1)} aria-label="Next artwork">
                  <Chevron />
                </button>
                <div className="lightbox__dots" aria-hidden="true">
                  {gallery.map((g, i) => (
                    <span key={g.id} className={i === index ? 'is-on' : ''} />
                  ))}
                </div>
              </div>

              <hr className="dash" />

              <div className="lightbox__info">
                <div className="lightbox__medal" aria-hidden="true">
                  <span className="badge">{piece.year}</span>
                  <Doodle kind={piece.doodle} size={44} />
                </div>
                <div className="lightbox__text">
                  <span className="lightbox__medium">{piece.medium}</span>
                  <p className="hand">{piece.note}</p>
                </div>
                <motion.button
                  className={`fav ${fav ? 'is-fav' : ''}`}
                  onClick={() => { playPop(fav ? 0.8 : 1.5); onToggleFavorite(piece.id) }}
                  aria-pressed={fav}
                  aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
                  whileTap={{ scale: 0.8 }}
                  animate={fav ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                >
                  <Doodle kind="heart" size={30} />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {open && flight && <Flyer key={flight.dir} flight={flight} onDone={landed} />}
    </>
  )
}

/**
 * The print in the card. Flipping to another piece shuffles prints like the
 * merch photos do: the old one tips away and fades as the new one tips in
 * and settles, each keeping its own shape. Underneath, an invisible stand-in
 * takes up the room the print needs and eases between shapes, so the card
 * grows and shrinks smoothly instead of jumping.
 */
function Frame({ piece, aspect }) {
  const shape = useMotionValue(aspect)
  useEffect(() => {
    const resize = animate(shape, aspect, { duration: 0.35, ease: [0.3, 0, 0.2, 1] })
    return () => resize.stop()
  }, [aspect])

  return (
    <div className="lightbox__prints">
      <motion.div className="lightbox__frame lightbox__room" style={{ '--aspect': shape }} aria-hidden="true">
        <div className="lightbox__art" />
      </motion.div>
      <AnimatePresence initial={false}>
        <motion.div
          key={piece.id}
          data-piece={piece.id}
          className="lightbox__frame"
          style={{ '--aspect': aspect }}
          initial={{ opacity: 0, scale: 0.9, rotate: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.9, rotate: 6 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        >
          <div className="lightbox__art">
            <Artwork src={piece.image} alt={piece.title} tint={piece.tint} doodle={piece.doodle} />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 36" aria-hidden="true">
      <path className="chevron__outline" d="M17 5 L6 18 L17 31" />
      <path className="chevron__fill" d="M17 5 L6 18 L17 31" />
    </svg>
  )
}

// How each mount lets go of its photo: the point it hinges on as it peels
// up (as a fraction of the photo) and how far it tips towards you (deg).
const PEEL = {
  // held at the top: the bottom comes up first, the tape stays on the page
  tape: { origin: '50% 0%', rotateX: 16, rotateY: 0 },
  // tucked into four corners: one corner lifts and it slides out
  corners: { origin: '0% 0%', rotateX: 10, rotateY: -10 },
  // the pin's pulled out, then it comes away flat-ish
  pin: { origin: '50% 50%', rotateX: 6, rotateY: 4 },
  // slides down out of the clip, top edge tipping up
  clip: { origin: '50% 100%', rotateX: -10, rotateY: 0 },
}

// One continuous move each way: quick off the mark, soft landing.
const OPEN = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }
const CLOSE = { duration: 0.35, ease: [0.4, 0, 0.2, 1] }

const clamp = (v, max) => Math.max(-max, Math.min(max, v))
const px = (v) => `${v}px`

/**
 * The photo while it's off the page, drawn above everything.
 *
 * It's one photo the whole way, like a view transition of a single element:
 * the lightbox shows the picture the same shape it has in the book, so the
 * photo just grows into the framed print as it moves. Its picture never
 * changes shape; around it, the caption folds away, the white border evens
 * out and the "art coming soon" label comes in.
 *
 * The same timeline also lets it peel up from its mount, travel in a slight
 * arc and tip a little with its own speed, with its shadow dropping away
 * while it's in the air.
 */
function Flyer({ flight, onDone }) {
  const { dir, piece } = flight
  const photo = dir === 'in' ? flight.from : flight.to
  const frame = dir === 'in' ? flight.to : flight.from
  const peel = PEEL[photo.mount] ?? PEEL.tape

  // the two ends: a polaroid on the page, and the print in the lightbox
  // (whose padding is 8px all round: 0.5em at 16px)
  const onPage = {
    x: photo.cx, y: photo.cy, w: photo.w, h: photo.h, rotate: photo.rotate,
    fontSize: photo.fontSize, radius: photo.radius, artRadius: photo.artRadius,
    padBottom: 0, captionH: photo.captionH, caption: 1, labelH: 0, labelM: 0, label: 0,
  }
  const inFrame = {
    x: frame.cx, y: frame.cy, w: frame.w, h: frame.h, rotate: 0,
    fontSize: 16, radius: frame.radius, artRadius: frame.artRadius,
    padBottom: 8, captionH: 0, caption: 0, labelH: frame.label?.h ?? 0, labelM: frame.label?.m ?? 0, label: 1,
  }
  const [start, end] = dir === 'in' ? [onPage, inFrame] : [inFrame, onPage]

  const mv = {}
  for (const k of Object.keys(start)) mv[k] = useMotionValue(start[k])
  const arc = useMotionValue(0)
  const peelX = useMotionValue(0)
  const peelY = useMotionValue(0)
  const shadow = useMotionValue(dir === 'in' ? 8 : 4)

  const arcY = useTransform(() => mv.y.get() + arc.get())
  const vx = useVelocity(mv.x)
  const vy = useVelocity(arcY)
  // the leading edge drags back a little while it moves
  const tiltX = useTransform(() => peelX.get() - clamp(vy.get() * 0.004, 6))
  const tiltY = useTransform(() => peelY.get() + clamp(vx.get() * 0.004, 6))
  // the camera keeps its distance as the photo grows, so a tilt looks the
  // same whatever size it is (rather than turning into a big trapezoid)
  const perspective = useTransform(() => Math.max(mv.w.get(), mv.h.get()) * 4)
  const shadowX = useTransform(shadow, (s) => s * 0.7)
  // x and y are the centre
  const left = useTransform(mv.w, (w) => -w / 2)
  const top = useTransform(mv.h, (h) => -h / 2)
  const artRadius = useTransform(mv.artRadius, px)

  // a hovered photo's doodle is mid-wiggle: start from there and let it settle
  const [wiggle, setWiggle] = useState(dir === 'in' && photo.hovered)
  useEffect(() => {
    if (!wiggle) return
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setWiggle(false)))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const t = dir === 'in' ? OPEN : CLOSE
    const along = (times) => ({ duration: t.duration, times, ease: 'easeInOut' })
    const dist = Math.hypot(end.x - start.x, end.y - start.y)
    const lift = -Math.min(50, dist * 0.12)
    // peels up early when taken off, settles late when put back
    const peak = dir === 'in' ? 0.22 : 0.65

    const moves = Object.keys(end).map((k) => animate(mv[k], end[k], t))
    animate(arc, [0, lift, 0], along([0, 0.45, 1]))
    animate(peelX, [0, peel.rotateX, 0], along([0, peak, 1]))
    animate(peelY, [0, peel.rotateY, 0], along([0, peak, 1]))
    animate(shadow, [dir === 'in' ? 8 : 4, 16, 4], along([0, peak, 1]))

    let cancelled = false
    Promise.all(moves).then(() => {
      if (cancelled) return
      if (dir === 'out') playPat()
      onDone()
    })
    return () => {
      cancelled = true
      // StrictMode runs this twice in development: start the second run fresh
      for (const [k, v] of Object.entries(start)) {
        mv[k].stop()
        mv[k].jump(v)
      }
      for (const v of [arc, peelX, peelY]) {
        v.stop()
        v.jump(0)
      }
      shadow.stop()
      shadow.jump(dir === 'in' ? 8 : 4)
    }
    // the flight is fixed for the life of this component
  }, [])

  return (
    <motion.div
      className="flyer"
      aria-hidden="true"
      style={{ x: mv.x, y: arcY, rotate: mv.rotate, width: mv.w, height: mv.h, left, top }}
    >
      <motion.div
        className="flyer__tilt"
        style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: perspective, transformOrigin: peel.origin }}
      >
        <motion.div className="flyer__shadow" style={{ x: shadowX, y: shadow, borderRadius: mv.radius }} />
        <motion.div
          className={`flyer__sheet polaroid ${wiggle ? 'is-wiggling' : ''}`}
          style={{
            fontSize: mv.fontSize,
            borderRadius: mv.radius,
            paddingBottom: mv.padBottom,
            '--art-radius': artRadius,
          }}
        >
          <div className={`artwork ${piece.image ? '' : `artwork--placeholder tint-${piece.tint}`}`}>
            {piece.image ? (
              <img src={piece.image} alt="" draggable="false" />
            ) : (
              <>
                <Doodle kind={piece.doodle} className="artwork__doodle" />
                <motion.span
                  className="flyer__label"
                  style={{ height: mv.labelH, marginTop: mv.labelM, opacity: mv.label }}
                >
                  <span className="artwork__label">art coming soon</span>
                </motion.span>
              </>
            )}
          </div>
          <motion.span className="polaroid__caption" style={{ height: mv.captionH, opacity: mv.caption }}>
            {piece.title}
          </motion.span>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
