# Broey V1 Next.js 16 Pre-Migration Record

Review date: August 5, 2026

Branch: `codex/next16-security-migration`

Rollback/base commit: `fbcfa041304ccd6f4122b8130f659ada2833e1b3`

This record was created before changing dependency manifests, the lockfile, framework code, or build configuration.

## Baseline state

The branch was clean and pointed at the finalized Phase 1 merge commit. A public production build with `NEXT_PUBLIC_SITE_URL=https://broey.net` and `SITE_VISIBILITY=public` passed under Next.js 14.2.35 and generated 55 pages.

| Package/runtime | Installed version |
| --- | --- |
| Node.js | 22.14.0 |
| npm | 10.9.2 |
| Next.js | 14.2.35 |
| React / React DOM | 18.3.1 / 18.3.1 |
| React types / React DOM types | 18.3.31 / 18.3.7 |
| ESLint / eslint-config-next | 8.57.1 / 14.2.35 |
| TypeScript | 5.9.3 |
| Next.js production PostCSS | 8.4.31 |
| Tailwind/Autoprefixer development PostCSS | 8.5.15 |

## Current advisory evidence

`npm audit --omit=dev --json` reported two high-severity vulnerable production package nodes: direct `next` plus its transitive `postcss`. The current registry fix recommendation is the semver-major move to `next@16.3.0`.

Next.js advisory IDs affecting the installed tree:

- `GHSA-9g9p-9gw9-jx7f`
- `GHSA-h25m-26qc-wcjf`
- `GHSA-ggv3-7p47-pfv8`
- `GHSA-3x4c-7xq6-9pq8`
- `GHSA-q4gf-8mx6-v5v3`
- `GHSA-8h8q-6873-q5fj`
- `GHSA-3g8h-86w9-wvmq`
- `GHSA-ffhc-5mcf-pf4q`
- `GHSA-vfv6-92ff-j949`
- `GHSA-gx5p-jg67-6x7h`
- `GHSA-h64f-5h5j-jqjh`
- `GHSA-c4j6-fc7j-m34r`
- `GHSA-wfc6-r584-vfw7`
- `GHSA-36qx-fr4f-26g5`
- `GHSA-m99w-x7hq-7vfj`
- `GHSA-89xv-2m56-2m9x`
- `GHSA-68g3-v927-f742`
- `GHSA-4633-3j49-mh5q`
- `GHSA-4c39-4ccg-62r3`
- `GHSA-p9j2-gv94-2wf4`
- `GHSA-955p-x3mx-jcvp`

PostCSS advisory IDs affecting Next.js 14.2.35's bundled PostCSS 8.4.31:

- `GHSA-qx2v-qp2m-jg93`
- `GHSA-6g55-p6wh-862q`
- `GHSA-r28c-9q8g-f849`
- `GHSA-fxqj-rqcc-2cmp`

The full development audit reported eight high-severity vulnerable package nodes. In addition to the production findings, the affected development paths include the old Next ESLint toolchain, `glob`, `brace-expansion`, `js-yaml`, and direct `xlsx`. The distinct additional advisory families are `GHSA-5j98-mcp5-4vw2`, `GHSA-3jxr-9vmj-r5cp`, `GHSA-mh99-v99m-4gvg`, `GHSA-rgw5-rvv9-x895`, `GHSA-52cp-r559-cp3m`, `GHSA-4r6h-8v6p-xvw6`, and `GHSA-5pgg-2g8v-p4x9`. Development-only results will remain separate from the production launch decision.

## Live target revalidation

The original Option C target remains available and appropriate; no substituted version is needed.

| Package | Exact target |
| --- | --- |
| Next.js | 16.3.0 |
| eslint-config-next | 16.3.0 |
| React / React DOM | 19.2.8 / 19.2.8 |
| React types / React DOM types | 19.2.18 / 19.2.4 |
| ESLint | 10.8.0 |
| TypeScript | Keep installed 5.9.3 |
| Node.js runtime policy | Node 22; declare `>=22.13.0 <23` to satisfy Next.js and ESLint 10 |

Registry metadata checked on August 5, 2026 shows:

- `next@16.3.0` is the stable `latest` tag, not a canary or prerelease.
- Next.js 16.3.0 requires Node 20.9 or newer and accepts stable React/React DOM 19.
- Next.js 16.3.0 declares exact `postcss@8.5.23`, beyond all four audited PostCSS affected ranges.
- `eslint-config-next@16.3.0` requires ESLint 9 or newer; ESLint 10.8.0 satisfies that peer range.
- ESLint 10.8.0 supports Node 22.13 or newer; local Node 22.14.0 satisfies it.
- React DOM 19.2.8 requires React 19.2.8, matching the proposed pair.
- The current Next.js advisory range reported by npm ends at `16.3.0-preview.10`; stable 16.3.0 is the published fix recommendation.
- The July 2026 Next.js security release fixed the audited 16.x branches by 16.2.11. Stable 16.3.0 was released afterward and is beyond those thresholds.

Official references reviewed:

- Next.js 16 upgrade guide: `https://nextjs.org/docs/app/guides/upgrading/version-16`
- Next.js 16.3 release: `https://nextjs.org/blog/next-16-3`
- Next.js security advisories: `https://github.com/vercel/next.js/security/advisories`
- PostCSS advisory: `https://github.com/postcss/postcss/security/advisories/GHSA-fxqj-rqcc-2cmp`
- Exact package metadata from the public npm registry using `npm view`

## Expected migration changes

- Pin the exact reviewed framework, React, type, and lint versions; regenerate and inspect `package-lock.json` without force, legacy-peer, or audit-fix flags.
- Declare the supported Node 22 runtime range in the package manifest.
- Convert dynamic page `params` and Gate `searchParams` to async access.
- Replace `middleware.ts`/`middleware` with the supported `proxy.ts`/`proxy` convention while preserving the matcher and gate behavior.
- Replace removed `next lint` usage and legacy `.eslintrc` with a direct ESLint command and flat configuration.
- Remove the deprecated tracing key and retain only supported output-file tracing configuration.
- Use Next.js 16's default Turbopack build, then run one explicit Webpack comparison build.
- Keep React Compiler, Cache Components, and unrelated experimental features disabled.
- Fix only migration regressions required to preserve finalized Phase 1 behavior.

## Rollback

The mechanical rollback point is `fbcfa041304ccd6f4122b8130f659ada2833e1b3`, the local-main Phase 1 merge and this branch's starting commit. If the migration cannot pass the required validation, revert the ordered migration commits or abandon this unmerged branch; do not partially copy the new lockfile onto `main`.
