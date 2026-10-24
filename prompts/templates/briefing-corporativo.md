# Template · briefing corporativo

> Envie como UMA mensagem. ★ = obrigatória para prosseguir. Ofereça as sugestões entre parênteses.
> Respostas faltantes viram `[hipótese]` explícita no plano — nunca suposição silenciosa.

## Negócio
1. ★ O que a empresa faz, em uma frase que um cliente entenderia? (ex.: "contabilidade para clínicas médicas")
2. ★ Objetivo principal do site, mensurável. (ex.: "40 pedidos de proposta por mês", "reduzir ligações ao suporte")
3. Objetivos secundários. (recrutamento, imprensa, investidores, parceiros)
4. Principais concorrentes e o que fazem melhor/pior que vocês.
5. Diferencial real (não "qualidade e compromisso"): por que alguém escolhe vocês?

## Público
6. ★ Quem decide a compra? Quem influencia? (cargo, setor, porte)
7. Qual dor ou objeção mais aparece nas vendas?
8. Em que dispositivo e contexto o público chega? (mobile em trânsito, desktop no escritório)
9. Nível de familiaridade técnica e vocabulário do público.

## Marca
10. ★ Existe manual de marca (logo, cores, tipografia)? Envie os arquivos.
11. Três adjetivos que a marca **é** e três que **não é**.
12. Marcas (de qualquer setor) cuja presença digital vocês admiram, e por quê.
13. Existe fotografia própria? Vídeo? Ilustração? Quem produz novos assets?

## Conteúdo
14. ★ Páginas/seções necessárias. (home, serviços, cases, sobre, blog, contato, carreiras)
15. Quem escreve os textos e quando ficam prontos?
16. Provas disponíveis: números, cases, logos de clientes (com autorização), certificações, prêmios.
17. Idiomas.

## Conversão
18. ★ Ação principal (CTA) e para onde ela leva (formulário, WhatsApp, agenda, trial).
19. Campos mínimos do formulário e para onde vão os leads (CRM, e-mail).
20. Ações secundárias aceitáveis (newsletter, material rico, demo gravada).

## Técnica
21. Stack obrigatória ou preferida? CMS? Quem atualiza o site depois?
22. Hospedagem e domínio.
23. Integrações (analytics, pixel, CRM, chat).
24. Metas de performance (ex.: LCP ≤ 2,5s em 4G) e SEO (palavras-chave prioritárias).

## Compliance e acessibilidade
25. ★ Regras do setor que afetam conteúdo (CFM, OAB, CVM, ANVISA…).
26. LGPD: política de privacidade, banner de cookies, base legal dos formulários.
27. Nível de acessibilidade exigido (padrão parede-da-ia: WCAG 2.2 AA).

## Operação
28. ★ Quem aprova o layout e quantas rodadas de revisão?
29. Prazo e marcos.
30. O que está explicitamente fora do escopo?

---

### Saída esperada do agente após as respostas

```yaml
briefing:
  empresa: ""
  objetivo_mensuravel: ""
  publico: { decisor: "", dor: "", contexto: "" }
  marca: { manual: sim|não, adjetivos_sim: [], adjetivos_nao: [] }
  conteudo: { secoes: [], provas: [], responsavel: "", prazo: "" }
  conversao: { cta: "", destino: "" }
  tecnica: { stack: "", cms: "", hospedagem: "" }
  compliance: { setor: "", lgpd: "", wcag: "2.2 AA" }
  operacao: { aprovador: "", rodadas: 0, prazo: "" }
  hipoteses: []        # tudo que foi assumido
  estetica_recomendada: corporativo-modernista | corporativo-marca | produto-saas
  aceite: { web_audit: ">= 90", lcp: "<= 2.5s", contraste: "AA em 100% dos textos" }
```
