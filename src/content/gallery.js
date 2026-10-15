// Gallery pieces. Each spread holds 5 pieces laid out like the wireframe:
// left page = tall + small + tall, right page = wide + small-wide.
// To add real art, drop the file in /public/art and set `image: '/art/your-file.jpg'`.
export const gallery = [
  { id: 'g1', title: 'Strawberry Field Nap', medium: 'Procreate', year: 2025, image: null, tint: 'peach', doodle: 'strawberry', note: 'Bunny + strawberries = a very good afternoon.' },
  { id: 'g2', title: 'Jam Jar Season', medium: 'Gouache', year: 2025, image: null, tint: 'mustard', doodle: 'jar', note: 'Painted while the actual jam was boiling over.' },
  { id: 'g3', title: 'Pepper the Frog', medium: 'Ink & watercolor', year: 2024, image: null, tint: 'matcha', doodle: 'frog', note: 'My sketchbook mascot. He judges every page.' },
  { id: 'g4', title: 'Saturday Market', medium: 'Procreate', year: 2025, image: null, tint: 'caramel', doodle: 'basket', note: 'Everything at the market, but make it tiny.' },
  { id: 'g5', title: 'Mushroom Picnic', medium: 'Colored pencil', year: 2024, image: null, tint: 'peach', doodle: 'mushroom', note: 'A picnic for very small guests.' },
  { id: 'g6', title: 'Rainy Greenhouse', medium: 'Gouache', year: 2024, image: null, tint: 'matcha', doodle: 'sprout', note: 'Rain on glass is the best soundtrack.' },
  { id: 'g7', title: 'Chicken Coop Gossip', medium: 'Procreate', year: 2025, image: null, tint: 'mustard', doodle: 'chick', note: 'They know everything that happens on the farm.' },
  { id: 'g8', title: 'Sunflower Delivery', medium: 'Watercolor', year: 2023, image: null, tint: 'caramel', doodle: 'flower', note: 'Special delivery for whoever needs it today.' },
  { id: 'g9', title: 'Hot Pepper Club', medium: 'Ink', year: 2025, image: null, tint: 'peach', doodle: 'pepper', note: 'Members only. Spicy members only.' },
  { id: 'g10', title: 'Starry Barn', medium: 'Procreate', year: 2024, image: null, tint: 'cocoa', doodle: 'star', note: 'Night shift on the farm.' },
]

export const PIECES_PER_SPREAD = 5
