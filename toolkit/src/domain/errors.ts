/** Erro de domínio com código estável e dica acionável para o agente. */
export class ParedeError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly hint?: string,
  ) {
    super(message);
    this.name = 'ParedeError';
  }

  toJSON() {
    return { code: this.code, message: this.message, hint: this.hint };
  }
}

const firstLine = (text: string) => text.split('\n')[0].trim();

/** Traduz erros crus (Playwright, rede, fs) em erros com dica de correção. */
export function toParedeError(err: unknown): ParedeError {
  if (err instanceof ParedeError) return err;
  const message = err instanceof Error ? err.message : String(err);

  if (/Executable doesn't exist|Please run the following command to download new browsers/i.test(message)) {
    return new ParedeError(
      'BROWSER_MISSING',
      'O Chromium do Playwright não está instalado.',
      'Rode: npx playwright install chromium (dentro de toolkit/).',
    );
  }
  if (/Timeout \d+ms exceeded/i.test(message)) {
    return new ParedeError(
      'TIMEOUT',
      firstLine(message),
      'Aumente --timeout ou use `web-wait <segundos>` para pre-loaders em canvas/WebGL.',
    );
  }
  if (/net::ERR_|ECONNREFUSED/.test(message)) {
    return new ParedeError('NETWORK', firstLine(message), 'Confira a URL e se o servidor local está no ar.');
  }
  if (/strict mode violation|waiting for locator|No node found/i.test(message)) {
    return new ParedeError(
      'SELECTOR',
      firstLine(message),
      'Rode `web-control inventory` para listar seletores clicáveis válidos.',
    );
  }
  if (/Target page, context or browser has been closed/i.test(message)) {
    return new ParedeError('PAGE_CLOSED', 'A página foi fechada.', 'Rode `web-url-fetch <url>` novamente.');
  }
  return new ParedeError('UNKNOWN', firstLine(message));
}
