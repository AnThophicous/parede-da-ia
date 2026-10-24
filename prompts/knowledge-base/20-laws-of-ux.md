# 20 · Laws of UX — Psicologia Aplicada em Regras Verificáveis

<module_meta>
  <source>Laws of UX — Jon Yablonski (destilação autoral)</source>
  <router_trigger>Carregar ao dimensionar alvos, definir número de opções, tempos de resposta, navegação, onboarding e ao justificar decisões de layout com evidência.</router_trigger>
  <enforcement_level>STRICT para Fitts, Doherty e Jakob; GUIDED para o resto.</enforcement_level>
  <pairs_with>03 · 04 · 11 · 18</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Leis e como aplicá-las

| Lei | Ideia | Regra prática |
|-----|-------|---------------|
| **Jakob** | as pessoas passam a maior parte do tempo em outros sites | siga convenções de navegação, carrinho, busca, formulários |
| **Fitts** | tempo para atingir um alvo depende de distância e tamanho | CTAs grandes e perto do contexto; alvos ≥ 44px no mobile, ≥ 24px sempre |
| **Hick** | mais opções = decisão mais lenta | reduza escolhas visíveis; destaque a recomendada |
| **Miller** | memória de trabalho limitada | agrupe em blocos de 3–5 |
| **Doherty** | produtividade dispara com resposta < 400ms | feedback imediato; skeletons; otimismo na UI |
| **Pico-fim** | lembramos do pico e do final | um ápice memorável + final forte (CTA/rodapé) |
| **Von Restorff** | o diferente é lembrado | um elemento destacado por grupo — não vários |
| **Serial position** | lembramos do primeiro e do último itens | itens-chave nas pontas da navegação |
| **Tesler** | complexidade não some, muda de lugar | absorva complexidade no sistema, não no usuário |
| **Postel** | seja liberal no que aceita | formulários tolerantes (máscaras, colar, espaços) |
| **Lei da região comum / proximidade / similaridade** | agrupamento perceptivo | use espaço e fundo para agrupar antes de bordas |
| **Goal-gradient** | esforço cresce perto da meta | barras de progresso em fluxos |
| **Zeigarnik** | tarefas inacabadas ficam na memória | mostre o que falta concluir |
| **Estética-usabilidade** | o bonito é percebido como mais fácil | polimento visual aumenta tolerância — não substitui usabilidade |
</core_axioms>

---

<agent_traps>
## 2. Trava (proibido)
- Usar "lei" como justificativa decorativa sem medir.
- CTA principal menor que links secundários.
- Menus com 9+ itens no topo sem agrupamento.
- Feedback de ação acima de 400ms sem indicador.
</agent_traps>

---

<review_checklist>
## 3. Rubrica (toolkit)
- [ ] Fitts: `web-audit` sem `tap-target`; CTAs ≥ 44px no mobile.
- [ ] Doherty: `web-interactions` → transições de feedback ≤ 300ms; LCP ≤ 2,5s.
- [ ] Hick: `web-control inventory` na dobra ≤ 7 interativos principais.
- [ ] Pico-fim: o ápice e o final aparecem claramente na spritesheet de scroll.
</review_checklist>
