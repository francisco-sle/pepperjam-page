import { motion } from 'motion/react'
import { LOCALES, useI18n } from '../i18n'
import { playPop } from '../hooks/sound'
import './LanguageToggle.css'

// EN | ES switch for the menu bar. Each option is named in its own language
// (and marked with `lang`), so screen readers read "Español" in Spanish even
// while the page is in English. The highlight slides over to the pick.
export default function LanguageToggle() {
  const { locale, setLocale, t } = useI18n()
  return (
    <div className="lang-toggle" role="group" aria-label={t('menu.language')}>
      {Object.entries(LOCALES).map(([code, { name }]) => {
        const on = code === locale
        return (
          <button
            key={code}
            lang={code}
            className={`lang-toggle__option ${on ? 'is-on' : ''}`}
            onClick={() => {
              if (on) return
              playPop(1.2)
              setLocale(code)
            }}
            aria-pressed={on}
            aria-label={name}
            title={name}
          >
            {on && (
              <motion.span
                layoutId="lang-toggle-pick"
                className="lang-toggle__pick"
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              />
            )}
            <span className="lang-toggle__code" aria-hidden="true">{code.toUpperCase()}</span>
          </button>
        )
      })}
    </div>
  )
}
