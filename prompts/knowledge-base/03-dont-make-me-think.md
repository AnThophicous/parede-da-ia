# 03 · Don't Make Me Think — Usabilidade Óbvia, Escaneável e Sem Atrito

<module_meta>
  <source>Don't Make Me Think, Revisited — Steve Krug (destilação autoral para agentes)</source>
  <router_trigger>Carregar ao desenhar navegação, hero, CTAs, formulários, hierarquia de página, ou ao auditar UX de qualquer interface — inclusive as experimentais.</router_trigger>
  <enforcement_level>STRICT — experimental nunca pode significar ilegível.</enforcement_level>
  <pairs_with>05 (hierarquia) · 18 (significantes) · 20 (leis de UX) · 22 (acessibilidade)</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axiomas

1. **Óbvio vence inteligente.** Cada tela deve ser autoexplicativa; quando não puder, ao menos autoevidente em um segundo de olhar.
2. **Pessoas escaneiam, não leem.** Elas caçam palavras que casam com a tarefa e clicam na primeira opção "boa o bastante".
3. **Pessoas se viram, não descobrem.** A interface precisa tolerar uso "errado" sem punir.
4. **Cliques sem dúvida valem mais que poucos cliques.** Três cliques óbvios > um clique ambíguo.
5. **Corte palavras pela metade — e depois corte de novo.** Texto de boas-vindas e instruções raramente são lidos.
6. **Convenções são aliadas.** Logo no topo-esquerda leva à home; lupa é busca; o item ativo da navegação é destacado.
7. **A navegação responde sempre:** onde estou, o que tem aqui, para onde posso ir, como volto.
8. **A home tem um trabalho:** dizer em 5 segundos o que é, para quem é e qual a próxima ação.
9. **Teste cedo e com pouca gente.** Três pessoas por rodada revelam a maioria dos problemas graves.
10. **Reservatório de boa vontade:** cada fricção (popup, campo desnecessário, preço escondido) drena paciência — e ela não volta.
</core_axioms>

---

<agent_traps>
## 2. Trava anti-"criatividade ilegível" (armadilhas de agentes)

- **Proibido** hero com frase poética sem um subtítulo literal que explique o produto.
- **Proibido** três botões de mesmo peso lado a lado. Um primário, um secundário, o resto vira link.
- **Proibido** ícone sem rótulo para ação rara (o significado não é universal).
- **Proibido** "Clique aqui" / "Saiba mais" repetidos: o texto do link descreve o destino.
- **Proibido** pre-loader ou animação de entrada que segure o conteúdo por mais de 2,5s.
- **Proibido** scroll-jacking que muda velocidade ou direção do wheel nativo sem motivo narrativo.
- **Regra da dupla leitura:** a **primeira leitura é convencional** (navegação, CTA, texto principal); a **segunda é surpreendente** (tipo, movimento, transição). Ousadia mora na segunda.
</agent_traps>

---

<design_engineering>
## 3. Aplicação em interfaces de alto nível

### 3.1 Hero que sobrevive ao teste dos 5 segundos
```
[ marca ]                                [ navegação curta ]   [ CTA primário ]
TÍTULO EXPRESSIVO (pode ser poético)
Subtítulo literal: o que é · para quem · resultado
[ CTA primário ]  [ link secundário ]
prova curta (logos, número, citação) ─────────────── ápice visual (shader/3D) ao lado ou atrás
```
### 3.2 Formulários
Rótulos visíveis (nunca só placeholder) · erro inline ao sair do campo · nada obrigatório sem motivo · botão diz o que acontece ("Enviar proposta", não "Enviar").
### 3.3 Navegação em sites experimentais
Menu overlay é permitido, mas: o botão diz "Menu", tem foco visível, fecha com Esc e devolve o foco ao botão.
### 3.4 Mobile
CTA principal ao alcance do polegar e acima da dobra; alvos ≥ 44px; nada de hover como única forma de revelar informação.
</design_engineering>

---

<review_checklist>
## 4. Rubrica (verifique com a toolkit)

| Verificação | Como provar |
|-------------|-------------|
| 5 segundos: o que é, para quem, próxima ação | `web-screenshot` da dobra — leia e responda as 3 perguntas sem rolar |
| Um CTA primário dominante por tela | `web-control inventory` + captura |
| Links e botões parecem clicáveis sem hover | `web-interactions` → "sem feedback de hover" = falha |
| Item ativo da navegação destacado | captura de páginas internas |
| CTA acima da dobra no mobile | `web-screenshot --viewport 390x844` |
| Formulário com rótulos e erros inline | `web-audit` (input-label) + teste manual com `web-control type` |
</review_checklist>

---

<few_shot>
## 5. Exemplo

**Ruim:** "Construímos o amanhã, hoje." + botões "Saiba mais", "Descubra", "Explore".
**Bom:** "Construímos o amanhã, hoje." + subtítulo "Software de gestão para clínicas veterinárias — agenda, prontuário e cobrança em um só lugar." + CTA "Agendar demonstração" + link "Ver preços".
</few_shot>
