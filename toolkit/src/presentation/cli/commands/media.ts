import { existsSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { compareImages } from '../../../application/use-cases/compare-images.js';
import { extractVideoFrames } from '../../../application/use-cases/extract-video-frames.js';
import { ParedeError } from '../../../domain/errors.js';
import { slug, stamp } from '../../../domain/naming.js';
import { parseDuration, parseNumber } from '../../../domain/units.js';
import { kv, next, ok, parse, type Command } from './shared.js';

const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${(s % 60).toFixed(1).padStart(4, '0')}`;

export const mediaFrames: Command = {
  name: 'media-frames',
  group: 'mídia',
  summary: 'Deixa o agente "assistir" um vídeo: frames com timestamp + folhas de contato numeradas.',
  usage: `media-frames <vídeo> [opções]
  --every 1.5            um frame a cada N segundos (padrão: ~24 frames no vídeo todo)
  --scenes 0.25          em vez de intervalo fixo, um frame por mudança de cena (0–1)
  --from 5 --to 20       recorte de tempo em segundos
  --max 60               limite de frames
  --width 640            largura de cada frame extraído
  --columns 5            colunas da folha de contato
  --out <dir>

Use para gravações de tela que o usuário enviar (referências, bugs, protótipos).`,
  async execute(argv, ctx) {
    const { values, positionals } = parse(
      argv,
      { every: { type: 'string' }, scenes: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' }, max: { type: 'string' }, width: { type: 'string' }, columns: { type: 'string' }, out: { type: 'string' } },
      this.usage,
    );
    const input = positionals.join(' ').trim();
    if (!input) throw new ParedeError('BAD_ARG', 'Informe o arquivo de vídeo.', this.usage);
    const path = /^https?:/.test(input) ? input : resolve(input);
    if (!/^https?:/.test(path) && !existsSync(path)) throw new ParedeError('NOT_FOUND', `Arquivo não encontrado: ${path}`);
    const outDir = values.out ? resolve(values.out) : ctx.artifacts.dir('media', `${slug(basename(path).replace(/\.[^.]+$/, ''))}-${stamp()}`);
    const result = await extractVideoFrames(ctx.encoder(), {
      input: path,
      outDir,
      everySec: values.every ? parseDuration(values.every, 's') / 1000 : undefined,
      scenes: values.scenes !== undefined ? Number(values.scenes) : undefined,
      fromSec: values.from ? parseDuration(values.from, 's') / 1000 : undefined,
      toSec: values.to ? parseDuration(values.to, 's') / 1000 : undefined,
      target: 24,
      maxFrames: parseNumber(values.max, 'max', 60),
      width: parseNumber(values.width, 'width', 640),
      columns: parseNumber(values.columns, 'columns', 5),
    });
    const manifest = resolve(outDir, 'frames.json');
    writeFileSync(manifest, JSON.stringify(result, null, 2));
    const i = result.info;
    return {
      data: { manifest, ...result },
      text: [
        ok(`${result.frames.length} frames de ${basename(path)} (${fmtTime(i.durationSec)} · ${i.width}x${i.height} · ${i.fps} fps${i.hasAudio ? ' · com áudio' : ''})`),
        kv('modo', result.mode === 'cenas' ? 'mudança de cena' : `a cada ${result.everySec}s`),
        ...result.sheets.map((s) => kv('folha', s)),
        kv('tempos', result.frames.slice(0, 12).map((f) => `#${f.index + 1} ${fmtTime(f.timeSec)}`).join(' · ') + (result.frames.length > 12 ? ' …' : '')),
        kv('manifest', manifest),
        next('leia as folhas de contato (números = frames; tempos no manifest) e depois frames individuais se precisar de detalhe'),
      ].join('\n'),
    };
  },
};

export const diff: Command = {
  name: 'web-diff',
  group: 'mídia',
  summary: 'Compara duas imagens (antes × depois, build × referência): SSIM, PSNR, mapa de diferença e lado a lado.',
  usage: `web-diff <a.png> <b.png> [--out pasta]
  A segunda imagem é redimensionada para o tamanho da primeira se preciso.`,
  async execute(argv, ctx) {
    const { values, positionals } = parse(argv, { out: { type: 'string' } }, this.usage);
    const [a, b] = positionals.map((p) => resolve(p));
    if (!a || !b) throw new ParedeError('BAD_ARG', 'Informe duas imagens.', this.usage);
    for (const f of [a, b]) if (!existsSync(f)) throw new ParedeError('NOT_FOUND', `Arquivo não encontrado: ${f}`);
    const outDir = values.out ? resolve(values.out) : ctx.artifacts.dir('diff', stamp());
    const r = await compareImages(ctx.encoder(), a, b, outDir);
    return {
      data: r,
      text: [
        ok(`${r.verdict} — SSIM ${r.ssim.toFixed(4)} · PSNR ${r.psnr === null ? '—' : r.psnr === Infinity ? '∞' : `${r.psnr.toFixed(1)} dB`}${r.resized ? ' (b redimensionada)' : ''}`),
        kv('diferença', r.diff),
        kv('lado a lado', r.sideBySide),
        next('leia o lado a lado (a | b | diferença ampliada 4×) para localizar o que mudou'),
      ].join('\n'),
    };
  },
};
