let ctx: AudioContext | null = null;
let muted = false;
let crowd: { osc: OscillatorNode; gain: GainNode; lfo: OscillatorNode; lfoGain: GainNode } | null = null;

export function setMuted(on: boolean) {
  muted = on;
  if (on) stopCrowd();
}

export function isMuted() {
  return muted;
}

export function unlockAudio() {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = ctx ?? new AC();
  void ctx.resume();
}

function ready() {
  return !!ctx && ctx.state === "running" && !muted;
}

export function goalNoise() {
  if (!ready() || !ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(392, now);
  osc.frequency.exponentialRampToValueAtTime(784, now + 0.18);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.07, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.46);
  const roar = ctx.createOscillator();
  const roarGain = ctx.createGain();
  roar.type = "sawtooth";
  roar.frequency.setValueAtTime(90, now);
  roarGain.gain.setValueAtTime(0.0001, now);
  roarGain.gain.exponentialRampToValueAtTime(0.04, now + 0.05);
  roarGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
  roar.connect(roarGain);
  roarGain.connect(ctx.destination);
  roar.start(now);
  roar.stop(now + 0.92);
}

export function whistleNoise() {
  if (!ready() || !ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(1800, now);
  osc.frequency.setValueAtTime(2100, now + 0.08);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.24);
}

export function cardNoise() {
  if (!ready() || !ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.035, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.3);
}

export function startCrowd() {
  if (!ready() || !ctx || crowd) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.value = 72;
  lfo.frequency.value = 0.18;
  lfoGain.gain.value = 0.012;
  gain.gain.value = 0.018;
  lfo.connect(lfoGain);
  lfoGain.connect(gain.gain);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  lfo.start();
  crowd = { osc, gain, lfo, lfoGain };
}

export function stopCrowd() {
  if (!crowd) return;
  try {
    crowd.osc.stop();
    crowd.lfo.stop();
  } catch {
    /* already stopped */
  }
  crowd = null;
}

export function bumpCrowd(intensity = 1) {
  if (!crowd || !ctx || muted) return;
  const now = ctx.currentTime;
  const g = crowd.gain.gain;
  g.cancelScheduledValues(now);
  g.setValueAtTime(g.value, now);
  g.linearRampToValueAtTime(0.018 + 0.04 * intensity, now + 0.08);
  g.linearRampToValueAtTime(0.018, now + 1.2);
}
