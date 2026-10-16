// Shop items. `limited` shows the little LIMITED badge.
// Each item's name, kind and description go in the dictionaries
// (src/i18n/locales/*.json), under merch.items.<id>.
export const CURRENCY = 'USD'

export const merch = [
  { id: 'm1', price: 6, image: null, tint: 'matcha', doodle: 'frog', limited: false },
  { id: 'm2', price: 15, image: null, tint: 'peach', doodle: 'strawberry', limited: true },
  { id: 'm3', price: 12, image: null, tint: 'mustard', doodle: 'jar', limited: false },
  { id: 'm4', price: 10, image: null, tint: 'caramel', doodle: 'mushroom', limited: false },
  { id: 'm5', price: 22, image: null, tint: 'peach', doodle: 'pepper', limited: true },
  { id: 'm6', price: 14, image: null, tint: 'matcha', doodle: 'sprout', limited: false },
  { id: 'm7', price: 8, image: null, tint: 'cocoa', doodle: 'star', limited: false },
  { id: 'm8', price: 5, image: null, tint: 'mustard', doodle: 'chick', limited: false },
]

// Where to find Pepperjam in person (dates as YYYY-MM-DD; each market's
// name and place go in the dictionaries, under merch.markets.<id>).
export const markets = [
  { id: 'harvest-moon', date: '2026-10-25' },
  { id: 'cozy-craft', date: '2026-11-08' },
  { id: 'winter-star', date: '2026-12-13' },
]
