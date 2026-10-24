/** Nomes de arquivo estáveis e legíveis para artefatos. Funções puras. */

/** Carimbo de tempo seguro para nomes de arquivo (horário local): 2026-10-23T18-50-00. */
export function stamp(date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 19).replace(/:/g, '-');
}

export function slugFromUrl(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    const path = pathname.replace(/\/+$/, '').replace(/[^\w-]+/g, '-').slice(0, 40);
    return (hostname + path).replace(/^-+|-+$/g, '') || 'page';
  } catch {
    return 'page';
  }
}

export function slug(text: string, max = 40): string {
  return (
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, max) || 'item'
  );
}
