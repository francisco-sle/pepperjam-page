import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform, useVelocity } from 'motion/react'
import { gallery } from '../content/gallery'
import Artwork from './Artwork'
import Doodle from './Doodle'
import { findPhoto, measureFrame, measurePhoto, subjectOf } from './photoLift'
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

  // how much smaller than the frame the photo has to be to fit over it
  // (when their shapes are very different); the frame zooms in from that
  const placed = (zoom) => setFlight((f) => f && { ...f, zoom })
  // the photo is over the frame: show the frame underneath while it fades out
  const handOver = () => setFlight((f) => f && { ...f, handedOver: true })

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
  const arriving = flight?.dir === 'in' && !flight.handedOver

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
                <motion.div
                  className="lightbox__viewport"
                  // empty until the flying photo gets here, then it fades in under
                  // it (and the other way round when it's put back)
                  style={{ transformOrigin: flight?.from.origin ?? flight?.to.origin }}
                  animate={arriving || leaving ? { opacity: 0, scale: flight.zoom ?? 1 } : { opacity: 1, scale: 1 }}
                  transition={arriving ? { duration: 0 } : leaving ? HAND_BACK : HAND_OVER}
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
                </motion.div>
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
      {open && flight && <Flyer key={flight.dir} flight={flight} onPlaced={placed} onHandOver={handOver} onDone={landed} />}
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

// How each mount lets go of its photo: the edge it hinges on as it peels up,
// how far it tips towards you (deg), and which way it slides free (× height).
const PEEL = {
  // held at the top: the bottom comes up first, the tape stays on the page
  tape: { origin: '50% 0%', rotateX: 24, rotateY: 0, dy: -0.04 },
  // tucked into four corners: one corner lifts and it slides out
  corners: { origin: '0% 0%', rotateX: 12, rotateY: -16, dy: -0.05 },
  // the pin comes out first, then it lifts off flat-ish
  pin: { origin: '50% 50%', rotateX: 8, rotateY: 6, dy: -0.06, delay: 0.1 },
  // slides down out of the clip, top edge tipping up
  clip: { origin: '50% 100%', rotateX: -14, rotateY: 0, dy: 0.06 },
}

// the photo and the frame swapping places: a cross-fade, with a little zoom
// if the photo had to be shrunk to fit over the frame
const HAND_OVER = { duration: 0.3, ease: 'easeInOut' }
// picking it back up is quicker: closing shouldn't keep you waiting
const HAND_BACK = { duration: 0.2, ease: 'easeOut' }

const clamp = (v, max) => Math.max(-max, Math.min(max, v))
const wait = (s) => new Promise((done) => setTimeout(done, s * 1000))

// carried across the screen by hand: speeds up evenly and slows down softly,
// taking a little longer the further it goes
const carryOver = (dist) => ({ duration: Math.min(0.6, Math.max(0.38, 0.3 + dist / 1400)), ease: [0.45, 0, 0.25, 1] })
// straightening up in your hand: a little wobble at the end
const WOBBLE = { type: 'spring', visualDuration: 0.55, bounce: 0.35 }

/**
 * The photo while it's off the page, drawn above everything.
 *
 * It's handled like a real photo: it never changes shape, it only moves,
 * turns, tips and comes closer. It peels up, is carried along a slight arc
 * (tipping with its own speed, like a card through air), and is set down
 * over the lightbox frame at whatever size fits, where it hands over to the
 * frame with a short fade. Putting it back runs the other way and ends with
 * a press onto the page.
 */
function Flyer({ flight, onPlaced, onHandOver, onDone }) {
  const { dir, piece } = flight
  const photo = dir === 'in' ? flight.from : flight.to
  const frame = dir === 'in' ? flight.to : flight.from
  const peel = PEEL[photo.mount] ?? PEEL.tape
  // both directions start on the page; putting it back jumps to the frame
  // (still invisible) once it knows where that is
  const start = { x: photo.cx, y: photo.cy, scale: 1, rotate: photo.rotate, shadow: 8, opacity: dir === 'in' ? 1 : 0 }
  const sheetRef = useRef(null)

  const x = useMotionValue(start.x)
  const y = useMotionValue(start.y)
  const arc = useMotionValue(0)
  const scale = useMotionValue(start.scale)
  const rotate = useMotionValue(start.rotate)
  const peelX = useMotionValue(0)
  const peelY = useMotionValue(0)
  const shadow = useMotionValue(start.shadow)
  const opacity = useMotionValue(start.opacity)

  const top = useTransform(() => y.get() + arc.get())
  const vx = useVelocity(x)
  const vy = useVelocity(top)
  // the leading edge drags back a little while it moves
  const tiltX = useTransform(() => peelX.get() - clamp(vy.get() * 0.01, 10))
  const tiltY = useTransform(() => peelY.get() + clamp(vx.get() * 0.01, 10))
  const shadowX = useTransform(shadow, (s) => s * 0.7)

  // Where the photo sits over the frame: its picture's subject on the frame's
  // (same centre, and the same size when it fits), so the hand-over only
  // changes the border around it. Measured on this copy while it's still flat
  // on the page. `at(k)` is where it goes at scale k to keep the subjects lined up.
  const placeOverFrame = () => {
    const subject = subjectOf(sheetRef.current)
    const r = subject.getBoundingClientRect()
    const a = (photo.rotate * Math.PI) / 180
    const c = Math.cos(a)
    const s = Math.sin(a)
    const ox = r.left + r.width / 2 - photo.cx
    const oy = r.top + r.height / 2 - photo.cy
    const lx = c * ox + s * oy
    const ly = c * oy - s * ox
    const w = subject instanceof SVGElement ? r.width / (Math.abs(c) + Math.abs(s)) : subject.offsetWidth
    const full = frame.subject.w / w
    // a photo much taller or wider than the frame mustn't cover the whole
    // card, but it never gets smaller than it was on the page (you're
    // bringing it closer)
    const fit = Math.min(full, Math.max(1, Math.min((frame.w * 1.15) / photo.w, (frame.h * 1.15) / photo.h)))
    return { full, fit, at: (k) => ({ x: frame.subject.cx - lx * k, y: frame.subject.cy - ly * k }) }
  }

  useEffect(() => {
    const values = [x, y, arc, scale, rotate, peelX, peelY, shadow, opacity]
    let cancelled = false
    const all = (...a) => Promise.all(a)
    const { full, fit, at } = placeOverFrame()
    const inFrame = at(fit)
    const zoomTo = (k, t) => [animate(scale, k, t), animate(x, at(k).x, t), animate(y, at(k).y, t)]
    onPlaced(fit / full)
    const dist = Math.hypot(inFrame.x - photo.cx, inFrame.y - photo.cy)
    const lift = -Math.min(60, dist * 0.15)
    const carry = carryOver(dist)

    const takeOff = async () => {
      const t = { duration: 0.2, ease: 'easeOut', delay: peel.delay ?? 0 }
      await all(
        animate(peelX, peel.rotateX, t),
        animate(peelY, peel.rotateY, t),
        animate(scale, 1.05, t),
        animate(y, photo.cy + photo.h * peel.dy, t),
        animate(shadow, 18, t),
      )
      if (cancelled) return
      animate(arc, [0, lift, 0], { duration: carry.duration, ease: ['easeOut', 'easeIn'] })
      animate(peelX, 0, WOBBLE)
      animate(peelY, 0, WOBBLE)
      animate(rotate, 0, WOBBLE)
      animate(shadow, 4, { duration: 0.3, delay: 0.25 })
      animate(x, inFrame.x, carry)
      animate(y, inFrame.y, carry)
      animate(scale, fit, carry)
      // start handing over as it settles, so it flows straight into the frame
      await wait(carry.duration * 0.75)
      if (cancelled) return
      onHandOver()
      await all(animate(opacity, 0, HAND_OVER), ...zoomTo(full, HAND_OVER))
      if (!cancelled) onDone()
    }

    const putDown = async () => {
      x.jump(at(full).x)
      y.jump(at(full).y)
      scale.jump(full)
      rotate.jump(0)
      shadow.jump(4)
      await all(animate(opacity, 1, HAND_BACK), ...zoomTo(fit, HAND_BACK))
      if (cancelled) return
      await all(animate(scale, fit * 1.04, { duration: 0.1, ease: 'easeOut' }), animate(shadow, 18, { duration: 0.1 }))
      if (cancelled) return
      const hoverY = photo.cy + photo.h * peel.dy
      animate(arc, [0, lift, 0], { duration: carry.duration, ease: ['easeOut', 'easeIn'] })
      animate(rotate, photo.rotate, WOBBLE)
      animate(peelX, peel.rotateX * 0.5, WOBBLE)
      animate(peelY, peel.rotateY * 0.5, WOBBLE)
      animate(x, photo.cx, carry)
      animate(y, hoverY, carry)
      animate(scale, 1.05, carry)
      await wait(carry.duration * 0.9)
      if (cancelled) return
      const press = { duration: 0.14, ease: 'easeIn' }
      await all(
        animate(y, photo.cy, press),
        animate(scale, 1, press),
        animate(peelX, 0, press),
        animate(peelY, 0, press),
        animate(shadow, 4, press),
      )
      if (cancelled) return
      playPat()
      onDone()
    }

    if (dir === 'in') takeOff()
    else putDown()
    return () => {
      cancelled = true
      values.forEach((v) => v.stop())
      // StrictMode runs this twice in development: start the second run fresh
      Object.entries(start).forEach(([k, v]) => ({ x, y, scale, rotate, shadow, opacity })[k].jump(v))
      ;[arc, peelX, peelY].forEach((v) => v.jump(0))
    }
    // the flight is fixed for the life of this component
  }, [])

  return (
    <motion.div
      className="flyer"
      aria-hidden="true"
      style={{
        left: -photo.w / 2,
        top: -photo.h / 2,
        width: photo.w,
        height: photo.h,
        fontSize: photo.fontSize,
        x,
        y: top,
        scale,
        rotate,
        opacity,
      }}
    >
      <motion.div className="flyer__shadow" style={{ x: shadowX, y: shadow, borderRadius: photo.radius }} />
      <motion.div
        ref={sheetRef}
        className="flyer__sheet polaroid"
        style={{
          borderRadius: photo.radius,
          rotateX: tiltX,
          rotateY: tiltY,
          transformPerspective: 900,
          transformOrigin: peel.origin,
        }}
      >
        <Artwork src={piece.image} alt="" tint={piece.tint} doodle={piece.doodle} label={null} />
        <span className="polaroid__caption">{piece.title}</span>
      </motion.div>
    </motion.div>
  )
}
