import { useMemo } from 'react'
import { motion } from 'motion/react'
import Doodle, { SocialIcon } from './Doodle'
import { site } from '../content/site'
import './Footer.css'

const SEASONS = [
  { name: 'Winter', icon: 'sparkle' }, // Dec–Feb
  { name: 'Spring', icon: 'flower' },
  { name: 'Summer', icon: 'sun' },
  { name: 'Fall', icon: 'leaf' },
]

// Today's real date, written the way a farming game would show it.
function useFarmDate() {
  return useMemo(() => {
    const now = new Date()
    const season = SEASONS[Math.floor(((now.getMonth() + 1) % 12) / 3)]
    const day = now.toLocaleDateString('en-US', { weekday: 'short' })
    return { label: `${day}. ${now.getDate()}`, season, year: now.getFullYear() }
  }, [])
}

export default function Footer({ soundOn, onToggleSound }) {
  const date = useFarmDate()
  return (
    <motion.footer
      className="footer"
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 140, damping: 18, delay: 0.3 }}
    >
      <div className="footer__inner">
        <div className="calendar" title={`${date.season.name}, ${date.year}`}>
          <span className="calendar__day">{date.label}</span>
          <span className="calendar__season">
            <Doodle kind={date.season.icon} size={20} />
            <span>{date.season.name}</span>
          </span>
        </div>

        <nav className="socials" aria-label="Social links">
          {site.socials.map((s) => (
            <a key={s.id} className="socials__link" href={s.url} aria-label={s.label} title={s.label}>
              <SocialIcon id={s.id} size={17} />
            </a>
          ))}
        </nav>

        <div className="footer__end">
          <button
            className={`sound-toggle ${soundOn ? 'is-on' : ''}`}
            onClick={onToggleSound}
            aria-pressed={soundOn}
            title={soundOn ? 'Sound on' : 'Sound off'}
          >
            <SoundIcon on={soundOn} />
            <span className="sr-only">Page sounds</span>
          </button>
          <span className="footer__copy">© {date.year} {site.name}</span>
        </div>
      </div>
    </motion.footer>
  )
}

function SoundIcon({ on }) {
  return (
    <svg viewBox="0 0 32 32" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12 H10 L17 6 V26 L10 20 H5Z" fill="currentColor" />
      {on ? (
        <>
          <path d="M21 11 C24 14 24 18 21 21" />
          <path d="M25 7 C30 12 30 20 25 25" />
        </>
      ) : (
        <path d="M22 12 L29 20 M29 12 L22 20" />
      )}
    </svg>
  )
}
