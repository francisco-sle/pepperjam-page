import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
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
      playPat()
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
            animate={{ opacity: leaving ? 0 : 1 }}
            exit={{ opacity: 0, pointerEvents: 'none', transition: { duration: 0.2 } }}
            // when a photo is flying in, the card waits until it's off the page
            transition={leaving ? { duration: 0.3 } : { duration: 0.35, delay: flight ? 0.18 : 0 }}
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
                <div className="lightbox__viewport" style={{ visibility: flight ? 'hidden' : undefined }}>
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

const SHADOW_HOVER = '7px 9px 0px rgba(70, 40, 20, 0.2)'
const SHADOW_REST = '0px 4px 0px rgba(107, 74, 54, 0.14)'
const SHADOW_AIR = '16px 24px 0px rgba(70, 40, 20, 0.13)'

// How each mount lets go of its photo: the edge the photo hinges on as it
// peels up, how far it tips towards you, and which way it slides free.
const PEEL = {
  // held at the top: the bottom comes up first, the tape stays on the page
  tape: { origin: '50% 0%', rotateX: 26, rotateY: 0, dy: -0.05 },
  // tucked into four corners: one corner lifts and it slides out
  corners: { origin: '0% 0%', rotateX: 14, rotateY: -18, dy: -0.06 },
  // the pin comes out first, then it lifts off flat-ish
  pin: { origin: '50% 50%', rotateX: 8, rotateY: 6, dy: -0.07, delay: 0.1 },
  // slides down out of the clip, top edge tipping up
  clip: { origin: '50% 100%', rotateX: -16, rotateY: 0, dy: 0.07 },
}

// One pose of the photo: where it is, and how much of a polaroid vs. a framed print it looks.
function onPage(p, shadow) {
  return {
    x: p.cx - p.w / 2, y: p.cy - p.h / 2, width: p.w, height: p.h, rotate: p.rotate,
    fontSize: p.fontSize, radius: p.radius, padBottom: 0, captionH: p.captionH, caption: 1,
    shadow, rotateX: 0, rotateY: 0,
  }
}

function inTheAir(p, peel, turn) {
  const k = 1.08
  return {
    x: p.cx - (p.w * k) / 2, y: p.cy + p.h * peel.dy - (p.h * k) / 2, width: p.w * k, height: p.h * k,
    rotate: p.rotate * turn, fontSize: p.fontSize * k, radius: p.radius * k, padBottom: 0,
    captionH: p.captionH * k, caption: 1, shadow: SHADOW_AIR, rotateX: peel.rotateX, rotateY: peel.rotateY,
  }
}

// The lightbox frame: 8px of white all round (0.5em at 16px), no caption.
function inFrame(f) {
  return {
    x: f.cx - f.w / 2, y: f.cy - f.h / 2, width: f.w, height: f.h, rotate: 0,
    fontSize: 16, radius: f.radius, padBottom: 8, captionH: 0, caption: 0,
    shadow: SHADOW_REST, rotateX: 0, rotateY: 0,
  }
}

/**
 * The photo while it's off the page, drawn above everything. Lifting it off
 * the page is a quick peel and a longer flight; putting it back is a flight
 * to just above its spot and a short press down.
 */
function Flyer({ flight, onDone }) {
  const { dir, piece } = flight
  const photo = dir === 'in' ? flight.from : flight.to
  const peel = PEEL[photo.mount] ?? PEEL.tape
  const poses =
    dir === 'in'
      ? [onPage(photo, SHADOW_HOVER), inTheAir(photo, peel, 0.4), inFrame(flight.to)]
      : [inFrame(flight.from), inTheAir(photo, peel, 0.8), onPage(photo, SHADOW_REST)]
  const at = (key) => poses.map((p) => p[key])
  const px = (key) => poses.map((p) => `${p[key]}px`)
  const first = poses[0]

  const transition =
    dir === 'in'
      ? { type: 'keyframes', duration: 0.75, times: [0, 0.25, 1], ease: ['easeOut', [0.3, 0, 0.15, 1]], delay: peel.delay ?? 0 }
      : { type: 'keyframes', duration: 0.6, times: [0, 0.7, 1], ease: [[0.3, 0, 0.2, 1], 'easeIn'] }

  return (
    <motion.div
      className="flyer"
      aria-hidden="true"
      initial={{ x: first.x, y: first.y, width: first.width, height: first.height, rotate: first.rotate }}
      animate={{ x: at('x'), y: at('y'), width: at('width'), height: at('height'), rotate: at('rotate') }}
      transition={transition}
      onAnimationComplete={onDone}
    >
      <motion.div
        className="flyer__sheet polaroid"
        style={{ transformOrigin: peel.origin, transformPerspective: 900 }}
        initial={{
          rotateX: 0, rotateY: 0, boxShadow: first.shadow, fontSize: `${first.fontSize}px`,
          borderRadius: `${first.radius}px`, paddingBottom: `${first.padBottom}px`,
        }}
        animate={{
          rotateX: at('rotateX'), rotateY: at('rotateY'), boxShadow: at('shadow'),
          fontSize: px('fontSize'), borderRadius: px('radius'), paddingBottom: px('padBottom'),
        }}
        transition={transition}
      >
        <Artwork src={piece.image} alt="" tint={piece.tint} doodle={piece.doodle} label={null} />
        <motion.span
          className="polaroid__caption"
          initial={{ height: first.captionH, opacity: first.caption }}
          animate={{ height: at('captionH'), opacity: at('caption') }}
          transition={transition}
        >
          {piece.title}
        </motion.span>
      </motion.div>
    </motion.div>
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
