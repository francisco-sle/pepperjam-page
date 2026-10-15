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
  Hover a page corner to see it peel, then drag it over — or swipe on touch screens.
- **Tabs:** like a real divider notebook, tabs of sections you've passed move to the left edge.
- **Gallery:** click a piece to open it in a closer view. You can "heart" favorites (saved in your browser).
- **Merch:** pick an item on the shelf (or use the yellow arrows) to feature it.
- **Sound:** the speaker button in the footer turns on the page-turn sounds (off by default).
- On phones the book shows one page at a time, with bookmarks along the top.
- You can link straight to a section: `#about`, `#gallery`, `#merch`.

## Adding real content

All text and items live in `src/content/`:

| File | What's in it |
| --- | --- |
| `site.js` | name, email, shop link, social links, section names/colors |
| `about.js` | bio, skills (hearts), fun facts, commission button |
| `gallery.js` | artworks (title, medium, year, note) |
| `merch.js` | shop items and upcoming markets |

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
- Fonts are bundled locally via Fontsource: Fredoka (UI) and Gaegu (handwritten notes)
- Plain CSS; colors, outlines, radii and shared building blocks (`.card`, `.pill-label`, `.chip`,
  `.game-btn`) live in `src/styles/global.css`

## Project map

```
src/
  App.jsx              layout, navigation state, keyboard + URL hash
  components/
    Book.jsx           the sketchbook (wraps StPageFlip)
    Tabs.jsx           divider tabs
    SignBoard.jsx      wooden title sign (header)
    Footer.jsx         footer: date, socials, sound
    Scenery.jsx        pastel checker + lace background with falling leaves
    Lightbox.jsx       artwork close-up
    Doodle.jsx         hand-drawn SVG icons
    Artwork.jsx        image or placeholder
  pages/               content of each page (About, Gallery, Merch)
  content/             all editable text/data
```
