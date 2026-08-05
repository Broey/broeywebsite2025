import "server-only";

const siteverifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const verificationTimeoutMs = 5_000;
const maxTokenLength = 2_048;

type SiteverifyResponse = {
  success?: boolean;
  "error-codes"?: string[];
};

export type TurnstileVerificationResult =
  | { ok: true; bypassed: boolean }
  | {
      ok: false;
      code: "configuration" | "missing-token" | "invalid-token" | "unavailable";
      status: 400 | 502 | 503;
    };

const configuredSiteKey = () =>
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

const configuredSecretKey = () => process.env.TURNSTILE_SECRET_KEY?.trim() ?? "";

const configurationFailure = (): TurnstileVerificationResult => {
  console.error("TURNSTILE_CONFIGURATION_MISSING");

  return { ok: false, code: "configuration", status: 503 };
};

export function clientIpFromRequest(request: Request) {
  return (
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    undefined
  );
}

export async function verifyTurnstileToken(
  token: string | undefined,
  clientIp?: string,
): Promise<TurnstileVerificationResult> {
  const siteKey = configuredSiteKey();
  const secretKey = configuredSecretKey();
  const isLocalDevelopment = process.env.NODE_ENV === "development";

  if (!siteKey && !secretKey && isLocalDevelopment) {
    return { ok: true, bypassed: true };
  }

  if (!siteKey || !secretKey) {
    return configurationFailure();
  }

  const normalizedToken = token?.trim();

  if (!normalizedToken || normalizedToken.length > maxTokenLength) {
    return { ok: false, code: "missing-token", status: 400 };
  }

  const body = new URLSearchParams({
    secret: secretKey,
    response: normalizedToken,
  });

  if (clientIp) {
    body.set("remoteip", clientIp);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), verificationTimeoutMs);

  try {
    const response = await fetch(siteverifyUrl, {
      method: "POST",
      body,
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false, code: "unavailable", status: 502 };
    }

    const result = (await response.json().catch(() => null)) as SiteverifyResponse | null;

    if (result?.success !== true) {
      const errorCodes = result?.["error-codes"] ?? [];

      if (errorCodes.includes("internal-error")) {
        return { ok: false, code: "unavailable", status: 503 };
      }

      if (
        errorCodes.includes("missing-input-secret") ||
        errorCodes.includes("invalid-input-secret")
      ) {
        return configurationFailure();
      }

      return { ok: false, code: "invalid-token", status: 400 };
    }

    return { ok: true, bypassed: false };
  } catch {
    return { ok: false, code: "unavailable", status: 503 };
  } finally {
    clearTimeout(timeout);
  }
}
