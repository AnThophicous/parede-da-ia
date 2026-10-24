# Workflow · corporate-briefing

<module_meta>
  <role>Ramo corporativo da Fase 1 do frontend-master. Converte um pedido vago ("site institucional moderno") em um briefing aprovado e uma direção estética econômica.</role>
  <enforcement_level>STRICT — sites corporativos não começam sem briefing respondido. Pergunte mais, suponha menos.</enforcement_level>
  <pairs_with>knowledge-base/19 (marca) · 23 (mensagem) · 15 (grid) · 03 (usabilidade) · 22 (acessibilidade) · aesthetics/corporativo-*.md · produto-saas.md · templates/briefing-corporativo.md</pairs_with>
</module_meta>

---

<why_more_questions>
## 1. Por que o corporativo pergunta mais

Em projetos pessoais e ambiciosos, a personalidade guia. No corporativo, o erro caro é **errar o negócio**: público, prova, conversão, compliance, quem aprova. A estética corporativa vencedora é **econômica**: cada elemento visual paga aluguel com clareza ou confiança `[15][19]`.
</why_more_questions>

---

<briefing_protocol>
## 2. Protocolo (3 mensagens, nesta ordem)

### Mensagem 1 — Briefing (uma única mensagem, numerada, com opções sugeridas)
Envie o questionário de `templates/briefing-corporativo.md`. Regras:
- Agrupe por blocos (Negócio · Público · Marca · Conteúdo · Conversão · Técnica · Compliance · Operação).
- Ofereça **respostas sugeridas** entre parênteses para acelerar ("ex.: gerar leads para demo").
- Marque com ★ as perguntas sem as quais você não pode prosseguir.
- Aceite respostas parciais: preencha o resto com hipóteses **explicitamente marcadas** como `[hipótese]`.

### Mensagem 2 — Estética (depois das respostas)
Apresente **as três famílias corporativas** com um parágrafo cada e diga qual recomenda e por quê:

| Família | Quando vence |
|---------|--------------|
| `corporativo-modernista` | Serviços profissionais, setor público, saúde, finanças, indústria: confiança e clareza acima de tudo. |
| `corporativo-marca` | Marcas com personalidade e cor própria (B2C/B2B2C), mobilidade, varejo, startups maduras. |
| `produto-saas` | Software com demo, planos e onboarding: o produto é o herói. |

Para cada família, mostre: paleta sugerida a partir da marca do cliente, par tipográfico, 1 ideia de hero, 1 microinteração assinatura e o **momento de destaque permitido** (no máximo um por página).

### Mensagem 3 — Plano aprovado
Mapa de seções (com a narrativa de `[23]`: problema → guia → plano → chamada → sucesso), tokens iniciais, stack, critérios de aceite mensuráveis (`web-audit` ≥ 90, LCP ≤ 2,5s, AA em todos os textos) e o que fica fora do escopo. Peça aprovação explícita.
</briefing_protocol>

---

<extra_questions>
## 3. Perguntas extras obrigatórias por setor

| Setor | Pergunte também |
|-------|-----------------|
| Saúde | Há conteúdo regulado (CFM/ANVISA)? Imagens de pacientes têm consentimento? |
| Finanças | Taxas e rentabilidade precisam de disclaimers? Há exigência de BACEN/CVM? |
| Setor público | Precisa seguir e-MAG / WCAG 2.2 AA? Há VLibras? Linguagem simples? |
| Jurídico | Regras da OAB sobre publicidade? Pode haver depoimentos? |
| Educação | Calendário/matrículas? Público inclui menores (LGPD)? |
| Indústria/B2B | Ciclo de venda longo? Materiais técnicos (PDFs, fichas)? Multilíngue? |
| Qualquer um | Quem aprova o layout? Existe manual de marca? Cookies/LGPD e analytics definidos? |
</extra_questions>

---

<anti_patterns>
## 4. Armadilhas (proibido)

- **Template médio:** hero com gradiente roxo genérico, três cards de "benefícios" com ícones aleatórios e depoimento falso.
- **Inventar números, logos de clientes ou depoimentos.** Use placeholders marcados até o cliente fornecer.
- **WebGL decorativo em site corporativo sem justificativa de negócio.** O momento de destaque precisa servir a mensagem.
- **Pular o briefing porque "o usuário parece com pressa".** Ofereça a versão curta (só os ★), nunca nenhuma.
</anti_patterns>

---

<self_evaluation>
## 5. Rubrica antes de seguir para a Fase 2 (0–2 cada; mínimo 8/10)

| Critério | 0 | 1 | 2 |
|----------|---|---|---|
| Objetivo de negócio | ausente | vago | mensurável (ex.: 40 demos/mês) |
| Público e dor | genérico | descrito | com objeções e linguagem do público |
| Conteúdo | inexistente | parcial | real ou com responsáveis e prazos |
| Estética | não escolhida | escolhida sem porquê | escolhida e justificada pela marca/público |
| Aceite | nenhum | subjetivo | métricas da toolkit (audit, LCP, contraste) |
</self_evaluation>
