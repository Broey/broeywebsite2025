const developmentFallbackOrigin = "http://localhost:3000";

function invalidOrigin(message: string): never {
  throw new Error(`Invalid NEXT_PUBLIC_SITE_URL: ${message}`);
}

function parseSiteOrigin(value: string | undefined) {
  const isDevelopment = process.env.NODE_ENV === "development";
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

  return parsed.origin;
}

export const siteOrigin = parseSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL);

export function absoluteUrl(path = "/") {
  const normalizedPath = path.trim();

  if (!normalizedPath.startsWith("/") || normalizedPath.startsWith("//")) {
    throw new Error(`Invalid application path: ${path}`);
  }

  const url = new URL(normalizedPath, `${siteOrigin}/`);

  if (url.origin !== siteOrigin) {
    throw new Error(`Application URL escaped the configured origin: ${path}`);
  }

  return url.toString();
}
