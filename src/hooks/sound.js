// Little synthesized sound effects (no audio files needed).
// Muted by default; the footer has a toggle.
let ctx = null
let enabled = false

export function setSoundEnabled(on) {
  enabled = on
}

function audio() {
  if (!enabled) return null
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch {
    return null
  }
}

// Paper "fwip": filtered noise with a sweeping band-pass.
export function playFlip() {
  const ac = audio()
  if (!ac) return
  const dur = 0.45
  const buffer = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  src.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = 0.9
  filter.frequency.setValueAtTime(900, ac.currentTime)
  filter.frequency.exponentialRampToValueAtTime(3800, ac.currentTime + dur * 0.7)
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0.0001, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.22, ac.currentTime + 0.08)
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur)
  src.connect(filter).connect(gain).connect(ac.destination)
  src.start()
}

// Soft "bloop" for buttons and selections.
export function playPop(pitch = 1) {
  const ac = audio()
  if (!ac) return
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(520 * pitch, ac.currentTime)
  osc.frequency.exponentialRampToValueAtTime(880 * pitch, ac.currentTime + 0.08)
  gain.gain.setValueAtTime(0.0001, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.18, ac.currentTime + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.18)
  osc.connect(gain).connect(ac.destination)
  osc.start()
  osc.stop(ac.currentTime + 0.2)
}
