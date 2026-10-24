import { useCallback, useEffect, useState } from 'react';
import { Cosmos } from '@/components/Cosmos';
import { Eyes } from '@/components/Eyes';
import { Captions, Hud, ScrollPill } from '@/components/Hud';
import { Install } from '@/components/Install';
import { Lever } from '@/components/Lever';
import { Word } from '@/components/Word';
import { Writing } from '@/components/Writing';
import { journey, STAGE } from '@/lib/journey';
import { music } from '@/lib/music';

type Phase = 'intro' | 'lever' | 'journey' | 'install';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Which scenes are mounted at a given progress (each one only around its own window). */
const scenesAt = (p: number) => ({
  cosmos: p < STAGE.horizonEnd + 0.02,
  word: p > STAGE.horizonEnd - 0.06 && p < STAGE.solidEnd + 0.06,
  eyes: p > STAGE.solidEnd - 0.02,
});

/**
 * The page: a written intro, a breaker that turns the lights and the music on, a slow journey
 * that runs by itself (stars → black hole → darkness → the word → eyes) and the install screen.
 */
export function App() {
  const [phase, setPhase] = useState<Phase>(() => (reducedMotion() ? 'install' : 'intro'));
  const [scenes, setScenes] = useState(() => scenesAt(0));
  const [lightsOn, setLightsOn] = useState(false);

  // Progress decides which scenes exist; reaching the end opens the install screen.
  useEffect(
    () =>
      journey.subscribe((p) => {
        const next = scenesAt(p);
        setScenes((prev) => (prev.cosmos === next.cosmos && prev.word === next.word && prev.eyes === next.eyes ? prev : next));
        if (p >= STAGE.install) setPhase((ph) => (ph === 'journey' ? 'install' : ph));
      }),
    [],
  );

  useEffect(() => {
    document.body.classList.toggle('is-journey', phase !== 'install');
    if (phase === 'install') journey.stop();
  }, [phase]);

  // Scroll, swipe and keys only push the journey forward (or slow it down).
  useEffect(() => {
    if (phase !== 'journey') return;
    let touchY: number | null = null;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? 800 : 1;
      journey.push(Math.max(-2, Math.min(2, (e.deltaY * unit) / 160)));
    };
    const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0]?.clientY ?? null);
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      if (touchY === null || y === undefined) return;
      journey.push(Math.max(-2, Math.min(2, (touchY - y) / 50)));
      touchY = y;
    };
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', ' ', 'End'].includes(e.key)) journey.push(1.2);
      if (['ArrowUp', 'PageUp', 'Home'].includes(e.key)) journey.push(-1.2);
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKey);
    };
  }, [phase]);

  const toLever = useCallback(() => setPhase('lever'), []);
  const turnOn = useCallback((muted: boolean) => {
    music.start(muted);
    setPhase('journey');
    window.setTimeout(() => setLightsOn(true), 40);
  }, []);
  const skip = useCallback(() => {
    if (!music.running) music.start(true);
    journey.set(STAGE.install);
    setPhase('install');
  }, []);

  return (
    <>
      {/* What the page is about, for readers and crawlers that do not take the journey. */}
      <div className="sr-only">
        <h2>Parede da IA — eyes, hands and taste for your AI agent</h2>
        <p>
          An open-source skill for Claude Code, Codex, OpenCode, Cursor, Windsurf and Gemini CLI. It distills 23 books on design and engineering, picks an aesthetic for each
          project, and gives your agent a real browser to open what it builds, scroll, click, record every frame and measure it before calling anything done.
        </p>
      </div>

      {phase === 'intro' && <Writing onDone={toLever} />}
      {phase === 'lever' && <Lever onOn={turnOn} />}

      {phase === 'journey' && (
        <main>
          {scenes.cosmos && <Cosmos />}
          {scenes.word && <Word />}
          {scenes.eyes && <Eyes />}
          {/* the lights come on: everything goes white */}
          <div className="pointer-events-none fixed inset-0 z-[45] bg-paper transition-opacity duration-[1600ms] ease-out" style={{ opacity: lightsOn ? 0 : 1 }} aria-hidden="true" />
          <Captions />
          <ScrollPill />
        </main>
      )}

      {phase === 'install' && <Install onReplay={() => window.location.reload()} />}
      {phase !== 'intro' && <Hud onSkip={phase === 'install' ? undefined : skip} showSound={phase !== 'lever'} />}
    </>
  );
}
