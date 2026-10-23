# 06 · The Pragmatic Programmer — ofício e resiliência

> Fonte: *The Pragmatic Programmer* (20th Anniversary), Andrew Hunt & David Thomas.
> Destilação autoral para agentes. **Carregue quando:** planejar uma implementação, avaliar
> duplicação/acoplamento, escolher abordagem incremental ou lidar com incerteza.

## Princípios

1. **Responsabilidade pelo resultado.** Ofereça opções, não desculpas. Se algo não dá, diga o que dá.
2. **Não tolere janelas quebradas.** Um hack não corrigido convida dez. Corrija ou registre com clareza.
3. **DRY é sobre conhecimento, não sobre texto.** Cada regra tem **uma** representação autoritativa.
   Dois trechos parecidos que mudam por motivos diferentes **não** são duplicação.
4. **Ortogonalidade:** mudar uma coisa não deve exigir mudar coisas não relacionadas.
   Teste: "se eu trocar X, quantos módulos quebram?"
5. **Reversibilidade:** nenhuma decisão é final. Isole fornecedores e formatos atrás de abstrações.
6. **Tracer bullets:** construa um caminho fino ponta a ponta (UI → API → dados) cedo, depois engorde.
7. **Protótipos são descartáveis** e servem para aprender; não vire protótipo em produção sem reescrever.
8. **Estimativas em unidades honestas** e com faixa; refine conforme aprende.
9. **Design by contract e asserções:** declare pré/pós-condições; falhe cedo e alto (crash early).
10. **Não programe por coincidência.** Se funciona e você não sabe por quê, ainda não funciona.
11. **Teste o seu software, ou seus usuários testarão.** Automatize o que for repetido.
12. **Linguagem de domínio:** use o vocabulário do usuário no código.

## Checklist de revisão

- [ ] Alguma regra de negócio aparece em mais de um lugar (front e back, dois componentes)?
- [ ] Alguma mudança simples exigiria editar arquivos em camadas diferentes sem motivo?
- [ ] Fornecedores (CMS, pagamento, analytics) estão atrás de um adaptador?
- [ ] Há uma fatia ponta a ponta funcionando antes de polir uma camada isolada?
- [ ] Entradas inválidas falham cedo com mensagem útil?
- [ ] Tarefas repetitivas (build, deploy, QA visual) estão automatizadas em scripts?
- [ ] Eu sei **por que** cada correção funciona?

## Aplicação para agentes de IA

- **Tracer bullet visual:** antes de animar, suba a página com o layout bruto e abra com
  `web-url-fetch`. Só depois adicione movimento e WebGL.
- **Automação do QA:** transforme o loop de verificação em script (`web-url-fetch → web-wait-page-load
  → web-screenshot --viewport ... → web-scrap`) em vez de repetir manualmente.
- **Janelas quebradas:** ao ver um warning de console ou falha de contraste no `web-scrap`, corrija
  na hora — não acumule.
- **Coincidência:** se um bug some depois de "mexer em várias coisas", isole qual mudança resolveu.

## Sinais de alerta

| Sinal | Princípio violado | Correção |
|-------|-------------------|----------|
| Mesma validação no form e na API, escrita duas vezes | DRY | schema compartilhado |
| Trocar a fonte exige editar 30 arquivos | ortogonalidade | tokens/variáveis CSS |
| SDK de analytics chamado em todo componente | reversibilidade | `track()` próprio |
| "Funciona na minha máquina" | coincidência | ambiente reproduzível, script de setup |
| Semanas polindo a UI sem integração | tracer bullets | fatia ponta a ponta primeiro |
