---
name: parede-da-ia
description: Awwwards-level art direction and front-end engineering with real eyes and hands (Playwright + FFmpeg). Use when creating, redesigning or auditing landing pages, sites, portfolios, components and UI; when briefing a corporate site; when dissecting references (Awwwards, monopo, Lusion) and their animations; when reviewing code, architecture, commits or prompts against 23 classic books and 7 aesthetics; and whenever you need to open a page, scroll, click, record frames, measure contrast, motion and microinteractions, or extract a site's fonts, palette and stack.
---

# parede-da-ia

Read the router and follow it: it classifies the task and the project archetype (corporate, personal
or ambitious) and tells you which modules, aesthetic and workflow to load on demand.

- Router: `{{PAREDE_REPO}}/prompts/router.md`
- Remote fallback: https://raw.githubusercontent.com/AnThophicous/parede-da-ia/main/prompts/router.md
- Effect recipes (Hover Font, text morph, magnetic, pixel trail…): `{{PAREDE_REPO}}/library/`

## Tools

On the PATH (after `npm link`) or through `node "{{PAREDE_REPO}}/toolkit/bin/parede.js" <command>`:

| Command | What for |
|---------|----------|
| `web-url-fetch <url>` | opens it in a persistent Chromium and injects hooks |
| `web-wait-page-load` | waits for load + networkidle + fonts (the default) |
| `web-wait <s>` | fallback for canvas/WebGL preloaders |
| `web-control <action>` | scroll, click, hover, mousemove, drag, keypress, inventory, sequence |
| `web-eval "<js>"` | reads page state (inspection, not for changing the UI) |
| `web-screenshot` | high definition, viewport/page/element, `--viewports desktop,tablet,mobile` |
| `web-record-frames` | frames every 0.5s → spritesheet + MP4; `--selector` crops one element |
| `web-scrap` | stack, fonts, icons, palette, contrast, media, shaders, network, aesthetic |
| `web-motion` | what animates, easings, durations, fps and jank (including bundled GSAP) |
| `web-interactions` | hover, focus and :active of every interactive element, with a before/after sheet |
| `web-audit` | a 0–100 score per viewport: accessibility, responsive, performance, SEO |
| `web-tokens` | exports colors, type, spacing and motion as CSS + JSON |
| `web-diff` · `media-frames` | compares captures (SSIM) · extracts frames from reference videos |
| `web-serve <folder> --detach` | a local static server |
| `web-close` | ends the session |

Non-negotiable rule: **never declare an interface done without opening it with `web-url-fetch`,
reading the screenshots and passing `web-audit`.**
