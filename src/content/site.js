// Global site info. Swap these placeholders for the real ones whenever you're ready.
// (The tagline and anything else in words lives in src/i18n/locales/*.json.)
export const site = {
  name: 'Pepperjam',
  email: 'hello@pepperjam.art',
  shopUrl: '#',
  // each id needs a label in menu.social
  socials: [
    { id: 'instagram', url: '#' },
    { id: 'tiktok', url: '#' },
    { id: 'bluesky', url: '#' },
    { id: 'mail', url: 'mailto:hello@pepperjam.art' },
  ],
}

// The three sketchbook sections, in page order. `color` matches a CSS token in
// global.css; each section's name is under "sections" in the dictionaries.
export const sections = [
  { id: 'about', icon: 'jar', color: 'cocoa' },
  { id: 'gallery', icon: 'flower', color: 'matcha' },
  { id: 'merch', icon: 'strawberry', color: 'mustard' },
]
