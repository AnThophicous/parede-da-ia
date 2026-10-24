import { parseArgs, type ParseArgsConfig } from 'node:util';
import { ParedeError } from './errors.js';
import { parseDuration, parseNumber, parsePoint, splitSequence, tokenize } from './units.js';

export type Target = { selector: string } | { x: number; y: number };
export type Point = { x: number; y: number };

export type Action =
  | { type: 'scroll'; direction: 'down' | 'up'; distance?: string; steps: number; intervalMs: number }
  | { type: 'scroll-to'; target: string; steps: number; intervalMs: number; instant: boolean }
  | { type: 'click'; target: Target; button: 'left' | 'right' | 'middle'; count: number; force: boolean }
  | { type: 'hover'; target: Target; holdMs: number }
  | { type: 'mousemove'; path: Point[]; steps: number }
  | { type: 'keypress'; key: string; repeat: number; delayMs: number }
  | { type: 'type'; text: string; delayMs: number }
  | { type: 'wait'; ms: number }
  | { type: 'inventory'; limit: number }
  | { type: 'drag'; from: Target; to: Point; relative: boolean; steps: number; holdMs: number };

export const ACTION_HELP = `Actions:
  scroll-down [px|Nvh] [--steps 10] [--interval 60ms]   real wheel scrolling (GSAP/Lenis/ScrollTrigger)
  scroll-up   [px|Nvh] [--steps 10] [--interval 60ms]
  scroll-to   <top|bottom|Y|selector> [--instant]         scrolls progressively to the target
  click       <selector|x,y> [--button left] [--count 1] [--force]
  hover       <selector|x,y> [--hold 400ms]                holds the hover so transitions can finish
  mousemove   <x,y> [x,y ...] [--steps 20]                 a real cursor path (magnetic effects)
  keypress    <key> [--repeat 1] [--delay 80ms]            e.g. Enter, Escape, ArrowDown, Control+K
  type        <text> [--delay 40ms]
  wait        <duration>                                   e.g. 0.5, 500ms, 2s
  drag        <selector|x,y> <x,y|+dx,+dy> [--steps 25]    drags with a real mouse (canvas, sliders, loose cards)
  inventory   [--limit 120]                                lists interactive elements and selectors
  sequence    "<action>; <action>; ..."                    chains actions in the same call`;

const toTarget = (raw: string | undefined, action: string): Target => {
  if (!raw) throw new ParedeError('BAD_ARG', `"${action}" needs a target (a CSS selector or x,y).`);
  return parsePoint(raw) ?? { selector: raw };
};

/** Turns command-line tokens (e.g. ["click", "#cta"]) into a typed Action. */
export function parseAction(tokens: string[]): Action {
  const [name, ...rest] = tokens;
  if (!name) throw new ParedeError('BAD_ARG', 'No action given.', ACTION_HELP);

  const parse = <T extends NonNullable<ParseArgsConfig['options']>>(options: T) => {
    try {
      return parseArgs({ args: rest, options, allowPositionals: true, strict: true });
    } catch (err) {
      throw new ParedeError('BAD_ARG', `${name}: ${(err as Error).message}`, ACTION_HELP);
    }
  };

  switch (name) {
    case 'scroll-down':
    case 'scroll-up': {
      const { values, positionals } = parse({
        distance: { type: 'string' },
        steps: { type: 'string' },
        interval: { type: 'string' },
      });
      return {
        type: 'scroll',
        direction: name === 'scroll-down' ? 'down' : 'up',
        distance: values.distance ?? positionals[0],
        steps: Math.max(1, parseNumber(values.steps, 'steps', 10)),
        intervalMs: parseDuration(values.interval ?? '60ms', 'ms'),
      };
    }
    case 'scroll-to': {
      const { values, positionals } = parse({
        steps: { type: 'string' },
        interval: { type: 'string' },
        instant: { type: 'boolean' },
      });
      if (!positionals[0]) throw new ParedeError('BAD_ARG', 'scroll-to needs a target: top, bottom, Y or a selector.');
      return {
        type: 'scroll-to',
        target: positionals[0],
        steps: Math.max(1, parseNumber(values.steps, 'steps', 120)),
        intervalMs: parseDuration(values.interval ?? '40ms', 'ms'),
        instant: Boolean(values.instant),
      };
    }
    case 'click': {
      const { values, positionals } = parse({
        button: { type: 'string' },
        count: { type: 'string' },
        force: { type: 'boolean' },
      });
      const button = (values.button ?? 'left') as 'left' | 'right' | 'middle';
      if (!['left', 'right', 'middle'].includes(button)) throw new ParedeError('BAD_ARG', `Invalid --button: ${button}`);
      return {
        type: 'click',
        target: toTarget(positionals.join(' ') || undefined, name),
        button,
        count: Math.max(1, parseNumber(values.count, 'count', 1)),
        force: Boolean(values.force),
      };
    }
    case 'hover': {
      const { values, positionals } = parse({ hold: { type: 'string' } });
      return {
        type: 'hover',
        target: toTarget(positionals.join(' ') || undefined, name),
        holdMs: parseDuration(values.hold ?? '400ms', 'ms'),
      };
    }
    case 'mousemove': {
      const { values, positionals } = parse({ steps: { type: 'string' } });
      const path = positionals.map((p) => {
        const point = parsePoint(p);
        if (!point) throw new ParedeError('BAD_ARG', `mousemove expects "x,y" points (got "${p}").`);
        return point;
      });
      if (!path.length) throw new ParedeError('BAD_ARG', 'mousemove needs at least one x,y point.');
      return { type: 'mousemove', path, steps: Math.max(1, parseNumber(values.steps, 'steps', 20)) };
    }
    case 'keypress': {
      const { values, positionals } = parse({ repeat: { type: 'string' }, delay: { type: 'string' } });
      if (!positionals[0]) throw new ParedeError('BAD_ARG', 'keypress needs a key (e.g. Enter, Escape, Control+K).');
      return {
        type: 'keypress',
        key: positionals[0],
        repeat: Math.max(1, parseNumber(values.repeat, 'repeat', 1)),
        delayMs: parseDuration(values.delay ?? '80ms', 'ms'),
      };
    }
    case 'type': {
      const { values, positionals } = parse({ delay: { type: 'string' } });
      return { type: 'type', text: positionals.join(' '), delayMs: parseDuration(values.delay ?? '40ms', 'ms') };
    }
    case 'wait': {
      const { positionals } = parse({});
      return { type: 'wait', ms: parseDuration(positionals[0] ?? '0.5', 's') };
    }
    case 'inventory': {
      const { values } = parse({ limit: { type: 'string' } });
      return { type: 'inventory', limit: parseNumber(values.limit, 'limit', 120) };
    }
    case 'drag': {
      const { values, positionals } = parse({ steps: { type: 'string' }, hold: { type: 'string' } });
      const [fromRaw, toRaw] = positionals;
      if (!fromRaw || !toRaw) throw new ParedeError('BAD_ARG', 'drag needs a source and a destination: drag <selector|x,y> <x,y|+dx,+dy>.');
      const relative = /^[+-]/.test(toRaw);
      const to = parsePoint(toRaw.replace(/^\+/, '').replace(/,\+/, ','));
      if (!to) throw new ParedeError('BAD_ARG', `Invalid drag destination: "${toRaw}" (use 400,300 or +120,-40).`);
      return {
        type: 'drag',
        from: toTarget(fromRaw, name),
        to,
        relative,
        steps: Math.max(2, parseNumber(values.steps, 'steps', 25)),
        holdMs: parseDuration(values.hold ?? '120ms', 'ms'),
      };
    }
    default:
      throw new ParedeError('BAD_ARG', `Unknown action: "${name}".`, ACTION_HELP);
  }
}

/** "scroll-down 800; wait 0.5; click #cta" → Action[] */
export function parseSequence(source: string): Action[] {
  return splitSequence(source).map((segment) => parseAction(tokenize(segment)));
}

export function describeAction(action: Action): string {
  switch (action.type) {
    case 'scroll':
      return `scroll-${action.direction} ${action.distance ?? 'auto'} (${action.steps} steps)`;
    case 'scroll-to':
      return `scroll-to ${action.target}`;
    case 'click':
    case 'hover':
      return `${action.type} ${'selector' in action.target ? action.target.selector : `${action.target.x},${action.target.y}`}`;
    case 'mousemove':
      return `mousemove ${action.path.map((p) => `${p.x},${p.y}`).join(' → ')}`;
    case 'keypress':
      return `keypress ${action.key}${action.repeat > 1 ? ` ×${action.repeat}` : ''}`;
    case 'type':
      return `type "${action.text.slice(0, 30)}"`;
    case 'wait':
      return `wait ${action.ms}ms`;
    case 'inventory':
      return 'inventory';
    case 'drag':
      return `drag ${'selector' in action.from ? action.from.selector : `${action.from.x},${action.from.y}`} → ${action.relative ? '+' : ''}${action.to.x},${action.to.y}`;
  }
}
