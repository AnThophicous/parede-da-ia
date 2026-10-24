# 10 · Designing Data-Intensive Applications — Reliability, Consistency and Asynchronous Flow

<module_meta>
  <source>Designing Data-Intensive Applications — Martin Kleppmann (an original distillation)</source>
  <router_trigger>Load when dealing with distributed state, caching, queues, offline-first, realtime, consistency or scale — front end or back end.</router_trigger>
  <enforcement_level>STRICT for idempotency, timeouts and read-your-writes.</enforcement_level>
  <pairs_with>02 · 06 · 08</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axioms

1. **Reliability:** the system stays correct in the face of hardware, software and human faults. Design expecting failure.
2. **Scalability is described with parameters** (req/s, read/write ratio, fan-out) and measured in **percentiles** (p95/p99).
3. **Maintainability:** operable, simple, evolvable.
4. **Choose the data model by the access pattern** (document, relational, graph).
5. **Indexes speed up reads and cost writes.**
6. **Schemas evolve with backward and forward compatibility** — old clients (and front-end caches) coexist.
7. **Replication lags:** guarantee *read-your-writes* where the user expects to see what they just saved.
8. **Networks lie:** timeouts, retries with backoff + jitter, **idempotency**.
9. **An event log as the source of truth;** derived state can be recomputed.
</core_axioms>

---

<frontend_patterns>
## 2. Patterns on the front end

| Problem | Pattern |
|---------|---------|
| A double click creates two orders | an idempotency key per intent |
| Optimistic UI diverges | reconcile with a version/ETag and a visible rollback |
| Stale data after saving | update the local cache with the response (read-your-writes) |
| Offline-first | a local queue + sync with deliberate conflict resolution |
| A slow infinite list | cursor pagination |
| Realtime | versioned events; tolerate duplicates and out-of-order delivery |
| Asset caching across deploys | hashed file names + `Cache-Control: immutable` |
</frontend_patterns>

---

<agent_traps>
## 3. Guard (forbidden)
- `setTimeout` to "wait for the server to finish".
- The same state kept in three stores.
- Average latency as a health metric.
- Infinite retries without backoff.
</agent_traps>

---

<review_checklist>
## 4. Rubric
- [ ] Every repeatable operation is idempotent.
- [ ] Timeouts and retries with backoff on every network call.
- [ ] The user always sees what they just wrote.
- [ ] API changes compatible with cached clients.
- [ ] What happens if the network drops halfway? (documented and tested)
</review_checklist>
