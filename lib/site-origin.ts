const developmentFallbackOrigin = "http://localhost:3000";
export const productionSiteOrigin = "https://broey.net";

function invalidOrigin(message: string): never {
  throw new Error(`Invalid NEXT_PUBLIC_SITE_URL: ${message}`);
}

export function parseSiteOrigin(
  value: string | undefined,
  nodeEnv = process.env.NODE_ENV,
) {
  const isDevelopment = nodeEnv === "development";
  const configuredValue = value?.trim();

  if (!configuredValue) {
    if (isDevelopment) {
      return developmentFallbackOrigin;
    }

    return invalidOrigin("an explicit HTTPS origin is required outside local development.");
  }

  let parsed: URL;

  try {
    parsed = new URL(configuredValue);
  } catch {
    return invalidOrigin("use an absolute URL such as https://broey.net.");
  }

  if (parsed.username || parsed.password) {
    return invalidOrigin("credentials are not allowed.");
  }

  if (parsed.search) {
    return invalidOrigin("query strings are not allowed.");
  }

  if (parsed.hash) {
    return invalidOrigin("hash fragments are not allowed.");
  }

  if (parsed.pathname !== "/") {
    return invalidOrigin("the value must be an origin without a path.");
  }

  const isLocalHttpOrigin =
    parsed.protocol === "http:" &&
    (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");

  if (parsed.protocol !== "https:" && !(isDevelopment && isLocalHttpOrigin)) {
    return invalidOrigin(
      isDevelopment
        ? "use HTTPS, or HTTP only with localhost or 127.0.0.1."
        : "production and preview builds require HTTPS.",
    );
  }

  if (!isDevelopment) {
    return productionSiteOrigin;
  }

  return parsed.origin;
}

export const siteOrigin = parseSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL);

export function canonicalPath(path = "/") {
  const normalizedPath = path.trim();

  if (!normalizedPath.startsWith("/") || normalizedPath.startsWith("//")) {
    throw new Error(`Invalid application path: ${path}`);
  }

  const url = new URL(normalizedPath, "https://broey.local");

  if (url.origin !== "https://broey.local" || url.search || url.hash) {
    throw new Error(`Canonical paths cannot contain an origin, query, or fragment: ${path}`);
  }

  return url.pathname;
}

export function absoluteUrl(path = "/") {
  const normalizedPath = canonicalPath(path);

  const url = new URL(normalizedPath, `${siteOrigin}/`);

  if (url.origin !== siteOrigin) {
    throw new Error(`Application URL escaped the configured origin: ${path}`);
  }

  return url.toString();
}
