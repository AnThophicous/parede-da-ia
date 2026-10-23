# 08 · Designing Machine Learning Systems — produção, não notebook

> Fonte: *Designing Machine Learning Systems*, Chip Huyen. Destilação autoral para agentes.
> **Carregue quando:** construir features com IA/ML, pipelines de dados, telemetria,
> avaliação de modelos/LLMs ou loops automatizados (incluindo o QA visual desta toolkit).

## Princípios

1. **Comece pelo objetivo de negócio** e só então escolha a métrica de ML. Acurácia sem impacto é vaidade.
2. **Sistemas de ML são sistemas de dados.** A maior parte do trabalho e das falhas está nos dados, não no modelo.
3. **Baseline simples primeiro** (regra, heurística, modelo trivial). Só complique se superar o baseline com margem.
4. **Determinismo e reprodutibilidade:** versione dados, código, configuração e sementes. Um resultado que não se reproduz não existe.
5. **Avaliação offline não garante online.** Planeje shadow deploy, A/B, canário e rollback.
6. **Distribuições mudam** (data drift, concept drift). Monitore entradas e saídas, não só erros HTTP.
7. **Telemetria é feature.** Registre o que entrou, o que saiu, a versão do modelo e a latência — de forma estruturada.
8. **Feedback loops** (o modelo influencia os dados futuros) exigem cuidado: viés de exposição, degenerescência.
9. **Treino e inferência precisam da mesma transformação de features** (evite training–serving skew).
10. **Custos são métricas:** latência p95, custo por requisição e tokens entram na avaliação.

## Checklist de revisão

- [ ] A métrica de sucesso está ligada a um resultado de negócio/usuário?
- [ ] Existe um baseline simples medido no mesmo conjunto de avaliação?
- [ ] Conjunto de avaliação versionado, com casos difíceis e casos de borda?
- [ ] Logs estruturados (JSON) com versão, entrada (ou hash), saída, latência e custo?
- [ ] Há alerta para drift de entrada/saída, não só para exceções?
- [ ] Caminho de rollback testado?
- [ ] Mesma função de pré-processamento no treino e na inferência?

## Aplicação ao loop de QA visual com agentes

O loop da Fase 2 (`workflows/frontend-master.md`) é um pequeno sistema de ML/avaliação:

| Conceito | No loop de QA |
|----------|---------------|
| Dataset de avaliação | conjunto fixo de viewports: 1440x900, 1024x768, 390x844 |
| Métricas | falhas de contraste, erros de console, overflow horizontal, % do grid de 4px |
| Baseline | primeiro `web-scrap` registrado antes das correções |
| Telemetria | JSONs do `web-scrap` + `manifest.json` das gravações, versionados por timestamp |
| Regressão | compare o JSON novo com o baseline: nenhuma métrica pode piorar |
| Determinismo | mesmo viewport/DPR, `--reduced-motion` quando o teste não é de animação |

## Aplicação a features com LLM

- Defina **casos de teste dourados** (entrada → saída esperada/critério) antes de iterar o prompt.
- Use **avaliação automatizada** (asserções de formato, LLM-as-judge com rubrica) + amostragem humana.
- Registre **versão do prompt** junto da resposta; um prompt é código.
- Tenha **fallbacks** (modelo menor, resposta padrão) e timeouts.

## Sinais de alerta

| Sinal | Risco |
|-------|-------|
| "O modelo ficou melhor" sem número | decisão por intuição |
| Avaliação só no conjunto de desenvolvimento | overfitting ao teste |
| Logs em texto livre | impossível agregar/monitorar |
| Nenhum dado de produção volta para avaliação | o sistema não aprende com a realidade |
