import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { gallery } from '../content/gallery'
import Artwork from './Artwork'
import Doodle from './Doodle'
import { playPop } from '../hooks/sound'
import './Lightbox.css'

// A closer look at one artwork, styled like the item card in the main reference.
export default function Lightbox({ index, onClose, onChange, favorites, onToggleFavorite }) {
  const open = index != null
  const closeRef = useRef(null)

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
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onChange((index + 1) % gallery.length)
      if (e.key === 'ArrowLeft') onChange((index - 1 + gallery.length) % gallery.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, index, onClose, onChange])

  const piece = open ? gallery[index] : null
  const fav = piece && favorites.includes(piece.id)
  const go = (d) => {
    playPop(1.1)
    onChange((index + d + gallery.length) % gallery.length)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, pointerEvents: 'none', transition: { duration: 0.2 } }}
          onClick={onClose}
        >
          <motion.div
            className="lightbox__card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lightbox-title"
            initial={{ scale: 0.85, y: 40, rotate: -3 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.92, y: 20, rotate: 2, opacity: 0, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="lightbox__ticket" aria-hidden="true" />
            <button ref={closeRef} className="lightbox__close" onClick={onClose} aria-label="Close">
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
              <div className="lightbox__viewport">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={piece.id}
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
