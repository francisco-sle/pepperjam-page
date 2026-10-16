import { AnimatePresence, motion } from 'motion/react'
import { merch, markets, CURRENCY } from '../content/merch'
import { site } from '../content/site'
import Artwork from '../components/Artwork'
import Doodle from '../components/Doodle'
import { Mount, Scrap } from '../components/Scrapbook'
import { useSite } from '../SiteContext'
import { useI18n } from '../i18n'
import { playPop } from '../hooks/sound'
import './Merch.css'

export function MerchShelf() {
  const { merchIndex, setMerchIndex } = useSite()
  const { t, formatPrice } = useI18n()
  return (
    <div className="merch-shelf">
      <section className="card merch-box">
        <Mount kind="tape" color="var(--cocoa)" />
        <h2 className="pill-label">
          <Doodle kind="basket" size={26} /> {t('merch.shelf')}
        </h2>
        <div className="inventory" role="listbox" aria-label={t('merch.itemsLabel')}>
          {merch.map((item, i) => (
            <motion.button
              key={item.id}
              role="option"
              aria-selected={i === merchIndex}
              aria-label={t('merch.slot', { name: t(`merch.items.${item.id}.name`), price: formatPrice(item.price, CURRENCY) })}
              className={`inventory__slot tint-${item.tint} ${i === merchIndex ? 'is-selected' : ''}`}
              onClick={() => { playPop(1.3); setMerchIndex(i) }}
              whileHover={{ y: -3, rotate: i % 2 ? 2 : -2 }}
              whileTap={{ scale: 0.92 }}
            >
              {item.image ? (
                <Artwork src={item.image} alt="" />
              ) : (
                <Doodle kind={item.doodle} className="inventory__doodle" />
              )}
              <span className="inventory__price">{formatPrice(item.price, CURRENCY)}</span>
              {item.limited && <span className="inventory__limited" title={t('merch.limited')} />}
            </motion.button>
          ))}
        </div>
      </section>

      <Scrap
        kind="lined"
        torn={['bottom']}
        seed={11}
        className="merch-box merch-box--markets"
        label={
          <h2 className="pill-label">
            <Doodle kind="sun" size={26} /> {t('merch.marketsTitle')}
          </h2>
        }
      >
        <ul className="markets">
          {markets.map((m) => (
            <li key={m.id}>
              <MarketDate iso={m.date} />
              <span className="markets__info">
                <strong>{t(`merch.markets.${m.id}.name`)}</strong>
                <span className="markets__place">{t(`merch.markets.${m.id}.place`)}</span>
              </span>
            </li>
          ))}
        </ul>
      </Scrap>
    </div>
  )
}

// A market's day on a little tag, e.g. "OCT 25" / "25 OCT".
function MarketDate({ iso }) {
  const { formatDateParts } = useI18n()
  const [y, m, d] = iso.split('-').map(Number)
  // just the day and month, in the language's order, without its punctuation
  const label = formatDateParts(new Date(y, m - 1, d), { month: 'short', day: '2-digit' })
    .filter((p) => p.type !== 'literal')
    .map((p) => p.value.replace('.', ''))
    .join(' ')
    .toUpperCase()
  return <time className="markets__date" dateTime={iso}>{label}</time>
}

export function MerchFeatured() {
  const { merchIndex, setMerchIndex } = useSite()
  const { t, formatPrice } = useI18n()
  const item = merch[merchIndex]
  const text = t(`merch.items.${item.id}`)
  const go = (d) => {
    playPop(1.1)
    setMerchIndex((merchIndex + d + merch.length) % merch.length)
  }

  return (
    <div className="merch-featured">
      <div className="merch-featured__stage">
        <button className="chevron chevron--prev" onClick={() => go(-1)} aria-label={t('merch.prev')}>
          <ChevronIcon />
        </button>

        {/* the outgoing photo is lifted out while it fades; this box is what
            it's positioned against (a grid cell would offset it twice) */}
        <div className="merch-featured__viewport">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.figure
              key={item.id}
              className="polaroid merch-featured__photo"
              initial={{ opacity: 0, scale: 0.9, rotate: -6 }}
              animate={{ opacity: 1, scale: 1, rotate: 1.5 }}
              exit={{ opacity: 0, scale: 0.9, rotate: 6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              <Mount kind="corners" color="var(--mustard)" />
              <Mount kind="clip" />
              <Artwork src={item.image} alt={text.name} tint={item.tint} doodle={item.doodle} label={t('merch.productPhoto')} />
              {item.limited && <span className="badge badge--rust merch-featured__limited">{t('merch.limited')}</span>}
            </motion.figure>
          </AnimatePresence>
        </div>

        <button className="chevron chevron--next" onClick={() => go(1)} aria-label={t('merch.next')}>
          <ChevronIcon />
        </button>

        {/* only shown on phones, between the arrows (see Merch.css) */}
        <div className="merch-featured__dots" aria-hidden="true">
          {merch.map((m, i) => (
            <span key={m.id} className={i === merchIndex ? 'is-on' : ''} />
          ))}
        </div>
      </div>

      <Scrap kind="plain" torn={['top', 'bottom']} seed={5} className="merch-featured__card">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={item.id}
            className="merch-featured__info"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="merch-featured__row">
              <div>
                <span className="merch-featured__kind">{text.kind}</span>
                <h3 className="merch-featured__name">{text.name}</h3>
              </div>
              <span className="price">
                <Doodle kind="coin" size={24} /> {formatPrice(item.price, CURRENCY)}
              </span>
            </div>
            <p className="merch-featured__desc">{text.description}</p>
          </motion.div>
        </AnimatePresence>
      </Scrap>

      <a className="game-btn game-btn--rust merch-featured__cta" href={site.shopUrl}>
        <Doodle kind="basket" size={22} /> {t('merch.shopCta')}
      </a>
    </div>
  )
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 36" aria-hidden="true">
      <path className="chevron__outline" d="M17 5 L6 18 L17 31" />
      <path className="chevron__fill" d="M17 5 L6 18 L17 31" />
    </svg>
  )
}
