# V1 production hosting requirements

## Purpose and decision boundary

This document defines the minimum production-hosting contract for the Broey website after the validated Next.js 16 migration. It is provider-neutral: it does not choose a host, establish pricing, authorize a deployment, or configure an account, DNS, TLS, or external service.

The application is ready for hosting evaluation, but production launch remains conditional on the owner-controlled verification checklist below.

## Application requirements

The host must provide all of the following:

- A standard Next.js 16 Node.js deployment using Node `>=22.13.0 <23`. A static export is not sufficient because the application uses API routes, dynamic routes, Proxy, the private-preview gate, image handling, and runtime Shopify retrieval.
- A reproducible install and build path using `npm ci` followed by `npm run build`. A Node host must support `npm run start`; a managed Next.js host may use its equivalent native runtime command.
- Environment-variable and secret support at both build and runtime. Variables prefixed with `NEXT_PUBLIC_` are embedded into browser assets and must never contain secrets. Server-only variables must not be exposed to the client or build logs.
- Next.js static, SSG, and dynamic route support. This includes the dynamic `/merch` route, `/gate`, `POST /api/gate`, `POST /api/contact`, `POST /api/newsletter`, and application Proxy behavior.
- Outbound HTTPS from the server runtime to Cloudflare Turnstile Siteverify, Resend, MailerLite, Shopify, and approved Shopify image origins. Egress failures and timeouts must be observable without logging secrets or submitted form content.
- Next.js image optimization or a verified compatible alternative for the configured Shopify image origins.
- HTTPS and custom-domain support for both the apex and `www` hostnames. The non-canonical hostname must permanently redirect to the canonical HTTPS origin while preserving the path and query string. Redirect behavior must be configured explicitly and verified after DNS is attached.
- CDN/static-file delivery that preserves file names, MIME types, cache validators, and immutable build assets. Purge or deployment versioning must prevent stale HTML and JavaScript from crossing releases.
- HTTP byte-range delivery for files under the public audio path. A valid single-range request must return `206 Partial Content` with correct `Accept-Ranges`, `Content-Range`, `Content-Length`, and audio `Content-Type` headers. The CDN must not recompress or truncate audio and must support seeking without downloading the complete file first.
- Bandwidth, artifact-size, file-size, and egress allowances appropriate for a music site with large static audio assets. These limits and overage behavior must be reviewed before selecting a plan.
- Small JSON and form-data requests for the Contact and Newsletter APIs. Contact currently permits names up to 120 characters, a subject up to 160 characters, a message up to 5,000 characters, an email address, form metadata, and a Turnstile token; Newsletter accepts an email address, form metadata, and a Turnstile token. Configure a documented edge/runtime body limit that safely admits these requests (64 KiB is sufficient for the present contract) and rejects larger requests before expensive provider work.
- Request, function, and runtime logs sufficient to diagnose route status, latency, provider reachability, rate-limit decisions, and deployment regressions. Logs must redact authorization headers, cookies, preview passcodes, Turnstile tokens, provider credentials, email addresses, names, and message bodies.
- Deployment health visibility and a tested rollback path to a known-good immutable deployment.

## Security and abuse-control requirements

- Serve every public and preview request over modern TLS and redirect plain HTTP to HTTPS.
- Store server-only credentials in the host's secret manager. Restrict access by environment and operator role, prevent secret values from appearing in source, build output, logs, or client bundles, and support rotation without a code change.
- Configure a matched production Cloudflare Turnstile site-key/secret-key pair. Restrict the widget key to the approved production and preview hostnames.
- Permit server-side HTTPS requests to Cloudflare Siteverify. The application already verifies Contact and Newsletter tokens server-side and fails closed outside local development when the pair is absent or invalid.
- Apply distributed, production-grade rate limiting before provider delivery for `POST /api/contact` and `POST /api/newsletter`. The limit must work across instances and regions, use a trustworthy client identity, tolerate normal shared networks, and define burst, sustained, and temporary provider-failure behavior.
- A throttled request must return HTTP `429` with a valid `Retry-After` header. Do not replace this with a success response, redirect, or provider call. The existing clients surface this response to visitors.
- Preserve the existing honeypot checks. Do not treat honeypots or Turnstile as replacements for distributed rate limiting.
- Retain only the minimum logs needed for abuse response and operations, with a documented retention period and deletion process consistent with the published privacy notice.
- Keep basic request/error visibility and alerting for elevated `429`, `5xx`, provider timeout, gate failure, and deployment error rates.
- Maintain an immutable prior deployment and an operator-tested rollback procedure.

## Production environment-variable inventory

The table lists names and classifications only; no values belong in this document.

| Variable name | Requirement | Exposure and lifecycle |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Required in every non-development build | Client-visible; build-time canonical origin used by metadata, structured data, sitemap, and share URLs |
| `SITE_VISIBILITY` | Required in every non-development environment | Server-only; required during build and runtime to select the public or private policy |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Required for working production forms | Client-visible; build-time widget configuration; must match the server secret and allowed hostnames |
| `TURNSTILE_SECRET_KEY` | Required for working production forms | Server-only secret; runtime Siteverify credential |
| `RESEND_API_KEY` | Required for Contact delivery | Server-only secret; runtime provider credential |
| `RESEND_FROM_EMAIL` | Required for Contact delivery | Server-only runtime configuration; sender identity must be authorized by the provider |
| `MAILERLITE_API_KEY` | Required for Newsletter subscription | Server-only secret; runtime provider credential |
| `MAILERLITE_GROUP_ID` | Required for Newsletter subscription | Server-only runtime configuration; selects the subscription group |
| `SITE_PASSCODE` | Required only when private-preview visibility is enabled | Server-only secret; build/runtime preview-gate credential |
| `RESEND_FROM_NAME` | Optional | Server-only runtime sender display configuration |
| `RESEND_API_BASE_URL` | Optional advanced override | Server-only runtime endpoint override; leave unmanaged unless an approved integration requires it |
| `MAILERLITE_API_BASE_URL` | Optional advanced override | Server-only runtime endpoint override; leave unmanaged unless an approved integration requires it |
| `SHOPIFY_STORE_DOMAIN` | Optional; required only to replace the curated merch fallback with live Shopify retrieval | Server-only runtime configuration |
| `SHOPIFY_MERCH_COLLECTION_HANDLE` | Optional Shopify configuration | Server-only runtime configuration; the application has a default collection selection |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Optional Shopify configuration | Server-only secret; required only when the selected Storefront API access mode needs a token |
| `SHOPIFY_MERCH_DEBUG_SOURCE` | Optional diagnostic configuration | Server-only runtime diagnostic switch; not required for production service |

`NODE_ENV` is framework-managed and is not an owner-provided application secret. MailerLite sender/reply-to names documented elsewhere are not read by the current Newsletter runtime and are therefore not production runtime requirements.

## Hosting comparison checklist

Use the same evidence standard for every candidate. Record current written limits and commercial terms during the later hosting-selection task; do not rely on remembered pricing or unstated defaults.

| Material criterion | Vercel Pro | Another managed Next.js/Node host | Self-hosted Node or Docker |
| --- | --- | --- | --- |
| Cost structure | Confirm current plan, bandwidth, function, build, image, log, WAF, and overage terms | Confirm the same line items and any Next.js adapter costs | Estimate compute, storage, CDN, egress, monitoring, backups, maintenance, and operator time |
| Next.js support | Verify full Next.js 16 feature compatibility and documented Node runtime selection | Verify native or adapter support for Next.js 16, Proxy, API routes, image handling, and rollback | Demonstrate a production build/start, reverse proxy, process supervision, and image/runtime compatibility |
| Custom domain and TLS | Verify apex/`www`, automated TLS, renewal, HTTP-to-HTTPS, and permanent canonical redirect controls | Verify the same capabilities and redirect behavior | Provide and operate DNS integration, certificate issuance/renewal, reverse proxy, and redirects |
| Environment variables | Verify separate build/runtime variables, preview/production scopes, secret masking, audit access, and rotation | Verify the same controls | Provide a secret store, least-privilege access, safe injection, rotation, and redaction |
| API/runtime model | Verify Node/serverless duration, memory, body, concurrency, egress, cold-start, and regional behavior | Verify equivalent limits and Next.js route semantics | Size, isolate, patch, supervise, and horizontally scale the Node runtime |
| Rate limiting and WAF | Verify distributed rules for both form POST routes, client-IP fidelity, `429`, and `Retry-After` | Verify native controls or a compatible external edge service | Select and operate a reverse-proxy/WAF/rate-limit datastore across all instances |
| Logs and rollback | Verify request/function logs, retention, redaction, alerts, immutable deployments, and one-step rollback | Verify equivalent observability and deployment history | Operate centralized logs, alerts, image/version retention, health checks, and rollback automation |
| Bandwidth and audio | Measure repository/artifact limits, per-file limits, CDN range support, cache behavior, egress allowance, and overages | Verify the same with an actual audio range probe | Provision object/static storage or CDN, range delivery, cache policy, capacity, and egress budget |
| Operational complexity | Document project configuration, integrations, incident ownership, and platform constraints | Document adapter/platform maintenance and support boundaries | Owner supplies OS/container patching, scaling, redundancy, backups, TLS, monitoring, and incident response |
| Commercial-use terms | Obtain current written confirmation that the selected plan and integrated services allow this commercial workload | Obtain the same confirmation | Review infrastructure, CDN, software, monitoring, and provider terms separately |

No candidate passes solely because it can complete a build. Every row must have an owner-approved answer and, where practical, a production-like verification result.

## Production verification checklist

Complete these checks only after a host is selected and the owner authorizes provider writes and DNS changes.

- [ ] Attach the apex and `www` DNS records to the selected host and document rollback values before changing them.
- [ ] Verify valid TLS chains, automated renewal, HTTP-to-HTTPS behavior, and no mixed content on both hostnames.
- [ ] Verify the non-canonical apex/`www` hostname permanently redirects to the canonical hostname while preserving path and query.
- [ ] Verify canonical tags, Open Graph/Twitter URLs, JSON-LD, robots, and sitemap use the approved canonical origin in the public environment.
- [ ] Verify private previews are gated and emit noindex metadata, disallowing robots and an empty sitemap.
- [ ] Exercise Turnstile with successful, expired, missing, invalid, and provider-unavailable challenges from an authorized production test session.
- [ ] Verify distributed rate limits independently on both form POST routes, including HTTP `429`, `Retry-After`, recovery after the window, logs, and no provider write while throttled.
- [ ] Send one owner-authorized Contact test and confirm delivery, sender authorization, reply-to behavior, redacted logs, and failure messaging.
- [ ] Submit one owner-authorized Newsletter test and confirm the intended MailerLite group, privacy expectations, duplicate behavior, redacted logs, and removal procedure.
- [ ] Verify the Shopify handoff for every visible product, including mobile behavior and the selected live-versus-fallback merch source. Complete a checkout test only if separately authorized.
- [ ] Probe representative audio files with normal and byte-range requests; verify `206`, required headers, seek/resume behavior, MIME type, caching, and playback on constrained mobile connectivity.
- [ ] Run browser/device smoke tests on current desktop and mobile Safari, Chrome, Firefox, and Edge coverage appropriate to the audience. Recheck navigation, filtering, persistent audio, forms, merch, privacy, and the preview gate.
- [ ] Run production Lighthouse against the deployed canonical URL and retain the report with the release evidence.
- [ ] Verify request/function logs, secret and personal-data redaction, alerts, retention, deployment health, and the documented rollback point.
- [ ] Perform and record a rollback drill before declaring the production deployment complete.

## Hosting-readiness determination

**Ready to evaluate production hosting, with documented launch limitations.** The merged application has a valid Next.js 16 production build and a defined hosting contract. It is not yet authorized or proven for public launch: provider selection, current-plan verification, production environment and secrets, distributed rate limiting, authorized Contact/Newsletter writes, DNS, TLS, canonical redirect configuration, production audio/CDN probes, browser/device smoke tests, Lighthouse, logging, and rollback verification remain owner-controlled work.
