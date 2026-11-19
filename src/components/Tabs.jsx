import { AnimatePresence, motion } from 'motion/react'
import Doodle from './Doodle'
import { SPREAD_STEP } from './Book'
import { pages } from '../pages'
import { useI18n } from '../i18n'
import './Tabs.css'

/**
 * Divider tabs sticking out of the sketchbook.
 * Like a real tabbed notebook: tabs of sections you've already flipped past
 * move to the left edge, the current and upcoming ones stay on the right.
 */
export default function Tabs({ sections, current, spread, onSelect, single }) {
  const { t } = useI18n()
  const label = (s) => t(`sections.${s.id}`)
  if (single) {
    return (
      <div className="tabs tabs--top" role="tablist" aria-label={t('sections.tabs')}>
        {sections.map((s, i) => (
          <motion.button
            key={s.id}
            role="tab"
            aria-selected={i === current}
            aria-label={label(s)}
            className={`tab tab--top tab--${s.color} ${i === current ? 'is-active' : ''}`}
            onClick={() => onSelect(i)}
            initial={{ y: 30 }}
            animate={{ y: i === current ? -6 : 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.25 + i * 0.06 }}
          >
            <span className="tab__icon"><Doodle kind={s.icon} size={18} /></span>
            <span className="tab__label">{label(s)}</span>
          </motion.button>
        ))}
      </div>
    )
  }

  // A divider is slotted into the pile at the sheet where its section starts:
  // above that sheet, under the ones on top of it. A tab for the section being
  // shown sticks out of the visible page's sheet. (Mirrors Book's placeAt.)
  const lastSpread = pages.length / 2 - 1
  const slot = (id, side) => {
    const start = Math.floor(pages.findIndex((p) => p.section === id) / 2)
    const dir = side === 'left' ? -1 : 1
    const depth = side === 'left' ? lastSpread - start : Math.max(start, spread)
    const d = depth - lastSpread / 2
    return { zIndex: 201 - 2 * depth, translate: `${dir * d * SPREAD_STEP.x}px ${d * SPREAD_STEP.y}px` }
  }

  return (
    <div className="tabs" role="tablist" aria-label={t('sections.tabs')}>
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
              style={{ top: `calc(9% + ${i} * 68px)`, ...slot(s.id, side) }}
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
              <span className="tab__label">{label(s)}</span>
            </motion.button>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
