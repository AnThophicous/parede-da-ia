# 02 · Clean Architecture — a UI é um detalhe

> Fonte: *Clean Architecture*, Robert C. Martin. Destilação autoral para agentes.
> **Carregue quando:** definir estrutura de pastas, separar camadas, escolher onde mora uma
> regra de negócio ou avaliar o acoplamento a framework.

## Princípios

1. **Regra da dependência:** dependências de código-fonte apontam **para dentro**, rumo às
   políticas de alto nível. Domínio não importa React, Prisma, Express nem SDK de terceiros.
2. **Framework, banco e UI são detalhes.** São plugins nas bordas; a regra de negócio sobrevive à troca deles.
3. **Casos de uso explícitos.** Cada intenção do usuário (`CheckoutCart`, `PublishPost`) é uma
   unidade nomeada e testável sem I/O.
4. **Fronteiras com interfaces (portas).** O núcleo declara o que precisa (`PaymentGateway`);
   a borda implementa (`StripePaymentGateway`).
5. **SOLID como higiene:** responsabilidade única, aberto/fechado, substituição, interfaces
   enxutas e inversão de dependência.
6. **Arquitetura grita o domínio.** A árvore de pastas deve dizer "loja", "agenda" — não "controllers/models/views".
7. **Adie decisões caras.** Boa arquitetura mantém opções abertas (qual banco, qual CMS) o maior tempo possível.

## Checklist de revisão

- [ ] Algum arquivo de domínio/caso de uso importa framework, ORM ou `fetch` diretamente?
- [ ] Dá para testar a regra de negócio sem navegador, rede ou banco?
- [ ] Componentes de UI recebem dados prontos e emitem intenções, sem decidir regra de negócio?
- [ ] Trocar o provedor (ex.: Stripe → Mercado Pago) muda só um adaptador?
- [ ] A estrutura de pastas é organizada por feature/domínio, não por tipo técnico?
- [ ] Existe um único lugar que monta as dependências (composition root)?

## Camadas recomendadas para front-end

```
src/
  domain/          entidades e regras puras (sem imports externos)
  application/     casos de uso + portas (interfaces) que o domínio precisa
  infrastructure/  adaptadores: API clients, storage, analytics, SDKs
  ui/              componentes, páginas, estilos — consomem casos de uso
  main.ts          composition root: liga adaptadores às portas
```

Para projetos pequenos, colapse para `features/<feature>/{model,api,ui}` — mas preserve a direção
das dependências: `ui → model ← api`.

## Sinais de alerta

| Sinal | Risco | Correção |
|-------|-------|----------|
| `useEffect` com regra de preço/desconto | regra presa ao React | mover para função pura em `domain/` |
| Componente chama `axios` direto | UI acoplada ao transporte | cliente/repositório injetado |
| Tipos do ORM vazando até a UI | troca de banco quebra telas | DTOs/mapeadores na borda |
| `utils/` com 60 funções sem relação | ausência de fronteiras | redistribuir por domínio |
| Mudança em uma feature quebra outra | acoplamento oculto | módulos com API pública explícita |

## Aplicação para landing pages e sites

Mesmo um site "simples" se beneficia: **conteúdo** (textos, dados de produto) separado de
**apresentação** (componentes) e de **efeitos** (animações, WebGL). Assim a direção de arte
pode trocar o motor de animação sem reescrever o conteúdo, e o conteúdo pode ir para um CMS
sem tocar nos componentes.

## Perguntas de autoavaliação

1. Se o framework de UI fosse proibido amanhã, quanto do código sobreviveria?
2. Qual é a menor mudança que faria um teste de domínio precisar de rede?
3. Minhas pastas contam a história do produto ou da tecnologia?
