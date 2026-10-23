# 03 · Don't Make Me Think — usabilidade óbvia

> Fonte: *Don't Make Me Think, Revisited*, Steve Krug. Destilação autoral para agentes.
> **Carregue quando:** desenhar navegação, CTAs, formulários, hierarquia de página ou auditar UX.

## Princípios

1. **Óbvio vence inteligente.** Cada tela deve ser autoexplicativa; se não for, ao menos autoevidente com um segundo de olhar.
2. **Pessoas escaneiam, não leem.** Elas caçam palavras que casam com sua tarefa e clicam no primeiro "bom o bastante".
3. **Pessoas não descobrem como funciona — se viram.** Interfaces devem tolerar uso "errado".
4. **Cliques sem dúvida valem mais que poucos cliques.** Três cliques óbvios > um clique ambíguo.
5. **Corte palavras pela metade, depois corte de novo.** Texto de boas-vindas e instruções raramente são lidos.
6. **Convenções são amigas.** Logo no topo-esquerda leva à home; lupa é busca; carrinho no topo-direita.
7. **A navegação responde:** onde estou? o que tem aqui? para onde posso ir? como volto?
8. **A home tem um trabalho:** dizer em 5 segundos o que é o site, para quem é e o que fazer agora.
9. **Teste cedo, com poucas pessoas.** 3 usuários por rodada revelam a maioria dos problemas graves.
10. **Reservatório de boa vontade:** cada fricção (campos obrigatórios demais, popups, preços escondidos) drena a paciência.

## Checklist de revisão (heurística dos 5 segundos)

- [ ] Em 5s na dobra inicial dá para responder: o que é? para quem? qual a próxima ação?
- [ ] Existe **um** CTA primário por tela, visualmente dominante?
- [ ] Links e botões parecem clicáveis sem precisar de hover?
- [ ] O item de navegação atual está destacado (você-está-aqui)?
- [ ] Rótulos usam a linguagem do usuário, não o jargão interno ("Planos", não "Tiers SKU")?
- [ ] Títulos e subtítulos permitem entender a página só escaneando?
- [ ] Formulários: rótulos visíveis (não só placeholder), erros inline, nada obrigatório sem motivo?
- [ ] Busca e navegação persistentes nas páginas internas?
- [ ] No mobile o CTA principal está ao alcance do polegar e não some atrás de menus?

## Sinais de alerta

| Sinal | Por que dói | Correção |
|-------|-------------|----------|
| Hero com frase poética e nenhuma explicação | ninguém entende o produto | subtítulo literal + CTA claro |
| 3 botões do mesmo peso lado a lado | paralisia de escolha | 1 primário, 1 secundário, resto link |
| Ícone sem rótulo para ação rara | adivinhação | ícone + texto |
| "Clique aqui" / "Saiba mais" repetidos | links sem informação ao escanear | texto do link descreve o destino |
| Animação de entrada que bloqueia o conteúdo | atrasa a tarefa | conteúdo legível imediatamente; animação decora |
| Scroll-jacking que muda a velocidade | perda de controle | respeitar o wheel nativo, `prefers-reduced-motion` |

## Aplicação em sites "Awwwards"

Experimental não pode significar ilegível. A regra prática:
**a primeira leitura é convencional, a segunda é surpreendente.** Navegação, CTA e texto
principal seguem convenções; a ousadia mora na tipografia, no movimento e nas transições.

## Teste com a toolkit

```bash
web-url-fetch <url> && web-wait-page-load
web-screenshot                        # o que se vê nos primeiros 5 segundos?
web-control inventory                 # quantos interativos competem na dobra?
web-screenshot --viewport 390x844     # o CTA continua óbvio no mobile?
```

## Perguntas de autoavaliação

1. Um visitante distraído, no celular, entenderia o que fazer agora?
2. Que pergunta o usuário teria que fazer a si mesmo nesta tela — e como eliminá-la?
3. O que acontece se ele clicar no lugar "errado"?
