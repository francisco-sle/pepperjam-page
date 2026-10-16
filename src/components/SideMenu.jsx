import { useId, useMemo } from 'react'
import { motion } from 'motion/react'
import Doodle, { SocialIcon } from './Doodle'
import useMediaQuery from '../hooks/useMediaQuery'
import { site } from '../content/site'
import './SideMenu.css'

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
    const weekday = now.toLocaleDateString('en-US', { weekday: 'short' })
    return { weekday, day: now.getDate(), season, year: now.getFullYear() }
  }, [])
}

// The menu bar: a solid strip down the left side (along the bottom on
// phones) trimmed with lace, with the date, socials and sound toggle.
export default function SideMenu({ soundOn, onToggleSound }) {
  const date = useFarmDate()
  const phone = useMediaQuery('(max-width: 820px)')
  return (
    <motion.aside
      className="side-menu"
      initial={phone ? { y: 90 } : { x: -130 }}
      animate={phone ? { y: 0 } : { x: 0 }}
      transition={{ type: 'spring', stiffness: 140, damping: 18, delay: 0.3 }}
    >
      <Lace phone={phone} />
      <div className="side-menu__inner">
        <div className="calendar" title={`${date.season.name}, ${date.year}`}>
          <span className="calendar__day">
            <span className="calendar__weekday">{date.weekday}.</span> <b>{date.day}</b>
          </span>
          <span className="calendar__season">
            <Doodle kind={date.season.icon} size={20} />
            <span>{date.season.name}</span>
          </span>
        </div>

        <nav className="socials" aria-label="Social links">
          {site.socials.map((s) => (
            <a key={s.id} className="socials__link" href={s.url} aria-label={s.label} title={s.label}>
              <SocialIcon id={s.id} size={20} />
            </a>
          ))}
        </nav>

        <div className="side-menu__end">
          <button
            className={`sound-toggle ${soundOn ? 'is-on' : ''}`}
            onClick={onToggleSound}
            aria-pressed={soundOn}
            title={soundOn ? 'Sound on' : 'Sound off'}
          >
            <SoundIcon on={soundOn} />
            <span className="sr-only">Page sounds</span>
          </button>
          <span className="side-menu__copy">© {date.year} {site.name}</span>
        </div>
      </div>
    </motion.aside>
  )
}

// The lace trim along the menu's edge: one tile per scallop, drawn for the
// side menu (scallops pointing right) and turned to point up on phones.
// Each scallop has an eyelet punched through it and each tile a little
// flower in the band, with a row of stitches on the menu side of the seam.
function Lace({ phone }) {
  const id = useId()
  return (
    <svg className="side-menu__lace" aria-hidden="true">
      <defs>
        <pattern
          id={id}
          width="44"
          height="22"
          patternUnits="userSpaceOnUse"
          patternTransform={phone ? 'translate(0 40) rotate(-90) scale(0.8)' : 'scale(1.3)'}
        >
          <circle cx="4" cy="11" r="1.5" fill="var(--paper)" opacity="0.85" />
          <path
            d="M10 0 H26 A11 11 0 0 1 26 22 H10 Z M30.6 11 a2.6 2.6 0 1 0 5.2 0 a2.6 2.6 0 1 0 -5.2 0 Z"
            fill="var(--paper)"
            fillRule="evenodd"
          />
          <path d="M26 0 A11 11 0 0 1 26 22" fill="none" stroke="var(--ink)" strokeWidth="2.5" />
          <circle cx="33.2" cy="11" r="2.6" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
          <path d="M11.25 0 V22" stroke="var(--ink)" strokeWidth="2.5" />
          <g fill="var(--rust-dark)">
            <circle cx="19" cy="8.2" r="1.9" />
            <circle cx="19" cy="13.8" r="1.9" />
            <circle cx="16.2" cy="11" r="1.9" />
            <circle cx="21.8" cy="11" r="1.9" />
          </g>
          <circle cx="19" cy="11" r="1.3" fill="var(--mustard)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
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
