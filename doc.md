# parede-da-ia · universal installer for agents

> **To the agent reading this:** the user asked you to install `parede-da-ia`.
> Run the steps **in order**, running each command in the user's terminal and checking the
> output before moving on. If a check fails, apply the given fix; if no fix is possible, stop
> and tell the user what is missing. Don't skip steps.
> At the end, show the output of `parede doctor` and where the router was registered.

Repository: https://github.com/AnThophicous/parede-da-ia
Default destination: `~/.parede-da-ia` (Windows: `%USERPROFILE%\.parede-da-ia`).

---

## Step 1 — Prerequisites

```bash
node --version    # must be >= 18.17 (20 or 22 LTS recommended)
git --version
```

- Node missing or old → install the LTS: macOS `brew install node` · Ubuntu/Debian via
  NodeSource or `nvm install --lts` · Windows `winget install OpenJS.NodeJS.LTS`.
  After installing, open a new terminal.
- Git missing → macOS `xcode-select --install` · Linux `sudo apt install git` · Windows `winget install Git.Git`.

## Step 2 — Clone (or update)

```bash
# macOS / Linux / Git Bash
if [ -d "$HOME/.parede-da-ia/.git" ]; then git -C "$HOME/.parede-da-ia" pull --ff-only; else git clone --depth 1 https://github.com/AnThophicous/parede-da-ia.git "$HOME/.parede-da-ia"; fi
```

```powershell
# Windows PowerShell
$dest = "$env:USERPROFILE\.parede-da-ia"
if (Test-Path "$dest\.git") { git -C $dest pull --ff-only } else { git clone --depth 1 https://github.com/AnThophicous/parede-da-ia.git $dest }
```

**Check:** the file `~/.parede-da-ia/prompts/router.md` exists.

## Step 3 — Install the toolkit (Playwright + TypeScript build)

```bash
cd ~/.parede-da-ia/toolkit
npm install            # installs dependencies and builds ("prepare" script)
npx playwright install chromium
```

- Linux without system libraries → `npx playwright install --with-deps chromium` (asks for sudo).
- npm ≥ 11 may warn that the `ffmpeg-static` install script was not approved. If
  Step 4 reports FFmpeg missing, run `npm install-scripts approve ffmpeg-static && npm rebuild ffmpeg-static`
  or install the system FFmpeg.

**Check:** `~/.parede-da-ia/toolkit/dist/cli.js` exists.

## Step 4 — FFmpeg (frame recording → spritesheet/MP4)

```bash
ffmpeg -version
```

The toolkit looks, in this order: `PAREDE_FFMPEG` → `ffmpeg` on the PATH → the `ffmpeg-static`
package (already installed as an optional dependency). If none works:

- macOS `brew install ffmpeg` · Ubuntu/Debian `sudo apt install -y ffmpeg` · Windows `winget install Gyan.FFmpeg`

Without FFmpeg everything works except assembling the spritesheet/MP4 (frames are still saved).

## Step 5 — Commands on the PATH

```bash
cd ~/.parede-da-ia/toolkit
npm link
web-scrap --help       # must print the command usage
```

If `npm link` fails on permissions, **don't reach for sudo blindly**: use the universal fallback
`node ~/.parede-da-ia/toolkit/bin/parede.js <command>` (e.g. `... parede.js web-scrap`).

## Step 6 — Register the router in the agents

```bash
node ~/.parede-da-ia/toolkit/bin/parede.js setup --agent auto
```

The command is **idempotent** (blocks delimited by `<!-- parede-da-ia:start/end -->`) and registers
the router in the global instructions of every agent whose folder exists:

| Agent | Where |
|-------|-------|
| Claude Code | `~/.claude/skills/parede-da-ia/SKILL.md` + a block in `~/.claude/CLAUDE.md` |
| Codex CLI | `~/.codex/AGENTS.md` |
| OpenCode | `~/.config/opencode/AGENTS.md` |
| Gemini CLI | `~/.gemini/GEMINI.md` |
| Windsurf | `~/.codeium/windsurf/memories/global_rules.md` |
| Cursor / others | `parede setup --project` → `./AGENTS.md` + `.cursor/rules/parede-da-ia.mdc` |

To force a specific agent: `--agent claude` (repeatable). To simulate: `--dry-run`.

### Optional — MCP server

```bash
# Claude Code
claude mcp add parede-da-ia -- node ~/.parede-da-ia/toolkit/bin/parede-mcp.js
```

```toml
# Codex: ~/.codex/config.toml
[mcp_servers.parede-da-ia]
command = "node"
args = ["/ABSOLUTE/PATH/.parede-da-ia/toolkit/bin/parede-mcp.js"]
```

```json
// OpenCode: opencode.json
{ "mcp": { "parede-da-ia": { "type": "local", "command": ["node", "/ABSOLUTE/PATH/.parede-da-ia/toolkit/bin/parede-mcp.js"] } } }
```

## Step 7 — Diagnostics and smoke test

```bash
parede doctor          # or: node ~/.parede-da-ia/toolkit/bin/parede.js doctor
cd ~/.parede-da-ia/toolkit && npm run smoke
```

Expected: `✔` for node, playwright, chromium and agents; `✔` or `⚠` (acceptable) for ffmpeg and PATH;
the smoke test ends with 24 `✔` lines.

## Step 8 — Report to the user

Reply with:
1. the installed version and path (`~/.parede-da-ia`);
2. a short summary of `parede doctor`;
3. the agents where the router was registered;
4. how to start: _"ask: build a landing page for X"_ — the router identifies the project archetype
   (corporate asks for a brief and an aesthetic; a portfolio gets a creative direction; an experience
   gets an apex) and applies the `frontend-master` workflow: questions first, then building with
   automatic visual QA (`web-audit`, `web-interactions`, `web-motion`).

Remind the user to **restart the agent session** so the new global instructions are loaded.

---

### Update / uninstall

```bash
git -C ~/.parede-da-ia pull --ff-only && (cd ~/.parede-da-ia/toolkit && npm install && npm link)
parede setup --agent auto   # refreshes the router block (tool list) in the agents
# uninstall: npm unlink -g parede-da-ia; remove ~/.parede-da-ia and ~/.parede,
# and delete the <!-- parede-da-ia:start --> … <!-- parede-da-ia:end --> blocks from the Step 6 files.
```
