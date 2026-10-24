# 14 · Thinking with Type — Letra, Texto e Grid como Voz

<module_meta>
  <source>Thinking with Type — Ellen Lupton (destilação autoral)</source>
  <router_trigger>Carregar ao escolher fontes, montar escala tipográfica, compor títulos expressivos, usar fontes variáveis (Hover Font) ou revisar legibilidade de texto corrido.</router_trigger>
  <enforcement_level>STRICT para legibilidade de texto corrido; GUIDED para display expressivo.</enforcement_level>
  <pairs_with>05 · 15 · 16 · 22</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axiomas

### Letra
1. **Tipo tem anatomia e voz.** Altura-x, abertura, contraste de traço e terminais definem a personalidade antes do conteúdo.
2. **Pares por contraste, não por semelhança:** sans geométrica + serifa itálica; grotesca + mono. Duas famílias bastam; três é o limite.
3. **Fontes variáveis são um material:** eixos de peso (wght), largura (wdth), tamanho óptico (opsz) e itálico permitem hierarquia e movimento sem trocar de arquivo.

### Texto
4. **Medida:** 45–75 caracteres por linha no corpo; 30–45 em colunas estreitas e no mobile.
5. **Entrelinha** cresce com a medida e diminui com o tamanho (corpo 1.5–1.7; display 0.85–1.05).
6. **Tracking:** negativo no display grande, positivo em caixa-alta pequena, zero no corpo.
7. **Alinhamento à esquerda** para texto corrido; centralizado só em blocos curtos.
8. **Hierarquia com poucos sinais:** tamanho OU peso OU cor por nível — empilhar todos grita.

### Grid
9. **Tipo assenta numa grade:** linha de base comum, margens consistentes, colunas que alinham título, texto e imagem.
10. **Assimetria intencional** (editorial) só funciona sobre um grid rigoroso.
</core_axioms>

---

<expressive_type>
## 2. Display expressivo (ambicioso/pessoal)

| Técnica | Regra |
|---------|-------|
| **Hover Font** (peso por proximidade do cursor) | fonte variável com wght amplo (100–900); raio 120–220px; interpolação suave; **reserve espaço** para a largura máxima (evita reflow) ou use fonte com largura estável; desligue em reduced-motion e em touch |
| Letras em itálico no meio da palavra (monopo: "Creat*i*ve") | 1–2 letras por palavra, mesma família com eixo ital |
| Contraste de escala extremo | display ≥ 8× o corpo; corpo continua confortável |
| Texto em máscara (reveal por linha) | `overflow: hidden` no pai, `translateY(105%)` no filho |
| Mix de serifa itálica em sans | só em palavras-chave (ênfase semântica) |
</expressive_type>

---

<agent_traps>
## 3. Trava (proibido)
- Mais de 3 famílias ou mais de 8 tamanhos na página.
- Texto corrido em display font ou em fonte fina (< 300) sobre fundo com textura.
- Caixa-alta em parágrafos.
- Fonte fallback visível (FOUT sem `size-adjust`): use `font-display: swap` + métricas de fallback.
- Hover Font que muda a largura das letras empurrando o layout (CLS).
</agent_traps>

---

<review_checklist>
## 4. Rubrica (toolkit)
- [ ] `web-scrap` → `fonts.used`: ≤ 3 famílias; `fonts.scale`: ≤ 8 tamanhos.
- [ ] Medida do corpo 45–75 caracteres (meça na captura: largura da coluna / ~0,5em).
- [ ] `web-audit`: sem texto < 12px no mobile.
- [ ] CLS ≤ 0,1 com a Hover Font ativa (`web-scrap` → `perf.cls` após `web-control mousemove`).
</review_checklist>
