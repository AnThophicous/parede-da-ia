# 21 · Atomic Design — Design Systems, Componentes e Tokens

<module_meta>
  <source>Atomic Design — Brad Frost (destilação autoral)</source>
  <router_trigger>Carregar ao criar ou organizar um design system, uma biblioteca de componentes (inclusive shadcn/ui), tokens e documentação de padrões.</router_trigger>
  <enforcement_level>GUIDED — sistema a serviço do produto, não o contrário.</enforcement_level>
  <pairs_with>05 · 22 · 02 · 01</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axiomas

1. **Interfaces são sistemas de partes:** átomos (tokens, botão, input) → moléculas (campo com rótulo) → organismos (header, card de plano) → templates (estrutura) → páginas (conteúdo real).
2. **Tokens são o nível zero:** cor, tipo, espaço, raio, sombra, movimento — uma fonte de verdade consumida por CSS, JS e shaders.
3. **Construa do conteúdo real para cima:** páginas com conteúdo real validam o sistema; lorem ipsum esconde problemas.
4. **Padrões vivem em uma biblioteca** com estados (hover, foco, erro, vazio, carregando) documentados.
5. **Sistema é produto:** tem versão, dono, roadmap e governança.
6. **Composição > configuração:** componentes pequenos e combináveis vencem um mega-componente com 30 props.
</core_axioms>

---

<shadcn_guide>
## 2. Com shadcn/ui + Tailwind

- shadcn copia componentes para o seu código: **você é dono** — adapte aos tokens, não lute contra eles.
- Tokens no `@theme` do Tailwind v4 (CSS custom properties) → classes utilitárias geradas.
- Variantes com `class-variance-authority` (cva); merge com `tailwind-merge`.
- Primitivas acessíveis (Radix) para dialog, tabs, tooltip, menu — não reescreva foco e teclado à mão.
```tsx
const button = cva('inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-2', {
  variants: { variant: { primary: 'bg-accent text-ink hover:bg-accent-strong', ghost: 'hover:bg-white/5' }, size: { md: 'h-11 px-6', lg: 'h-14 px-8 text-lg' } },
  defaultVariants: { variant: 'primary', size: 'md' },
});
```
</shadcn_guide>

---

<agent_traps>
## 3. Trava (proibido)
- Valores literais de cor/espaço espalhados nos componentes.
- Duplicar um componente para mudar uma cor (crie variante).
- Componente sem estados de foco, desabilitado e carregando.
- Design system antes de existir uma página real usando-o.
</agent_traps>

---

<review_checklist>
## 4. Rubrica
- [ ] `web-tokens` do próprio projeto bate com os tokens declarados (sem valores fora da escala).
- [ ] Cada componente interativo passa no `web-interactions`.
- [ ] Componentes documentados com estados.
</review_checklist>
