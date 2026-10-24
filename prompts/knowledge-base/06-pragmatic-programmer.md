# 06 · The Pragmatic Programmer — Ofício, Ortogonalidade e Reversibilidade

<module_meta>
  <source>The Pragmatic Programmer (20th Anniversary) — Andrew Hunt & David Thomas (destilação autoral)</source>
  <router_trigger>Carregar ao planejar implementação, avaliar duplicação e acoplamento, decidir abordagem incremental ou lidar com incerteza técnica.</router_trigger>
  <enforcement_level>STRICT para DRY de conhecimento e ortogonalidade; GUIDED para o resto.</enforcement_level>
  <pairs_with>01 · 02 · 07 · 08</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axiomas

1. **Responsabilidade pelo resultado.** Ofereça opções, não desculpas. Se algo não dá, diga o que dá.
2. **Não tolere janelas quebradas.** Um hack sem registro convida dez. Corrija ou documente com prazo.
3. **DRY é sobre conhecimento, não texto.** Cada regra tem uma representação autoritativa. Trechos parecidos que mudam por motivos diferentes **não** são duplicação.
4. **Ortogonalidade:** mudar uma coisa não exige mudar coisas não relacionadas. Teste: "se eu trocar X, quantos módulos quebram?"
5. **Reversibilidade:** nenhuma decisão é final. Isole fornecedores, formatos e motores (de animação, de 3D, de CMS) atrás de fronteiras.
6. **Tracer bullets:** um caminho fino ponta a ponta cedo (UI → dados → deploy), depois engorde.
7. **Protótipos são descartáveis** e servem para aprender.
8. **Falhe cedo e alto:** valide entradas nas bordas com mensagens úteis.
9. **Não programe por coincidência.** Se funciona e você não sabe por quê, ainda não funciona.
10. **Automatize o repetido** (build, QA visual, deploy).
</core_axioms>

---

<agent_traps>
## 2. Trava anti-desperdício (agentes)

- **Proibido** polir uma camada isolada por horas sem integração ponta a ponta.
- **Proibido** "mexer em várias coisas até o bug sumir": isole a mudança que resolveu e explique o mecanismo.
- **Proibido** copiar a mesma configuração de animação em 12 componentes: crie tokens/hooks.
- **Proibido** acoplar SDK de analytics, CMS ou 3D direto em componentes de apresentação.
</agent_traps>

---

<design_engineering>
## 3. Aplicação para agentes de design engineering

| Princípio | Prática |
|-----------|---------|
| Tracer bullet visual | Suba o layout bruto e abra com `web-url-fetch` antes de animar |
| Automação do QA | Script único: `web-serve` → `web-url-fetch` → `web-audit` → `web-interactions` → `web-record-frames` |
| Janelas quebradas | Warning de console, falha de contraste ou jank aparecem no relatório → corrigir na mesma iteração |
| Reversibilidade | Shaders e cenas 3D atrás de um componente com fallback estático (troca de motor = um arquivo) |
| DRY de tokens | Uma fonte (CSS vars/@theme) alimenta CSS, JS (GSAP) e shaders (uniforms) |
</design_engineering>

---

<review_checklist>
## 4. Rubrica
- [ ] Nenhuma regra de negócio ou token visual definido em dois lugares.
- [ ] Trocar o provedor X muda só um adaptador.
- [ ] Existe fatia ponta a ponta rodando antes de refinamentos.
- [ ] Cada correção tem mecanismo explicado.
- [ ] Tarefas repetidas viraram script.
</review_checklist>
