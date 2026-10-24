# 11 · Microinteractions — Gatilho, Regras, Feedback, Loops e Modos

<module_meta>
  <source>Microinteractions: Designing with Details — Dan Saffer (destilação autoral)</source>
  <router_trigger>Carregar ao desenhar ou revisar hover, toggles, cópia, likes, formulários, botões, cursores, toasts, estados de carregamento — qualquer interação de um único propósito.</router_trigger>
  <enforcement_level>STRICT — toda microinteração precisa das quatro partes declaradas.</enforcement_level>
  <pairs_with>12 · 13 · 18 · 20 · 22 · templates/motion-spec.md</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Anatomia (as quatro partes)

1. **Gatilho** — o que inicia: manual (clique, hover, tecla, arraste) ou de sistema (tempo, dado novo, posição de scroll). O gatilho manual precisa **parecer acionável** antes da ação (significante `[18]`).
2. **Regras** — o que pode e não pode acontecer, em que ordem, com que limites. Regras são invisíveis; o usuário só vê o feedback delas.
3. **Feedback** — tudo que comunica as regras: visual, movimento, som, háptica, texto. **Proporcional**: ação pequena, feedback pequeno; ação irreversível, feedback inequívoco.
4. **Loops e modos** — o que acontece com o tempo (repetição, expiração, aprendizado) e estados alternativos (modo edição, modo arraste). Evite modos sempre que puder.

### Princípios
- **Traga os dados para a frente:** o gatilho pode mostrar estado (ex.: botão "Copiado ✓", contador no ícone).
- **Não comece do zero:** lembre a última escolha, preencha o óbvio.
- **Previna erro em vez de explicá-lo.**
- **Use o que já está na tela** antes de adicionar elementos novos (o próprio botão vira o feedback).
- **Signature moment:** uma microinteração memorável pode virar marca — mas só uma ou duas por produto.
</core_axioms>

---

<timing>
## 2. Tempos de referência

| Tipo | Início | Duração | Curva |
|------|--------|---------|-------|
| Hover / foco | ≤ 50ms | 150–250ms | ease-out |
| Pressionar (active) | imediato | 80–120ms | ease-out |
| Toggle / checkbox | imediato | 150–200ms | ease-in-out |
| Abrir menu / modal | imediato | 250–400ms entrada · 200–300ms saída | expo-out / ease-in |
| Toast | imediato | entra 300ms · permanece 2–4s · sai 200ms | ease-out |
| Magnético (seguir cursor) | contínuo | lerp 0.1–0.2 por frame · retorno elástico 600–1000ms | elastic.out |

Saída mais rápida que entrada. Feedback que demora > 400ms quebra a sensação de causa e efeito (limiar de Doherty `[20]`).
</timing>

---

<agent_traps>
## 3. Trava anti-enfeite

- **Proibido** microinteração sem estado de foco equivalente ao hover (teclado também merece feedback).
- **Proibido** feedback que depende só de cor.
- **Proibido** animação em loop infinito sem função (spinner eterno, pulso eterno no CTA).
- **Proibido** efeito magnético em links de texto corrido ou em elementos densos de navegação.
- **Proibido** som sem controle e sem opt-in.
</agent_traps>

---

<design_engineering>
## 4. Receitas (gatilho → regras → feedback → loop)

| Microinteração | Gatilho | Regras | Feedback | Loop/modo |
|----------------|---------|--------|----------|-----------|
| Copiar prompt | clique | copia; se a API falhar, seleciona o texto | rótulo "Copiado ✓" + toast | volta ao rótulo em 2,4s |
| Botão magnético | cursor dentro do raio | desloca até 35% do vetor; texto interno 50% disso | movimento contínuo + preenchimento no hover | retorno elástico ao sair |
| Hover Font | cursor perto das letras | peso por distância (raio 120–200px) | engrossa letras próximas | relaxa ao se afastar; desligado em reduced-motion |
| Like / salvar | clique | alterna estado; idempotente | ícone preenche + escala 1→1.2→1 | contador atualiza |
| Arrastar card | pointerdown + move | limite ao container; z-index sobe | sombra maior + leve rotação | soltar com inércia curta |
</design_engineering>

---

<review_checklist>
## 5. Rubrica (verifique com `web-interactions`)
- [ ] Todo interativo tem mudança de hover **e** foco visível.
- [ ] Transições de feedback entre 150 e 300ms.
- [ ] `:active` responde (sensação tátil) nos CTAs.
- [ ] Efeitos magnéticos só em alvos grandes e isolados.
- [ ] Cada microinteração foi descrita nas quatro partes na motion spec.
</review_checklist>
