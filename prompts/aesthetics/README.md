# Estéticas · índice e matriz de decisão

<module_meta>
  <role>Mapa das famílias estéticas do parede-da-ia. Carregue este índice, escolha UMA família principal (e no máximo uma secundária) e então carregue o playbook correspondente.</role>
  <enforcement_level>GUIDED — a família orienta; a marca e o briefing decidem.</enforcement_level>
  <evidence>Playbooks construídos a partir de referências medidas com a toolkit (web-scrap, web-motion, web-interactions, media-frames).</evidence>
</module_meta>

---

<matrix>
## 1. Arquétipo × família

| | corporativo-modernista | corporativo-marca | produto-saas | canvas-ludico | editorial-brutalista | gradiente-atmosferico | imersivo-webgl |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Corporativo** | ★★★ | ★★★ | ★★★ | — | ★ | ★ (só o hero) | — |
| **Pessoal / portfólio** | ★ | ★ | — | ★★★ | ★★★ | ★★ | ★ |
| **Ambicioso / experiência** | — | ★ | — | ★ | ★★ | ★★★ | ★★★ |

★★★ natural · ★★ funciona com cuidado · ★ só como acento · — evite
</matrix>

---

<families>
## 2. Famílias

| id | Essência | Ápice típico | Custo de performance |
|----|----------|--------------|----------------------|
| [`corporativo-modernista`](corporativo-modernista.md) | Suíço, econômico, grid rígido, uma cor | tipografia grande e silêncio | baixo |
| [`corporativo-marca`](corporativo-marca.md) | Marca protagonista: cor forte, display arredondado, formas orgânicas | forma de marca que atravessa o hero | baixo–médio |
| [`produto-saas`](produto-saas.md) | O produto é o herói: UI real, provas, planos | demo animada do produto | baixo–médio |
| [`canvas-ludico`](canvas-ludico.md) | Prancheta de designer viva e arrastável | wordmark com caixa de seleção + rastro de pixels | médio |
| [`editorial-brutalista`](editorial-brutalista.md) | Contraste tipográfico extremo, monocromia | título gigante com Hover Font | baixo–médio |
| [`gradiente-atmosferico`](gradiente-atmosferico.md) | Campos de cor desfocados, grão, vidro | campo líquido + texto em máscara | médio–alto |
| [`imersivo-webgl`](imersivo-webgl.md) | Cena 3D viva, partículas, física | morph de partículas / objeto 3D reativo | alto |

Receitas de gradiente: [`biblioteca-de-blurs.md`](biblioteca-de-blurs.md).
</families>

---

<mixing_rules>
## 3. Regras de mistura

1. **Uma família manda; a secundária só tempera** (ex.: `corporativo-marca` + um hero `gradiente-atmosferico`).
2. **Corporativo nunca herda o custo do imersivo:** se usar WebGL, é um único elemento com fallback estático e orçamento de 60 fps em GPU integrada.
3. **Ápice único:** se a secundária traz um ápice, a principal abre mão do dela.
4. **Coerência de movimento:** uma linguagem de movimento por site (`knowledge-base/13` §2).
5. **Confirme a hipótese:** `web-scrap` → `aesthetic.primary/secondary` serve para referências; para o projeto do usuário, a decisão vem do briefing/direção aprovada.
</mixing_rules>
