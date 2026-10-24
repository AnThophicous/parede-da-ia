/** A domain error with a stable code and an actionable hint for the agent. */
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

/** Translates raw errors (Playwright, network, fs) into errors with a fix hint. */
export function toParedeError(err: unknown): ParedeError {
  if (err instanceof ParedeError) return err;
  const message = err instanceof Error ? err.message : String(err);

  if (/Executable doesn't exist|Please run the following command to download new browsers/i.test(message)) {
    return new ParedeError(
      'BROWSER_MISSING',
      "Playwright's Chromium is not installed.",
      'Run: npx playwright install chromium (inside toolkit/).',
    );
  }
  if (/Timeout \d+ms exceeded/i.test(message)) {
    return new ParedeError(
      'TIMEOUT',
      firstLine(message),
      'Raise --timeout or use `web-wait <seconds>` for canvas/WebGL preloaders.',
    );
  }
  if (/net::ERR_|ECONNREFUSED/.test(message)) {
    return new ParedeError('NETWORK', firstLine(message), 'Check the URL and whether the local server is up.');
  }
  if (/strict mode violation|waiting for locator|No node found/i.test(message)) {
    return new ParedeError(
      'SELECTOR',
      firstLine(message),
      'Run `web-control inventory` to list valid clickable selectors.',
    );
  }
  if (/Target page, context or browser has been closed/i.test(message)) {
    return new ParedeError('PAGE_CLOSED', 'The page was closed.', 'Run `web-url-fetch <url>` again.');
  }
  return new ParedeError('UNKNOWN', firstLine(message));
}
