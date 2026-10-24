# 15 · Grid Systems in Graphic Design — Ordem, Módulo e Economia Visual

<module_meta>
  <source>Grid Systems in Graphic Design — Josef Müller-Brockmann (destilação autoral)</source>
  <router_trigger>Carregar em todo projeto corporativo, em layouts editoriais e sempre que a página "parece desalinhada". Base do playbook corporativo-modernista.</router_trigger>
  <enforcement_level>STRICT no corporativo; GUIDED em direções expressivas (quebrar o grid exige um grid).</enforcement_level>
  <pairs_with>05 · 14 · aesthetics/corporativo-modernista.md · aesthetics/editorial-brutalista.md</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axiomas

1. **O grid é uma atitude:** ordem, clareza e objetividade comunicam competência — é por isso que o modernismo suíço é a linguagem natural do corporativo.
2. **Módulo:** a página se divide em colunas e campos com medianiz (gutter) constante; texto, imagem e espaço vazio ocupam campos inteiros.
3. **Linha de base comum:** o espaçamento vertical é múltiplo da entrelinha do corpo.
4. **Margens desiguais criam tensão útil** (mais respiro embaixo/à esquerda em layouts editoriais).
5. **Espaço vazio é elemento ativo**, não sobra.
6. **Poucos tamanhos, poucos pesos, uma família** (grotesca neutra) — a hierarquia vem da posição no grid.
7. **Imagem e texto se alinham às mesmas linhas.**
8. **Quebrar o grid é um gesto raro e intencional** — um elemento que sangra, um título que atravessa colunas.
</core_axioms>

---

<blueprints>
## 2. Grids aprovados

```css
/* 12 colunas fluido com gutter fixo (corporativo/SaaS) */
.grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: clamp(16px, 2vw, 32px); padding-inline: clamp(16px, 4vw, 64px); max-width: 1440px; margin-inline: auto; }

/* Editorial assimétrico: 4 colunas de 3 + uma coluna de respiro */
.editorial { display: grid; grid-template-columns: 1fr repeat(4, minmax(0, 3fr)) 1fr; column-gap: 24px; }

/* Ritmo vertical: múltiplos da entrelinha (24px) */
:root { --baseline: 24px; } section { padding-block: calc(var(--baseline) * 5); }
```

| Layout | Colunas | Uso |
|--------|---------|-----|
| Institucional | 12 | conteúdo em 8, aside em 4; textos em 6–7 colunas |
| Landing de produto | 12 | hero 7/5, features 4/4/4, prova 6/6 |
| Editorial | 4+2 | título atravessa 3, texto em 2, imagem sangra |
| Portfólio | 6 | grade de projetos 3/3 ou 2/2/2 com ritmo de alturas |
</blueprints>

---

<agent_traps>
## 3. Trava (proibido)
- Elementos "quase alinhados" (diferenças de 2–8px entre bordas que deveriam coincidir).
- Gutter variando entre seções.
- Texto ocupando 12 colunas em desktop (medida enorme).
- Centralizar tudo por falta de decisão.
</agent_traps>

---

<review_checklist>
## 4. Rubrica
- [ ] `web-scrap` → `layout.maxContentWidth` coerente (ex.: 1200–1440 contêiner, 640–720 texto).
- [ ] Bordas de títulos, textos e imagens coincidem nas capturas (sobreponha uma grade com `web-eval` se necessário).
- [ ] Espaços verticais múltiplos da baseline (`layout.spacingScale`).
- [ ] Uma quebra de grid intencional no máximo por seção.
</review_checklist>
