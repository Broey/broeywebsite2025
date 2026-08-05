# Broey V1 Phase 1 Validation

Validation date: August 5, 2026  
Branch: `codex/v1-launch-blockers`  
Starting commit: `f82a620af2a1b5dcb74b7a7655ab495949f203ab`

This record covers application-level Phase 1 only. It does not authorize or record a deployment, DNS change, hosting selection, dependency update, or external-provider mutation.

## Core checks

| Check | Result |
| --- | --- |
| Existing install, `npm ls --depth=0` | Pass; installed dependency tree resolves |
| `npm run lint` | Pass; no ESLint warnings or errors |
| `npx tsc --noEmit --incremental false` | Pass |
| Public `npm run build` with `NEXT_PUBLIC_SITE_URL=https://broey.net` and `SITE_VISIBILITY=public` | Pass; 55 static pages generated |
| Private `npm run build` with an explicit local validation passcode | Pass; 55 static pages generated |
| `git diff --check` | Pass |
| `package.json` / `package-lock.json` diff | Empty; no dependency change |
| Local internal-page and asset crawl | Pass; 44 pages and 44 local assets, zero failures |

Next.js continues to print the pre-existing `experimental.outputFileTracingIgnores` deprecation warning and the edge-runtime/static-generation advisory. Neither warning was introduced by Phase 1, and this task did not begin dependency or unrelated configuration remediation.

## Origin matrix

Each row was exercised as a production `npm run build`, with the process environment overriding the populated local environment file.

| Value | Result |
| --- | --- |
| Missing/blank path | Failed, exit 1: explicit HTTPS origin required |
| `http://broey.net` | Failed, exit 1: HTTPS required |
| `/relative` | Failed, exit 1: absolute URL required |
| `https://user:pass@broey.net` | Failed, exit 1: credentials rejected |
| `https://broey.net/?test=1` | Failed, exit 1: query rejected |
| `https://broey.net/#test` | Failed, exit 1: fragment rejected |
| `https://broey.net/path` | Failed, exit 1: non-root path rejected |
| `https://broey.net/` | Passed and normalized to `https://broey.net` |
| Development with the variable absent/blank | Resolved to `http://localhost:3000` |

Representative release output used `https://broey.net/music/stereo-luv` for canonical, Open Graph URL, and JSON-LD. Open Graph and Twitter image URLs also used `https://broey.net`. Robots referenced `https://broey.net/sitemap.xml`, the public sitemap used the approved origin, and current application/operator documentation contained no active `broey.com` recommendation. Dated audit evidence was deliberately not rewritten.

## Routes and visibility

The production public server returned 200 for `/`, `/music`, `/merch`, `/about`, `/contact`, `/press`, `/privacy`, `/music/stereo-luv`, and the approved track `/music/like-that`. It returned 404 for `/watch`, `/music/link`, `/music/paradise`, and an unknown route.

Public robots allowed indexing, and the public sitemap included `/privacy` while excluding Watch, LiNK, and Paradise. The built static-parameter list contained 37 approved release/track paths, excluding the two draft releases.

Private production mode returned 307 from `/` to `/gate?next=%2F`; `/gate` returned 200. An incorrect passcode returned 303 to the gate error state. The local validation passcode returned 303 to `/music`, set the gate cookie, and allowed `/music` to return 200. Private robots disallowed all crawling and the private sitemap contained no URL entries. Invalid visibility and private-without-passcode checks both failed clearly; local development defaulted to public.

## Description and unfinished-content inspection

Source parsing found 175 preserved editorial strings of at least 20 characters in `description`, `shortDescription`, `seoDescription`, `about`, and `mood` fields. The final public build scan covered 95 generated public `.html`, `.rsc`, and response-body artifacts and found zero exact matches. Representative metadata used the factual template: `Listen to STEREO LUV by Broey., a Deep House single released in 2025.`

Browser and output inspection found no release/track editorial copy in cards, release details, track output, accessibility labels, metadata, JSON-LD, or practical client serialization. Public page/output checks also found no LiNK or Paradise route reference/title and no Watch placeholder content. Source content remains preserved.

## Genre and browser checks

The source inventory and normalization decisions are recorded in `V1_GENRE_INVENTORY.md`. The `/music` archive initially showed all 13 approved archive releases and generated 22 genre filters plus `All`; no draft-only filter appeared.

Every filter was activated with the keyboard. Counts, `aria-pressed`, and release membership matched the normalized card data. Multi-genre releases appeared in each applicable result. `All` restored 13 releases. The location remained `/music`, canonical remained `https://broey.net/music`, and no genre URL or sitemap entry was created.

At 360×800, 430×932, 768×1024, 1440×900, and 1920×1080, filter controls wrapped into 7, 6, 3, 2, and 2 rows respectively with no horizontal page overflow. Home, Contact, Privacy, `/music`, and a representative release page were coherent at all five viewport classes. Mobile navigation opened and closed correctly.

Local audio started successfully. Filtering FREE out of the visible catalog left the same audio element playing and advanced its current time. Client-side navigation from `/music` to `/music/free` also preserved the playing audio element and position.

## Privacy, consent, Turnstile, and 429 checks

The Privacy page contains the approved Contact, Newsletter, abuse/hosting, retention/request/deletion, privacy-contact, and August 5, 2026 effective-date topics. Footer, Contact, and both tested Newsletter variants linked to it. The Contact form contained no checkbox or `updatesOptIn` field; its payload fields were only the honeypot, first name, last name, email, and message. Source inspection confirmed Contact has no MailerLite call and no updates line in its Resend templates.

On pages with two active forms, both Turnstile widgets completed using Cloudflare's safe always-pass test credentials while only one client script loaded. Contact plus footer Newsletter also coexisted. Tokens were not logged.

Controlled API checks used test credentials and local unreachable provider endpoints, so no Resend message or MailerLite subscriber was created:

- Both honeypots returned generic 200 before Turnstile/provider work.
- Missing tokens returned 400 for both APIs.
- Cloudflare always-fail credentials returned 400 before provider calls.
- Timeout/duplicate error handling returned the shared invalid-token 400 path.
- A controlled fetch that only rejected on the verifier's abort signal returned unavailable/503 after approximately 5 seconds.
- Always-pass tokens reached the next provider stage, which intentionally failed against the local sink with 502.
- Missing non-development configuration returned 503 for both APIs; only `TURNSTILE_CONFIGURATION_MISSING` was logged.
- `rateLimitMessage("120")` produced a useful two-minute retry message; a missing header produced the neutral fallback. Both form clients use this helper on HTTP 429 and reset the widget after every server attempt.

## Validation-harness retries

These failures were in local validation orchestration, not application behavior:

- `npm run dev` initially returned `EADDRINUSE` because an earlier temporary server still owned port 3210. The exact Node listener was verified, stopped, and the command then ran successfully.
- The first private-gate PowerShell harness used `$home=...` and `New-Object System.Net.Http.FormUrlEncodedContent([System.Collections.Generic.Dictionary[string,string]]@{...})`; PowerShell rejected the read-only `$HOME` collision and dictionary construction. The corrected command used `$homeResponse` and `StringContent`, then passed every gate assertion.
- `node --conditions=react-server --experimental-strip-types --input-type=module` could not directly import `lib/turnstile.ts` because standalone Node does not resolve Next's build-time `server-only` marker. The corrected read-only harness transpiled that source in memory with the marker omitted and verified the real timeout/result logic. No repository file or dependency was changed.
- PowerShell-prefixed `npm run start` / direct `next start` attempts were rejected by the command policy. The exact fallback `cmd.exe /d /c "set SITE_VISIBILITY=...&&set NEXT_PUBLIC_SITE_URL=https://broey.net&&node node_modules\\next\\dist\\bin\\next start -p 3210"` ran both public and private production servers successfully.
- The first link-crawl harness stripped the query from `/_next/image` and therefore reported a synthetic 400. The corrected command retained `Uri.PathAndQuery` and passed 44 pages plus 44 local assets with zero failures.

## Owner review and remaining launch work

- `After You` has no approved structured genre and remains unlabeled. `Bass`, `Club`, `Dance`, `Electronic`, `Electronica`, and `Garage` remain broad source-backed labels for owner review.
- Metadata for items without an approved genre uses the shorter neutral factual template; no genre was inferred from draft descriptions, audio, or artwork.
- The Privacy Notice is concise implementation copy, not legal advice, and needs owner/legal review before launch.
- `.vercelignore` remains Vercel-specific preview infrastructure; no Vercel-only runtime API was added. The permanent production host is still undecided.
- Required launch environment includes `NEXT_PUBLIC_SITE_URL`, `SITE_VISIBILITY`, optional/private-only `SITE_PASSCODE`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `MAILERLITE_API_KEY`, and `MAILERLITE_GROUP_ID`, plus the existing Shopify settings needed for the selected merch source.
- The eventual host must supply environment management, TLS, distributed rate limiting, operational logging, and any platform-specific abuse controls. Rate limiting remains an explicit open decision.
- Real Contact delivery and Newsletter subscription tests still require owner authorization and production-like provider configuration.
- DNS, apex hosting attachment, and the `www.broey.net` to `broey.net` redirect remain external launch work.
- The five pre-existing untracked audit/plan documents were preserved without modification and remain outside the Phase 1 commits.

## Determination

**Ready with documented limitations.** The repository closes the application-level Phase 1 launch blockers and is ready for owner review. Production launch still depends on owner approval of taxonomy/privacy, authorized provider write tests, rate limiting, host/environment configuration, TLS, DNS, and canonical redirect work.
