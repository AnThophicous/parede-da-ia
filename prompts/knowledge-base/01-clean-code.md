# 01 · Clean Code — legibilidade como requisito

> Fonte: *Clean Code*, Robert C. Martin. Destilação autoral para agentes — não é transcrição.
> **Carregue quando:** escrever ou revisar qualquer código, especialmente componentes de UI,
> hooks, handlers e utilitários.

## Princípios

1. **Código é lido muito mais vezes do que é escrito.** Otimize para o próximo leitor (humano ou agente).
2. **Nomes revelam intenção.** Se um nome precisa de comentário, o nome está errado.
3. **Funções fazem uma coisa, num só nível de abstração.** Orquestração e detalhe não se misturam.
4. **Poucos argumentos.** Zero a dois é o ideal; três exige justificativa; flags booleanas escondem duas funções.
5. **Sem efeitos colaterais escondidos.** Uma função chamada `getX` não grava nada.
6. **Comentários explicam o *porquê*, nunca o *o quê*.** O código conta o que faz; o comentário conta a restrição invisível.
7. **Erros são fluxo de primeira classe.** Lance exceções com contexto; não devolva `null` como código de erro.
8. **Regra do escoteiro:** deixe cada arquivo que tocar um pouco mais limpo — sem refatorar o mundo.

## Checklist de revisão

- [ ] Cada nome responde "o que é / por que existe / como se usa" sem ler o corpo?
- [ ] Nomes de booleanos soam como perguntas (`isOpen`, `hasError`, `canSubmit`)?
- [ ] Nenhuma função passa de ~30 linhas sem um bom motivo?
- [ ] Nenhum parâmetro booleano muda o comportamento da função (`render(true)`)?
- [ ] Condicionais complexas foram extraídas para funções com nome (`isEligibleForDiscount()`)?
- [ ] Números e strings mágicas viraram constantes nomeadas (`HEADER_HEIGHT = 72`)?
- [ ] Não há código morto, `console.log` esquecido ou comentário de código antigo?
- [ ] Erros carregam contexto suficiente para depurar sem reproduzir?
- [ ] O arquivo lê de cima para baixo como uma narrativa (alto nível primeiro, detalhes depois)?

## Sinais de alerta (code smells)

| Sinal | O que geralmente significa | Correção típica |
|-------|---------------------------|-----------------|
| Componente com 400+ linhas | várias responsabilidades misturadas | extrair subcomponentes e hooks |
| `data`, `info`, `item`, `temp`, `handleClick2` | nome sem intenção | renomear pelo papel no domínio |
| `if` aninhado 3+ níveis | regras de negócio enroladas | guard clauses, early return |
| Comentário "// gambiarra, não mexer" | dívida não documentada | explicar a restrição ou corrigir |
| Mesmo `try/catch` copiado em 5 lugares | política de erro sem dono | centralizar num wrapper |
| Props drilling por 4 níveis | estado no lugar errado | contexto, composição ou store |

## Aplicação em front-end

- **Componentes:** um componente = uma responsabilidade visual. Lógica de dados vai para hooks
  (`useCart`), formatação para funções puras (`formatPrice`).
- **CSS:** nomes de classe descrevem papel (`.card__title`), não aparência (`.big-blue-text`).
- **Handlers:** `onSubmit` orquestra; validação, chamada de API e feedback são funções separadas.
- **Estados de UI:** nomeie todos explicitamente (`idle | loading | success | error`) em vez de
  combinações de booleanos que permitem estados impossíveis.

## Exemplo

```ts
// antes — o leitor precisa simular o código para entender
function proc(d: any, f: boolean) {
  if (d && d.items && d.items.length > 0) {
    if (f) return d.items.filter((i: any) => i.p > 0 && !i.x).map((i: any) => i.p * 1.1);
    return d.items.map((i: any) => i.p);
  }
  return [];
}

// depois — os nomes contam a história; cada função tem um nível de abstração
const TAX_RATE = 0.1;
const isBillable = (item: CartItem) => item.price > 0 && !item.isGift;
const withTax = (price: number) => price * (1 + TAX_RATE);

function billablePricesWithTax(cart: Cart): number[] {
  return cart.items.filter(isBillable).map((item) => withTax(item.price));
}
```

## Perguntas de autoavaliação

1. Um dev novo entenderia este arquivo em 2 minutos?
2. Se eu apagar todos os comentários, o código ainda explica a si mesmo?
3. Há alguma função que eu não conseguiria testar isoladamente?
