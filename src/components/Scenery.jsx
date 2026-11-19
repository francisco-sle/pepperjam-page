import { useEffect, useRef } from 'react'
import Doodle from './Doodle'
import FallingLeaf from './FallingLeaf'
import './Scenery.css'

// Gingham tablecloth with drifting autumn leaves and a few sparkles.
// Purely decorative. Leaves are moved by a tiny per-frame simulation (gusty wind +
// pendulum glide + drag); the shape morph and 3D wobble stay in SVG/CSS.
// dur: rough seconds to cross the screen, sway: seconds per glide swing, tumble: wobble seconds.
const COUNT = 16
const COLORS = ['var(--rust)', 'var(--mustard)', 'var(--peach)', 'var(--matcha)', 'var(--caramel)']
const rand = (min, max) => min + Math.random() * (max - min)
// Each leaf owns a column (shuffled, jittered inside it) so coverage stays even
// without lining up. z = depth: far leaves are smaller, slower and fainter.
const bins = Array.from({ length: COUNT }, (_, i) => i).sort(() => Math.random() - 0.5)
const LEAVES = bins
  .map((bin) => {
    const z = Math.random()
    return {
      bin,
      z,
      size: Math.round(34 + 30 * z),
      kind: Math.random() < 0.55 ? 'maple' : 'elm',
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      dur: rand(20, 25) - 8 * z,
      sway: rand(2.8, 4.8),
      tumble: rand(4, 7.5),
    }
  })
  .sort((a, b) => a.z - b.z) // near leaves render on top
const columnX = (l) => ((l.bin + Math.random()) / COUNT) * window.innerWidth

const SPARKLES = [
  { left: 6, top: 18, size: 26 },
  { left: 93, top: 14, size: 20 },
  { left: 3, top: 62, size: 18 },
  { left: 96, top: 70, size: 28 },
  { left: 12, top: 88, size: 16 },
  { left: 88, top: 42, size: 16 },
]

// Wind in px/s: a slow wander, a quicker ripple, and occasional strong gusts
// whose direction flips every minute or so.
function wind(t) {
  const gust = 150 * Math.max(0, Math.sin(t * 0.11)) ** 8 * Math.sign(Math.sin(t * 0.021) || 1)
  return 22 * Math.sin(t * 0.19) + 12 * Math.sin(t * 0.57 + 2) + gust
}

function useLeafWind(refs) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const W = () => window.innerWidth
    const H = () => window.innerHeight
    const leaves = LEAVES.map((l, i) => ({
      x: columnX(l),
      y: rand(-1.2, 0.5) * H(), // some already on screen, the rest arrive one by one
      vx: 0,
      phase: i * 1.9,
      lift: 0.6 + 0.4 * (30 / l.size), // small leaves catch more air
    }))
    let t = Math.random() * 100
    let last = performance.now()
    let raf
    const step = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05) // clamp after tab switches
      last = now
      t += dt
      leaves.forEach((s, i) => {
        const l = LEAVES[i]
        const el = refs.current[i]
        if (!el) return
        s.phase += (dt * 2 * Math.PI) / l.sway
        const swing = Math.sin(s.phase)
        // wind varies a little with height so neighbours don't move in lockstep
        const w = (wind(t) + 10 * Math.sin(s.y * 0.008 + t * 0.4)) * s.lift
        // drag: horizontal speed eases toward wind + glide instead of snapping to it
        s.vx += (w + swing * 55 - s.vx) * Math.min(1, dt * 1.6)
        // falls fastest mid-swing, almost stalls (even lifts) at the ends; strong gusts hold it up
        const speed = H() / l.dur / 0.8
        const vy = speed * (0.2 + 1.2 * Math.cos(s.phase) ** 2) - Math.max(0, Math.abs(w) - 50) * 0.35
        s.x += s.vx * dt
        s.y += vy * dt
        if (s.y > H() + 80) Object.assign(s, { y: -80, x: columnX(l), vx: w })
        if (s.x < -100) s.x += W() + 200
        if (s.x > W() + 100) s.x -= W() + 200
        el.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`
        // tilt with the swing and lean into the wind
        el.firstChild.style.rotate = `${(38 * swing + (s.vx - swing * 55) * 0.25).toFixed(1)}deg`
      })
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [refs])
}

export default function Scenery() {
  const refs = useRef([])
  useLeafWind(refs)
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
          ref={(el) => (refs.current[i] = el)}
          className="falling"
          style={{ opacity: 0.6 + 0.4 * l.z }}
        >
          <FallingLeaf
            kind={l.kind}
            seed={i * 1.37}
            dur={l.sway}
            color={l.color}
            className="falling__leaf"
            style={{ width: l.size, height: l.size, animationDuration: `${l.tumble}s` }}
          />
        </span>
      ))}
    </div>
  )
}
