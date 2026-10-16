import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform, useVelocity } from 'motion/react'
import { gallery } from '../content/gallery'
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

  const frameEl = () => cardRef.current?.querySelector(`[data-piece="${gallery[index].id}"]`)

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
                {/* the outgoing art is lifted out while it fades; this box is what
                    it's positioned against (a grid cell would offset it twice) */}
                <div
                  className="lightbox__viewport"
                  // the flying photo stands in for the frame until it lands
                  style={{ visibility: flight ? 'hidden' : undefined }}
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={piece.id}
                      data-piece={piece.id}
                      className="lightbox__frame"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ duration: 0.22 }}
                    >
                      <Artwork src={piece.image} alt={piece.title} tint={piece.tint} doodle={piece.doodle} />
                    </motion.div>
                  </AnimatePresence>
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
  tape: { origin: [0.5, 0], rotateX: 22, rotateY: 0 },
  // tucked into four corners: one corner lifts and it slides out
  corners: { origin: [0, 0], rotateX: 12, rotateY: -14 },
  // the pin's pulled out, then it comes away flat-ish
  pin: { origin: [0.5, 0.5], rotateX: 8, rotateY: 6 },
  // slides down out of the clip, top edge tipping up
  clip: { origin: [0.5, 1], rotateX: -14, rotateY: 0 },
}

// One continuous move each way, like a view transition: quick off the mark,
// soft landing.
const OPEN = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }
const CLOSE = { duration: 0.35, ease: [0.4, 0, 0.2, 1] }

const clamp = (v, max) => Math.max(-max, Math.min(max, v))

/**
 * The photo while it's off the page, drawn above everything.
 *
 * Works like a view transition between the photo on the page and the
 * lightbox frame: a copy of each, pinned together on their subject, moves
 * from one place to the other in a single motion while they cross-fade, so
 * the photo turns into the framed print on the way. Neither copy ever
 * changes shape; the pair only moves, turns and grows.
 *
 * The same timeline also lets the photo peel up from its mount, travel in a
 * slight arc and tip a little with its own speed, with its shadow dropping
 * away while it's in the air.
 */
function Flyer({ flight, onDone }) {
  const { dir, piece } = flight
  const photo = dir === 'in' ? flight.from : flight.to
  const frame = dir === 'in' ? flight.to : flight.from
  const peel = PEEL[photo.mount] ?? PEEL.tape

  // where each end puts the shared subject on screen
  const a = (photo.rotate * Math.PI) / 180
  const px = photo.subject.x - photo.w / 2
  const py = photo.subject.y - photo.h / 2
  const onPage = {
    x: photo.cx + px * Math.cos(a) - py * Math.sin(a),
    y: photo.cy + px * Math.sin(a) + py * Math.cos(a),
    scale: 1,
    rotate: photo.rotate,
  }
  const inFrame = {
    x: frame.cx - frame.w / 2 + frame.subject.x,
    y: frame.cy - frame.h / 2 + frame.subject.y,
    // how much bigger the picture is in the frame than on the page
    scale: frame.subject.w / photo.subject.w,
    rotate: 0,
  }
  const [start, end] = dir === 'in' ? [onPage, inFrame] : [inFrame, onPage]
  const rest = dir === 'in'
    ? { shadow: 8, photoOpacity: 1, frameOpacity: 0 }
    : { shadow: 4, photoOpacity: 0, frameOpacity: 1 }

  const x = useMotionValue(start.x)
  const y = useMotionValue(start.y)
  const scale = useMotionValue(start.scale)
  const rotate = useMotionValue(start.rotate)
  const arc = useMotionValue(0)
  const peelX = useMotionValue(0)
  const peelY = useMotionValue(0)
  const shadow = useMotionValue(rest.shadow)
  const photoOpacity = useMotionValue(rest.photoOpacity)
  const frameOpacity = useMotionValue(rest.frameOpacity)

  const top = useTransform(() => y.get() + arc.get())
  const vx = useVelocity(x)
  const vy = useVelocity(top)
  // the leading edge drags back a little while it moves
  const tiltX = useTransform(() => peelX.get() - clamp(vy.get() * 0.006, 8))
  const tiltY = useTransform(() => peelY.get() + clamp(vx.get() * 0.006, 8))
  const shadowX = useTransform(shadow, (s) => s * 0.7)

  useEffect(() => {
    const t = dir === 'in' ? OPEN : CLOSE
    const along = (times, ease = 'easeInOut') => ({ duration: t.duration, times, ease })
    const dist = Math.hypot(end.x - start.x, end.y - start.y)
    const lift = -Math.min(50, dist * 0.12)
    // peels up early when taken off, settles late when put back
    const peak = dir === 'in' ? 0.3 : 0.6

    const main = [
      animate(x, end.x, t),
      animate(y, end.y, t),
      animate(scale, end.scale, t),
      animate(rotate, end.rotate, t),
    ]
    animate(arc, [0, lift, 0], along([0, 0.45, 1]))
    animate(peelX, [0, peel.rotateX, 0], along([0, peak, 1]))
    animate(peelY, [0, peel.rotateY, 0], along([0, peak, 1]))
    animate(shadow, [rest.shadow, 16, 4], along([0, peak, 1]))
    // a quick cross-fade early on: the incoming picture fades in a little
    // ahead of the outgoing one fading out, so the pair never goes
    // see-through, and the outgoing one is gone before it's grown much
    const [incoming, outgoing] = dir === 'in' ? [frameOpacity, photoOpacity] : [photoOpacity, frameOpacity]
    animate(incoming, [0, 1, 1], along([0, 0.35, 1], 'linear'))
    animate(outgoing, [1, 1, 0, 0], along([0, 0.1, 0.45, 1], 'linear'))

    let cancelled = false
    Promise.all(main).then(() => {
      if (cancelled) return
      if (dir === 'out') playPat()
      onDone()
    })
    return () => {
      cancelled = true
      // StrictMode runs this twice in development: start the second run fresh
      const values = { ...start, arc: 0, peelX: 0, peelY: 0, ...rest }
      const mv = { x, y, scale, rotate, arc, peelX, peelY, shadow, photoOpacity, frameOpacity }
      Object.entries(values).forEach(([k, v]) => {
        mv[k].stop()
        mv[k].jump(v)
      })
    }
    // the flight is fixed for the life of this component
  }, [])

  // the hinge, measured from the subject (where the flyer's origin is)
  const hinge = `${peel.origin[0] * photo.w - photo.subject.x}px ${peel.origin[1] * photo.h - photo.subject.y}px`

  return (
    <motion.div className="flyer" aria-hidden="true" style={{ x, y: top, scale, rotate }}>
      <motion.div
        className="flyer__tilt"
        style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 900, transformOrigin: hinge }}
      >
        {/* the photo as it was on the page */}
        <motion.div
          className="flyer__layer"
          style={{
            left: -photo.subject.x,
            top: -photo.subject.y,
            width: photo.w,
            height: photo.h,
            fontSize: photo.fontSize,
            opacity: photoOpacity,
          }}
        >
          <motion.div className="flyer__shadow flyer__shadow--photo" style={{ x: shadowX, y: shadow }} />
          <div className="flyer__photo polaroid">
            <Artwork src={piece.image} alt="" tint={piece.tint} doodle={piece.doodle} label={null} />
            <span className="polaroid__caption">{piece.title}</span>
          </div>
        </motion.div>

        {/* the print as it is in the lightbox, shrunk to begin with so its
            picture matches the photo's */}
        <motion.div
          className="flyer__layer"
          style={{
            left: -frame.subject.x,
            top: -frame.subject.y,
            width: frame.w,
            height: frame.h,
            transformOrigin: `${frame.subject.x}px ${frame.subject.y}px`,
            scale: photo.subject.w / frame.subject.w,
            opacity: frameOpacity,
          }}
        >
          <motion.div className="flyer__shadow flyer__shadow--frame" style={{ x: shadowX, y: shadow }} />
          <div className="flyer__frame lightbox__frame">
            <Artwork src={piece.image} alt="" tint={piece.tint} doodle={piece.doodle} />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
