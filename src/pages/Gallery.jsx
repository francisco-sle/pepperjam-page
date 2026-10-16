import { motion } from 'motion/react'
import { gallery, PIECES_PER_SPREAD } from '../content/gallery'
import Artwork from '../components/Artwork'
import Doodle from '../components/Doodle'
import { Mount, Scrap } from '../components/Scrapbook'
import { useSite } from '../SiteContext'
import { playPop } from '../hooks/sound'
import './Gallery.css'

// Collage slots, following the wireframe (percentages of the page),
// each held down a different way, like a real scrapbook.
const LAYOUT = {
  left: [
    { left: 0, top: 1, width: 46, height: 56, rotate: -3, mount: 'tape', color: 'var(--peach)' },
    { left: 57, top: 4, width: 38, height: 33, rotate: 3.5, mount: 'pin', color: 'var(--rust)' },
    { left: 51, top: 45, width: 47, height: 52, rotate: -1.5, mount: 'corners', color: 'var(--matcha)' },
  ],
  right: [
    { left: 1, top: 1, width: 72, height: 50, rotate: 1.5, mount: 'corners', color: 'var(--cocoa)' },
    { left: 43, top: 57, width: 55, height: 39, rotate: -2.5, mount: 'clip' },
  ],
}

// Stickers dotted around the empty spots of each page
const STICKERS = {
  left: [
    { kind: 'heart', left: 37, top: 57, size: 9, rotate: -14 },
    { kind: 'star', left: 92, top: 36, size: 8, rotate: 12 },
  ],
  right: [
    { kind: 'flower', left: 80, top: 6, size: 12, rotate: 10 },
    { kind: 'sparkle', left: 30, top: 88, size: 7, rotate: 0 },
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
  const stickers = STICKERS[side === 'right' ? 'right' : 'left']
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
            <Mount kind={slot.mount} color={slot.color} />
            <Artwork src={piece.image} alt={piece.title} tint={piece.tint} doodle={piece.doodle} label={null} />
            <span className="polaroid__caption">{piece.title}</span>
          </motion.button>
        )
      })}

      {stickers.map((st, i) => (
        <Doodle
          key={i}
          kind={st.kind}
          sticker
          className="sticker"
          style={{ left: `${st.left}%`, top: `${st.top}%`, width: `${st.size}cqw`, height: 'auto', rotate: `${st.rotate}deg` }}
        />
      ))}

      {side === 'right' ? (
        <Scrap kind="sticky" torn={[]} className="gallery-page__note gallery-page__note--right">
          <p className="page-note">{note.right}</p>
          <div className="gallery-dots" aria-hidden="true">
            {Array.from({ length: gallerySpreadCount }, (_, i) => (
              <span key={i} className={i === spread ? 'is-on' : ''} />
            ))}
          </div>
        </Scrap>
      ) : (
        <Scrap kind="lined" torn={['top', 'right']} seed={spread + 3} className="gallery-page__note gallery-page__note--left">
          <p className="page-note">{note.left}</p>
          <svg viewBox="0 0 80 40" className="squiggle-arrow" aria-hidden="true">
            <path d="M4 30 C20 4 34 40 50 18 C56 10 64 10 74 14 M66 6 L75 14 L65 20" />
          </svg>
        </Scrap>
      )}
    </div>
  )
}
