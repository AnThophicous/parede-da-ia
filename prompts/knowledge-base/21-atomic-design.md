# 21 · Atomic Design — Design Systems, Components and Tokens

<module_meta>
  <source>Atomic Design — Brad Frost (an original distillation)</source>
  <router_trigger>Load when creating or organizing a design system, a component library (shadcn/ui included), tokens and pattern documentation.</router_trigger>
  <enforcement_level>GUIDED — the system serves the product, not the other way around.</enforcement_level>
  <pairs_with>05 · 22 · 02 · 01</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axioms

1. **Interfaces are systems of parts:** atoms (tokens, button, input) → molecules (a field with a label) → organisms (a header, a pricing card) → templates (structure) → pages (real content).
2. **Tokens are level zero:** color, type, space, radius, shadow, motion — one source of truth consumed by CSS, JS and shaders.
3. **Build up from real content:** pages with real content validate the system; lorem ipsum hides problems.
4. **Patterns live in a library** with documented states (hover, focus, error, empty, loading).
5. **A system is a product:** it has a version, an owner, a roadmap and governance.
6. **Composition > configuration:** small, combinable components beat one mega-component with 30 props.
</core_axioms>

---

<shadcn_guide>
## 2. With shadcn/ui + Tailwind

- shadcn copies components into your code: **you own them** — adapt them to your tokens, don't fight them.
- Tokens in Tailwind v4's `@theme` (CSS custom properties) → generated utility classes.
- Variants with `class-variance-authority` (cva); merging with `tailwind-merge`.
- Accessible primitives (Radix) for dialog, tabs, tooltip, menu — don't rewrite focus and keyboard handling by hand.
```tsx
const button = cva('inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-2', {
  variants: { variant: { primary: 'bg-accent text-ink hover:bg-accent-strong', ghost: 'hover:bg-white/5' }, size: { md: 'h-11 px-6', lg: 'h-14 px-8 text-lg' } },
  defaultVariants: { variant: 'primary', size: 'md' },
});
```
</shadcn_guide>

---

<agent_traps>
## 3. Guard (forbidden)
- Literal color/space values scattered through components.
- Duplicating a component to change one color (create a variant).
- A component without focus, disabled and loading states.
- A design system before any real page uses it.
</agent_traps>

---

<review_checklist>
## 4. Rubric
- [ ] The project's own `web-tokens` matches the declared tokens (no values off the scale).
- [ ] Every interactive component passes `web-interactions`.
- [ ] Components documented with their states.
</review_checklist>
