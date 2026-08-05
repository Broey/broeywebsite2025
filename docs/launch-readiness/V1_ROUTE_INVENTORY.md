# Broey V1 Route Inventory

Audit date: 2026-08-05

Status terminology:

- **Verified:** directly built/crawled or exercised during this audit.
- **Representative:** the route uses a shared implementation that was visually or interactively verified on a representative page; it was not individually screenshot-reviewed.
- **Needs verification:** requires a production account, write action, real device/browser, or owner content decision.

All 39 generated `/music/[slug]` paths returned HTTP 200 with a unique title, H1, and canonical URL. All page routes passed the local link/asset crawl. Canonical URLs are structurally present but currently use the wrong production origin (`https://broey.com` rather than the intended `broey.net`), so “metadata complete” below is subject to F-001.

## Page and utility routes

| Route | Purpose | V1 requirement | Content status | Functional status | Metadata status | Responsive status | Accessibility status | Primary issues | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Artist landing page and highlighted releases | Required | Complete except highlighted LiNK promise | Verified: 200; carousel, links, and audio exercised | Complete structure; wrong origin | Verified at 390×844 and 1440×900; wide layout also sampled | Lighthouse 100; one H1; named controls | LiNK pending; lazy LCP image; some small targets | Keep; remove/complete LiNK and fix origin |
| `/music` | Release archive | Required | Substantial and coherent | Verified: 200; release links healthy | Complete structure; wrong origin | Shared music layout; crawl verified | Automated/shared semantics pass | Indexing policy differs for project tracks | Keep; formalize index policy |
| `/merch` | Shopify-backed merchandise catalog | Required if merch CTA remains | Six live products plus curated fallback | Verified: 200; Shopify 200; filtering exercised | Complete structure; wrong origin | Verified at 768×1024; Lighthouse mobile 99 | Lighthouse 100; filter state exposed | “Crewbeck” typo; checkout unverified; API fall-forward | Keep after typo/API/checkout checks |
| `/about` | Artist biography and profile | Required | Complete | Verified: 200 and links healthy | Person JSON-LD and social metadata; wrong origin | Verified at 1920×1080; shared mobile styles | Lighthouse/shared semantics pass | No material route issue | Keep |
| `/contact` | Contact form and contact destinations | Required | Complete UI | Verified validation/error behavior; provider write unverified | Complete structure; wrong origin | Verified at 430×932; Lighthouse mobile 99 | Lighthouse 100; labels and native focus work | Privacy, abuse controls, broken opt-in promise | Keep only after P1 form/privacy work |
| `/press` | Press kit, coverage, and media | Required for current navigation | Complete | Verified: 200; embeds/links healthy | Complete structure; wrong origin | Shared layouts; route crawl verified | Embeds titled; shared semantics pass | No production editorial sign-off captured | Keep after owner spot-check |
| `/watch` | Future video archive | Optional/defer | **Incomplete placeholder** | Verified: 200; no finished archive content | Canonical/indexable; absent from sitemap/nav; wrong origin | Source/shared layout only | Embeds would be titled; current placeholder is readable | “Coming soon,” “Queued,” “In progress” public | Hide, return 404, or noindex until complete |
| `/design-system` | Internal visual reference | Not public V1 | Utility content complete | Verified: 200 via direct URL | `noindex,nofollow` | Source/shared styles only | Not exhaustively audited | Publicly reachable utility surface | Keep noindex only if intentional; otherwise restrict |
| `/gate` | Private-preview passcode UI | Not public V1 | Implemented UI | Verified: 307 to `/` in current hardcoded-public state | Not a public SEO target | Source reviewed | Source reviewed | Visibility helper ignores `SITE_VISIBILITY` | Restore config behavior; use only for previews |
| Unknown path / 404 | Missing-content recovery | Required behavior | Default Next 404 only | Verified: correct HTTP 404 and root chrome | `noindex` present | Default/shared layout | Basic semantics present | No branded recovery; no custom `not-found.tsx` | Accept for V1 risk or add a small custom page |

## Sitemap release routes

These 17 release URLs are currently included in `sitemap.xml`.

| Route | Purpose | V1 requirement | Content status | Functional status | Metadata status | Responsive status | Accessibility status | Primary issues | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/music/link` | LiNK release/preview page | Optional until approved | **Incomplete/pending public links** | 200; local radio edit/Disco available | Unique metadata/JSON-LD; indexable; wrong origin | Shared release layout; representative only | Shared release semantics | P1 pending-link copy while highlighted/indexed | Complete links/copy or hide/noindex |
| `/music/stereo-luv` | Stereo Luv release | Required catalog page | Complete | 200; local/external targets healthy | Complete structure; wrong origin | Shared release layout; representative only | Shared release semantics | No material route-specific issue found | Keep |
| `/music/free` | FREE release and playback page | Required/highlighted | Complete | 200; audio playback and persistence exercised | Complete structure/JSON-LD; wrong origin | Visually verified at 390×844; Lighthouse mobile 99 | Lighthouse 100; accessible player labels | Global player can cover mobile content | Keep; polish player overlay post-blockers |
| `/music/dancing-dumpster-fire` | Release page | Required catalog page | Complete | 200; targets healthy | Complete structure; wrong origin | Shared release layout; representative only | Shared release semantics | No material route-specific issue found | Keep |
| `/music/i-cant-wait-for-love` | Release page | Required catalog page | Complete | 200; targets healthy | Complete structure; wrong origin | Shared release layout; representative only | Shared release semantics | No material route-specific issue found | Keep |
| `/music/fragments-ep` | EP release page | Required catalog page | Complete | 200; targets healthy | Album/track metadata; wrong origin | Shared release layout; representative only | Shared release semantics | No material route-specific issue found | Keep |
| `/music/4u` | Release/project page | Required catalog page | Complete | 200; track links healthy | Complete structure; wrong origin | Shared release layout; representative only | Shared release semantics | Child-track index policy unclear | Keep; define child indexing |
| `/music/mean-something` | Release page | Required catalog page | Complete | 200; targets healthy | Complete structure; wrong origin | Shared release layout; representative only | Shared release semantics | No material route-specific issue found | Keep |
| `/music/fragments-remixes` | Remix project page | Required catalog page | Complete | 200; track links healthy | Album/track metadata; wrong origin | Shared release layout; representative only | Shared release semantics | Child-track index policy unclear | Keep; define child indexing |
| `/music/blu` | Release page | Required catalog page | Complete | 200; targets healthy | Complete structure; wrong origin | Shared release layout; representative only | Shared release semantics | No material route-specific issue found | Keep |
| `/music/like-that` | Release/project page | Required catalog page | Complete | 200; track links healthy | Complete structure; wrong origin | Shared release layout; representative only | Shared release semantics | Child-track index policy unclear | Keep; define child indexing |
| `/music/contrast` | Release/project page | Required catalog page | Complete | 200; track links healthy | Album/track metadata; wrong origin | Shared release layout; representative only | Shared release semantics | Child-track index policy unclear | Keep; define child indexing |
| `/music/hold-on` | Release page | Required catalog page | Complete | 200; targets healthy | Complete structure; wrong origin | Shared release layout; representative only | Shared release semantics | No material route-specific issue found | Keep |
| `/music/warning` | Release page | Required catalog page | Complete | 200; targets healthy | Complete structure; wrong origin | Shared release layout; representative only | Shared release semantics | No material route-specific issue found | Keep |
| `/music/hysteria` | Release page | Required catalog page | Complete | 200; targets healthy | Complete structure; wrong origin | Shared release layout; representative only | Shared release semantics | No material route-specific issue found | Keep |
| `/music/after-you` | Release page | Required catalog page | Complete | 200; targets healthy | Complete structure; wrong origin | Shared release layout; representative only | Shared release semantics | No material route-specific issue found | Keep |
| `/music/paradise` | Paradise streaming page | Optional until artwork approved | **Artwork/local media pending** | 200; external streaming targets healthy | Unique metadata; indexable; wrong origin | Shared release layout; representative only | Shared release semantics | P1 placeholder artwork/copy | Add approved art/content or hide/noindex |

## Generated project-track routes omitted from sitemap

These 22 paths are generated, return 200, and are internally linked from parent tracklists. They are omitted from `sitemap.xml` but do not emit `noindex`, creating an inconsistent indexing policy. Each has parent context and an audio-capable shared release layout. Responsive and accessibility status is representative of `/music/free`, not a separate visual inspection of every track.

| Route | Purpose | V1 requirement | Content status | Functional status | Metadata status | Responsive status | Accessibility status | Primary issues | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/music/4u-vip` | Project track | Optional | Complete registry entry | 200; targets healthy | Unique title/H1/canonical; indexable but not sitemap | Representative shared layout | Representative shared semantics | Index-policy mismatch | Explicitly index+sitemap or noindex |
| `/music/brainrot` | Project track | Optional | Complete registry entry | 200; targets healthy | Unique; indexable but not sitemap | Representative | Representative | Index-policy mismatch | Decide policy |
| `/music/breathing-room` | Project track | Optional | Complete registry entry | 200; targets healthy | Unique; indexable but not sitemap | Representative | Representative | Index-policy mismatch | Decide policy |
| `/music/contrast-falling` | Project track | Optional | Complete registry entry | 200; targets healthy | Unique; indexable but not sitemap | Representative | Representative | Index-policy mismatch | Decide policy |
| `/music/contrast-falling-almost-anyone-remix` | Project track/remix | Optional | Complete registry entry | 200; targets healthy | Unique; indexable but not sitemap | Representative | Representative | Index-policy mismatch | Decide policy |
| `/music/contrast-origins-almost-anyone-remix` | Project track/remix | Optional | Complete registry entry | 200; targets healthy | Unique; indexable but not sitemap | Representative | Representative | Index-policy mismatch | Decide policy |
| `/music/eyes-on-me` | Project track | Optional | Complete registry entry | 200; targets healthy | Unique; indexable but not sitemap | Representative | Representative | Index-policy mismatch | Decide policy |
| `/music/eyes-on-me-dreamsuite-remix` | Project track/remix | Optional | Complete registry entry | 200; targets healthy | Unique; indexable but not sitemap | Representative | Representative | Index-policy mismatch | Decide policy |
| `/music/eyes-on-me-exmaxhina-remix` | Project track/remix | Optional | Complete registry entry | 200; targets healthy | Unique; indexable but not sitemap | Representative | Representative | Index-policy mismatch | Decide policy |
| `/music/eyes-on-me-vivid-fever-dreams-remix` | Project track/remix | Optional | Complete registry entry | 200; targets healthy | Unique; indexable but not sitemap | Representative | Representative | Index-policy mismatch | Decide policy |
| `/music/glfm` | Project track | Optional | Complete registry entry | 200; targets healthy | Unique; indexable but not sitemap | Representative | Representative | Index-policy mismatch | Decide policy |
| `/music/i-can-do-better-broey-remix` | Project track/remix | Optional | Complete registry entry | 200; targets healthy | Unique; indexable but not sitemap | Representative | Representative | Index-policy mismatch | Decide policy |
| `/music/like-that-notminimal-remix` | Project track/remix | Optional | Complete registry entry | 200; targets healthy | Unique; indexable but not sitemap | Representative | Representative | Index-policy mismatch | Decide policy |
| `/music/lil-luv` | Project track | Optional | Complete registry entry | 200; targets healthy | Unique; indexable but not sitemap | Representative | Representative | Index-policy mismatch | Decide policy |
| `/music/numbers` | Project track | Optional | Complete registry entry | 200; targets healthy | Unique; indexable but not sitemap | Representative | Representative | Index-policy mismatch | Decide policy |
| `/music/numbers-tom-ecko-remix` | Project track/remix | Optional | Complete registry entry | 200; targets healthy | Unique; indexable but not sitemap | Representative | Representative | Index-policy mismatch | Decide policy |
| `/music/old-fashion` | Project track | Optional | Complete registry entry | 200; targets healthy | Unique; indexable but not sitemap | Representative | Representative | Index-policy mismatch | Decide policy |
| `/music/run-for-cover` | Project track | Optional | Complete registry entry | 200; targets healthy | Unique; indexable but not sitemap | Representative | Representative | Index-policy mismatch | Decide policy |
| `/music/shake` | Project track | Optional | Complete registry entry | 200; targets healthy | Unique; indexable but not sitemap | Representative | Representative | Index-policy mismatch | Decide policy |
| `/music/wanted` | Project track | Optional | Complete registry entry | 200; targets healthy | Unique; indexable but not sitemap | Representative | Representative | Index-policy mismatch | Decide policy |
| `/music/wanted-almost-anyone-remix` | Project track/remix | Optional | Complete registry entry | 200; targets healthy | Unique; indexable but not sitemap | Representative | Representative | Index-policy mismatch | Decide policy |
| `/music/wanted-kaiyo-remix` | Project track/remix | Optional | Complete registry entry | 200; targets healthy | Unique; indexable but not sitemap | Representative | Representative | Index-policy mismatch | Decide policy |

## API and generated metadata routes

| Route | Purpose | V1 requirement | Content status | Functional status | Metadata status | Responsive status | Accessibility status | Primary issues | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /api/contact` | Send contact message through Resend | Required for Contact form | Implementation complete | Invalid/missing/oversize payloads return 400; provider write unverified | N/A | N/A | Errors returned as readable messages to UI | No rate limit; optional Turnstile inactive locally; opt-in not subscribed | Fix P1s and production-smoke |
| `POST /api/newsletter` | Add subscriber to MailerLite group | Required if newsletter remains | Implementation complete | Invalid email returns 400; group read verified; write unverified | N/A | N/A | Form has label/status handling in shared UI | Honeypot only; no rate limit; privacy disclosure absent | Add controls/privacy and production-smoke |
| `POST /api/gate` | Validate preview passcode | Preview-only | Implementation present | Not exercised because visibility helper is public | N/A | N/A | Gate form source reviewed | `SITE_VISIBILITY` ignored | Restore env-aware preview behavior |
| `/robots.txt` | Crawler policy | Required | Generated | 200 | Structurally valid; wrong origin and hardcoded public visibility | N/A | N/A | Domain/visibility mismatch | Fix origin and preview policy |
| `/sitemap.xml` | Search discovery | Required | 23 URLs: six core plus 17 releases | 200 | Structurally valid; wrong origin; artificial current-time `lastModified` | N/A | N/A | Omits Watch and 22 tracks while tracks remain indexable | Fix origin/index policy/dates |
| `/manifest.webmanifest` | PWA/application metadata | Useful | Generated | 200 | Present | N/A | N/A | No material issue found | Keep |
| `/opengraph-image` | Default social-sharing image | Required for sharing | Generated | 200 | Present; Edge runtime warning only | N/A | Image itself visually coherent in source/runtime | Origin inherits F-001; some release-specific assets are large | Keep; optimize heavy assets |

## Routes not present

| Intended concept | Discovery result | V1 impact | Recommendation |
| --- | --- | --- | --- |
| `/services` | No route, section, or current navigation promise | None | Defer until content/offering is approved |
| `/studio` | No route, section, or current navigation promise | None | Defer until content/offering is approved |

## Navigation coverage

- Header/footer primary navigation exposes Music, Merch, About, Press, and Contact.
- Watch, Design System, and Gate are not promised by primary navigation.
- Release and track pages are reachable through the home carousel/music archive/parent tracklists as applicable.
- Services and Studio are not linked, so their absence is not a broken promise for V1.
