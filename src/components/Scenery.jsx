import Doodle from './Doodle'
import './Scenery.css'

// Gingham tablecloth with drifting autumn leaves and a few sparkles.
// Purely decorative and CSS-animated so it stays light.
const LEAVES = [
  { left: 4, delay: 0, dur: 16, size: 30, kind: 'maple', color: 'var(--rust)' },
  { left: 14, delay: 7, dur: 19, size: 22, kind: 'leaf', color: 'var(--matcha)' },
  { left: 27, delay: 3, dur: 17, size: 26, kind: 'maple', color: 'var(--mustard)' },
  { left: 46, delay: 10, dur: 21, size: 20, kind: 'leaf', color: 'var(--matcha)' },
  { left: 63, delay: 1.5, dur: 18, size: 28, kind: 'maple', color: 'var(--peach)' },
  { left: 78, delay: 6, dur: 16, size: 24, kind: 'maple', color: 'var(--rust)' },
  { left: 90, delay: 12, dur: 20, size: 22, kind: 'leaf', color: 'var(--matcha)' },
  { left: 97, delay: 4, dur: 18, size: 26, kind: 'maple', color: 'var(--mustard)' },
]

const SPARKLES = [
  { left: 6, top: 18, size: 26 },
  { left: 93, top: 14, size: 20 },
  { left: 3, top: 62, size: 18 },
  { left: 96, top: 70, size: 28 },
  { left: 12, top: 88, size: 16 },
  { left: 88, top: 42, size: 16 },
]

export default function Scenery() {
  return (
    <div className="scenery" aria-hidden="true">
      {SPARKLES.map((s, i) => (
        <Doodle
          key={i}
          kind="sparkle"
          className="scenery__sparkle"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${i * 0.7}s` }}
        />
      ))}

      {LEAVES.map((l, i) => (
        <span
          key={i}
          className="falling"
          style={{ left: `${l.left}%`, animationDelay: `${l.delay}s`, animationDuration: `${l.dur}s` }}
        >
          <Doodle
            kind={l.kind}
            className="falling__leaf"
            style={{ width: l.size, height: l.size, '--leaf': l.color, '--matcha': l.color, animationDelay: `${l.delay}s` }}
          />
        </span>
      ))}
    </div>
  )
}
