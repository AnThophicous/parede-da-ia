# parede-da-ia · instalador universal para agentes

> **Para o agente que está lendo isto:** o usuário pediu para você instalar o `parede-da-ia`.
> Execute as etapas **em ordem**, rodando cada comando no terminal do usuário e verificando a
> saída antes de seguir. Se uma verificação falhar, aplique a correção indicada; se não houver
> correção possível, pare e explique ao usuário o que falta. Não pule etapas.
> Ao final, mostre o resultado de `parede doctor` e onde o router foi registrado.

Repositório: https://github.com/AnThophicous/parede-da-ia
Destino padrão: `~/.parede-da-ia` (Windows: `%USERPROFILE%\.parede-da-ia`).

---

## Etapa 1 — Pré-requisitos

```bash
node --version    # precisa ser >= 18.17 (recomendado 20 ou 22 LTS)
git --version
```

- Node ausente ou antigo → instale a LTS: macOS `brew install node` · Ubuntu/Debian via
  NodeSource ou `nvm install --lts` · Windows `winget install OpenJS.NodeJS.LTS`.
  Depois de instalar, abra um terminal novo.
- Git ausente → macOS `xcode-select --install` · Linux `sudo apt install git` · Windows `winget install Git.Git`.

## Etapa 2 — Clonar (ou atualizar)

```bash
# macOS / Linux / Git Bash
if [ -d "$HOME/.parede-da-ia/.git" ]; then git -C "$HOME/.parede-da-ia" pull --ff-only; else git clone --depth 1 https://github.com/AnThophicous/parede-da-ia.git "$HOME/.parede-da-ia"; fi
```

```powershell
# Windows PowerShell
$dest = "$env:USERPROFILE\.parede-da-ia"
if (Test-Path "$dest\.git") { git -C $dest pull --ff-only } else { git clone --depth 1 https://github.com/AnThophicous/parede-da-ia.git $dest }
```

**Verificação:** o arquivo `~/.parede-da-ia/prompts/router.md` existe.

## Etapa 3 — Instalar a toolkit (Playwright + build TypeScript)

```bash
cd ~/.parede-da-ia/toolkit
npm install            # instala dependências e compila (script "prepare")
npx playwright install chromium
```

- Linux sem bibliotecas de sistema → `npx playwright install --with-deps chromium` (pede sudo).
- npm ≥ 11 pode avisar que o script de instalação do `ffmpeg-static` não foi aprovado. Se a
  Etapa 4 indicar FFmpeg ausente, rode `npm install-scripts approve ffmpeg-static && npm rebuild ffmpeg-static`
  ou instale o FFmpeg do sistema.

**Verificação:** existe `~/.parede-da-ia/toolkit/dist/cli.js`.

## Etapa 4 — FFmpeg (gravação de frames → spritesheet/MP4)

```bash
ffmpeg -version
```

A toolkit procura, nesta ordem: `PAREDE_FFMPEG` → `ffmpeg` no PATH → pacote `ffmpeg-static`
(já instalado como dependência opcional). Se nenhum funcionar:

- macOS `brew install ffmpeg` · Ubuntu/Debian `sudo apt install -y ffmpeg` · Windows `winget install Gyan.FFmpeg`

Sem FFmpeg tudo funciona, exceto a montagem de spritesheet/MP4 (os frames continuam sendo salvos).

## Etapa 5 — Comandos no PATH

```bash
cd ~/.parede-da-ia/toolkit
npm link
web-scrap --help       # deve imprimir o uso do comando
```

Se `npm link` falhar por permissão, **não use sudo às cegas**: use o fallback universal
`node ~/.parede-da-ia/toolkit/bin/parede.js <comando>` (ex.: `... parede.js web-scrap`).

## Etapa 6 — Registrar o router nos agentes

```bash
node ~/.parede-da-ia/toolkit/bin/parede.js setup --agent auto
```

O comando é **idempotente** (blocos delimitados por `<!-- parede-da-ia:start/end -->`) e registra
o router nas instruções globais dos agentes cujas pastas existem:

| Agente | Onde |
|--------|------|
| Claude Code | `~/.claude/skills/parede-da-ia/SKILL.md` + bloco em `~/.claude/CLAUDE.md` |
| Codex CLI | `~/.codex/AGENTS.md` |
| OpenCode | `~/.config/opencode/AGENTS.md` |
| Gemini CLI | `~/.gemini/GEMINI.md` |
| Windsurf | `~/.codeium/windsurf/memories/global_rules.md` |
| Cursor / outros | `parede setup --project` → `./AGENTS.md` + `.cursor/rules/parede-da-ia.mdc` |

Para forçar um agente específico: `--agent claude` (repetível). Para simular: `--dry-run`.

### Opcional — servidor MCP

```bash
# Claude Code
claude mcp add parede-da-ia -- node ~/.parede-da-ia/toolkit/bin/parede-mcp.js
```

```toml
# Codex: ~/.codex/config.toml
[mcp_servers.parede-da-ia]
command = "node"
args = ["/CAMINHO/ABSOLUTO/.parede-da-ia/toolkit/bin/parede-mcp.js"]
```

```json
// OpenCode: opencode.json
{ "mcp": { "parede-da-ia": { "type": "local", "command": ["node", "/CAMINHO/ABSOLUTO/.parede-da-ia/toolkit/bin/parede-mcp.js"] } } }
```

## Etapa 7 — Diagnóstico e teste de fumaça

```bash
parede doctor          # ou: node ~/.parede-da-ia/toolkit/bin/parede.js doctor
cd ~/.parede-da-ia/toolkit && npm run smoke
```

Esperado: `✔` em node, playwright, chromium e agentes; `✔` ou `⚠` (aceitável) em ffmpeg e PATH;
o smoke test termina com 10 linhas `✔`.

## Etapa 8 — Relatório ao usuário

Responda com:
1. versão instalada e caminho (`~/.parede-da-ia`);
2. saída resumida do `parede doctor`;
3. agentes onde o router foi registrado;
4. como começar: _"peça: crie uma landing para X"_ — o router aplicará o workflow `frontend-master`
   (perguntas primeiro, depois construção com QA visual automático).

Lembre o usuário de **reiniciar a sessão do agente** para que as novas instruções globais sejam carregadas.

---

### Atualizar / desinstalar

```bash
git -C ~/.parede-da-ia pull --ff-only && (cd ~/.parede-da-ia/toolkit && npm install)
# desinstalar: npm unlink -g parede-da-ia; remova ~/.parede-da-ia e ~/.parede,
# e apague os blocos <!-- parede-da-ia:start --> … <!-- parede-da-ia:end --> dos arquivos da Etapa 6.
```
