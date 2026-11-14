// Reuse installed Playwright and its matching browser. Never install or attach.
const fs = require("node:fs");
const path = require("node:path");

function installedPlaywright() {
  const configured = process.env.DISCOVERY_PLAYWRIGHT_MODULE;
  if (configured) return require(configured);
  try { return require("playwright"); } catch { /* Try existing npm cache only. */ }
  const cache = path.join(process.env.LOCALAPPDATA || "", "npm-cache", "_npx");
  const candidates = fs.existsSync(cache) ? fs.readdirSync(cache).flatMap((entry) => {
    const modulePath = path.join(cache, entry, "node_modules", "playwright-core");
    try {
      const api = require(modulePath);
      return fs.existsSync(api.chromium.executablePath())
        ? [{ api, version: require(path.join(modulePath, "package.json")).version }] : [];
    } catch { return []; }
  }) : [];
  candidates.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
  if (!candidates.length) throw new Error("No installed matching Playwright/Chromium pair. Set DISCOVERY_PLAYWRIGHT_MODULE; this command installs nothing.");
  return candidates[0].api;
}

function loopbackOrigin(value) {
  const url = new URL(value);
  if (url.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(url.hostname) || url.origin !== value) {
    throw new Error("Specify a loopback HTTP origin without credentials, path, or query.");
  }
  return value;
}

module.exports = { installedPlaywright, loopbackOrigin };
