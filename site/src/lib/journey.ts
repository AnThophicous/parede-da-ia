/**
 * The journey runs by itself, slowly, from the first scroll on.
 * Scrolling only accelerates it — and even the top speed is deliberate, never a rush.
 * Progress `p` goes 0 → 1; every scene reads it (and the beat) on its own frame loop.
 */

type Listener = (p: number) => void;

/** Seconds from the first scroll to the install screen at the base speed. */
const BASE_SECONDS = 100;
/** The fastest the visitor can push it (still slow). */
const MAX_SECONDS = 42;
const BASE = 1 / BASE_SECONDS;
const MAX = 1 / MAX_SECONDS;
/** How long a scroll push keeps accelerating, in seconds. */
const BOOST_DECAY = 1.4;

/** Where each scene lives on the progress line. */
export const STAGE = {
  cosmosEnd: 0.16, // stars + small black hole
  horizonEnd: 0.34, // the hole grows, swallows, spaghettifies → black
  darkEnd: 0.4, // darkness, loose particles
  parade: 0.47, // particles read "Parade da IA"
  parede: 0.52, // …and correct themselves into "Parede da IA"
  solidEnd: 0.64, // solid word, hoverable
  eyesTrackEnd: 0.78, // the word breaks into eyes that follow the cursor
  blinkEnd: 0.86, // they look at you and blink
  install: 0.88, // white — install screen
} as const;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** 0 → 1 while p crosses [a, b]. */
export const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

class Journey {
  p = 0;
  started = false;
  private boost = 0;
  private listeners = new Set<Listener>();
  private raf = 0;
  private last = 0;
  private startListeners = new Set<() => void>();

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    fn(this.p);
    return () => void this.listeners.delete(fn);
  }

  onStart(fn: () => void) {
    this.startListeners.add(fn);
    return () => void this.startListeners.delete(fn);
  }

  /** A scroll/swipe/key push. Positive = forward. Starts the journey on the first one. */
  push(amount: number) {
    if (!this.started) {
      this.started = true;
      this.startListeners.forEach((fn) => fn());
      this.loop();
    }
    this.boost = Math.max(-MAX * 1.5, Math.min(MAX * 2, this.boost + amount * MAX));
  }

  /** Jump (skip intro, replay). */
  set(p: number) {
    this.p = clamp01(p);
    this.emit();
  }

  private emit() {
    this.listeners.forEach((fn) => fn(this.p));
  }

  private loop = (now = performance.now()) => {
    const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0;
    this.last = now;
    this.boost *= Math.exp(-dt / BOOST_DECAY);
    const speed = Math.max(-MAX, Math.min(MAX, BASE + this.boost));
    if (this.p < STAGE.install) {
      this.p = Math.min(STAGE.install, Math.max(0, this.p + speed * dt));
      this.emit();
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  stop() {
    cancelAnimationFrame(this.raf);
  }
}

export const journey = new Journey();
