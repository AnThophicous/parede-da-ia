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
  group: 'análise',
  summary: 'Wappalyzer de front-end: estética provável, stack, fontes, paleta, contraste, mídia, efeitos, vitals e rede.',
  usage: `web-scrap [--out arquivo.json] [--max-elements 4000]
  Rode depois de web-wait-page-load. Para capturar recursos de scroll, role antes (web-control scroll-to bottom).
  A linha "estética" aponta o playbook em prompts/aesthetics/ mais próximo da página.`,
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
  group: 'análise',
  summary: 'Disseca o movimento: transições, curvas, @keyframes, GSAP/ScrollTrigger, Lenis, jank e tokens.',
  usage: `web-motion [opções]
  --observe 3            observa por N segundos o que anima (estilos inline/classes) + fps
  --while "<ações>"      ações durante a observação, ex.: "scroll-down 3000 --steps 60"
  --out arquivo.json

Funciona com GSAP/Motion empacotados: a observação registra o que eles escrevem no DOM a cada frame.`,
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
  group: 'análise',
  summary: 'Testa microinterações: hover, :active, foco e efeito magnético de cada interativo, com folha antes/depois.',
  usage: `web-interactions [opções]
  --limit 12             quantos elementos interativos testar (do inventory)
  --selector <css>       testa só este elemento
  --hold 500ms           tempo para as transições terminarem antes de medir
  --no-shots             não captura recortes (mais rápido)`,
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
  group: 'análise',
  summary: 'QA automático em vários viewports: responsivo, a11y, contraste, foco, vitals, peso, console → nota e veredito.',
  usage: `web-audit [opções]
  --viewports desktop,tablet,mobile   presets ou LxA (padrão: desktop,tablet,mobile)
  --full-page            capturas de página inteira por viewport
  --focus-steps 12       quantos Tabs para checar foco visível
  --strict               sai com código 1 se reprovar (CI)

Gera audit.md (relatório) e audit.json na pasta .parede/audit/<data>/.`,
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
    if (values.strict && report.verdict === 'reprovado') process.exitCode = 1;
    return { data: report, text: formatAudit(report) };
  },
};

export const tokens: Command = {
  name: 'web-tokens',
  group: 'análise',
  summary: 'Exporta design tokens (cor, fonte, escala, espaço, raio, sombra, movimento) da página em CSS + JSON.',
  usage: `web-tokens [--out pasta] [--no-motion]
  Útil para auditar consistência do próprio projeto ou estudar o sistema de uma referência
  (estude, não copie: tokens de terceiros são ponto de partida, não entrega).`,
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
      text: [ok(`${count} tokens extraídos de ${s.page.url}`), kv('css', css), kv('json', json), ...set.css.split('\n').slice(2, 14).map((l) => `    ${l.trim()}`), next('compare com os tokens do seu projeto para achar valores fora da escala')].join('\n'),
    };
  },
};
