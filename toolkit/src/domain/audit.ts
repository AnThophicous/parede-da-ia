import type { AuditIssue, Severity } from './reports.js';

/**
 * Regras de pontuação da auditoria (puras). Cada categoria começa em 100 e perde
 * pontos por problema; problemas repetidos em vários viewports pesam uma vez só.
 */
const PENALTY: Record<Severity, number> = { erro: 14, aviso: 5, info: 1 };

export const CATEGORY_WEIGHTS: Record<AuditIssue['category'], number> = {
  acessibilidade: 0.28,
  responsivo: 0.2,
  performance: 0.15,
  console: 0.1,
  conteudo: 0.1,
  seo: 0.1,
  movimento: 0.07,
};

export const PASS_SCORE = 85;

export function scoreAudit(issues: AuditIssue[]) {
  const seen = new Set<string>();
  const lost: Record<string, number> = {};
  for (const issue of issues) {
    const key = `${issue.category}:${issue.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    lost[issue.category] = (lost[issue.category] ?? 0) + PENALTY[issue.severity];
  }
  const scores: Record<string, number> = {};
  let overall = 0;
  for (const [category, weight] of Object.entries(CATEGORY_WEIGHTS)) {
    scores[category] = Math.max(0, 100 - (lost[category] ?? 0));
    overall += scores[category] * weight;
  }
  overall = Math.round(overall);
  const hasErrors = issues.some((i) => i.severity === 'erro');
  return { scores, overall, verdict: (overall >= PASS_SCORE && !hasErrors ? 'aprovado' : 'reprovado') as 'aprovado' | 'reprovado' };
}

/** Limites de performance usados pela auditoria (Core Web Vitals + orçamento de peso). */
export const BUDGET = {
  clsWarn: 0.1,
  clsError: 0.25,
  lcpWarnMs: 2500,
  lcpErrorMs: 4000,
  bytesWarn: 5 * 1024 * 1024,
  bytesError: 10 * 1024 * 1024,
  jsWarn: 1024 * 1024,
  fontFilesWarn: 8,
  longTasksWarn: 5,
  tapTargetMin: 24,
  tapTargetComfort: 44,
  mobileTextMin: 12,
};
