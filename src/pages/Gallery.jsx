import { motion } from 'motion/react'
import { gallery, PIECES_PER_SPREAD } from '../content/gallery'
import Artwork from '../components/Artwork'
import Doodle from '../components/Doodle'
import { useSite } from '../SiteContext'
import { playPop } from '../hooks/sound'
import './Gallery.css'

// Collage slots, following the wireframe (percentages of the page).
const LAYOUT = {
  left: [
    { left: 0, top: 1, width: 46, height: 56, rotate: -3, tape: 'var(--peach)' },
    { left: 57, top: 4, width: 38, height: 33, rotate: 3.5, tape: 'var(--mustard)' },
    { left: 51, top: 45, width: 47, height: 52, rotate: -1.5, tape: 'var(--matcha)' },
  ],
  right: [
    { left: 1, top: 1, width: 72, height: 50, rotate: 1.5, tape: 'var(--cocoa)' },
    { left: 43, top: 57, width: 55, height: 39, rotate: -2.5, tape: 'var(--peach)' },
  ],
}

const NOTES = [
  { left: 'vol. 1 ~ summer on the farm', right: 'click any doodle to take a closer look!' },
  { left: 'vol. 2 ~ cozy little evenings', right: 'more pages coming as the sketchbook fills up' },
]

export const gallerySpreadCount = Math.ceil(gallery.length / PIECES_PER_SPREAD)

export default function GalleryPage({ spread, side }) {
  const { openArt } = useSite()
  const start = spread * PIECES_PER_SPREAD + (side === 'right' ? LAYOUT.left.length : 0)
  const slots = LAYOUT[side === 'right' ? 'right' : 'left']
  const note = NOTES[spread % NOTES.length]

  return (
    <div className={`gallery-page gallery-page--${side === 'right' ? 'right' : 'left'}`}>
      {slots.map((slot, i) => {
        const index = start + i
        const piece = gallery[index]
        if (!piece) return null
        return (
          <motion.button
            key={piece.id}
            className="gallery-item polaroid"
            style={{
              left: `${slot.left}%`,
              top: `${slot.top}%`,
              width: `${slot.width}%`,
              height: `${slot.height}%`,
              rotate: slot.rotate,
            }}
            whileHover={{ rotate: 0, scale: 1.04, y: -4 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            onClick={() => { playPop(1.2); openArt(index) }}
            aria-label={`Open “${piece.title}”`}
          >
            <span className="tape" style={{ '--tape': slot.tape }} />
            <Artwork src={piece.image} alt={piece.title} tint={piece.tint} doodle={piece.doodle} label={null} />
            <span className="polaroid__caption">{piece.title}</span>
          </motion.button>
        )
      })}

      {side === 'right' ? (
        <div className="gallery-page__note gallery-page__note--right">
          <p className="page-note">{note.right}</p>
          <Doodle kind="sparkle" size={22} />
          <div className="gallery-dots" aria-hidden="true">
            {Array.from({ length: gallerySpreadCount }, (_, i) => (
              <span key={i} className={i === spread ? 'is-on' : ''} />
            ))}
          </div>
        </div>
      ) : (
        <div className="gallery-page__note gallery-page__note--left">
          <p className="page-note">{note.left}</p>
          <svg viewBox="0 0 80 40" className="squiggle-arrow" aria-hidden="true">
            <path d="M4 30 C20 4 34 40 50 18 C56 10 64 10 74 14 M66 6 L75 14 L65 20" />
          </svg>
        </div>
      )}
    </div>
  )
}
