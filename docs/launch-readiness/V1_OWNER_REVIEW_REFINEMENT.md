# V1 Owner-Review Refinement

Validation date: August 5, 2026

Branch: `codex/v1-launch-blockers`

Starting commit: `9bcf629e01a0f54568336e291f2381cb41bd21fa`

This pass is limited to the owner-review refinements requested after Phase 1. It does not include a Next.js migration, dependency change, deployment, DNS change, permanent-host selection, or external-service mutation.

## Functional commits

- `36a9249` — Clarify required contact fields
- `7ba2616` — Hide empty filtered catalog sections
- `8856883` — Strengthen About press coverage hierarchy
- `e104506` — Support per-release artwork framing
- `c2bf31c` — Centralize public DISCO link policy

## Validation summary

| Check | Result |
| --- | --- |
| `npm run lint` | Pass; no warnings or errors |
| `npx tsc --noEmit --incremental false` | Pass |
| Public `npm run build` with `NEXT_PUBLIC_SITE_URL=https://broey.net` and `SITE_VISIBILITY=public` | Pass; 55 pages generated |
| `npm ls --depth=0` | Pass |
| `git diff --check` | Pass |
| `package.json` and `package-lock.json` compared with the starting commit | No diff; hashes remain `ea64edca149a8fefab898ef415c7b37097ba793b` and `a60ca86f6f0930c67bb746f4b2191a427e544aa7` |
| Local internal-link crawl | Pass; 43 linked public pages checked, zero failures |
| Google reCAPTCHA / hCaptcha source and dependency scan | No implementation found; Cloudflare Turnstile remains the only CAPTCHA |

The build continues to print the pre-existing `outputFileTracingIgnores` deprecation warning and edge-runtime/static-generation advisory. Neither was introduced or remediated in this pass.

## Contact required fields

The visible note reads `All fields are required.` Each label includes `(required)`, and each of First name, Last name, Email, and Message has native `required` plus `aria-required="true"`.

At 390 pixels wide, the accessibility tree exposed the four required labels verbatim. Submitting the empty form left it native-invalid and focused First name. Direct local API requests independently omitted each field and returned HTTP 400:

- First name: `Add your first name before sending.`
- Last name: `Add your last name before sending.`
- Email: `Enter a valid email address before sending your message.`
- Message: `Add a message before sending.`

The honeypot, Privacy Notice link, shared Turnstile component, and provider ordering are unchanged. Server validation still completes before Turnstile and Resend work.

## Catalog filtering and playback

Filtering is now declarative by catalog section. A section is removed before render when it has no matching public release, so its eyebrow, heading, copy, divider, and spacing disappear together. A zero-match result renders one global empty state.

Browser checks:

- `Tech House`: one release (`STEREO LUV`) and only `Selected Catalog` rendered.
- `Dubstep`: `Fragments (Remixes)` and `Warning` rendered across both sections.
- `Drum & Bass`: four releases across both sections, including `Hold On`.
- `Jungle`: four releases across both sections, including `Hold On`.
- `All`: both sections and all 13 approved catalog releases restored at `/music`.
- A temporary no-match filter fixture produced `0 releases`, zero catalog section children/headings, and one global empty message. The fixture was reverted; no test genre remains.
- FREE continued playing while filtered out: the same `/audio/free.mp3` element advanced from 0.62 seconds to 3.79 seconds and remained unpaused. It was still playing at 29.88 seconds after the multi-filter sequence.

Draft entries remain excluded by the centralized release export and the music-page selection guard.

## Genre filter usage

Counts are for the 13 public releases in the current `/music` catalog.

| Top-level filter | Releases |
| --- | ---: |
| Alternative Electronic | 1 |
| Bass | 1 |
| Bass House | 1 |
| Bassline | 2 |
| Breakbeat | 2 |
| Chillout | 1 |
| Club | 4 |
| Dance | 5 |
| Deep House | 2 |
| Drum & Bass | 4 |
| Dubstep | 2 |
| Electro Pop | 1 |
| Electronic | 10 |
| Garage | 1 |
| House | 4 |
| Jungle | 4 |
| Old School House | 1 |
| Speed House | 1 |
| Tech House | 1 |
| Trance | 1 |
| Trap | 1 |
| UK Garage | 2 |

Single-release filters are Alternative Electronic, Bass, Bass House, Chillout, Electro Pop, Garage, Old School House, Speed House, Tech House, Trance, and Trap.

No release in the 13-item public catalog lacks an approved normalized genre. The set of displayed release tags is identical to the set of top-level filter options; there are no display-only or filter-only values.

Recommendation for owner consideration: keep granular normalized tags for release context, but introduce a smaller curated filter taxonomy for faster browsing. No genre was deleted, combined, or automatically reassigned in this pass.

## About coverage observations

The section uses the existing approved press titles, summaries, quotations, sources, dates, and destinations. We Rave You is the featured item; Insight Music, LOUDNESS, and EDM Reviewer are supporting cards. Every displayed item shows its publication, release context, headline, approved quote, summary, and `Read coverage` action. The final action is `View all press & coverage`, visibly labeled as the full Press page.

Responsive browser observations:

- At 1440 pixels, the supporting cards formed three 427-pixel columns beneath the full-width feature.
- At 768 pixels, they became a single 707-pixel column rather than a dense intermediate two-column layout.
- At 390 pixels, they remained a single 329-pixel column with no horizontal page overflow.
- External actions were 44 pixels tall and retained `_blank` plus `noopener noreferrer`.
- Keyboard focus produced the shared amber three-pixel focus ring, and Enter on the final CTA navigated to `/press` with the title `Press & Coverage | Broey.`

## Fragments artwork

`ReleaseEntry` now supports maintainable per-release `fit` and focal `position` values. `Fragments (Remixes)` alone uses `cover` with `center bottom`; other releases default to `cover` with `center`.

On the 390-pixel carousel, the square source was bottom-anchored inside the unchanged wide card frame and the embedded `FRAGMENTS – THE REMIXES` line was legible. The computed position was `50% 100%`; FREE remained `50% 50%`. No global `contain` change, distortion, card-size change, or carousel-layout change was made.

## Public DISCO policy

The central action policy suppresses DISCO when a non-draft release has an approved public streaming/catalog destination or is a released project track. It still permits DISCO for draft material, music without an approved public destination, and explicit `preview`, `press`, or `industry` use.

Previously visible public DISCO actions were affected on:

- `/music/free`
- `/music/contrast`
- `/music/contrast-falling`
- `/music/contrast-falling-almost-anyone-remix`
- `/music/contrast-origins-almost-anyone-remix`

No currently rendered home or catalog card exposed a DISCO action; the older shared carousel fallback now consumes the same central policy. Browser inspection found no DISCO anchors or frames on the affected pages. FREE retained Spotify, Apple Music, YouTube, and TIDAL; Contrast retained Spotify, Apple Music, TIDAL, Deezer, and Amazon Music; the released Contrast track retained local playback and its parent-project link.

All DISCO URLs remain in `content/releases.ts`; none was changed or deleted.

## Newsletter and anti-bot scope

The V1 newsletter remains email-only. An optional First name field may be useful later for MailerLite personalization, but it is intentionally deferred to preserve signup simplicity. Privacy disclosure, MailerLite delivery, honeypot behavior, HTTP 429 messaging, and existing success/error states are unchanged.

Turnstile remains shared by Contact and Newsletter. Source and regression inspection confirm that:

- both clients use the same widget and reset it after every server attempt;
- expiry, client error, and timeout clear the token and reset the widget;
- both APIs validate before Resend or MailerLite;
- only a true keyless local development session bypasses verification;
- missing non-development configuration fails closed;
- tokens and secrets are not logged or rendered by application code;
- 429 responses use the shared `Retry-After` helper;
- honeypots return before Turnstile/provider calls.

The current browser process did not have a client Turnstile site key, so the widget was not rendered in that session. The shared widget and server verifier were unchanged from the completed Phase 1 test-credential validation, and the final production build passed. Real production Turnstile keys remain an external configuration task after the public domain and host are selected.

## Remaining owner decisions

- Decide whether to separate granular display tags from a smaller curated filter taxonomy.
- Decide later whether MailerLite personalization justifies an optional First name field.
- Supply and restrict real production Turnstile keys after the public domain and host are selected.
- Complete authorized production-like Resend and MailerLite write tests when external-service mutation is in scope.
- Select the permanent host and complete environment, TLS, DNS, and canonical redirect work outside this pass.

## Deviations and determination

No requested application behavior was omitted. The exact post-build production-server crawl could not be started by the local command policy, so the successful 43-page internal-link crawl used the live local development server after the production build completed. Browser checks also used that server.

**Ready for owner review.**
