# 10 · Designing Data-Intensive Applications — Confiabilidade, Consistência e Fluxo Assíncrono

<module_meta>
  <source>Designing Data-Intensive Applications — Martin Kleppmann (destilação autoral)</source>
  <router_trigger>Carregar ao lidar com estado distribuído, cache, filas, offline-first, realtime, consistência ou escala — no front ou no back.</router_trigger>
  <enforcement_level>STRICT para idempotência, timeouts e read-your-writes.</enforcement_level>
  <pairs_with>02 · 06 · 08</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axiomas

1. **Confiabilidade:** o sistema continua correto diante de falhas de hardware, software e humanas. Projete esperando falhas.
2. **Escalabilidade se descreve com parâmetros** (req/s, leitura/escrita, fan-out) e se mede em **percentis** (p95/p99).
3. **Manutenibilidade:** operável, simples, evoluível.
4. **Modelo de dados pelo padrão de acesso** (documento, relacional, grafo).
5. **Índices aceleram leitura e custam escrita.**
6. **Schemas evoluem com compatibilidade** para trás e para frente — clientes antigos (e caches de front) coexistem.
7. **Replicação tem atraso:** garanta *read-your-writes* onde o usuário espera ver o que acabou de salvar.
8. **Redes mentem:** timeouts, retries com backoff + jitter, **idempotência**.
9. **Log de eventos como fonte da verdade;** estados derivados são recalculáveis.
</core_axioms>

---

<frontend_patterns>
## 2. Padrões no front-end

| Problema | Padrão |
|----------|--------|
| Duplo clique cria dois pedidos | chave de idempotência por intenção |
| UI otimista diverge | reconciliação com versão/ETag e rollback visível |
| Dado velho após salvar | atualizar cache local com a resposta (read-your-writes) |
| Offline-first | fila local + sync com resolução de conflito consciente |
| Lista infinita lenta | paginação por cursor |
| Realtime | eventos com versão; tolerar duplicados e fora de ordem |
| Cache de assets entre deploys | nomes com hash + `Cache-Control: immutable` |
</frontend_patterns>

---

<agent_traps>
## 3. Trava (proibido)
- `setTimeout` para "esperar o servidor terminar".
- Mesmo estado guardado em três stores.
- Média de latência como métrica de saúde.
- Retry infinito sem backoff.
</agent_traps>

---

<review_checklist>
## 4. Rubrica
- [ ] Toda operação repetível é idempotente.
- [ ] Timeouts e retries com backoff em toda chamada de rede.
- [ ] O usuário sempre vê o que acabou de escrever.
- [ ] Mudanças de API compatíveis com clientes em cache.
- [ ] O que acontece se a rede cair no meio? (documentado e testado)
</review_checklist>
