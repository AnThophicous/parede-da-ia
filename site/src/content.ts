/**
 * Todo o texto da landing num só lugar.
 * Narrativa (prompts/knowledge-base/23 · StoryBrand): problema → guia → plano → chamada.
 * Objetivo único da página: a pessoa instalar a skill.
 */

export const REPO_URL = 'https://github.com/AnThophicous/parede-da-ia';
export const DOC_RAW_URL = 'https://raw.githubusercontent.com/AnThophicous/parede-da-ia/main/doc.md';
export const VERSION = '0.2';

export const BOOTSTRAP_PROMPT = `Instale o parede-da-ia no meu ambiente.
Leia ${DOC_RAW_URL}
e execute todas as etapas na ordem, verificando a saída de cada uma antes de seguir.
Use o meu terminal; se algo exigir permissão de administrador, me pergunte antes.
No final, mostre o resultado do \`parede doctor\` e em quais agentes o router foi registrado.`;

export const MANUAL_INSTALL = `git clone --depth 1 ${REPO_URL}.git ~/.parede-da-ia
cd ~/.parede-da-ia/toolkit && npm install && npx playwright install chromium
npm link && parede setup --agent auto && parede doctor`;

export const AGENTS = ['Claude Code', 'Codex', 'OpenCode', 'Cursor', 'Windsurf', 'Gemini CLI'];

export const HERO = {
  eyebrow: 'Skill open-source para agentes de IA',
  lede: 'Dê olhos, mãos e repertório ao seu agente. Ele passa a ver o que constrói — e para de entregar o template médio.',
  cta: 'Instalar a skill',
  note: 'Grátis · MIT · um prompt',
};

export const PROBLEM = {
  eyebrow: '(01) O problema',
  statement: 'Seu agente escreve interface sem nunca ver a tela.',
  symptoms: ['entrega o template médio', 'não sente o scroll nem o hover', 'diz "pronto" sem ter testado'],
};

export const PILLARS = [
  {
    word: 'ruído',
    title: 'Hoje',
    text: 'Sem ver a tela, o resultado é um palpite: espaçamentos soltos, contraste no chute, animação genérica.',
    tools: [] as string[],
  },
  {
    word: 'olhos',
    title: 'Olhos',
    text: 'Abre o próprio trabalho num navegador real, grava o scroll quadro a quadro e mede contraste, fontes e jank. Nada é declarado pronto sem ser visto.',
    tools: ['web-screenshot', 'web-record-frames', 'web-audit'],
  },
  {
    word: 'mãos',
    title: 'Mãos',
    text: 'Rola, clica, arrasta e testa cada hover e cada foco como uma pessoa de verdade — inclusive enquanto grava.',
    tools: ['web-control', 'web-interactions', 'web-motion'],
  },
  {
    word: 'repertório',
    title: 'Repertório',
    text: '23 livros e 7 estéticas carregados sob demanda. Corporativo pede briefing; portfólio ganha personalidade; experiência ganha um ápice.',
    tools: ['router.md', '23 livros', '7 estéticas'],
  },
];

export const STEPS = [
  { n: '01', title: 'Copie o prompt', text: 'Um texto curto que aponta para o instalador do repositório.' },
  { n: '02', title: 'Cole no seu agente', text: 'Qualquer agente de código com acesso ao terminal.' },
  { n: '03', title: 'Ele faz o resto', text: 'Instala Playwright e FFmpeg, registra o router e passa a ver o que constrói.' },
];

export const FOOTER_LINKS = [
  { label: 'GitHub', href: REPO_URL },
  { label: 'doc.md', href: `${REPO_URL}/blob/main/doc.md` },
  { label: 'router.md', href: `${REPO_URL}/blob/main/prompts/router.md` },
  { label: 'Licença MIT', href: `${REPO_URL}/blob/main/LICENSE` },
];
