// The words for the About pages live in the dictionaries (src/i18n/locales/*.json,
// under "about"); this file only has what's the same in every language.
export const about = {
  // Put a real photo/self-portrait in /public/art and set e.g. image: '/art/me.jpg'
  image: null,
  name: 'Pepperjam',
  // Stardew-style skill hearts (out of 5). Each id needs a name in about.skills.
  skills: [
    { id: 'illustration', hearts: 5 },
    { id: 'characters', hearts: 5 },
    { id: 'stickers', hearts: 4 },
    { id: 'comics', hearts: 3 },
  ],
  // Each id needs a label and value in about.facts
  facts: ['crop', 'season', 'tools'],
}
