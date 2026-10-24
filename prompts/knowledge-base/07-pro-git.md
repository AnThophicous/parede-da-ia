# 07 · Pro Git — Histórico Atômico, Semântico e Seguro

<module_meta>
  <source>Pro Git (2ª ed.) — Scott Chacon & Ben Straub (destilação autoral)</source>
  <router_trigger>Carregar ao commitar, criar branch, escrever PR, reescrever histórico ou resolver conflitos.</router_trigger>
  <enforcement_level>STRICT — operações destrutivas exigem confirmação explícita do usuário.</enforcement_level>
  <pairs_with>06 (automação) · 08 (reprodutibilidade)</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axiomas

1. **Um commit = uma mudança lógica** que compila, passa nos testes e pode ser revertida sozinha.
2. **A mensagem explica o porquê.** O diff já mostra o quê.
3. **Prepare o commit, não o diretório:** separe mudanças misturadas com `git add -p`.
4. **Histórico local é rascunho; publicado é contrato.** Reescreva à vontade antes do push; nunca depois sem combinar.
5. **Branches são baratas.** Uma por tarefa; integre cedo.
6. **`git diff --staged` é o último code review** que você faz sozinho.
7. **Respeite as regras do usuário sobre autoria** (ex.: não adicionar coautoria automática se ele pediu).
</core_axioms>

---

<message_format>
## 2. Conventional Commits

```
<tipo>(<escopo>): <resumo no imperativo, ≤ 72 caracteres, no idioma do projeto>

<corpo: por que a mudança existe, que problema resolve, trade-offs. ~72 colunas.>

<rodapé: BREAKING CHANGE: … · Refs #123>
```

| Tipo | Quando |
|------|--------|
| feat | funcionalidade nova para o usuário |
| fix | correção de bug |
| refactor | mudança interna sem alterar comportamento |
| perf | desempenho |
| style | formatação |
| docs | documentação |
| test | testes |
| build / ci | build, dependências, pipelines |
| chore | manutenção |
</message_format>

---

<agent_traps>
## 3. Trava de segurança (proibido sem confirmação)

- `git push --force` em branch compartilhada (prefira `--force-with-lease`).
- `git reset --hard`, `git clean -fd`, `git checkout -- .` (descartam trabalho).
- Reescrever histórico publicado; pular hooks com `--no-verify`.
- Commitar `.env`, chaves, `node_modules`, `dist/` — se um segredo entrar, **rotacione a chave** (apagar o commit não basta).
- Commitar arquivos que o usuário está editando e pediu para não incluir.
</agent_traps>

---

<workflow>
## 4. Fluxo para agentes

```bash
git switch -c feat/hero-shader
git add -p && git diff --staged     # revise pedaço a pedaço
git commit                          # mensagem com corpo
git fetch origin && git rebase origin/main
git push -u origin feat/hero-shader
```
</workflow>

---

<review_checklist>
## 5. Rubrica
- [ ] O resumo precisa de "e"? Divida o commit.
- [ ] O projeto compila neste ponto do histórico.
- [ ] Nada acidental no stage (logs, builds, segredos).
- [ ] O corpo explica motivação para quem ler daqui a um ano.
</review_checklist>
