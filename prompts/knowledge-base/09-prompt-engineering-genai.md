# 09 · Prompt Engineering for Generative AI — prompts como engenharia

> Fonte: *Prompt Engineering for Generative AI*, James Phoenix & Mike Taylor.
> Destilação autoral para agentes. **Carregue quando:** escrever system prompts, prompts de
> geração de imagem/código, pipelines multi-etapa com LLM ou instruções para outros agentes.

## Os cinco princípios (resumo operacional)

1. **Dê direção.** Descreva o estilo, o público, o papel e o padrão de qualidade. Referências
   concretas ("no estilo editorial de uma revista de arquitetura") valem mais que adjetivos.
2. **Especifique o formato.** Diga exatamente a forma da saída (JSON com schema, Markdown com
   seções X/Y, diff unificado). Formato explícito torna a saída **determinística e parseável**.
3. **Forneça exemplos.** Zero-shot para tarefas triviais; few-shot (2–5 exemplos variados) quando
   o padrão é sutil. Exemplos ensinam mais que regras — e também ensinam os erros deles.
4. **Avalie a qualidade.** Crie critérios e casos de teste; compare variações de prompt com
   dados, não com impressão. Itere com base em falhas observadas.
5. **Divida o trabalho.** Tarefas complexas viram cadeias: planejar → executar → revisar.
   Cada etapa tem um prompt focado e uma saída verificável.

## Técnicas práticas

- **Separação clara** entre instruções, contexto e dados (tags XML ou blocos delimitados).
- **Pensar antes de responder** em tarefas de raciocínio; peça o raciocínio em seção separada da resposta final.
- **Restrições positivas** ("use no máximo 3 cores") funcionam melhor que listas de proibições.
- **Persona + público:** quem escreve e para quem muda vocabulário, profundidade e tom.
- **Auto-crítica:** uma segunda passada com rubrica ("liste 3 problemas e corrija") eleva a qualidade.
- **Contexto sob demanda (RAG):** recupere só o necessário — o mesmo princípio deste router.
- **Temperatura:** baixa para extração/código/formatos; mais alta para ideação e variações.

## Checklist de revisão de um prompt

- [ ] O objetivo e o critério de "pronto" estão explícitos?
- [ ] O formato de saída está especificado (idealmente com exemplo ou schema)?
- [ ] Instruções, contexto e dados estão separados por delimitadores?
- [ ] Há exemplos quando o padrão desejado não é óbvio — e eles são diversos?
- [ ] A tarefa cabe em uma etapa ou deveria ser decomposta?
- [ ] Existem casos de teste para comparar versões do prompt?
- [ ] O prompt tem uma única fonte de verdade (versionado no repositório)?

## Template de decomposição para direção de arte

```
Etapa 1 — Análise (saída: JSON)
  Entrada: resultado do web-scrap + screenshots da referência
  Saída: { "tipografia": ..., "paleta": ..., "grid": ..., "movimento": ..., "ápice": ... }

Etapa 2 — Direções criativas (saída: 3 opções em Markdown)
  Entrada: JSON da etapa 1 + objetivo do usuário
  Saída: para cada opção → conceito em 1 frase, moodboard verbal, tokens, risco

Etapa 3 — Especificação (saída: tokens CSS + estrutura de seções)
  Entrada: opção escolhida pelo usuário

Etapa 4 — Implementação e QA (saída: código + evidência visual)
```

## Sinais de alerta

| Sinal | Correção |
|-------|----------|
| Prompt de 3 páginas com regras contraditórias | modularize e carregue sob demanda |
| "Seja criativo e profissional" | direção concreta: referências, restrições, exemplos |
| Saída diferente a cada execução em tarefa de formato | formato explícito + temperatura baixa + exemplo |
| Uma única chamada para "fazer o site inteiro" | cadeia de etapas com verificação entre elas |
