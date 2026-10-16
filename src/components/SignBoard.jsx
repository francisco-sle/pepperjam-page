import { useEffect } from 'react'
import { AnimatePresence, motion, useAnimate } from 'motion/react'
import Doodle from './Doodle'
import { site } from '../content/site'
import { useI18n } from '../i18n'
import './SignBoard.css'

// Wooden title sign perched on top of the sketchbook, like a game menu header.
// It gives a little wobble every time the section changes.
export default function SignBoard({ section }) {
  const { t } = useI18n()
  const label = t(`sections.${section.id}`)
  const [board, wobble] = useAnimate()
  useEffect(() => {
    wobble(board.current, { rotate: [0, -1.6, 1.1, -0.5, 0] }, { duration: 0.9, ease: 'easeOut' })
  }, [section.id, board, wobble])

  return (
    <header className="sign-wrap">
      <motion.div
        className="sign"
        initial={{ y: -140, rotate: -4 }}
        animate={{ y: 0, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 130, damping: 12, delay: 0.15 }}
      >
        <div ref={board} className="sign__board">
          <Doodle kind="flower" className="sign__deco sign__deco--r" />
          <div className="sign__panel">
            <h1 className="sign__title">
              <Doodle kind="jar" className="sign__jar" />
              {site.name}
            </h1>
            <div className="sign__sub">
              <AnimatePresence mode="wait" initial={false}>
                {/* swaps with a little hop on a new section, or a new language */}
                <motion.span
                  key={label}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {label}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
      <p className="sr-only">{t('site.tagline')}</p>
    </header>
  )
}
