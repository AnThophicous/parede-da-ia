# 07 · Pro Git — histórico como documentação

> Fonte: *Pro Git* (2ª ed.), Scott Chacon & Ben Straub. Destilação autoral para agentes.
> **Carregue quando:** for commitar, criar branch, escrever PR, reescrever histórico ou resolver conflitos.

## Princípios

1. **Um commit = uma mudança lógica.** Ele compila, passa nos testes e pode ser revertido sozinho.
2. **A mensagem explica o porquê.** O diff já mostra o quê.
3. **Prepare o commit, não o diretório.** Use a staging area para separar mudanças misturadas (`git add -p`).
4. **Histórico local é rascunho; histórico publicado é contrato.** Reescreva à vontade antes do push; nunca depois sem combinar.
5. **Branches são baratas.** Uma branch por tarefa; integre cedo e com frequência.
6. **Revise antes de enviar:** `git diff --staged` é o último code review que você faz sozinho.

## Formato de mensagem (Conventional Commits)

```
<tipo>(<escopo opcional>): <resumo no imperativo, ≤ 72 caracteres>

<corpo: por que a mudança existe, que problema resolve, trade-offs.
Quebre linhas em ~72 colunas. Liste efeitos colaterais.>

<rodapé: BREAKING CHANGE: ..., Refs #123>
```

| Tipo | Quando |
|------|--------|
| `feat` | nova funcionalidade para o usuário |
| `fix` | correção de bug |
| `refactor` | mudança interna sem alterar comportamento |
| `perf` | melhoria de desempenho |
| `style` | formatação, sem mudança de lógica |
| `docs` | documentação |
| `test` | testes |
| `build` / `ci` | build, dependências, pipelines |
| `chore` | manutenção que não cabe acima |

Resumo no **imperativo** e no idioma do projeto: "adiciona seção de preços", não "adicionado" nem "adicionando".

## Checklist antes de commitar

- [ ] `git status` e `git diff --staged` revisados — nada acidental (logs, `.env`, builds, `node_modules`)?
- [ ] O commit faz **uma** coisa? Se o resumo precisa de "e", divida.
- [ ] O projeto compila/testa neste ponto do histórico?
- [ ] A mensagem explica a motivação para quem ler daqui a um ano?
- [ ] Segredos nunca entram no histórico (se entrarem, rotacione a chave — apagar o commit não basta).

## Fluxo recomendado para agentes

```bash
git switch -c feat/hero-webgl          # nunca trabalhe direto na main
# ... mudanças ...
git add -p                              # escolha pedaço por pedaço
git diff --staged                       # revise
git commit                              # mensagem com corpo
git fetch origin && git rebase origin/main   # atualize antes do PR (histórico local)
git push -u origin feat/hero-webgl
```

## Operações perigosas (confirme com o usuário antes)

- `git push --force` em branch compartilhada → prefira `--force-with-lease`.
- `git reset --hard`, `git clean -fd`, `git checkout -- .` → descartam trabalho.
- Reescrever histórico já publicado (`rebase`, `commit --amend` após push).
- Hooks falhando: investigue a causa; não use `--no-verify` sem pedido explícito.

## Sinais de alerta

| Sinal | Correção |
|-------|----------|
| "wip", "fix", "ajustes", "final final" | mensagens descritivas; `--fixup` + `rebase --autosquash` antes do push |
| Commit de 4.000 linhas misturando feature e formatação | separar `style:` de `feat:` |
| Merge commits de "sync com main" a cada hora | rebase local antes do PR |
| Arquivo gerado (dist, lockfile alheio) versionado sem querer | `.gitignore` + remover do índice |
