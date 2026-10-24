# 22 · Inclusive Components — Acessibilidade que Funciona de Verdade

<module_meta>
  <source>Inclusive Components — Heydon Pickering (destilação autoral)</source>
  <router_trigger>Carregar em toda interface com componentes interativos (menus, abas, modais, toggles, carrosséis, formulários, tooltips) e sempre que houver movimento intenso ou efeitos que dependem de mouse.</router_trigger>
  <enforcement_level>STRICT — WCAG 2.2 AA é o piso, não a meta.</enforcement_level>
  <pairs_with>03 · 11 · 13 · 18 · 20</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axiomas

1. **HTML semântico primeiro:** `button` para ações, `a` para navegação, listas para listas, `fieldset/legend` para grupos. ARIA corrige o que o HTML não expressa — não o substitui.
2. **Teclado completo:** tudo que funciona com mouse funciona com Tab/Shift+Tab/Enter/Espaço/Esc/setas.
3. **Foco visível e previsível:** indicador com contraste ≥ 3:1; foco preso em modais; foco devolvido ao fechar.
4. **Nome, papel e estado** expostos: `aria-expanded`, `aria-pressed`, `aria-selected`, `aria-current`.
5. **Conteúdo não depende de hover, cor ou movimento** para ser entendido.
6. **Movimento opcional:** `prefers-reduced-motion` respeitado; nada piscando mais de 3×/s.
7. **Texto legível e redimensionável:** zoom 200% sem perda; sem texto em imagem.
8. **Alvos generosos** (≥ 24×24px; 44px confortável).
</core_axioms>

---

<components>
## 2. Padrões

| Componente | Requisitos |
|------------|------------|
| Botão-toggle | `button` + `aria-pressed`; rótulo estável |
| Menu/disclosure | botão com `aria-expanded` + `aria-controls`; Esc fecha |
| Abas | `role=tablist/tab/tabpanel`, setas navegam, `aria-selected` |
| Modal | `<dialog>` ou Radix Dialog: foco preso, Esc, retorno de foco, título ligado |
| Tooltip | aparece em hover **e** foco; nunca contém informação essencial |
| Carrossel | pausável; controles com nome; não autoavança com leitor de tela |
| Formulário | `label` visível ligado ao campo; erro com `aria-describedby`; não só cor |
| Efeitos de cursor (Hover Font, magnético, partículas) | decorativos: `aria-hidden` nas camadas de efeito; texto real acessível; desligados em touch e reduced-motion |
| Canvas/WebGL | `aria-hidden` se decorativo; se informativo, alternativa textual equivalente |
</components>

---

<agent_traps>
## 3. Trava (proibido)
- `div` clicável sem papel e sem teclado.
- `outline: none` sem substituto.
- Texto dividido em `span` por letra sem manter o texto inteiro acessível (`aria-label` no pai e `aria-hidden` nos fragmentos).
- Modal que não devolve o foco.
</agent_traps>

---

<review_checklist>
## 4. Rubrica (toolkit)
- [ ] `web-audit`: zero erros de acessibilidade (alt, rótulos, nomes, foco, contraste, lang, alvos).
- [ ] `web-interactions`: zero "foco invisível".
- [ ] `web-control keypress Tab --repeat 15 --screenshot`: ordem de foco lógica.
- [ ] `web-url-fetch --reduced-motion` + gravação: nenhum movimento grande.
</review_checklist>
