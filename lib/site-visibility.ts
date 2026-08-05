import type { Metadata } from "next";

export const gateCookieName = "broey_private_preview";

export type SiteVisibility = "public" | "private";

const supportedVisibilities = new Set<SiteVisibility>(["public", "private"]);

export function siteVisibility(): SiteVisibility {
  const configuredVisibility = process.env.SITE_VISIBILITY?.trim().toLowerCase();

  if (!configuredVisibility) {
    if (process.env.NODE_ENV === "development") {
      return "public";
    }

    throw new Error(
      "SITE_VISIBILITY must be set to either \"public\" or \"private\" outside local development.",
    );
  }

  if (!supportedVisibilities.has(configuredVisibility as SiteVisibility)) {
    throw new Error(
      `Invalid SITE_VISIBILITY value \"${configuredVisibility}\". Use \"public\" or \"private\".`,
    );
  }

  if (configuredVisibility === "private" && !getSitePasscode()) {
    throw new Error("SITE_PASSCODE is required when SITE_VISIBILITY is private.");
  }

  return configuredVisibility as SiteVisibility;
}

export function isSitePrivate() {
  return siteVisibility() === "private";
}

export function getSitePasscode() {
  return process.env.SITE_PASSCODE?.trim() ?? "";
}

export function privateRobotsMetadata(): Metadata["robots"] | undefined {
  if (!isSitePrivate()) {
    return undefined;
  }

  return {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  };
}

export function sanitizeGateNext(value: unknown, fallback = "/") {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const rawPath = String(rawValue ?? "").trim();

  if (!rawPath || !rawPath.startsWith("/") || rawPath.startsWith("//")) {
    return fallback;
  }

  try {
    const parsedUrl = new URL(rawPath, "https://broey.local");

    if (parsedUrl.origin !== "https://broey.local") {
      return fallback;
    }

    const safePath = `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;

    if (!safePath || safePath.startsWith("/gate")) {
      return fallback;
    }

    return safePath;
  } catch {
    return fallback;
  }
}

export async function createGateCookieValue(passcode = getSitePasscode()) {
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(`broey-preview-gate:${passcode}`),
  );

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function isValidGateCookie(value?: string) {
  const passcode = getSitePasscode();

  if (!isSitePrivate()) {
    return true;
  }

  if (!passcode || !value) {
    return false;
  }

  return value === await createGateCookieValue(passcode);
}
