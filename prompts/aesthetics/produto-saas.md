# Estética · produto-saas — O Produto É o Herói

<aesthetic_meta>
  <archetypes>corporativo (software)</archetypes>
  <use_when>Produtos digitais com demo, planos, integrações e onboarding; B2B e B2C.</use_when>
  <avoid_when>Serviços sem interface própria; marcas que vendem emoção mais que funcionalidade.</avoid_when>
  <books>03 · 05 · 20 · 21 · 23 · 11</books>
</aesthetic_meta>

---

<visual_dna>
## 1. DNA visual

| Eixo | Regra |
|------|-------|
| Tipografia | sans de interface (Inter, Geist, Instrument Sans) com 3–4 pesos; títulos 40–72px; números tabulares |
| Cor | neutros frios + **um** acento de produto; estados (sucesso, alerta, erro) com tons próprios; modo escuro opcional pensado desde o início |
| Componentes | cards com raio 12–16px, sombras de elevação em 3 níveis, bordas 1px translúcidas, ícones de sistema (Lucide) |
| Imagem | **screenshots e trechos reais da UI** (recortados e ampliados), não ilustrações genéricas |
| Layout | grid de 12, seções com uma ideia cada, ritmo "texto ↔ demo" alternado |
</visual_dna>

---

<motion_signature>
## 2. Movimento
"Preciso e responsivo": 150 / 250 / 450ms, ease-out-quart. Demos da UI animadas com timelines curtas (cursor fictício clicando, estados mudando). Hover de cards eleva 2–4px com sombra maior.
</motion_signature>

---

<signature_moves>
## 3. Movimentos assinatura
1. **Hero com a UI real** em perspectiva leve e reflexo/brilho sutil (um gradiente da biblioteca de blurs, *Blurred*, atrás).
2. **Feature tabs** (shadcn Tabs) trocando a demo à direita.
3. **Bento grid** de features com microdemos.
4. **Tabela de planos** com o recomendado destacado (Hick, Von Restorff).
5. **Integrações** em grade de logos autorizados com busca.
</signature_moves>

---

<anti_patterns>
## 4. Anti-padrões
Mockup 3D genérico de laptop · ilustrações isométricas sem relação com o produto · dashboards falsos com dados absurdos · 6 CTAs diferentes.
</anti_patterns>

---

<qa_rubric>
## 5. QA
`web-audit` ≥ 90 · `web-interactions`: tabs/menus com teclado e foco visível · LCP ≤ 2,5s com screenshots otimizados (AVIF/WebP, width/height).
</qa_rubric>
