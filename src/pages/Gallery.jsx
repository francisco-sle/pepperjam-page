import { motion } from 'motion/react'
import { gallery, PIECES_PER_SPREAD } from '../content/gallery'
import Artwork from '../components/Artwork'
import Doodle from '../components/Doodle'
import { Mount, Scrap } from '../components/Scrapbook'
import { useSite } from '../SiteContext'
import { useI18n } from '../i18n'
import { playPeel } from '../hooks/sound'
import { measurePhoto } from '../components/photoLift'
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

export const gallerySpreadCount = Math.ceil(gallery.length / PIECES_PER_SPREAD)

/**
 * The shape (width / height) of piece `index`'s picture in the book, so the
 * lightbox can show it the same shape. Every spread uses the same slots, so
 * this works for pieces on other spreads too: it measures a gallery page
 * that's showing, and the border and caption around a photo on it.
 */
export function artAspect(index) {
  const pos = index % PIECES_PER_SPREAD
  const slot = pos < LAYOUT.left.length ? LAYOUT.left[pos] : LAYOUT.right[pos - LAYOUT.left.length]
  const shown = (el) => el.getClientRects().length > 0
  const page = [...document.querySelectorAll('.gallery-page')].find(shown)
  // (not the one that's off the page: its empty spot has a thinner border)
  const photo = page && [...page.querySelectorAll('.gallery-item:not(.is-lifted)')].find(shown)
  const art = photo?.querySelector('.artwork')
  if (!art) return null
  const aroundW = photo.offsetWidth - art.offsetWidth
  const aroundH = photo.offsetHeight - art.offsetHeight
  return ((slot.width / 100) * page.offsetWidth - aroundW) / ((slot.height / 100) * page.offsetHeight - aroundH)
}

export default function GalleryPage({ spread, side }) {
  const { openArt, liftedArt } = useSite()
  const { t } = useI18n()
  const start = spread * PIECES_PER_SPREAD + (side === 'right' ? LAYOUT.left.length : 0)
  const slots = LAYOUT[side === 'right' ? 'right' : 'left']
  const stickers = STICKERS[side === 'right' ? 'right' : 'left']
  // the handwritten notes (gallery.notes) take turns, one per spread
  const notes = t('gallery.notes')
  const note = notes[spread % notes.length]

  return (
    <div className={`gallery-page gallery-page--${side === 'right' ? 'right' : 'left'}`}>
      {slots.map((slot, i) => {
        const index = start + i
        const piece = gallery[index]
        if (!piece) return null
        const title = t(`gallery.items.${piece.id}.title`)
        return (
          <motion.button
            key={piece.id}
            className={`gallery-item polaroid ${liftedArt === index ? 'is-lifted' : ''}`}
            data-art-index={index}
            data-mount={slot.mount}
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
            onClick={(e) => { playPeel(); openArt(index, measurePhoto(e.currentTarget)) }}
            aria-label={t('gallery.open', { title })}
          >
            <Mount kind={slot.mount} color={slot.color} />
            <Artwork src={piece.image} alt={title} tint={piece.tint} doodle={piece.doodle} label={null} />
            <span className="polaroid__caption">{title}</span>
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
