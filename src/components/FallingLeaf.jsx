// A leaf whose outline actually bends, curls and cups while it falls.
// Each shape is drawn upright (stem at the bottom, tip at the top, midrib on x=32).
// We bake FRAMES deformed copies of every path and morph between them with SVG
// <animate> on `d`, so the browser tweens the frames natively.

const FRAMES = 16
const CX = 32
const ROLL = 4 // crease radius

const SHAPES = {
  maple: {
    base: 49,
    pivot: 24,
    maxCurl: 1.3,
    fill: 'M32 4 Q34 13 38 21 Q43 15 50 13 Q49 17 57 19 Q51 27 43 33 Q49 37 53 45 Q44 42 36 46 L32 49 L28 46 Q19 43 11 44 Q15 37 21 33 Q13 26 7 21 Q15 18 14 13 Q21 15 26 21 Q30 13 32 4Z',
    veins: 'M32 61 C31 50 32 30 32 12 M32 41 Q41 33 50 20 M32 41 Q23 33 14 21 M32 46 Q41 43 48 43 M32 46 Q23 43 15 43',
  },
  elm: { base: 54, pivot: 24, maxCurl: 2.9, profile: true },
}

// Long leaf built from a width profile so we can also cut out the folded tip.
const LEN = 50
const N = 18
const width = (s, side) => 12 * Math.sin(Math.PI * s ** 0.75) * (side < 0 ? 1 : 0.9)
const edge = (side, from, to) =>
  Array.from({ length: N + 1 }, (_, i) => {
    const s = from + ((to - from) * i) / N
    return [CX + side * width(s, side), 54 - s * LEN]
  })
const poly = (pts) => 'M' + pts.map((p) => p.join(' ')).join(' L') // M x y L x y ...
SHAPES.elm.fill = poly([...edge(-1, 0, 1), ...edge(1, 1, 0)]) + 'Z'
SHAPES.elm.veins = [
  poly([[CX, 62], ...Array.from({ length: 13 }, (_, i) => [CX, 54 - (i / 12) * LEN * 0.96])]),
  ...[0.14, 0.3, 0.46, 0.62, 0.78].flatMap((s) =>
    [-1, 1].map((side) => {
      const e = s + 0.12
      return poly([[CX, 54 - s * LEN], [CX + side * width(e, side) * 0.45, 54 - (s + 0.07) * LEN], [CX + side * width(e, side) * 0.85, 54 - e * LEN]])
    }),
  ),
].join(' ')

// "M1 2 Q3 4 5 6Z" -> [['M',1,2],['Q',3,4,5,6],['Z']] (absolute M/L/Q/C/Z only).
function parse(d) {
  return [...d.matchAll(/([MLQCZ])([^MLQCZ]*)/g)].map(([, cmd, nums]) => [cmd, ...(nums.match(/-?[\d.]+/g) ?? []).map(Number)])
}

// Bend a point of an upright leaf. u = distance from the leaf base up the midrib.
// cup: edges roll in; curl: radians the tip folds toward the viewer around a crease
// tilted by `tilt` (past ~1.6 it lies back over the leaf); bend: sideways bow of the midrib.
const cupped = ([x, y], cup) => [CX + (x - CX) * (1 - (cup * Math.abs(x - CX)) / 40), y]
const normal = (tilt) => [Math.sin(tilt), -Math.cos(tilt)]
// Signed distance of a (cupped) point past the crease line.
const past = ([x, y], { base, pivot }, tilt) => {
  const [nx, ny] = normal(tilt)
  return (x - CX) * nx + (y - base + pivot) * ny
}

function deform(pt, shape, { curl, bend, cup, tilt }) {
  const u = shape.base - pt[1]
  if (u <= 0) return pt // stem stays put
  let [x, y] = cupped(pt, cup)
  const a = past([x, y], shape, tilt)
  if (a > 0) {
    // roll tightly around the crease, then the rest of the tip carries on flat at the final angle
    const th = Math.min(a / ROLL, curl)
    const shift = ROLL * Math.sin(th) + (a - ROLL * th) * Math.cos(th) - a
    const [nx, ny] = normal(tilt)
    x += shift * nx
    y += shift * ny
  }
  return [x + bend * (u / (shape.base - 4)) ** 2 * 24, y]
}

function frame(segs, shape, p) {
  return segs
    .map(([cmd, ...n]) => {
      const out = []
      for (let i = 0; i < n.length; i += 2) out.push(...deform([n[i], n[i + 1]], shape, p).map((v) => v.toFixed(1)))
      return cmd + out.join(' ')
    })
    .join(' ')
}

// One full loop of poses; periodic so the animation wraps seamlessly.
function poses(seed, maxCurl) {
  return Array.from({ length: FRAMES + 1 }, (_, i) => {
    const t = (i / FRAMES) * Math.PI * 2
    return {
      curl: (0.5 - 0.5 * Math.cos(t + seed)) * maxCurl * (0.85 + 0.15 * (seed % 1)),
      bend: Math.sin(t + seed * 2),
      cup: 0.25 + 0.2 * Math.sin(2 * t + seed),
      tilt: 0.55 * Math.sin(seed * 3) + 0.15 * Math.sin(t),
    }
  })
}

// The part of the tip that has rolled past 90 degrees, i.e. folded over and showing its underside.
function flap(shape, p) {
  const af = (ROLL * Math.PI) / 2 // past this the leaf faces away: we see its underside
  // where each edge crosses that line (edges run base -> tip, so `past` grows with s)
  const cross = (side) => {
    const at = (s) => past(cupped(edge(side, s, s)[0], p.cup), shape, p.tilt) - af
    if (p.curl <= Math.PI / 2 || at(1) <= 0) return 1
    let lo = 0, hi = 1
    for (let i = 0; i < 20; i++) at((lo + hi) / 2) > 0 ? (hi = (lo + hi) / 2) : (lo = (lo + hi) / 2)
    return hi
  }
  const pts = [...edge(-1, cross(-1), 1), ...edge(1, 1, cross(1))].map((pt) => deform(pt, shape, p).map((v) => v.toFixed(1)).join(' '))
  return 'M' + pts.join(' L') + 'Z'
}

const cache = {}
function framesFor(kind, seed) {
  const key = kind + seed
  if (!cache[key]) {
    const shape = SHAPES[kind]
    const ps = poses(seed, shape.maxCurl)
    cache[key] = ['fill', 'veins'].map((k) => {
      const segs = parse(shape[k])
      return ps.map((p) => frame(segs, shape, p)).join(';')
    })
    if (shape.profile) cache[key].push(ps.map((p) => flap(shape, p)).join(';'))
  }
  return cache[key]
}

export default function FallingLeaf({ kind = 'elm', seed = 0, dur = 4, color, className, style }) {
  const [fill, veins, under] = framesFor(kind, seed)
  const anim = (values) => <animate attributeName="d" values={values} dur={`${dur}s`} repeatCount="indefinite" calcMode="spline" keySplines={Array(FRAMES).fill('0.45 0 0.55 1').join(';')} />
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} fill="none" stroke="var(--ink)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={fill.split(';')[0]} fill={color}>{anim(fill)}</path>
      <path d={veins.split(';')[0]} strokeWidth="1.8">{anim(veins)}</path>
      {under && <path d={under.split(';')[0]} fill={`color-mix(in srgb, ${color} 55%, #fff8ee)`}>{anim(under)}</path>}
    </svg>
  )
}
