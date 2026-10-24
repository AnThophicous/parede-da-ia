# 09 · Prompt Engineering for Generative AI — Cinco Princípios, Cadeias e Avaliação

<module_meta>
  <source>Prompt Engineering for Generative AI — James Phoenix & Mike Taylor (O'Reilly, 2024). Destilação autoral; leia o original.</source>
  <router_trigger>Carregar ao escrever system prompts, prompts para outros agentes, pipelines multi-etapa com LLM, avaliações de prompt ou prompts de geração de imagem para assets.</router_trigger>
  <enforcement_level>STRICT — prompt é código: versionado, testado e com formato de saída explícito.</enforcement_level>
  <pairs_with>08 (avaliação) · router.md (que aplica estes princípios a si mesmo)</pairs_with>
</module_meta>

---

<core_thesis>
## 0. A tese do livro

Os autores destilaram técnicas que funcionavam em vários modelos e modalidades (texto e imagem) em **cinco princípios** que devem sobreviver à troca de modelo. A intuição: o que funciona para **gerenciar inteligência humana** (briefing claro, formato combinado, exemplos, revisão e divisão do trabalho) continua funcionando quando a inteligência é artificial.
</core_thesis>

---

<core_axioms>
## 1. Os cinco princípios (com técnicas)

### 1.1 Dê direção
- Descreva o estilo desejado com **referências concretas** em vez de adjetivos ("hierarquia editorial de uma revista de arquitetura suíça", não "moderno e clean").
- Atribua **persona e público** (quem escreve, para quem, com que objetivo).
- Diga o **critério de pronto**.

### 1.2 Especifique o formato
- Declare a forma exata da saída: JSON com schema, YAML, Markdown com seções fixas, diff unificado.
- Separe **instruções, contexto e dados** com delimitadores (tags XML como as deste repositório).
- Formato explícito = saída **parseável e determinística**; para extração e código, temperatura baixa.

### 1.3 Forneça exemplos
- Zero-shot para o trivial; **few-shot (2–5 exemplos variados)** quando o padrão é sutil.
- Exemplos ensinam mais que regras — **e também ensinam os vícios deles**. Varie tamanho, tema e caso de borda.
- Inclua um contraexemplo rotulado quando o erro comum for previsível.

### 1.4 Avalie a qualidade
- Defina critérios e **casos de teste dourados** antes de iterar.
- Compare variações com dados (rubrica pontuada, avaliação em pares, LLM-as-judge com critérios explícitos + amostragem humana).
- Itere a partir de falhas observadas, não de intuição.

### 1.5 Divida o trabalho
- Tarefas complexas viram **cadeias**: planejar → executar → revisar. Cada etapa tem prompt focado e saída verificável.
- Dê "tempo para pensar": peça raciocínio em seção separada da resposta final.
- Decomponha do mais simples ao mais difícil (*least-to-most*) quando a tarefa tem dependências.
</core_axioms>

---

<techniques>
## 2. Técnicas recorrentes do livro (aplicáveis a agentes)

| Técnica | Quando | Forma |
|---------|--------|-------|
| Role prompting | precisa de vocabulário e julgamento de especialista | "Você é um(a) …" + público + objetivo |
| Texto de referência contra alucinação | fatos, APIs, dados do cliente | "Responda só com base em <docs>; se não estiver lá, diga que não sabe" |
| Autoavaliação / crítica | qualidade acima de velocidade | 2ª passada: "liste 3 problemas segundo a rubrica e corrija" |
| Encadeamento (chaining) | tarefas com fases distintas | saída JSON da etapa N vira entrada da N+1 |
| Meta-prompting | gerar/refinar prompts | um modelo escreve o prompt, outro executa, um terceiro avalia |
| Classificação antes de agir | roteamento | "classifique em {A,B,C}; depois siga o protocolo da classe" (é o que o router faz) |
| Recuperação (RAG) | conhecimento grande | buscar só os trechos relevantes (o router carrega módulos sob demanda) |
| Agentes com ferramentas (ReAct) | ações no mundo | pensar → agir com ferramenta → observar → repetir (a toolkit `web-*` é a "mão") |
| Memória e resumo | conversas longas | resumir a etapa em 5 linhas antes de carregar a próxima |
</techniques>

---

<image_prompts>
## 3. Prompts de imagem para assets (quando o usuário escolher assets gerados por IA)

Estrutura: **assunto · ação/composição · estilo/meio · luz · paleta · enquadramento/lente · modificadores de qualidade · formato** + negativos.

```text
assunto: bicicleta urbana encostada em parede de concreto
composição: plano médio, terço esquerdo vazio para texto, horizonte baixo
estilo: fotografia editorial, grão de filme 35mm
luz: fim de tarde, contraluz quente
paleta: azul meia-noite e laranja (#0b1638, #ff6a1a)
formato: 16:9, alta resolução
negativo: texto, logotipos, marcas d'água, mãos deformadas
```
Regras: consistência de personagem/objeto entre imagens (mesma descrição-âncora); **nunca** gere logos ou pessoas reais de terceiros; registre o prompt junto do asset (versão).
</image_prompts>

---

<parede_prompt_contract>
## 4. Como o parede-da-ia aplica os princípios a si mesmo

| Princípio | Onde aparece |
|-----------|--------------|
| Direção | `router.md` §0 (identidade) · playbooks em `aesthetics/` com referências reais |
| Formato | blocos XML em todos os módulos · `templates/*.md` (briefing, direção, motion spec, entrega) |
| Exemplos | few-shot de classificação no router · "ruim → bom" em cada módulo |
| Avaliação | rubricas `<self_evaluation>` · portões de qualidade · notas do `web-audit` |
| Divisão | workflows em fases com verificação entre elas |
</parede_prompt_contract>

---

<prompt_template>
## 5. Template para escrever um prompt de sistema

```xml
<role>Quem o modelo é, para quem trabalha, qual o padrão de qualidade.</role>
<context>Fatos necessários (docs, dados, restrições). Nada além disso.</context>
<task>O que fazer, em etapas numeradas.</task>
<rules>Restrições positivas ("use no máximo 3 cores") e proibições críticas.</rules>
<examples>2–5 exemplos variados + 1 contraexemplo rotulado.</examples>
<output_format>Schema/estrutura exata da resposta.</output_format>
<evaluation>Rubrica que a resposta deve passar antes de ser entregue.</evaluation>
```
</prompt_template>

---

<agent_traps>
## 6. Trava anti-prompt-monolítico

- **Proibido** prompt de 3 páginas com regras contraditórias: modularize e carregue sob demanda.
- **Proibido** "seja criativo e profissional" sem referências, restrições e exemplos.
- **Proibido** uma única chamada para "fazer o site inteiro".
- **Proibido** iterar prompt sem casos de teste fixos (você não saberá se melhorou).
</agent_traps>
