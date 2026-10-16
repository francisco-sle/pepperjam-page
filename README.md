# Pepperjam 🍓

Artist site for **Pepperjam**: a spiral-bound sketchbook styled like a cozy farming-game menu (inspired by Stardew Valley).
The book has three sections (**About me**, **Gallery**, **Merch**) that you reach by turning pages.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

To check a production build: `npm run build && npm run preview`.

## How to use the sketchbook

- **Turn pages:** use the side tabs, the ◀ ▶ buttons and dots on the bottom edge, or the ← → keys.
  With a mouse, the outer edge of a page shows a hand cursor: hover its corner to lift it, click the
  corner to turn, or press and drag the page over (a quick flick works too). On touch screens, swipe
  left/right anywhere on the page. Clicks on photos, buttons and links never turn the page.
- **Tabs:** like a real divider notebook, tabs of sections you've passed move to the left edge.
- **Gallery:** click a piece to open it in a closer view. You can "heart" favorites (saved in your browser).
- **Merch:** pick an item on the shelf (or use the yellow arrows) to feature it.
- **Sound:** the speaker button at the bottom of the side menu turns on the (soft) page-turn sounds (off by default).
- **Language:** the EN | ES switch in the side menu swaps the whole site between English and Spanish.
  The first visit picks the visitor's browser language (English if it's neither); after that their
  choice is remembered.
- On phones the book shows one page at a time, with bookmarks along the top.
- You can link straight to a section: `#about`, `#gallery`, `#merch`.

## Adding real content

The things on the site live in `src/content/`, and the words, in both languages, live in one
dictionary per language: `src/i18n/locales/en.json` and `src/i18n/locales/es.json`.

| File | What's in it |
| --- | --- |
| `site.js` | name, email, shop link, social links, section colors |
| `about.js` | photo, skills (hearts), which fun facts to show |
| `gallery.js` | artworks (id, year, image, colors) |
| `merch.js` | shop items (id, price, image, colors) and upcoming market dates |
| `en.json` / `es.json` | every piece of text: bio, titles, notes, item names and descriptions, buttons… |

Items are tied to their words by `id`. For example, a new gallery piece `{ id: 'g11', … }` in
`gallery.js` gets its title, medium and note under `"gallery"` → `"items"` → `"g11"` in **both**
dictionaries. Text in `{curly braces}` (like `{title}`) is filled in by the site, so keep those as they are.

After editing, run `npm run i18n:check`: it lists anything missing from a dictionary or that doesn't
match between the two. (While `npm run dev` is running, a missing Spanish text shows the English one
and logs a warning in the browser console.)

Prices and market dates are written by the site in each language's style (`$6`, `OCT 25` / `25 OCT`).

**Images:** put files in `public/art/` and set the `image` field, e.g. `image: '/art/frog.jpg'`.
Anything with `image: null` shows a gingham placeholder with a doodle.

The gallery fills spreads 5 pieces at a time (3 on the left page, 2 on the right), so adding
more pieces to `gallery.js` adds more pages automatically.

## Tech

- [Vite](https://vite.dev) + React
- [StPageFlip](https://github.com/Nodlik/StPageFlip) (`page-flip`) for the page turn: realistic
  soft-page folding with shadows, corner peel, drag/swipe, and single-page mode on phones.
  `Book.jsx` renders each page's React content into PageFlip's page elements via portals.
- [Motion](https://motion.dev) for the springy UI (tabs, sign, lightbox)
- Fonts are bundled locally via Fontsource: Fredoka (UI) and Gaegu (handwritten notes). Gaegu has
  no accented letters, so Patrick Hand fills in á, ñ, ¿… in Spanish notes.
- Translations: a small built-in setup in `src/i18n/` (no library). `useI18n()` gives components
  `t('some.key', { vars })`, the current `locale` and `setLocale`, plus price/date formatters
  (`Intl`). It also keeps `<html lang>`, the page title and the meta description in sync.
- Plain CSS; colors, outlines, radii and shared building blocks (`.card`, `.pill-label`, `.chip`,
  `.game-btn`) live in `src/styles/global.css`

## Project map

```
src/
  App.jsx              layout, navigation state, keyboard + URL hash
  components/
    Book.jsx           the sketchbook (wraps StPageFlip)
    pageInput.js       mouse/touch handling for turning pages (grab zones, corner lift, drag, swipe)
    cursors.js         hand-drawn grab / grabbing cursors
    Tabs.jsx           divider tabs
    SignBoard.jsx      wooden title sign (header)
    SideMenu.jsx       lace-trimmed side menu: date, socials, language, sound
    LanguageToggle.jsx EN | ES switch
    Scrapbook.jsx      torn paper scraps and photo mounts (tape, corners, pin, clip)
    Scenery.jsx        pastel checker + lace background with falling leaves
    Lightbox.jsx       artwork close-up
    Doodle.jsx         hand-drawn SVG icons
    Artwork.jsx        image or placeholder
  pages/               content of each page (About, Gallery, Merch)
  i18n/                language switching: index.jsx (provider + useI18n), translate.js
    locales/           one dictionary per language (en.json, es.json)
  content/             editable data (photos, prices, dates…), words are in i18n/locales
```
