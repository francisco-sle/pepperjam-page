// Hand-drawn cursors that tell the reader a page can be grabbed and turned.
// Exposed as CSS variables (--cursor-grab / --cursor-grabbing) so stylesheets can use them.

const INK = '#6b4a36'
const FILL = '#fffaf3'
const ACCENT = '#e9ad6e'

const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">${body}</svg>`

const outline = `fill="${FILL}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`

// open hand, with a little folded page corner under it
const GRAB = svg(`
  <path d="M19 31 L31 31 L31 19 Z" fill="${ACCENT}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
  <path ${outline} d="M8 15V8.5a2 2 0 0 1 4 0V14V6a2 2 0 0 1 4 0V14V7a2 2 0 0 1 4 0V15V10a2 2 0 0 1 4 0V19c0 5-3.5 8.5-8.5 8.5c-3.4 0-5.4-1.4-7.3-4.3l-3.6-5.6a2 2 0 0 1 3.3-2.2Z"/>
`)

// closed hand, holding the page
const GRABBING = svg(`
  <path d="M19 31 L31 31 L31 19 Z" fill="${ACCENT}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
  <path ${outline} d="M8 16V13a2 2 0 0 1 4 0V16V12a2 2 0 0 1 4 0V16V12.5a2 2 0 0 1 4 0V16V14a2 2 0 0 1 4 0V20c0 4.5-3.5 7.5-8.5 7.5c-3.4 0-5.4-1.4-7-3.8l-2.4-4.2a2 2 0 0 1 3.4-2Z"/>
`)

const url = (s) => `url("data:image/svg+xml,${encodeURIComponent(s.replace(/\s+/g, ' ').trim())}")`

export function installCursors(root = document.documentElement) {
  root.style.setProperty('--cursor-grab', `${url(GRAB)} 15 11, grab`)
  root.style.setProperty('--cursor-grabbing', `${url(GRABBING)} 15 14, grabbing`)
}
