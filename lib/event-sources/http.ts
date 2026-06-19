const DEFAULT_TIMEOUT_MS = 15_000;

export async function fetchHtml(url: string, timeoutMs = DEFAULT_TIMEOUT_MS) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-MX,es;q=0.9",
        "User-Agent":
          "ConciertosGDL/1.0 (+https://conciertos-gdl.vercel.app; event indexer)",
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (response.ok) {
      return response.text();
    }

    const shouldRetry = response.status === 429 || response.status >= 500;

    if (!shouldRetry || attempt === 3) {
      throw new Error(
        `HTML request failed for ${url}: ${response.status} ${response.statusText}`,
      );
    }

    await delay(attempt * 500);
  }

  throw new Error(`HTML request failed for ${url}`);
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
