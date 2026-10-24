/**
 * Every word on the landing, in one place.
 * Single goal of the page: the visitor installs the skill.
 */

export const REPO_URL = 'https://github.com/AnThophicous/parede-da-ia';
export const DOC_RAW_URL = 'https://raw.githubusercontent.com/AnThophicous/parede-da-ia/main/doc.md';
export const VERSION = '0.3';

export const BOOTSTRAP_PROMPT = `Install parede-da-ia in my environment.
Read ${DOC_RAW_URL}
and run every step in order, checking each output before moving on.
Use my terminal; ask me before anything that needs admin rights.
At the end, show me the output of \`parede doctor\` and which agents the router was registered in.`;

export const MANUAL_INSTALL = `git clone --depth 1 ${REPO_URL}.git ~/.parede-da-ia
cd ~/.parede-da-ia/toolkit && npm install && npx playwright install chromium
npm link && parede setup --agent auto && parede doctor`;

export const AGENTS = ['Claude Code', 'Codex', 'OpenCode', 'Cursor', 'Windsurf', 'Gemini CLI'];

/** Captions of the journey, keyed by the progress window where they show. */
export const CAPTIONS: { from: number; to: number; kicker: string; line: string }[] = [
  { from: 0.0, to: 0.15, kicker: 'Every star is a book', line: 'Twenty-three of them, distilled for your agent. Click one.' },
  { from: 0.17, to: 0.31, kicker: 'The problem', line: 'Most agents build in the dark. They write interfaces they never see.' },
  { from: 0.35, to: 0.41, kicker: 'Then', line: 'Something starts to take shape.' },
  { from: 0.53, to: 0.63, kicker: 'An open-source skill', line: 'Hover the letters. It already reacts to you.' },
  { from: 0.67, to: 0.77, kicker: 'Eyes. Hands. Taste.', line: 'It opens what it builds in a real browser, scrolls, clicks, records every frame and measures it.' },
  { from: 0.79, to: 0.85, kicker: 'Now it sees you', line: '' },
];

export const INSTALL = {
  eyebrow: 'parede-da-ia · open source · MIT',
  title: 'Install in your AI agent',
  lede: 'One prompt. Your agent reads the installer, gives itself eyes and hands, and starts seeing what it builds.',
  copy: 'Copy prompt',
  copied: 'Copied',
  afterCopy: 'Paste it in your agent. From now on it works like your second mind — the quiet operator behind everything you build.',
};

export const FOOTER_LINKS = [
  { label: 'GitHub', href: REPO_URL },
  { label: 'doc.md', href: `${REPO_URL}/blob/main/doc.md` },
  { label: 'router.md', href: `${REPO_URL}/blob/main/prompts/router.md` },
  { label: 'MIT license', href: `${REPO_URL}/blob/main/LICENSE` },
];

/** The nearest known black hole: Gaia BH1, ~1,560 light-years away. */
export const BLACK_HOLE = { name: 'Gaia BH1', lightYears: 1560, kmPerLightYear: 9_460_730_472_580.8 };

/** The 23 distilled books — each one is a star. Covers come from Open Library. */
export const BOOKS: { title: string; author: string; cover: string }[] = [
  { title: 'Clean Code', author: 'Robert C. Martin', cover: 'isbn/9780132350884' },
  { title: 'Clean Architecture', author: 'Robert C. Martin', cover: 'isbn/9780134494166' },
  { title: "Don't Make Me Think, Revisited", author: 'Steve Krug', cover: 'isbn/9780321965516' },
  { title: '100 Things Every Designer Needs to Know About People', author: 'Susan Weinschenk', cover: 'isbn/9780321767530' },
  { title: 'Refactoring UI', author: 'Adam Wathan & Steve Schoger', cover: 'id/10527062' },
  { title: 'The Pragmatic Programmer', author: 'Andrew Hunt & David Thomas', cover: 'isbn/9780135957059' },
  { title: 'Pro Git', author: 'Scott Chacon & Ben Straub', cover: 'isbn/9781484200773' },
  { title: 'Designing Machine Learning Systems', author: 'Chip Huyen', cover: 'isbn/9781098107963' },
  { title: 'Prompt Engineering for Generative AI', author: 'James Phoenix & Mike Taylor', cover: 'isbn/9781098153434' },
  { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', cover: 'isbn/9781449373320' },
  { title: 'Microinteractions', author: 'Dan Saffer', cover: 'isbn/9781449342685' },
  { title: 'The Illusion of Life', author: 'Frank Thomas & Ollie Johnston', cover: 'isbn/9780786860708' },
  { title: 'Designing Interface Animation', author: 'Val Head', cover: 'isbn/9781933820323' },
  { title: 'Thinking with Type', author: 'Ellen Lupton', cover: 'isbn/9781568989693' },
  { title: 'Grid Systems in Graphic Design', author: 'Josef Müller-Brockmann', cover: 'isbn/9783721201451' },
  { title: 'Interaction of Color', author: 'Josef Albers', cover: 'isbn/9780300179354' },
  { title: 'The Book of Shaders', author: 'Patricio Gonzalez Vivo & Jen Lowe', cover: 'id/15116918' },
  { title: 'The Design of Everyday Things', author: 'Don Norman', cover: 'isbn/9780465050659' },
  { title: 'Designing Brand Identity', author: 'Alina Wheeler', cover: 'isbn/9781118980828' },
  { title: 'Laws of UX', author: 'Jon Yablonski', cover: 'isbn/9781492055310' },
  { title: 'Atomic Design', author: 'Brad Frost', cover: 'isbn/9780998296609' },
  { title: 'Inclusive Components', author: 'Heydon Pickering', cover: 'id/14442662' },
  { title: 'Building a StoryBrand', author: 'Donald Miller', cover: 'isbn/9780718033323' },
];

export const coverUrl = (cover: string) => `https://covers.openlibrary.org/b/${cover}-M.jpg`;
