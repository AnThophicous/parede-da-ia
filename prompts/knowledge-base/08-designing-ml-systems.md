# 08 · Designing Machine Learning Systems — Avaliação, Telemetria e Loops Determinísticos

<module_meta>
  <source>Designing Machine Learning Systems — Chip Huyen (destilação autoral)</source>
  <router_trigger>Carregar ao construir features com IA/LLM, pipelines de dados, telemetria, avaliação contínua — e para operar o próprio loop de QA visual como um sistema de avaliação.</router_trigger>
  <enforcement_level>GUIDED — números antes de opiniões.</enforcement_level>
  <pairs_with>09 (prompts) · 10 (dados) · 06 (automação)</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axiomas

1. **Objetivo de negócio primeiro**, métrica de ML depois. Acurácia sem impacto é vaidade.
2. **Sistemas de ML são sistemas de dados.** A maior parte das falhas está nos dados.
3. **Baseline simples primeiro** (regra, heurística, modelo trivial).
4. **Determinismo e reprodutibilidade:** versione dados, código, prompts, configuração e sementes.
5. **Offline não garante online.** Planeje canário, A/B e rollback.
6. **Distribuições mudam:** monitore entradas e saídas, não só exceções.
7. **Telemetria é feature:** entrada (ou hash), saída, versão, latência e custo — estruturados.
8. **Feedback loops** do modelo nos dados futuros exigem cuidado (viés de exposição).
9. **Mesma transformação no treino e na inferência.**
10. **Custo é métrica:** p95 de latência, custo por requisição, tokens.
</core_axioms>

---

<qa_as_ml>
## 2. O loop de QA visual como sistema de avaliação

| Conceito | No parede-da-ia |
|----------|-----------------|
| Conjunto de avaliação fixo | viewports `desktop,tablet,mobile` + interativos do `inventory` |
| Métricas | nota do `web-audit`, falhas de contraste, foco invisível, `pageFrames.longFrames`, LCP/CLS |
| Baseline | primeiro `web-audit` + capturas antes das correções |
| Regressão | `web-diff` entre iterações (SSIM < 0.95 em área não tocada = regressão) |
| Telemetria | JSONs de `web-scrap`/`web-motion`/`web-audit` versionados por data |
| Determinismo | mesmo viewport/DPR, `--reduced-motion` quando o teste não é de animação |
</qa_as_ml>

---

<llm_features>
## 3. Features com LLM
- Casos de teste dourados antes de iterar o prompt; rubrica automática + amostragem humana.
- Versão do prompt registrada junto da resposta.
- Fallbacks (modelo menor, resposta padrão), timeouts e orçamento de tokens.
</llm_features>

---

<review_checklist>
## 4. Rubrica
- [ ] Métrica de sucesso ligada a resultado de usuário/negócio.
- [ ] Baseline medido no mesmo conjunto.
- [ ] Logs estruturados com versão.
- [ ] Alerta para drift, não só para erro.
- [ ] Rollback testado.
</review_checklist>
