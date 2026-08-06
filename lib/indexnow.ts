import { canonicalPath, productionSiteOrigin } from "./site-origin.ts";

export const indexNowEndpoint = "https://api.indexnow.org/indexnow";
export const indexNowMaximumUrls = 10_000;
export const indexNowRequestTimeoutMs = 10_000;

const productionSiteUrl = new URL(productionSiteOrigin);
const keyPattern = /^[A-Za-z0-9-]{8,128}$/;

export type IndexNowClassification =
  | "received"
  | "validation-pending"
  | "bad-request"
  | "key-validation-failed"
  | "url-validation-failed"
  | "rate-limited"
  | "provider-error"
  | "network-error"
  | "timeout";

export type IndexNowResult = {
  status: number | null;
  ok: boolean;
  classification: IndexNowClassification;
  urlCount: number;
  message: string;
  responseBody?: string;
};

type SubmitOptions = {
  fetchImpl?: typeof fetch;
  key?: string;
  timeoutMs?: number;
};

export function validateIndexNowKey(value: string | undefined): string {
  if (!value) {
    throw new Error("INDEXNOW_KEY is required for this operation.");
  }

  if (!keyPattern.test(value)) {
    throw new Error(
      "INDEXNOW_KEY must be 8-128 characters using only letters, numbers, and hyphens.",
    );
  }

  return value;
}

export function isIndexNowKeyFilename(filename: string, key: string): boolean {
  return filename === `${validateIndexNowKey(key)}.txt`;
}

export function normalizeIndexNowUrl(input: string): string {
  const value = input.trim();
  if (!value) {
    throw new Error("IndexNow URLs and application paths cannot be empty.");
  }

  if (value.startsWith("/")) {
    return new URL(canonicalPath(value), `${productionSiteOrigin}/`).toString();
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid IndexNow URL or application path: ${input}`);
  }

  if (url.username || url.password) {
    throw new Error("IndexNow URLs cannot contain credentials.");
  }
  if (url.search || url.hash) {
    throw new Error("IndexNow URLs cannot contain a query string or fragment.");
  }
  if (url.protocol !== "https:") {
    throw new Error("IndexNow URLs must use HTTPS.");
  }
  if (url.origin !== productionSiteOrigin || url.hostname !== productionSiteUrl.hostname) {
    throw new Error(`IndexNow URLs must belong to ${productionSiteOrigin}.`);
  }

  return url.toString();
}

export function normalizeIndexNowUrls(inputs: readonly string[]): string[] {
  if (inputs.length === 0) {
    throw new Error("At least one URL or application path is required.");
  }

  const urls = [...new Set(inputs.map(normalizeIndexNowUrl))];
  if (urls.length > indexNowMaximumUrls) {
    throw new Error(`IndexNow accepts at most ${indexNowMaximumUrls} URLs per request.`);
  }

  return urls;
}

function sanitizeResponseBody(body: string, key: string): string | undefined {
  const trimmed = body.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, 2_000).split(key).join("[REDACTED]");
}

function resultForStatus(status: number, urlCount: number, responseBody?: string): IndexNowResult {
  const known: Record<number, Omit<IndexNowResult, "status" | "urlCount" | "responseBody">> = {
    200: {
      ok: true,
      classification: "received",
      message: "IndexNow received the URL submission; indexing is not guaranteed.",
    },
    202: {
      ok: true,
      classification: "validation-pending",
      message: "IndexNow received the URLs while key validation is pending.",
    },
    400: {
      ok: false,
      classification: "bad-request",
      message: "IndexNow rejected the malformed request.",
    },
    403: {
      ok: false,
      classification: "key-validation-failed",
      message: "IndexNow could not validate the configured key.",
    },
    422: {
      ok: false,
      classification: "url-validation-failed",
      message: "IndexNow rejected a host, URL, or key schema mismatch.",
    },
    429: {
      ok: false,
      classification: "rate-limited",
      message: "IndexNow rate limited the submission; retry later.",
    },
  };
  const details = known[status] ?? {
    ok: false,
    classification: "provider-error" as const,
    message: `IndexNow returned unexpected HTTP status ${status}.`,
  };
  return { status, urlCount, responseBody, ...details };
}

export async function submitIndexNowUrls(
  inputs: readonly string[],
  options: SubmitOptions = {},
): Promise<IndexNowResult> {
  const urls = normalizeIndexNowUrls(inputs);
  const key = validateIndexNowKey(options.key ?? process.env.INDEXNOW_KEY);
  const timeoutMs = options.timeoutMs ?? indexNowRequestTimeoutMs;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await (options.fetchImpl ?? fetch)(indexNowEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: productionSiteUrl.hostname,
        key,
        keyLocation: `${productionSiteOrigin}/${key}.txt`,
        urlList: urls,
      }),
      signal: controller.signal,
    });
    const responseBody = sanitizeResponseBody(await response.text(), key);
    return resultForStatus(response.status, urls.length, responseBody);
  } catch {
    const timedOut = controller.signal.aborted;
    return {
      status: null,
      ok: false,
      classification: timedOut ? "timeout" : "network-error",
      urlCount: urls.length,
      message: timedOut
        ? `IndexNow did not respond within ${timeoutMs} ms.`
        : "IndexNow could not be reached due to a network error.",
    };
  } finally {
    clearTimeout(timer);
  }
}
