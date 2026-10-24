# 08 · Designing Machine Learning Systems — Evaluation, Telemetry and Deterministic Loops

<module_meta>
  <source>Designing Machine Learning Systems — Chip Huyen (an original distillation)</source>
  <router_trigger>Load when building AI/LLM features, data pipelines, telemetry, continuous evaluation — and to run the visual QA loop itself as an evaluation system.</router_trigger>
  <enforcement_level>GUIDED — numbers before opinions.</enforcement_level>
  <pairs_with>09 (prompts) · 10 (data) · 06 (automation)</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axioms

1. **Business goal first**, ML metric second. Accuracy without impact is vanity.
2. **ML systems are data systems.** Most failures live in the data.
3. **A simple baseline first** (a rule, a heuristic, a trivial model).
4. **Determinism and reproducibility:** version data, code, prompts, configuration and seeds.
5. **Offline does not guarantee online.** Plan canaries, A/B tests and rollback.
6. **Distributions shift:** monitor inputs and outputs, not only exceptions.
7. **Telemetry is a feature:** input (or a hash), output, version, latency and cost — structured.
8. **Feedback loops** from the model into future data need care (exposure bias).
9. **The same transformation at training and at inference.**
10. **Cost is a metric:** p95 latency, cost per request, tokens.
</core_axioms>

---

<qa_as_ml>
## 2. The visual QA loop as an evaluation system

| Concept | In parede-da-ia |
|---------|-----------------|
| Fixed evaluation set | the `desktop,tablet,mobile` viewports + the interactive elements from `inventory` |
| Metrics | `web-audit` score, contrast failures, invisible focus, `pageFrames.longFrames`, LCP/CLS |
| Baseline | the first `web-audit` + captures before any fix |
| Regression | `web-diff` between iterations (SSIM < 0.95 in an untouched area = regression) |
| Telemetry | `web-scrap`/`web-motion`/`web-audit` JSONs versioned by date |
| Determinism | same viewport/DPR, `--reduced-motion` when the test is not about animation |
</qa_as_ml>

---

<llm_features>
## 3. LLM features
- Golden test cases before iterating on the prompt; an automatic rubric + human sampling.
- The prompt version recorded alongside the answer.
- Fallbacks (a smaller model, a default answer), timeouts and a token budget.
</llm_features>

---

<review_checklist>
## 4. Rubric
- [ ] The success metric is tied to a user/business outcome.
- [ ] The baseline was measured on the same set.
- [ ] Structured logs with the version.
- [ ] Alerts for drift, not only for errors.
- [ ] Rollback tested.
</review_checklist>
