# 04 · 100 Things Every Designer Needs to Know About People — Percepção, Atenção e Motivação

<module_meta>
  <source>100 Things Every Designer Needs to Know About People — Susan Weinschenk (destilação autoral)</source>
  <router_trigger>Carregar ao decidir foco visual, ápice emocional, persuasão, microcopy, onboarding, densidade de informação e conversão.</router_trigger>
  <enforcement_level>GUIDED — use como lente de decisão; cite a regra quando ela mudar uma escolha.</enforcement_level>
  <pairs_with>05 (hierarquia) · 12 (animação) · 20 (leis de UX) · 23 (mensagem)</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axiomas

### Como as pessoas veem
1. **A periferia define o clima; o centro lê o detalhe.** Fundo, campo de cor e composição são percebidos antes do texto — por isso o gradiente do hero é emoção, e o título é informação.
2. **Rostos e olhares capturam atenção** e conduzem o olhar para onde o rosto olha.
3. **Padrões são reconhecidos antes de serem lidos.** Proximidade, semelhança e região comum criam estrutura sem esforço.
4. **Movimento na periferia é irresistível.** Use para orientar, nunca para competir com a tarefa.
5. **Contraste e tamanho vencem cor** para hierarquia (≈ 8% dos homens têm alguma deficiência de visão de cores).

### Como pensam e lembram
6. **Memória de trabalho é pequena** (≈ 3–4 blocos). Agrupe e revele progressivamente.
7. **Reconhecer é mais fácil que lembrar.** Mostre opções; não peça que digitem do zero.
8. **Modelos mentais vêm de experiências anteriores.** Alinhe a interface ao que o público já conhece.
9. **Histórias e exemplos concretos** são processados e lembrados melhor que abstrações.

### O que motiva
10. **Progresso visível aumenta o engajamento** (gradiente de objetivo).
11. **Surpresa e recompensa variável** prendem atenção — é por isso que microinterações deliciosas funcionam.
12. **Prova social reduz incerteza.** Escassez e exclusividade aumentam valor percebido — use com honestidade.
13. **Escolhas demais paralisam.** Destaque a opção recomendada.
14. **Pessoas decidem pela intuição e justificam depois:** a primeira impressão estética vira credibilidade.
15. **Pico e fim** são o que se lembra de uma experiência.
</core_axioms>

---

<agent_traps>
## 2. Trava anti-manipulação e anti-ruído

- **Proibido** escassez falsa ("só hoje!"), contadores de urgência inventados, prova social fabricada.
- **Proibido** movimento contínuo na periferia enquanto o usuário lê ou preenche um formulário.
- **Proibido** encher a dobra de estímulos concorrentes: **um** ponto focal por seção.
- Personalidade ≠ ruído: o ápice emocional acontece **uma vez** por página.
</agent_traps>

---

<design_engineering>
## 3. Aplicação

| Decisão | Regra | Implementação |
|---------|-------|---------------|
| Onde mora o "uau" | pico-fim (15) | um ápice (shader, morph de partículas, transição) + um final forte (rodapé/CTA) |
| Ritmo da página | atenção (4) e memória (6) | alterne seções densas e respiros; blocos de 3–5 itens |
| Microcopy de botões | modelo mental (8) | verbo + resultado: "Instalar a skill", "Ver os 23 livros" |
| Cursor e hover | feedback (11) | confirmar interatividade antes do clique |
| Fluxos longos | progresso (10) | passos numerados e barra de progresso |
| Planos/opções | escolha (13) | 3 opções, recomendada destacada |
</design_engineering>

---

<review_checklist>
## 4. Rubrica

- [ ] Cada seção tem um único ponto focal (confira na captura: para onde o olho vai primeiro?).
- [ ] Informação agrupada em blocos de 3–5 itens.
- [ ] Movimento orienta (o que mudou, onde olhar) e não compete com leitura.
- [ ] Existe prova social real perto do CTA de conversão.
- [ ] Ápice e final memoráveis identificáveis na spritesheet de scroll.
</review_checklist>

---

<few_shot>
## 5. Exemplo
**Ruim:** quatro cards animando em loop ao lado do formulário de contato.
**Bom:** formulário estático, um depoimento real ao lado, e a animação reservada para a confirmação de envio (recompensa no fim).
</few_shot>
