# 18 · The Design of Everyday Things — Affordances, Significantes, Mapeamento e Erro

<module_meta>
  <source>The Design of Everyday Things (ed. revisada) — Don Norman (destilação autoral)</source>
  <router_trigger>Carregar ao desenhar controles não convencionais (canvas arrastável, cursores customizados, menus experimentais, sliders, gestos), estados de erro e qualquer interface que "ninguém entende como usa".</router_trigger>
  <enforcement_level>STRICT — interfaces expressivas precisam de significantes ainda mais claros.</enforcement_level>
  <pairs_with>03 · 11 · 20 · 22</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axiomas

1. **Affordance** é a relação entre objeto e pessoa (o que é possível fazer); **significante** é o sinal que comunica onde e como agir. Na tela, quase tudo depende de significantes.
2. **Mapeamento natural:** controles se relacionam espacialmente com o que controlam (o slider move na direção do efeito).
3. **Feedback imediato e informativo** para toda ação — inclusive "nada aconteceu porque…".
4. **Modelo conceitual:** o usuário precisa formar uma explicação simples de como o sistema funciona; a interface deve ensiná-la.
5. **Restrições** (físicas, culturais, semânticas, lógicas) evitam erro antes de acontecer.
6. **Os dois golfos:** execução (como faço?) e avaliação (deu certo?). Bom design encurta os dois.
7. **Erro é do design, não da pessoa.** Distinga lapsos (deslizes) de enganos (modelo errado) e projete desfazer em vez de confirmar.
8. **Conhecimento no mundo > conhecimento na cabeça:** mostre opções em vez de exigir memória.
</core_axioms>

---

<design_engineering>
## 2. Aplicação em interfaces expressivas

| Interface | Significante obrigatório |
|-----------|--------------------------|
| Canvas com elementos arrastáveis (canvas-ludico) | `cursor: grab/grabbing`, sombra que cresce ao pegar, dica "arraste" na primeira visita, posição restaurável |
| Cursor customizado | nunca esconder o cursor em campos de texto; rótulo contextual ("ver", "arrastar", "copiar") |
| Menu overlay experimental | botão com a palavra "Menu"; Esc fecha; foco preso no menu aberto |
| Scroll horizontal pinado | indicação de progresso e direção; não sequestrar o wheel sem pista visual |
| Hover Font / efeitos de proximidade | puramente decorativos — nunca carregam informação essencial |
| Gestos no mobile | alternativa por botão para todo gesto |
</design_engineering>

---

<agent_traps>
## 3. Trava (proibido)
- Elementos interativos indistinguíveis de decoração.
- Ação destrutiva sem desfazer (ou sem confirmação quando desfazer for impossível).
- "Easter eggs" que escondem funções necessárias.
- Mensagem de erro que culpa o usuário ou não diz como resolver.
</agent_traps>

---

<review_checklist>
## 4. Rubrica
- [ ] `web-interactions`: todo interativo muda no hover/foco e tem cursor coerente.
- [ ] `web-control inventory` não lista elementos clicáveis sem rótulo.
- [ ] Teste do golfo de avaliação: após cada ação, a captura mostra o resultado?
- [ ] Toda ação destrutiva tem desfazer.
</review_checklist>
