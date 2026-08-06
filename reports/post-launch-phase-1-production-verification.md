# Post-launch Phase 1 production verification

- Verification date/time: 2026-08-06 13:15 EDT (America/New_York)
- Production provider: DigitalOcean App Platform
- Expected production commit: `0d90fb093e2e8b27914043e7c369094b17243582`
- Final assessment: **Final Phase 1 status: Pass.**

## Repository state

- Branch: `main`
- Local `main`: `0d90fb093e2e8b27914043e7c369094b17243582`
- `origin/main`: `0d90fb093e2e8b27914043e7c369094b17243582`
- No application-source changes were present or made.
- The only expected worktree entry is this untracked report.

## DigitalOcean architecture and production mapping

| Field | Verified value |
| --- | --- |
| Account/team | `My Team` |
| Project | `first-project` |
| Service | DigitalOcean App Platform web service |
| App name | `broey-website` |
| App/resource ID | `d53e2714-0516-49bc-ab95-2943a2bf3d5d` |
| Component | `broeywebsite2025` |
| Region | New York, `nyc1` |
| Repository | `https://github.com/Broey/broeywebsite2025` |
| Production branch | `main` |
| Source directory | `/` |
| Build | DigitalOcean Node.js buildpack; no explicit build command |
| Run command | `npm start` |
| Public port | `8080` |
| Trigger | Manual App Platform deployment; autodeploy is off |
| Required environment-variable keys | `NEXT_PUBLIC_SITE_URL`, `SITE_VISIBILITY` (present; values remained masked and unchanged) |
| Primary domain | `broey.net` (Active, Primary) |
| Starter domain | `broey-website-6r8bd.ondigitalocean.app` (Active) |
| `www.broey.net` | Active; redirects to primary `broey.net` |

Repository inspection found no App Platform specification, `.do/` deployment directory, Dockerfile, Compose deployment, Kubernetes configuration, PM2 configuration, Nginx configuration, systemd unit, or deployment workflow. Repository launch-readiness documentation and the authenticated DigitalOcean dashboard consistently identify the existing Git-connected App Platform workflow.

## Authoritative DNS and `www` configuration

- Authoritative DNS provider: Namecheap BasicDNS.
- Nameservers: `dns1.registrar-servers.com` and `dns2.registrar-servers.com`.
- Existing apex record: `ALIAS @ -> broey-website-6r8bd.ondigitalocean.app` with a 5-minute TTL.
- Previous `www` state: no A, AAAA, CNAME, ALIAS, or redirect record; public DNS returned `NXDOMAIN`.
- Wildcard state: no wildcard host record in the authoritative zone, corroborated by an NXDOMAIN random-label probe.
- Conflict check: pass; no `www` or wildcard conflict existed before the change.
- DigitalOcean configuration: attached `www.broey.net` to the existing `broey-website` app and added a native app-level HTTPS `301` redirect from `www.broey.net` to the primary domain `broey.net`. Both optional route-path fields were left blank so the original path and query are preserved.
- DNS record created: `CNAME www -> broey-website-6r8bd.ondigitalocean.app` with Namecheap Automatic TTL.
- DNS propagation: confirmed from both authoritative Namecheap servers and public resolvers `1.1.1.1` and `8.8.8.8`.
- Domain activation: DigitalOcean reports `www.broey.net` as **Active**, associated with the existing app, and redirecting to `broey.net`; `broey.net` remains **Active** and **Primary**.
- TLS: pass; a default-trust HTTPS request completed successfully for `www.broey.net` before the redirect, proving certificate hostname validation and trust succeeded.

## Deployment

- Previous deployed commit: `c64824dbc378de30ec08b6c9811460008fc9fcfa` (dashboard hash `c64824d`).
- Reason the expected commit had not deployed: the component was correctly connected to `main`, but autodeploy was off and no manual deployment had run after the Phase 1 merge.
- Action: used the existing App Platform **Deploy** action, which fetched `main` and performed the platform's rebuild-and-deploy workflow. No source or environment-variable value was changed.
- Deployment ID: `b6148e46-5f28-4a99-8577-a6763820d391`.
- Started: 2026-08-06 16:49:18 UTC.
- Result: shown by DigitalOcean as the **Live deployment**; app status remained **Healthy**.
- Deployed component hash: `0d90fb0`, which resolves to expected full repository SHA `0d90fb093e2e8b27914043e7c369094b17243582`.
- Adding the native redirect rule caused DigitalOcean's required configuration-only deployment `89671b44-c004-4429-8cb2-7d9971207b38`, shown as the live deployment at 2026-08-06 17:03:03 UTC. The component source hash remained `0d90fb0`; no new Git revision was deployed.

## Redirect matrix

Redirects were requested without automatic redirect hiding.

| Initial URL | Observed hops | Result |
| --- | --- | --- |
| `http://broey.net/` | `301` -> `https://broey.net/` -> `200` | Pass; one redirect |
| `https://broey.net/` | `200` | Pass; no redirect |
| `http://www.broey.net/` | `301` -> `https://www.broey.net/` -> `301` -> `https://broey.net/` -> `200` | Pass; allowed two-hop HTTPS upgrade and hostname normalization, no loop |
| `https://www.broey.net/` | `301` -> `https://broey.net/` -> `200` | Pass; direct hostname redirect with valid TLS |

The apex HTTP-to-HTTPS behavior has no unnecessary chain, and HTTPS `www` never serves a duplicate `200` response.

### Path and query preservation

| Initial URL | Redirect destination | Result |
| --- | --- | --- |
| `https://www.broey.net/music/free` | `https://broey.net/music/free` | Pass; path preserved, then `200` |
| `https://www.broey.net/music/free?source=redirect-test` | `https://broey.net/music/free?source=redirect-test` | Pass; path and query preserved, then `200` |

## Public visibility and response headers

- `https://broey.net/` returned `200` and did not redirect to `/gate`.
- The homepage had a nonempty title and description, canonical `https://broey.net`, and no robots meta directive.
- All 22 sitemap responses and all five excluded-route responses had no `X-Robots-Tag: noindex` header.
- Public sitemap pages contained neither `noindex` nor `nofollow` in HTML metadata.
- Observable behavior is consistent with canonical origin `https://broey.net` and public production visibility.

## robots.txt

- URL: `https://broey.net/robots.txt`
- Status: `200`
- Content type: `text/plain`
- `X-Robots-Tag`: absent
- Result: pass; crawling is allowed and the canonical sitemap is referenced.

Exact response body:

```text
User-Agent: *
Allow: /

Sitemap: https://broey.net/sitemap.xml
```

## sitemap.xml

- URL: `https://broey.net/sitemap.xml`
- Status: `200`
- Content type: `application/xml`
- XML parse: pass
- URL count: 22 (7 static plus 15 releases)
- Unique URL count: 22
- Origin/protocol: all URLs use `https://broey.net`
- Queries/fragments: none
- Preview, internal, gate, `/watch`, and API routes: none
- Invalid or nonindexable releases: none
- Every URL returned a direct `200` with no redirect.
- Every URL had one nonempty title, one nonempty meta description, one self-referencing canonical, no HTML `noindex`/`nofollow`, and no `X-Robots-Tag: noindex`.
- The root sitemap URL `https://broey.net/` and root canonical `https://broey.net` are equivalent representations of the same origin.

### Exact release modification dates

Only complete, source-backed dates were emitted; static routes had no synthetic timestamp.

| Release URL | `lastmod` |
| --- | --- |
| `/music/stereo-luv` | `2025-10-03T00:00:00.000Z` |
| `/music/free` | `2026-05-07T00:00:00.000Z` |
| `/music/dancing-dumpster-fire` | `2025-08-02T00:00:00.000Z` |
| `/music/i-cant-wait-for-love` | `2025-05-02T00:00:00.000Z` |
| `/music/fragments-ep` | `2024-03-29T00:00:00.000Z` |
| `/music/4u` | `2024-07-19T00:00:00.000Z` |
| `/music/mean-something` | `2024-11-01T00:00:00.000Z` |
| `/music/fragments-remixes` | `2024-05-10T00:00:00.000Z` |
| `/music/blu` | `2026-02-06T00:00:00.000Z` |
| `/music/like-that` | `2024-03-15T00:00:00.000Z` |
| `/music/contrast` | `2023-08-04T00:00:00.000Z` |
| `/music/hold-on` | `2023-05-08T00:00:00.000Z` |
| `/music/warning` | `2023-03-10T00:00:00.000Z` |
| `/music/hysteria` | `2022-01-13T00:00:00.000Z` |
| `/music/after-you` | `2020-11-30T00:00:00.000Z` |

## Per-route metadata and canonical results

`T`, `D`, and `C` mean nonempty title, nonempty description, and exactly one matching self-canonical.

| Route | HTTP | T | D | C | Robots meta | X-Robots-Tag |
| --- | ---: | :---: | :---: | :---: | --- | --- |
| `/` | 200 | Yes | Yes | Yes | absent | absent |
| `/music` | 200 | Yes | Yes | Yes | absent | absent |
| `/about` | 200 | Yes | Yes | Yes | absent | absent |
| `/contact` | 200 | Yes | Yes | Yes | absent | absent |
| `/merch` | 200 | Yes | Yes | Yes | absent | absent |
| `/press` | 200 | Yes | Yes | Yes | absent | absent |
| `/privacy` | 200 | Yes | Yes | Yes | absent | absent |
| `/music/stereo-luv` | 200 | Yes | Yes | Yes | absent | absent |
| `/music/free` | 200 | Yes | Yes | Yes | absent | absent |
| `/music/dancing-dumpster-fire` | 200 | Yes | Yes | Yes | absent | absent |
| `/music/i-cant-wait-for-love` | 200 | Yes | Yes | Yes | absent | absent |
| `/music/fragments-ep` | 200 | Yes | Yes | Yes | absent | absent |
| `/music/4u` | 200 | Yes | Yes | Yes | absent | absent |
| `/music/mean-something` | 200 | Yes | Yes | Yes | absent | absent |
| `/music/fragments-remixes` | 200 | Yes | Yes | Yes | absent | absent |
| `/music/blu` | 200 | Yes | Yes | Yes | absent | absent |
| `/music/like-that` | 200 | Yes | Yes | Yes | absent | absent |
| `/music/contrast` | 200 | Yes | Yes | Yes | absent | absent |
| `/music/hold-on` | 200 | Yes | Yes | Yes | absent | absent |
| `/music/warning` | 200 | Yes | Yes | Yes | absent | absent |
| `/music/hysteria` | 200 | Yes | Yes | Yes | absent | absent |
| `/music/after-you` | 200 | Yes | Yes | Yes | absent | absent |

## Excluded-route results

All five routes were absent from the sitemap.

| Route | Result | Indexing result |
| --- | --- | --- |
| `/watch` | `404` | `noindex`; no canonical |
| `/gate` | `307` to `/` | route response declares `noindex, nofollow`; no canonical |
| `/design-system` | `200` | `noindex, nofollow`; no canonical |
| `/music/not-a-real-release` | `404` | `noindex`; no canonical |
| `/music/shake` | `200` | `noindex, nofollow`; self-canonical retained for direct use |

## Failures and follow-up

No Phase 1 production acceptance failures remain. The `www` hostname resolves, has valid TLS, redirects without serving duplicate content, and preserves paths and query strings. No further Phase 1 infrastructure action is required.

## Final assessment

Expected commit `0d90fb093e2e8b27914043e7c369094b17243582` remains deployed and verified through `https://broey.net`. Robots, sitemap, public visibility, sitemap-route metadata/canonicals, response headers, excluded routes, apex redirects, `www` DNS, `www` TLS, hostname normalization, and path/query preservation all pass. **Final Phase 1 status: Pass.**
