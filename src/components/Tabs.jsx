import { AnimatePresence, motion } from 'motion/react'
import Doodle from './Doodle'
import './Tabs.css'

/**
 * Divider tabs sticking out of the sketchbook.
 * Like a real tabbed notebook: tabs of sections you've already flipped past
 * move to the left edge, the current and upcoming ones stay on the right.
 */
export default function Tabs({ sections, current, onSelect, single }) {
  if (single) {
    return (
      <div className="tabs tabs--top" role="tablist" aria-label="Sketchbook sections">
        {sections.map((s, i) => (
          <motion.button
            key={s.id}
            role="tab"
            aria-selected={i === current}
            aria-label={s.label}
            className={`tab tab--top tab--${s.color} ${i === current ? 'is-active' : ''}`}
            onClick={() => onSelect(i)}
            initial={{ y: 30 }}
            animate={{ y: i === current ? -6 : 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.25 + i * 0.06 }}
          >
            <span className="tab__icon"><Doodle kind={s.icon} size={18} /></span>
            <span className="tab__label">{s.label}</span>
          </motion.button>
        ))}
      </div>
    )
  }

  return (
    <div className="tabs" role="tablist" aria-label="Sketchbook sections">
      <AnimatePresence initial={true}>
        {sections.map((s, i) => {
          const side = i < current ? 'left' : 'right'
          const out = side === 'right' ? 1 : -1
          const active = i === current
          return (
            <motion.button
              key={`${s.id}-${side}`}
              role="tab"
              aria-selected={active}
              className={`tab tab--${side} tab--${s.color} ${active ? 'is-active' : ''}`}
              style={{ top: `calc(9% + ${i} * 68px)` }}
              onClick={() => onSelect(i)}
              initial={{ x: -70 * out, opacity: 0 }}
              animate={{
                x: active ? 10 * out : 0,
                opacity: 1,
                transition: { type: 'spring', stiffness: 320, damping: 20, delay: 0.45 + i * 0.05 },
              }}
              exit={{ x: -70 * out, opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } }}
              whileHover={{ x: (active ? 14 : 8) * out }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="tab__icon"><Doodle kind={s.icon} size={26} /></span>
              <span className="tab__label">{s.label}</span>
            </motion.button>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
