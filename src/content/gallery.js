// Gallery pieces. Each spread holds 5 pieces laid out like the wireframe:
// left page = tall + small + tall, right page = wide + small-wide.
// To add real art, drop the file in /public/art and set `image: '/art/your-file.jpg'`.
// Each piece's title, medium and note go in the dictionaries
// (src/i18n/locales/*.json), under gallery.items.<id>.
export const gallery = [
  { id: 'g1', year: 2025, image: null, tint: 'peach', doodle: 'strawberry' },
  { id: 'g2', year: 2025, image: null, tint: 'mustard', doodle: 'jar' },
  { id: 'g3', year: 2024, image: null, tint: 'matcha', doodle: 'frog' },
  { id: 'g4', year: 2025, image: null, tint: 'caramel', doodle: 'basket' },
  { id: 'g5', year: 2024, image: null, tint: 'peach', doodle: 'mushroom' },
  { id: 'g6', year: 2024, image: null, tint: 'matcha', doodle: 'sprout' },
  { id: 'g7', year: 2025, image: null, tint: 'mustard', doodle: 'chick' },
  { id: 'g8', year: 2023, image: null, tint: 'caramel', doodle: 'flower' },
  { id: 'g9', year: 2025, image: null, tint: 'peach', doodle: 'pepper' },
  { id: 'g10', year: 2024, image: null, tint: 'cocoa', doodle: 'star' },
]

export const PIECES_PER_SPREAD = 5
