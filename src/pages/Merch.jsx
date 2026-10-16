import { AnimatePresence, motion } from 'motion/react'
import { merch, markets } from '../content/merch'
import { site } from '../content/site'
import Artwork from '../components/Artwork'
import Doodle from '../components/Doodle'
import { Mount, Scrap } from '../components/Scrapbook'
import { useSite } from '../SiteContext'
import { playPop } from '../hooks/sound'
import './Merch.css'

export function MerchShelf() {
  const { merchIndex, setMerchIndex } = useSite()
  return (
    <div className="merch-shelf">
      <section className="card merch-box">
        <Mount kind="tape" color="var(--cocoa)" />
        <h2 className="pill-label">
          <Doodle kind="basket" size={26} /> Shop shelf
        </h2>
        <div className="inventory" role="listbox" aria-label="Merch items">
          {merch.map((item, i) => (
            <motion.button
              key={item.id}
              role="option"
              aria-selected={i === merchIndex}
              aria-label={`${item.name}, $${item.price}`}
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
              <span className="inventory__price">${item.price}</span>
              {item.limited && <span className="inventory__limited" title="Limited" />}
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
            <Doodle kind="sun" size={26} /> Market days
          </h2>
        }
      >
        <ul className="markets">
          {markets.map((m) => (
            <li key={m.name}>
              <span className="markets__date">{m.date}</span>
              <span className="markets__info">
                <strong>{m.name}</strong>
                <span className="markets__place">{m.place}</span>
              </span>
            </li>
          ))}
        </ul>
      </Scrap>
    </div>
  )
}

export function MerchFeatured() {
  const { merchIndex, setMerchIndex } = useSite()
  const item = merch[merchIndex]
  const go = (d) => {
    playPop(1.1)
    setMerchIndex((merchIndex + d + merch.length) % merch.length)
  }

  return (
    <div className="merch-featured">
      <div className="merch-featured__stage">
        <button className="chevron chevron--prev" onClick={() => go(-1)} aria-label="Previous item">
          <ChevronIcon />
        </button>

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
            <Artwork src={item.image} alt={item.name} tint={item.tint} doodle={item.doodle} label="product photo" />
            {item.limited && <span className="badge badge--rust merch-featured__limited">Limited</span>}
          </motion.figure>
        </AnimatePresence>

        <button className="chevron chevron--next" onClick={() => go(1)} aria-label="Next item">
          <ChevronIcon />
        </button>
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
                <span className="merch-featured__kind">{item.kind}</span>
                <h3 className="merch-featured__name">{item.name}</h3>
              </div>
              <span className="price">
                <Doodle kind="coin" size={24} /> ${item.price}
              </span>
            </div>
            <p className="merch-featured__desc">{item.description}</p>
          </motion.div>
        </AnimatePresence>
      </Scrap>

      <a className="game-btn game-btn--rust merch-featured__cta" href={site.shopUrl}>
        <Doodle kind="basket" size={22} /> Get it at the shop
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
