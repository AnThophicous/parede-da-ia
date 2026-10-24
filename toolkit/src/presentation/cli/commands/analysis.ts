import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseSequence } from '../../../domain/actions.js';
import { slugFromUrl, stamp } from '../../../domain/naming.js';
import type { AuditReport, InteractionsReport, MotionReport, ScrapReport } from '../../../domain/reports.js';
import { buildTokens } from '../../../domain/tokens.js';
import { parseDuration, parseNumber } from '../../../domain/units.js';
import { auditMarkdown, formatAudit, formatInteractions, formatMotion, formatScrap } from '../../formatters/reports.js';
import { parseViewportList } from './interact.js';
import { kv, next, ok, parse, requireSession, type Command } from './shared.js';

export const scrap: Command = {
  name: 'web-scrap',
  group: 'analysis',
  summary: 'A front-end Wappalyzer: likely aesthetic, stack, fonts, palette, contrast, media, effects, vitals and network.',
  usage: `web-scrap [--out file.json] [--max-elements 4000]
  Run it after web-wait-page-load. To catch scroll-loaded resources, scroll first (web-control scroll-to bottom).
  The "aesthetic" line points to the closest playbook in prompts/aesthetics/.`,
  async execute(argv, ctx) {
    requireSession(ctx);
    const { values } = parse(argv, { out: { type: 'string' }, 'max-elements': { type: 'string' } }, this.usage);
    const result = await ctx.session.call<ScrapReport>('scrap', { maxElements: parseNumber(values['max-elements'], 'max-elements', 4000) });
    const file = values.out ? resolve(values.out) : ctx.artifacts.path('scrap', `${slugFromUrl(result.page.url)}-${stamp()}.json`);
    writeFileSync(file, JSON.stringify(result, null, 2));
    return { data: { file, ...result }, text: formatScrap(result, file) };
  },
};

export const motion: Command = {
  name: 'web-motion',
  group: 'analysis',
  summary: 'Dissects motion: transitions, easings, @keyframes, GSAP/ScrollTrigger, Lenis, jank and tokens.',
  usage: `web-motion [options]
  --observe 3            watches for N seconds what animates (inline styles/classes) + fps
  --while "<actions>"    actions during the observation, e.g. "scroll-down 3000 --steps 60"
  --out file.json

Works with bundled GSAP/Motion: the observation records what they write to the DOM every frame.`,
  async execute(argv, ctx) {
    requireSession(ctx);
    const { values } = parse(argv, { observe: { type: 'string' }, while: { type: 'string' }, out: { type: 'string' } }, this.usage);
    const actions = values.while ? parseSequence(values.while) : [];
    const observeMs = values.observe ? parseDuration(values.observe, 's') : actions.length ? 1000 : 0;
    const result = await ctx.session.call<MotionReport>('motion', { observeMs, actions });
    const file = values.out ? resolve(values.out) : ctx.artifacts.path('motion', `${slugFromUrl(result.url)}-${stamp()}.json`);
    writeFileSync(file, JSON.stringify(result, null, 2));
    return { data: { file, ...result }, text: formatMotion(result, file) };
  },
};

export const interactions: Command = {
  name: 'web-interactions',
  group: 'analysis',
  summary: 'Tests microinteractions: hover, :active, focus and magnetic effect of every interactive element, with a before/after sheet.',
  usage: `web-interactions [options]
  --limit 12             how many interactive elements to test (from the inventory)
  --selector <css>       test only this element
  --hold 500ms           time for the transitions to finish before measuring
  --no-shots             no crops (faster)`,
  async execute(argv, ctx) {
    requireSession(ctx);
    const { values } = parse(argv, { limit: { type: 'string' }, selector: { type: 'string' }, hold: { type: 'string' }, 'no-shots': { type: 'boolean' } }, this.usage);
    const dir = ctx.artifacts.dir('interactions', stamp());
    const result = await ctx.session.call<InteractionsReport>('interactions', {
      dir,
      limit: parseNumber(values.limit, 'limit', 12),
      selector: values.selector,
      holdMs: parseDuration(values.hold ?? '500ms', 'ms'),
      shots: !values['no-shots'],
    });
    const file = resolve(dir, 'interactions.json');
    writeFileSync(file, JSON.stringify(result, null, 2));
    return { data: { file, ...result }, text: formatInteractions(result, file) };
  },
};

export const audit: Command = {
  name: 'web-audit',
  group: 'analysis',
  summary: 'Automatic QA on several viewports: responsive, a11y, contrast, focus, vitals, weight, console → a score and a verdict.',
  usage: `web-audit [options]
  --viewports desktop,tablet,mobile   presets or WxH (default: desktop,tablet,mobile)
  --full-page            full-page captures per viewport
  --focus-steps 12       how many Tabs to check visible focus
  --strict               exits with code 1 when rejected (CI)

Writes audit.md (report) and audit.json to .parede/audit/<date>/.`,
  async execute(argv, ctx) {
    requireSession(ctx);
    const { values } = parse(argv, { viewports: { type: 'string' }, 'full-page': { type: 'boolean' }, 'focus-steps': { type: 'string' }, strict: { type: 'boolean' } }, this.usage);
    const dir = ctx.artifacts.dir('audit', stamp());
    const viewports = parseViewportList(values.viewports ?? 'desktop,tablet,mobile').map((v) => ({ name: v.name, ...v.viewport }));
    const result = await ctx.session.call<AuditReport>('audit', { dir, viewports, fullPage: Boolean(values['full-page']), focusSteps: parseNumber(values['focus-steps'], 'focus-steps', 12) });
    const md = resolve(dir, 'audit.md');
    const report: AuditReport = { ...result, reportFile: md };
    writeFileSync(md, auditMarkdown(report));
    writeFileSync(resolve(dir, 'audit.json'), JSON.stringify(report, null, 2));
    if (values.strict && report.verdict === 'rejected') process.exitCode = 1;
    return { data: report, text: formatAudit(report) };
  },
};

export const tokens: Command = {
  name: 'web-tokens',
  group: 'analysis',
  summary: 'Exports the page design tokens (color, font, scale, space, radius, shadow, motion) as CSS + JSON.',
  usage: `web-tokens [--out folder] [--no-motion]
  Useful to audit your own project's consistency or to study a reference's system
  (study, don't copy: third-party tokens are a starting point, not a deliverable).`,
  async execute(argv, ctx) {
    requireSession(ctx);
    const { values } = parse(argv, { out: { type: 'string' }, 'no-motion': { type: 'boolean' } }, this.usage);
    const s = await ctx.session.call<ScrapReport>('scrap', { maxElements: 4000 });
    const m = values['no-motion'] ? null : await ctx.session.call<MotionReport>('motion', { observeMs: 0, actions: [] });
    const set = buildTokens(s, m);
    const base = values.out ? resolve(values.out) : ctx.artifacts.dir('tokens', `${slugFromUrl(s.page.url)}-${stamp()}`);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(base, { recursive: true });
    const css = resolve(base, 'tokens.css');
    const json = resolve(base, 'tokens.json');
    writeFileSync(css, set.css);
    writeFileSync(json, JSON.stringify(set.json, null, 2));
    const count = Object.values(set.json).reduce((n, g) => n + Object.keys(g).length, 0);
    return {
      data: { css, json, tokens: set.json },
      text: [ok(`${count} tokens extracted from ${s.page.url}`), kv('css', css), kv('json', json), ...set.css.split('\n').slice(2, 14).map((l) => `    ${l.trim()}`), next('compare with your project tokens to find off-scale values')].join('\n'),
    };
  },
};
