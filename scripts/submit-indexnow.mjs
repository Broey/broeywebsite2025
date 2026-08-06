import { normalizeIndexNowUrls, submitIndexNowUrls } from "../lib/indexnow.ts";

const args = process.argv.slice(2);
// npm consumes these two recognized flags instead of forwarding them, exposing
// them as npm_config_* values. Direct `node` usage still receives normal args.
const dryRun = args.includes("--dry-run") || process.env.npm_config_dry_run === "true";
const confirmed = args.includes("--yes") || process.env.npm_config_yes === "true";
const unknownFlags = args.filter((arg) => arg.startsWith("--") && !["--dry-run", "--yes"].includes(arg));
const inputs = args.filter((arg) => !arg.startsWith("--"));

function fail(message) {
  console.error(`IndexNow: ${message}`);
  process.exitCode = 1;
}

if (unknownFlags.length) {
  fail(`unknown option(s): ${unknownFlags.join(", ")}`);
} else {
  try {
    const urls = normalizeIndexNowUrls(inputs);
    console.log(`IndexNow URLs (${urls.length}):`);
    for (const url of urls) console.log(`- ${url}`);

    if (dryRun) {
      console.log("Dry run only; no request sent.");
    } else if (!confirmed) {
      fail("submission not sent; review the URLs and rerun with --yes.");
    } else {
      const result = await submitIndexNowUrls(urls);
      console.log(`${result.status ?? "network"}: ${result.message}`);
      if (result.responseBody) console.log(`Response: ${result.responseBody}`);
      if (!result.ok) process.exitCode = 1;
    }
  } catch (error) {
    fail(error instanceof Error ? error.message : "submission failed.");
  }
}
