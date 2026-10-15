// Hand-drawn style SVG doodles used for icons, stickers and image placeholders.
// All drawn on a 64x64 grid with the same chunky ink outline.

const INK = 'var(--ink)'
const C = {
  rust: 'var(--rust)',
  peach: 'var(--peach)',
  matcha: 'var(--matcha)',
  olive: 'var(--olive)',
  mustard: 'var(--mustard)',
  caramel: 'var(--caramel)',
  paper: 'var(--paper)',
  cocoa: 'var(--cocoa)',
}

const shapes = {
  flower: (
    <>
      <path d="M32 38 V58" />
      <path d="M32 50 C24 50 20 44 20 44 C28 42 32 48 32 50Z" fill={C.matcha} />
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={32 + 10 * Math.cos(((a - 90) * Math.PI) / 180)} cy={24 + 10 * Math.sin(((a - 90) * Math.PI) / 180)} r="8" fill={C.paper} />
      ))}
      <circle cx="32" cy="24" r="6" fill={C.mustard} />
    </>
  ),
  strawberry: (
    <>
      <path d="M32 58 C18 50 11 36 15 26 C19 17 45 17 49 26 C53 36 46 50 32 58Z" fill={C.rust} />
      <path d="M20 22 L26 14 L30 20 L34 12 L38 20 L44 14 L46 23 C38 26 26 26 20 22Z" fill={C.matcha} />
      {[[24, 32], [36, 31], [30, 40], [42, 40], [22, 42], [32, 49]].map(([x, y]) => (
        <ellipse key={`${x}${y}`} cx={x} cy={y} rx="1.6" ry="2.4" fill={C.mustard} stroke="none" />
      ))}
    </>
  ),
  jar: (
    <>
      <rect x="18" y="8" width="28" height="10" rx="3" fill={C.mustard} />
      <path d="M15 22 H49 V46 A12 12 0 0 1 37 58 H27 A12 12 0 0 1 15 46Z" fill={C.rust} />
      <path d="M32 46 C32 46 23 41 23 35 A5 5 0 0 1 32 32 A5 5 0 0 1 41 35 C41 41 32 46 32 46Z" fill={C.paper} />
      <path d="M20 27 V40" stroke={C.paper} strokeWidth="2.5" />
    </>
  ),
  pepper: (
    <>
      <path d="M22 18 C40 14 52 26 50 40 C48 52 38 59 26 57 C34 51 38 43 34 34 C30 27 23 25 22 18Z" fill={C.rust} />
      <path d="M22 18 C21 13 24 9 30 8" fill="none" />
      <path d="M17 19 C20 14 27 14 29 19 C25 22 20 22 17 19Z" fill={C.matcha} />
      <path d="M40 26 C44 30 45 36 44 40" stroke={C.paper} strokeWidth="2.5" fill="none" />
    </>
  ),
  mushroom: (
    <>
      <path d="M24 34 H40 V48 A8 8 0 0 1 24 48Z" fill={C.paper} />
      <path d="M7 34 C7 18 19 10 32 10 C45 10 57 18 57 34Z" fill={C.rust} />
      <circle cx="22" cy="23" r="3.5" fill={C.paper} />
      <circle cx="36" cy="18" r="3" fill={C.paper} />
      <circle cx="45" cy="27" r="3.5" fill={C.paper} />
    </>
  ),
  star: (
    <path
      d="M32 7 L39 23 L56 24 L43 35 L47 52 L32 43 L17 52 L21 35 L8 24 L25 23Z"
      fill={C.mustard}
    />
  ),
  sun: (
    <>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <path
          key={a}
          d={`M${32 + 19 * Math.cos((a * Math.PI) / 180)} ${32 + 19 * Math.sin((a * Math.PI) / 180)} L${32 + 27 * Math.cos((a * Math.PI) / 180)} ${32 + 27 * Math.sin((a * Math.PI) / 180)}`}
        />
      ))}
      <circle cx="32" cy="32" r="13" fill={C.mustard} />
    </>
  ),
  blossom: (
    <>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <circle key={`o${a}`} cx={32 + 17 * Math.cos((a * Math.PI) / 180)} cy={32 + 17 * Math.sin((a * Math.PI) / 180)} r="11" strokeWidth="7" />
      ))}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <circle key={`f${a}`} cx={32 + 17 * Math.cos((a * Math.PI) / 180)} cy={32 + 17 * Math.sin((a * Math.PI) / 180)} r="11" fill={C.paper} stroke="none" />
      ))}
      <circle cx="32" cy="32" r="18" fill={C.paper} stroke="none" />
      <circle cx="32" cy="32" r="7" fill={C.mustard} />
    </>
  ),
  maple: (
    <>
      <path d="M32 6 L37 19 L47 13 L45 26 L58 27 L49 36 L53 46 L39 42 L34 54 L32 56 L30 54 L25 42 L11 46 L15 36 L6 27 L19 26 L17 13 L27 19Z" fill="var(--leaf, var(--rust))" />
      <path d="M32 26 V62" />
    </>
  ),
  sparkle: <path d="M32 6 C34 24 40 30 58 32 C40 34 34 40 32 58 C30 40 24 34 6 32 C24 30 30 24 32 6Z" fill={C.mustard} />,
  leaf: (
    <>
      <path d="M12 52 C12 26 30 10 54 10 C54 36 38 52 12 52Z" fill={C.matcha} />
      <path d="M12 52 C24 40 34 30 44 20" fill="none" />
    </>
  ),
  heart: <path d="M32 54 C32 54 8 41 8 24 A12 12 0 0 1 32 18 A12 12 0 0 1 56 24 C56 41 32 54 32 54Z" fill={C.rust} />,
  sprout: (
    <>
      <path d="M32 40 V24" />
      <path d="M32 28 C32 18 22 14 14 16 C14 26 22 30 32 28Z" fill={C.matcha} />
      <path d="M32 26 C32 16 42 10 50 12 C50 22 42 28 32 26Z" fill={C.matcha} />
      <path d="M18 40 H46 L42 58 H22Z" fill={C.caramel} />
      <path d="M16 40 H48" strokeWidth="5" />
    </>
  ),
  frog: (
    <>
      <ellipse cx="32" cy="40" rx="24" ry="17" fill={C.matcha} />
      <circle cx="20" cy="22" r="9" fill={C.matcha} />
      <circle cx="44" cy="22" r="9" fill={C.matcha} />
      <circle cx="20" cy="22" r="3.5" fill={INK} stroke="none" />
      <circle cx="44" cy="22" r="3.5" fill={INK} stroke="none" />
      <path d="M24 42 C28 47 36 47 40 42" fill="none" />
      <ellipse cx="15" cy="40" rx="4" ry="2.5" fill={C.peach} stroke="none" />
      <ellipse cx="49" cy="40" rx="4" ry="2.5" fill={C.peach} stroke="none" />
    </>
  ),
  chick: (
    <>
      <path d="M10 36 C10 20 22 12 34 12 C46 12 54 22 54 34 C54 48 44 56 32 56 C18 56 10 48 10 36Z" fill={C.mustard} />
      <path d="M54 30 L62 33 L54 37Z" fill={C.caramel} />
      <circle cx="42" cy="28" r="3" fill={INK} stroke="none" />
      <path d="M20 38 C26 46 34 44 36 38" fill="none" />
      <ellipse cx="46" cy="38" rx="3.5" ry="2" fill={C.peach} stroke="none" />
      <path d="M30 12 C30 6 36 6 34 12" fill="none" />
    </>
  ),
  basket: (
    <>
      <path d="M16 30 C16 12 48 12 48 30" fill="none" strokeWidth="4" />
      <circle cx="24" cy="28" r="7" fill={C.rust} />
      <circle cx="38" cy="27" r="7" fill={C.mustard} />
      <path d="M8 30 H56 L50 56 H14Z" fill={C.caramel} />
      <path d="M12 40 H52 M14 48 H50" fill="none" strokeWidth="2.5" />
    </>
  ),
  cloud: (
    <path d="M16 46 A10 10 0 0 1 14 26 A12 12 0 0 1 34 18 A12 12 0 0 1 52 28 A9 9 0 0 1 50 46Z" fill={C.paper} />
  ),
  coin: (
    <>
      <circle cx="32" cy="32" r="24" fill={C.mustard} />
      <circle cx="32" cy="32" r="16" fill="none" strokeWidth="2.5" />
      <path d="M36 25 C34 22 26 22 26 32 C26 42 38 42 38 34 H32" fill="none" strokeWidth="3.5" />
    </>
  ),
  palette: (
    <>
      <path d="M32 8 C16 8 8 20 8 32 C8 46 20 56 32 56 C38 56 38 50 36 46 C34 42 38 38 44 40 C52 42 56 38 56 30 C56 16 44 8 32 8Z" fill={C.caramel} />
      <circle cx="22" cy="24" r="4.5" fill={C.rust} />
      <circle cx="34" cy="19" r="4.5" fill={C.mustard} />
      <circle cx="45" cy="26" r="4.5" fill={C.matcha} />
      <circle cx="19" cy="38" r="4.5" fill={C.cocoa} />
    </>
  ),
}

export default function Doodle({ kind = 'flower', size = 48, className = '', title, ...rest }) {
  const shape = shapes[kind] ?? shapes.flower
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`doodle ${className}`}
      fill="none"
      stroke={INK}
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title && <title>{title}</title>}
      {shape}
    </svg>
  )
}

// Social media glyphs (simple, single-color so they sit nicely on the footer).
const socialPaths = {
  instagram: (
    <>
      <rect x="10" y="10" width="44" height="44" rx="13" />
      <circle cx="32" cy="32" r="10" />
      <circle cx="45" cy="19" r="2" fill="currentColor" stroke="none" />
    </>
  ),
  tiktok: <path d="M34 10 V40 A9 9 0 1 1 25 31 M34 10 C35 18 40 23 48 23" />,
  bluesky: (
    <path d="M32 30 C27 20 18 12 12 12 C8 12 8 16 8 20 C8 30 14 34 22 34 C14 36 12 42 18 48 C24 53 30 44 32 38 C34 44 40 53 46 48 C52 42 50 36 42 34 C50 34 56 30 56 20 C56 16 56 12 52 12 C46 12 37 20 32 30Z" />
  ),
  mail: (
    <>
      <rect x="8" y="14" width="48" height="36" rx="6" />
      <path d="M10 18 L32 36 L54 18" />
    </>
  ),
}

export function SocialIcon({ id, size = 22 }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {socialPaths[id]}
    </svg>
  )
}
