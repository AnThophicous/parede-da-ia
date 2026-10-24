import type { AuditIssue, Severity } from './reports.js';

/**
 * The audit's scoring rules (pure). Each category starts at 100 and loses
 * points per problem; a problem repeated across viewports counts only once.
 */
const PENALTY: Record<Severity, number> = { error: 14, warning: 5, info: 1 };

export const CATEGORY_WEIGHTS: Record<AuditIssue['category'], number> = {
  accessibility: 0.28,
  responsive: 0.2,
  performance: 0.15,
  console: 0.1,
  content: 0.1,
  seo: 0.1,
  motion: 0.07,
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
  const hasErrors = issues.some((i) => i.severity === 'error');
  return { scores, overall, verdict: (overall >= PASS_SCORE && !hasErrors ? 'approved' : 'rejected') as 'approved' | 'rejected' };
}

/** Performance limits used by the audit (Core Web Vitals + weight budget). */
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
