# 07 · Pro Git — Atomic, Semantic and Safe History

<module_meta>
  <source>Pro Git (2nd ed.) — Scott Chacon & Ben Straub (an original distillation)</source>
  <router_trigger>Load when committing, creating a branch, writing a PR, rewriting history or resolving conflicts.</router_trigger>
  <enforcement_level>STRICT — destructive operations require the user's explicit confirmation.</enforcement_level>
  <pairs_with>06 (automation) · 08 (reproducibility)</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axioms

1. **One commit = one logical change** that builds, passes the tests and can be reverted on its own.
2. **The message explains the why.** The diff already shows the what.
3. **Stage the commit, not the directory:** split mixed changes with `git add -p`.
4. **Local history is a draft; published history is a contract.** Rewrite freely before the push; never after without agreeing on it.
5. **Branches are cheap.** One per task; integrate early.
6. **`git diff --staged` is the last code review** you do alone.
7. **Respect the user's rules on authorship** (e.g., no automatic co-author lines if they asked for none).
</core_axioms>

---

<message_format>
## 2. Conventional Commits

```
<type>(<scope>): <summary in the imperative, ≤ 72 characters, in the project's language>

<body: why the change exists, which problem it solves, trade-offs. ~72 columns.>

<footer: BREAKING CHANGE: … · Refs #123>
```

| Type | When |
|------|------|
| feat | a new user-facing feature |
| fix | a bug fix |
| refactor | an internal change without behavior change |
| perf | performance |
| style | formatting |
| docs | documentation |
| test | tests |
| build / ci | build, dependencies, pipelines |
| chore | maintenance |
</message_format>

---

<agent_traps>
## 3. Safety guard (forbidden without confirmation)

- `git push --force` on a shared branch (prefer `--force-with-lease`).
- `git reset --hard`, `git clean -fd`, `git checkout -- .` (they discard work).
- Rewriting published history; skipping hooks with `--no-verify`.
- Committing `.env`, keys, `node_modules`, `dist/` — if a secret gets in, **rotate the key** (deleting the commit is not enough).
- Committing files the user is editing and asked you to leave out.
</agent_traps>

---

<workflow>
## 4. Flow for agents

```bash
git switch -c feat/hero-shader
git add -p && git diff --staged     # review it hunk by hunk
git commit                          # a message with a body
git fetch origin && git rebase origin/main
git push -u origin feat/hero-shader
```
</workflow>

---

<review_checklist>
## 5. Rubric
- [ ] Does the summary need an "and"? Split the commit.
- [ ] The project builds at this point in history.
- [ ] Nothing accidental staged (logs, builds, secrets).
- [ ] The body explains the motivation to whoever reads it a year from now.
</review_checklist>
