# 12 · The Illusion of Life — Os 12 Princípios da Animação Aplicados à Interface

<module_meta>
  <source>The Illusion of Life: Disney Animation — Frank Thomas & Ollie Johnston (destilação autoral dos princípios clássicos)</source>
  <router_trigger>Carregar ao criar coreografias de entrada, transições de seção, personagens/mascotes, partículas, morphs, efeitos de cursor ou qualquer movimento que deva parecer "vivo".</router_trigger>
  <enforcement_level>GUIDED — princípios de craft; o orçamento de performance e a acessibilidade continuam STRICT.</enforcement_level>
  <pairs_with>11 · 13 · 17 · 20</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Os 12 princípios, traduzidos para UI

| # | Princípio | Na interface |
|---|-----------|--------------|
| 1 | **Comprimir e esticar** | botões que afundam levemente ao clicar (scale 0.97); partículas que alongam na direção do movimento |
| 2 | **Antecipação** | micro recuo antes do salto (card desce 2px antes de subir); cursor que contrai antes do clique |
| 3 | **Encenação (staging)** | um ponto focal por vez; o resto esmaece ou espera |
| 4 | **Direto vs. pose a pose** | timelines com keyframes (pose a pose) para coreografias; física/simulação (direto) para partículas e cursor |
| 5 | **Continuidade e sobreposição** | stagger: filhos terminam depois do pai; o texto assenta após o card |
| 6 | **Aceleração e desaceleração** | curvas ease-out/expo-out nas entradas; nunca linear para objetos (linear só em scrub/scroll) |
| 7 | **Arcos** | trajetórias curvas (morph de partículas, cursor magnético) parecem naturais; linhas retas parecem mecânicas |
| 8 | **Ação secundária** | o grão se move sutilmente enquanto o título entra; nunca compete |
| 9 | **Timing** | duração comunica peso: leve 150–250ms, médio 300–500ms, pesado/cinematográfico 700–1200ms |
| 10 | **Exagero** | no ápice, exagere (escala, cor, velocidade); no resto, contenha |
| 11 | **Desenho sólido** | volume e luz coerentes (shaders com iluminação consistente; sombras da mesma fonte) |
| 12 | **Apelo** | personalidade intencional: uma assinatura de movimento reconhecível |
</core_axioms>

---

<agent_traps>
## 2. Trava anti-movimento-genérico

- **Proibido** tudo entrar com o mesmo fade-up de 0.6s: varie timing e ordem conforme a hierarquia (staging).
- **Proibido** easing linear em objetos que se deslocam.
- **Proibido** stagger longo demais: total da coreografia de uma seção ≤ 1,2s.
- **Proibido** exagero fora do ápice (o exagero perde valor se é constante).
</agent_traps>

---

<design_engineering>
## 3. Receitas

```js
// Reveal em máscara com sobreposição (pose a pose + continuidade)
gsap.from(lines, { yPercent: 105, duration: 1.1, ease: 'expo.out', stagger: 0.08 });
gsap.from(meta, { opacity: 0, y: 12, duration: 0.6, ease: 'power3.out', delay: 0.35 });

// Antecipação + comprimir no clique
button.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.96)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'cubic-bezier(.34,1.56,.64,1)' });
```
Partículas (text morph): cada partícula percorre um **arco** (bezier com ponto de controle deslocado em z ou ruído), com atraso proporcional à distância (continuidade), e assenta com ease-out (aceleração/desaceleração).
</design_engineering>

---

<review_checklist>
## 4. Rubrica (leia a spritesheet do `web-record-frames`)
- [ ] Existe um ponto focal por frame (staging).
- [ ] Elementos relacionados chegam em cascata, não juntos.
- [ ] Nenhum objeto se move com velocidade constante.
- [ ] O ápice é visivelmente mais exagerado que o resto.
- [ ] Reduced-motion: os mesmos estados finais sem deslocamento.
</review_checklist>
