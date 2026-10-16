// Little synthesized sound effects (no audio files needed).
// Muted by default; the side menu has a toggle.
//
// Everything goes through one quiet master bus with a low-pass filter, so
// nothing is ever sharp or loud: paper turns are a soft, low "shff" and
// buttons a gentle wooden "boop".
let ctx = null
let bus = null
let noise = null
let enabled = false

export function setSoundEnabled(on) {
  enabled = on
}

function audio() {
  if (!enabled) return null
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)()
      const gain = ctx.createGain()
      gain.gain.value = 0.55
      const tone = ctx.createBiquadFilter()
      tone.type = 'lowpass'
      tone.frequency.value = 2600
      tone.Q.value = 0.5
      const limiter = ctx.createDynamicsCompressor()
      limiter.threshold.value = -18
      limiter.ratio.value = 6
      gain.connect(tone).connect(limiter).connect(ctx.destination)
      bus = gain
    }
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch {
    return null
  }
}

// Run `play(ac, t)` once the context can actually make sound. Browsers start
// it suspended until a click; scheduling before it resumes gets cut off.
function whenReady(play) {
  const ac = audio()
  if (!ac) return
  if (ac.state === 'running') play(ac, ac.currentTime + 0.005)
  else ac.resume().then(() => play(ac, ac.currentTime + 0.005), () => {})
}

// Brown-ish noise (softer and lower than white noise), made once and reused.
function paperNoise(ac) {
  if (noise) return noise
  const len = Math.floor(ac.sampleRate * 0.8)
  noise = ac.createBuffer(1, len, ac.sampleRate)
  const data = noise.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    last = (last + 0.06 * (Math.random() * 2 - 1)) / 1.06
    data[i] = last * 3.2
  }
  return noise
}

let lastFlip = 0

// Paper turning: a low, breathy swish that rises a little and fades out.
// Quick turns in a row (riffling to another section) get shorter and quieter.
export function playFlip() {
  whenReady((ac, t) => {
    const quick = t - lastFlip < 0.6
    lastFlip = t
    const dur = quick ? 0.28 : 0.5
    const peak = quick ? 0.16 : 0.26

    const src = ac.createBufferSource()
    src.buffer = paperNoise(ac)
    src.playbackRate.value = 0.9 + Math.random() * 0.2
    const filter = ac.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.value = 0.6
    filter.frequency.setValueAtTime(380, t)
    filter.frequency.exponentialRampToValueAtTime(1200, t + dur * 0.55)
    filter.frequency.exponentialRampToValueAtTime(600, t + dur)
    const gain = ac.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(peak, t + dur * 0.35)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(filter).connect(gain).connect(bus)
    src.start(t)
    src.stop(t + dur + 0.05)
  })
}

// Soft "boop" for buttons and selections: a sine that dips slightly in pitch.
export function playPop(pitch = 1) {
  whenReady((ac, t) => {
    // keep every pop in a mellow range, whatever pitch it's asked for
    const f = 330 * Math.min(1.35, Math.max(0.8, pitch))
    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(f * 1.25, t)
    osc.frequency.exponentialRampToValueAtTime(f, t + 0.07)
    const gain = ac.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.16, t + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
    osc.connect(gain).connect(bus)
    osc.start(t)
    osc.stop(t + 0.25)
  })
}
