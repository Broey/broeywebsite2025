# Post-launch Phase 2: IndexNow implementation

Audit date: 2026-08-06

Branch: `feat/indexnow-phase-2`

Scope: implementation only; no deployment, DigitalOcean change, production key creation, or live IndexNow request

## Initial architecture findings

- The site uses Next.js 16 App Router on Node `>=22.13.0 <23` and requires a dynamic Node-capable host.
- `lib/site-origin.ts` already owns the canonical production origin, `https://broey.net`, and rejects preview-origin leakage. IndexNow reuses that constant.
- `app/sitemap.ts` explicitly builds the public sitemap from seven static routes and eligible release records. The dynamic verification route is not enumerated there.
- `proxy.ts` excludes paths containing a file extension, so the verification text path remains public and does not weaken the private-preview gate for ordinary pages.
- Existing tests use Node's test runner with type stripping and mocked/pure helpers. No additional test framework or runtime dependency is needed.
- The repository was clean on `main` before the dedicated branch was created.

The optional changed-Git-ref URL proposer was deferred. Mapping release registry and shared component changes to public URLs reliably would require policy beyond this implementation; manual changed-URL review is safer and remains inexpensive for the 22-page site.

## Architecture and files changed

| File | Change |
| --- | --- |
| `lib/indexnow.ts` | Server-oriented key validation, canonical URL normalization/deduplication, 10,000-URL cap, safe response classification, response redaction, and timeout/network handling. |
| `app/[indexnowKey]/route.ts` | Force-dynamic root verification handler returning exact UTF-8 key text only for the configured filename; all other matches return HTTP 404. |
| `scripts/submit-indexnow.mjs` | Human-controlled CLI supporting application paths, canonical URLs, dry runs, and explicit `--yes` submission. |
| `tests/indexnow.test.mjs` | Mocked tests for keys, verification behavior, URLs, payload, statuses, network failure, timeout, and redaction. |
| `package.json` | Adds `npm run indexnow`. |
| `tsconfig.json` | Permits explicit TypeScript import extensions used by Node's type-stripped CLI/tests and the bundled route. |
| `.env.local.example` | Adds a blank, documented server-only `INDEXNOW_KEY` placeholder. |
| `README.md` | Adds concise operator commands and key-management guidance. |
| `docs/launch-readiness/V1_PRODUCTION_HOSTING_REQUIREMENTS.md` | Adds the runtime variable and outbound IndexNow requirement to the hosting contract. |

No dependency, component, design, sitemap, robots policy, navigation, metadata, generated static params, build hook, startup hook, or public submission API was added.

## Key management and verification

Generate the production key outside Git. It must be 8-128 characters and contain only `a-z`, `A-Z`, `0-9`, and `-`. Add it to DigitalOcean App Platform as the server-only runtime environment variable `INDEXNOW_KEY`. Do not prefix it with `NEXT_PUBLIC_`, paste it into source, or print it in logs.

At runtime, `GET /{INDEXNOW_KEY}.txt` returns:

- HTTP 200;
- `Content-Type: text/plain; charset=utf-8`;
- a body containing exactly the key with no newline or markup;
- `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, and `X-Robots-Tag: noindex, nofollow`.

An absent/invalid configured key or any non-exact filename returns a real HTTP 404. The handler is dynamic, has no generated parameter list, and is absent from the sitemap. `X-Robots-Tag` does not prevent IndexNow from retrieving the ownership file; it tells general-purpose indexes not to index the response as a search result.

## Submission workflow

The CLI reads `.env.local` when present, but never prints the key. It accepts canonical absolute URLs or application paths, rejects other hosts (including `www`), HTTP, localhost/preview URLs, credentials, ports, queries, and fragments, then deduplicates inputs.

```bash
npm run indexnow -- --dry-run /music/new-release
npm run indexnow -- --yes /music/new-release
npm run indexnow -- --yes /music/new-release /music
```

Without `--dry-run` or `--yes`, the URLs are displayed but no request is sent and the command exits nonzero. An empty URL list also exits nonzero. The command never reads or submits the whole sitemap.

The JSON POST goes only to `https://api.indexnow.org/indexnow`:

```json
{
  "host": "broey.net",
  "key": "<server-only key>",
  "keyLocation": "https://broey.net/<server-only key>.txt",
  "urlList": ["https://broey.net/example"]
}
```

## Response interpretation

| Status | CLI/client interpretation |
| --- | --- |
| 200 | Received successfully; this does not guarantee crawling or indexing. |
| 202 | Received while ownership-key validation is pending. |
| 400 | Malformed request. Review input/payload construction before retrying. |
| 403 | Key verification failed. Check the deployed environment value and public verification response. |
| 422 | Host, URL, or key schema mismatch. Do not retry unchanged. |
| 429 | Rate limited. Wait before retrying; do not loop aggressively. |
| Other HTTP | Provider error/unexpected response; investigate before retrying. |
| Network failure/timeout | No receipt confirmed. Check egress/reachability and retry deliberately. |

Provider response text is capped and any occurrence of the active key is redacted. Returned errors and thrown key-validation messages never include the submitted key.

## Deployment instructions (manual/deferred)

1. Review and merge the PR through the normal process; do not merge directly as part of this task.
2. Generate an IndexNow production key outside this repository.
3. In DigitalOcean App Platform, add `INDEXNOW_KEY` as a server-only encrypted runtime environment variable for production. Preserve existing values, including `NEXT_PUBLIC_SITE_URL=https://broey.net` and `SITE_VISIBILITY=public`.
4. Deploy the reviewed commit through the normal DigitalOcean workflow. No DigitalOcean configuration was changed in this branch.
5. Confirm `https://broey.net/{key}.txt` is public, returns 200, has plain-text UTF-8 content, and its raw body exactly equals the key.
6. Confirm a similar incorrect filename returns 404, and recheck `/`, `/music`, `/robots.txt`, and `/sitemap.xml`.
7. Confirm the verification URL is absent from `sitemap.xml` and that ordinary HTML/browser JavaScript does not contain the key.

## Initial live submission procedure

After the deployed verification checks pass, choose one genuinely added, updated, or deleted canonical URL. From an authorized workstation/CI job with the same `INDEXNOW_KEY` available:

1. Run `npm run indexnow -- --dry-run /changed-path` and inspect every displayed URL.
2. Run `npm run indexnow -- --yes /changed-path` once.
3. Record the timestamp, commit/release, URLs, status, and safe message. Do not record the key.
4. Treat 200 as receipt only and 202 as receipt pending key validation. Resolve 4xx responses using the table above before another submission.
5. Verify later through normal Bing/indexing tools; do not interpret receipt as guaranteed indexing.

For ongoing releases, the release owner should list only URLs actually added, updated, or deleted, dry-run them, deploy and verify the public change, then perform one explicit submission. Never add this command to `next build`, application startup, or blanket sitemap submission.

## Security considerations

- There is no unauthenticated submission endpoint. Public access is limited to the protocol-required ownership text response.
- The production key is not in tracked files, sitemap output, route lists, navigation, metadata, logs, or client configuration.
- Canonical validation permits only `https://broey.net`; `www`, preview hosts, localhost, external domains, query strings, fragments, unsupported protocols, and malformed inputs fail before fetch.
- URL count is limited to 10,000 after normalization and deduplication.
- Requests time out after 10 seconds and use mocked fetches in tests. No live request was made during implementation.

## Validation record

Final results are recorded after the clean validation pass:

| Command/check | Result |
| --- | --- |
| `npm ci` | Passed: 403 packages installed/audited. npm reported one existing high-severity dependency advisory for separate review. |
| `npm run lint` | Passed with no errors or warnings. |
| `npm run typecheck` | Passed. |
| `npm test` | Passed: 14 tests, 0 failures. Node emitted the repository's expected experimental type-stripping/module-format warnings. |
| Production `npm run build` with canonical public environment and a temporary test key | Passed: 54 static pages generated; `/[indexnowKey]` reported as dynamic. |
| Local production-server route checks | Passed: `/`, `/music`, `/about`, `/robots.txt`, `/sitemap.xml`, and `/manifest.webmanifest` returned 200; correct test-key response returned 200/exact text; incorrect key returned 404. |
| Sitemap/robots/client checks | Passed: verification URL absent from sitemap, canonical sitemap declaration retained in robots, and temporary key absent from `.next/static` browser assets. |
| `npm run indexnow -- --dry-run /music/new-release /music/new-release /music` | Passed: displayed two deduplicated canonical URLs and sent no request. |
| `git diff --check` | Passed. |

Protocol reference reviewed on 2026-08-06: https://www.indexnow.org/documentation
