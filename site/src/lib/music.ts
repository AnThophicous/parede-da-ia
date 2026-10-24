/**
 * Music made of math: a slow, deliberate, bass-heavy stellar atmosphere, generated live with
 * Web Audio (no samples, no voices). A sub drone and a warm pad follow a 4-chord cycle; a soft
 * heartbeat marks each beat, and only rare, quiet bells reach the highs.
 *
 * The beat clock keeps running when the sound is off, so the visuals stay in sync either way.
 */

type BeatListener = (beat: number) => void;

const BPM = 56;
const BEAT = 60 / BPM;
const BEATS_PER_CHORD = 16;
const LOOKAHEAD = 0.12;

/** A minor, suspended and open: Am(add9) · Fmaj7 · C(add9) · G(sus2) — roots low, voicings wide. */
const CHORDS = [
  { root: 55.0, notes: [110.0, 164.81, 246.94, 261.63] },
  { root: 43.65, notes: [87.31, 130.81, 220.0, 329.63] },
  { root: 65.41, notes: [130.81, 196.0, 293.66, 329.63] },
  { root: 49.0, notes: [98.0, 146.83, 220.0, 293.66] },
];

class Music {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private wet: GainNode | null = null;
  private dry: GainNode | null = null;
  private drone: { osc: OscillatorNode[]; gain: GainNode } | null = null;
  private timer = 0;
  private nextBeat = 0;
  private beat = 0;
  private listeners = new Set<BeatListener>();
  private lastBeatAt = 0;
  muted = false;
  running = false;

  onBeat(fn: BeatListener) {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  }

  /** 0 right on the beat → 1 just before the next one. */
  phase() {
    return Math.min(1, (performance.now() - this.lastBeatAt) / 1000 / BEAT);
  }

  /**
   * Opens the audio context inside a real gesture (pointerdown/keydown on the lever): browsers only
   * allow sound after one, and a drag's pointermove does not count.
   */
  prime() {
    if (this.ctx) return void this.ctx.resume();
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    void this.ctx.resume();
  }

  start(muted = false) {
    if (this.running) return;
    this.running = true;
    this.muted = muted;
    this.prime();
    const ctx = this.ctx;
    if (!ctx) return this.silentClock();

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2600;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.85, ctx.currentTime + 6);
    this.master.connect(tone).connect(comp).connect(ctx.destination);

    const reverb = ctx.createConvolver();
    reverb.buffer = this.impulse(ctx, 5.5);
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.5;
    this.dry = ctx.createGain();
    this.dry.gain.value = 0.7;
    this.wet.connect(reverb).connect(this.master);
    this.dry.connect(this.master);

    this.startDrone(ctx);
    this.startBreath(ctx);
    this.nextBeat = ctx.currentTime + 0.4;
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.85, t + 0.8);
  }

  /** The breaker: a short, heavy mechanical clunk. */
  clunk() {
    const ctx = this.ctx;
    if (!ctx) return;
    const out = ctx.destination;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.18);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(g).connect(out);
    osc.start(t);
    osc.stop(t + 0.4);
    const noise = ctx.createBufferSource();
    noise.buffer = this.noise(ctx, 0.08);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.25, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    const hp = ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.value = 1800;
    noise.connect(hp).connect(ng).connect(out);
    noise.start(t);
  }

  private silentClock() {
    const tick = () => this.fire(this.beat++);
    this.timer = window.setInterval(tick, BEAT * 1000);
    tick();
  }

  private fire(beat: number) {
    this.lastBeatAt = performance.now();
    this.listeners.forEach((fn) => fn(beat));
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx) return;
    while (this.nextBeat < ctx.currentTime + LOOKAHEAD) {
      const beat = this.beat++;
      const at = this.nextBeat;
      if (beat % BEATS_PER_CHORD === 0) this.chord(ctx, CHORDS[(beat / BEATS_PER_CHORD) % CHORDS.length], at);
      this.heartbeat(ctx, at, beat % 4 === 0);
      // Highs are rare and quiet: a bell on a few off-beats of each chord.
      if (beat % BEATS_PER_CHORD === 6 || beat % BEATS_PER_CHORD === 11) this.bell(ctx, CHORDS[Math.floor(beat / BEATS_PER_CHORD) % CHORDS.length], at);
      window.setTimeout(() => this.fire(beat), Math.max(0, (at - ctx.currentTime) * 1000));
      this.nextBeat += BEAT;
    }
  }

  private startDrone(ctx: AudioContext) {
    const gain = ctx.createGain();
    gain.gain.value = 0.22;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 180;
    const osc = [0, 1.002].map((detune) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = CHORDS[0].root * detune;
      o.connect(lp);
      o.start();
      return o;
    });
    // slow breathing of the sub
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = 0.07;
    depth.gain.value = 0.08;
    lfo.connect(depth).connect(gain.gain);
    lfo.start();
    lp.connect(gain).connect(this.dry!);
    this.drone = { osc, gain };
  }

  /** Very quiet filtered noise that swells and recedes: the "space" in the room. */
  private startBreath(ctx: AudioContext) {
    const src = ctx.createBufferSource();
    src.buffer = this.noise(ctx, 4);
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 260;
    bp.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.value = 0.015;
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = 0.045;
    depth.gain.value = 0.012;
    lfo.connect(depth).connect(g.gain);
    lfo.start();
    src.connect(bp).connect(g).connect(this.wet!);
    src.start();
  }

  private chord(ctx: AudioContext, chord: (typeof CHORDS)[number], at: number) {
    const length = BEAT * BEATS_PER_CHORD;
    this.drone?.osc.forEach((o, i) => o.frequency.setTargetAtTime(chord.root * (i ? 1.002 : 1), at, 1.2));
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(420, at);
    lp.frequency.linearRampToValueAtTime(900, at + length * 0.5);
    lp.frequency.linearRampToValueAtTime(380, at + length);
    lp.Q.value = 0.4;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(0.055, at + 3.5);
    env.gain.setValueAtTime(0.055, at + length - 1);
    env.gain.linearRampToValueAtTime(0, at + length + 4);
    lp.connect(env);
    env.connect(this.dry!);
    env.connect(this.wet!);
    for (const f of chord.notes) {
      for (const cents of [-7, 6]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = f;
        o.detune.value = cents;
        o.connect(lp);
        o.start(at);
        o.stop(at + length + 4.2);
      }
    }
  }

  /** The beat everything syncs to: a soft, low pitch-dropping sine, like a distant heart. */
  private heartbeat(ctx: AudioContext, at: number, accent: boolean) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(accent ? 92 : 78, at);
    o.frequency.exponentialRampToValueAtTime(36, at + 0.45);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(accent ? 0.55 : 0.36, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, at + 1.1);
    o.connect(g);
    g.connect(this.dry!);
    o.start(at);
    o.stop(at + 1.2);
  }

  private bell(ctx: AudioContext, chord: (typeof CHORDS)[number], at: number) {
    const f = chord.notes[2 + Math.floor(Math.random() * 2)] * 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.025, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0008, at + 5);
    g.connect(this.wet!);
    for (const [ratio, level] of [[1, 1], [2.76, 0.35], [5.4, 0.12]] as const) {
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.frequency.value = f * ratio;
      og.gain.value = level;
      o.connect(og).connect(g);
      o.start(at);
      o.stop(at + 5.2);
    }
  }

  private noise(ctx: AudioContext, seconds: number) {
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  /** Synthetic hall: darkened, exponentially decaying stereo noise. */
  private impulse(ctx: AudioContext, seconds: number) {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let low = 0;
      for (let i = 0; i < length; i++) {
        low += (Math.random() * 2 - 1 - low) * 0.18; // one-pole lowpass: a dark room
        data[i] = low * (1 - i / length) ** 2.6;
      }
    }
    return buffer;
  }
}

export const music = new Music();
export const BEAT_SECONDS = BEAT;
