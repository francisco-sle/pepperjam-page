import { useCallback, useEffect, useMemo, useState } from 'react'
import { MotionConfig, motion } from 'motion/react'
import { sections } from './content/site'
import { pages } from './pages'
import { SiteContext } from './SiteContext'
import Book from './components/Book'
import Tabs from './components/Tabs'
import SignBoard from './components/SignBoard'
import SideMenu from './components/SideMenu'
import Scenery from './components/Scenery'
import Lightbox from './components/Lightbox'
import useMediaQuery from './hooks/useMediaQuery'
import { load, save } from './hooks/storage'
import { setSoundEnabled, playPop } from './hooks/sound'
import './App.css'

const firstPageOf = (sectionId) => Math.max(0, pages.findIndex((p) => p.section === sectionId))
const pageFromHash = () => firstPageOf(window.location.hash.replace('#', '') || sections[0].id)

export default function App() {
  const single = useMediaQuery('(max-width: 820px)')
  const [page, setPage] = useState(pageFromHash)
  const [artIndex, setArtIndex] = useState(null)
  // where the photo was on the page when it was picked up (see Lightbox)
  const [artFrom, setArtFrom] = useState(null)
  const [merchIndex, setMerchIndex] = useState(0)
  const [favorites, setFavorites] = useState(() => load('pj:favorites', []))
  const [soundOn, setSoundOn] = useState(() => load('pj:sound', false))

  // In spread mode we always land on the left page of a spread.
  const view = single ? page : Math.floor(page / 2) * 2
  const sectionIndex = sections.findIndex((s) => s.id === pages[view].section)
  const section = sections[sectionIndex]
  const step = single ? 1 : 2

  const navigate = useCallback((p) => setPage(Math.max(0, Math.min(pages.length - 1, p))), [])
  const goToSection = (i) => navigate(firstPageOf(sections[i].id))

  // Keep the URL hash in sync so sections can be linked (#about, #gallery, #merch).
  useEffect(() => {
    const hash = `#${section.id}`
    if (window.location.hash !== hash) history.replaceState(null, '', hash)
  }, [section.id])

  useEffect(() => {
    const onHash = () => navigate(pageFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [navigate])

  // Arrow keys turn pages (the lightbox handles its own keys while open).
  useEffect(() => {
    if (artIndex != null) return
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, [contenteditable]')) return
      if (e.key === 'ArrowRight') navigate(view + step)
      if (e.key === 'ArrowLeft') navigate(view - step)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [artIndex, view, step, navigate])

  useEffect(() => {
    setSoundEnabled(soundOn)
    save('pj:sound', soundOn)
  }, [soundOn])

  const toggleSound = () => {
    const on = !soundOn
    setSoundOn(on)
    // a little boop so you can hear it's on (and the browser lets audio start)
    if (on) {
      setSoundEnabled(true)
      playPop(1)
    }
  }

  const toggleFavorite = (id) =>
    setFavorites((f) => {
      const next = f.includes(id) ? f.filter((x) => x !== id) : [...f, id]
      save('pj:favorites', next)
      return next
    })

  const openArt = useCallback((i, from = null) => {
    setArtFrom(from)
    setArtIndex(i)
  }, [])

  // the photo that's off the page while it's in the lightbox
  const ctx = useMemo(
    () => ({ openArt, liftedArt: artIndex, merchIndex, setMerchIndex }),
    [openArt, artIndex, merchIndex],
  )

  const viewCount = single ? pages.length : pages.length / 2
  const viewIndex = single ? page : view / 2

  return (
    <MotionConfig reducedMotion="user">
      <SiteContext.Provider value={ctx}>
        <Scenery />
        <div className="app">
          <SideMenu soundOn={soundOn} onToggleSound={toggleSound} />
          <SignBoard section={section} />

          <main className="stage">
            <motion.div
              className="book-wrap"
              initial={{ y: 80, opacity: 0, rotate: -2 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 110, damping: 16 }}
            >
              <Book key={single ? 'single' : 'spread'} pages={pages} page={view} single={single} onNavigate={navigate}>
                <Tabs sections={sections} current={sectionIndex} onSelect={goToSection} single={single} />
                <nav className="pager" aria-label="Pages">
                  <button className="pager__btn" onClick={() => navigate(view - step)} disabled={viewIndex === 0} aria-label="Previous page">
                    <Arrow dir={-1} />
                  </button>
                  <div className="pager__dots">
                    {Array.from({ length: viewCount }, (_, i) => {
                      const p = i * step
                      const s = sections.find((x) => x.id === pages[p].section)
                      return (
                        <button
                          key={i}
                          className={`pager__dot dot--${s.color} ${i === viewIndex ? 'is-on' : ''}`}
                          onClick={() => navigate(p)}
                          aria-label={`${s.label}, page ${p + 1}`}
                          aria-current={i === viewIndex ? 'page' : undefined}
                        />
                      )
                    })}
                  </div>
                  <button className="pager__btn" onClick={() => navigate(view + step)} disabled={viewIndex === viewCount - 1} aria-label="Next page">
                    <Arrow dir={1} />
                  </button>
                </nav>
              </Book>
            </motion.div>
          </main>
        </div>

        <Lightbox
          index={artIndex}
          from={artFrom}
          onClose={() => setArtIndex(null)}
          onChange={setArtIndex}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      </SiteContext.Provider>
    </MotionConfig>
  )
}

function Arrow({ dir }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" style={{ scale: dir > 0 ? '-1 1' : undefined }}>
      <path d="M15 4 L7 12 L15 20" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
