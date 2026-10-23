# 10 · Designing Data-Intensive Applications — dados confiáveis

> Fonte: *Designing Data-Intensive Applications*, Martin Kleppmann. Destilação autoral para agentes.
> **Carregue quando:** lidar com estado distribuído, cache, filas, sincronização offline,
> realtime, consistência ou escalabilidade — no front ou no back.

## Os três pilares

1. **Confiabilidade:** o sistema continua correto diante de falhas de hardware, software e humanas.
   Projete esperando falhas; teste injetando-as.
2. **Escalabilidade:** descreva a carga com parâmetros concretos (req/s, razão leitura/escrita,
   fan-out) e meça **percentis** (p95/p99), não médias.
3. **Manutenibilidade:** operabilidade (fácil de rodar), simplicidade (sem complexidade acidental),
   evolutividade (fácil de mudar).

## Princípios

- **Escolha o modelo de dados pelo padrão de acesso:** documento para agregados auto-contidos,
  relacional para muitas relações, grafo para conexões arbitrárias.
- **Índices aceleram leituras e custam escritas.** Não há almoço grátis.
- **Evolução de schema:** mantenha compatibilidade para trás e para frente; clientes antigos e
  novos coexistem (especialmente apps e caches de front-end).
- **Replicação introduz atraso:** garanta *read-your-writes* onde o usuário espera ver o que acabou de salvar.
- **Particionamento** exige uma chave que distribua carga sem hot spots.
- **Transações e isolamento:** saiba qual anomalia o seu nível de isolamento permite (lost update, write skew).
- **Sistemas distribuídos mentem:** relógios divergem, redes atrasam, nós pausam. Use timeouts,
  retries com backoff e **idempotência**.
- **Logs de eventos como fonte da verdade:** estado derivado (caches, índices de busca) é recalculável a partir do log.
- **Processamento em fluxo** (streams) para reagir a mudanças; batch para recomputar com garantias.

## Aplicação no front-end

| Problema | Padrão |
|----------|--------|
| Duplo clique cria dois pedidos | chave de idempotência por intenção do usuário |
| UI otimista diverge do servidor | reconciliação com versão/ETag; rollback visível |
| Dados desatualizados após salvar | read-your-writes: atualize o cache local com a resposta |
| Offline-first | fila local de operações + sincronização com resolução de conflitos (CRDT/last-writer-wins consciente) |
| Lista infinita lenta | paginação por cursor, não por offset |
| Realtime | eventos com ordem/versão; tolerar duplicados e fora de ordem |
| Cache de assets entre deploys | nomes com hash de conteúdo + `Cache-Control` imutável |

## Checklist de revisão

- [ ] Toda operação que pode ser repetida (retry, duplo clique) é idempotente?
- [ ] Timeouts e retries com backoff + jitter em toda chamada de rede?
- [ ] O usuário sempre vê o que acabou de escrever?
- [ ] Mudanças de schema/API são compatíveis com clientes em cache?
- [ ] Métricas em percentis (p95/p99) de latência?
- [ ] Existe uma fonte da verdade clara e estados derivados recalculáveis?
- [ ] O que acontece se a rede cair no meio da operação?

## Sinais de alerta

| Sinal | Risco |
|-------|-------|
| `setTimeout` para "esperar o servidor terminar" | condição de corrida |
| Estado duplicado em três stores | divergência inevitável |
| Média de latência "ok" | p99 escondendo usuários sofrendo |
| Retry infinito sem backoff | tempestade de requisições |
