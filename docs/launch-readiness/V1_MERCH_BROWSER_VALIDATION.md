# V1 Merch Browser Validation

## Repository state

- Branch: `main`
- Starting commit: `552c59e4e504113e7fe14a4cf321690f9e375dae`
- Implementation ending commit: `afdfbc995294830405d2cad3e1b469a41b491512`
- Original uncommitted state: modified `app/globals.css`; modified `app/merch/page.tsx`; deleted `components/sections/MerchMobileBrowser.tsx`; untracked `components/sections/MerchBrowser.tsx`.
- The safety check found exactly those four merch files and no unrelated changes before implementation work continued.

## Intended behavior and root cause

Before this change, desktop rendered an unfiltered multi-column grid while mobile mounted a separate `MerchMobileBrowser`. The mobile component duplicated product-card rendering and placed one full-width product at a time in a snap-scrolling horizontal track. Additional products existed off-screen, the scrollbar was hidden, and discovering them depended on an unlabelled swipe gesture.

After this change, every viewport uses one `MerchBrowser` with the same category state, result context, empty state, and shared `MerchCard` rendering. Mobile presents two explicit product columns at the validated phone widths, so multiple items are visible together and no swipe instruction or hidden horizontal gesture is needed. Tablet and desktop retain progressively wider two-, three-, and four-column grids.

## Files changed

- `app/globals.css`: removed obsolete mobile-carousel selectors; added unified browser, result, empty-state, and grid-item styles; kept wrapped filters and two-column phone grids; retained existing global focus treatment and site breakpoints.
- `app/merch/page.tsx`: replaced the separate mobile browser plus desktop grid with one `MerchBrowser` data/rendering path.
- `components/sections/MerchBrowser.tsx`: added the responsive filter controller, pressed state, live visible result context, shared card slots, and empty state.
- `components/sections/MerchMobileBrowser.tsx`: removed after its behavior was fully replaced.

No dependency, lockfile, analytics, Contact, Newsletter, Privacy, audio, release, metadata, sitemap, robots, or external-service configuration file changed.

## Component architecture

`app/merch/page.tsx` still obtains server-side products from `getMerchProducts()`, derives the same category list, and renders the existing `MerchCard` for each product. `MerchBrowser` owns only client-side category selection and chooses which pre-rendered card slots remain visible. This keeps one card implementation for all viewport sizes and avoids moving Shopify retrieval or server-only artwork checks into the client bundle.

Filters are semantic buttons with `aria-pressed` and `aria-controls`. The selected filter has an existing visual active treatment. A visible polite status reports the current item count and category. The grid renders a clean message when no item matches. Cards retain title, category, price, description, artwork, and the existing external `View item` handoff without nested controls or native checkout behavior.

## Shopify and fallback validation

- Configured Shopify run: a read-only production-server request logged `source=shopify-tokenless products=6`; `/merch` returned 200, rendered six items, and retained Shopify product links.
- Forced fallback run: an invalid process-local Shopify domain caused the expected fetch failure and logged `source=fallback products=6`; `/merch` still returned 200 with the six curated local products.
- Fallback filtering: `Crewnecks` returned exactly the two crewneck products and both intended Shopify destinations at 430 x 932 with zero page overflow.
- Live and fallback category values use the same component and exact equality filter.
- All six card links used `https://broey-beats.myshopify.com/products/...`, `target="_blank"`, and `rel="noopener noreferrer"`. Opening the Dad Hat action produced the expected Shopify product URL. No cart, order, checkout, or other provider write was attempted.
- Existing environment-variable behavior was not modified, and no token or secret was printed or committed.
- The owner-sensitive `Crewbeck` title, URL, and alt text were deliberately preserved.

## Filter results

| Filter | Result | Products |
| --- | ---: | --- |
| All | 6 | Full catalog restored in source order |
| Hoodies | 3 | Beats Hoodie; Broey. Unisex Hoodie; Broey. Unisex Hoodie - Pastels |
| Crewnecks | 2 | Broey. Crewneck Sweater - Colors; Broey. Unisex Crewbeck Sweatshirt (The Classic) |
| Hats | 1 | Broey. Dad Hat (The Original) |

Every selection exposed only the expected category, updated the one pressed button, and announced the correct singular or plural result text. A direct server-render exercise with zero items confirmed the zero-result count, empty-state message, and absence of an empty grid.

## Responsive and browser results

| Viewport | Grid | Narrowest card | Page overflow | Filter overflow | Result |
| --- | --- | ---: | ---: | ---: | --- |
| 360 x 800 | 2 columns | 152 px | 0 px | 0 px | Pass |
| 430 x 932 | 2 columns | 187 px | 0 px | 0 px | Pass |
| 768 x 1024 | 2 columns | 355 px | 0 px | 0 px | Pass |
| 1440 x 900 | 4 columns | 309 px | 0 px | 0 px | Pass |
| 1920 x 1080 | 4 columns | 309 px | 0 px | 0 px | Pass |

The existing 1180 px breakpoint continues to supply a three-column intermediate layout. Visual inspection at 360 px confirmed two clearly visible products per row, wrapped filters, undistorted square artwork, non-overlapping titles/prices/descriptions/actions, a functional Menu/Close mobile navigation, and the existing responsive footer. All inspected product images completed with positive intrinsic dimensions; the temporary lazy image observed before scrolling completed at a subsequent viewport check. Image styling remained `object-fit: contain`.

The persistent player was started with `FREE` on `/music`. Client-side navigation through the primary Merch link retained the same `/audio/free.mp3` element, active playback, track metadata, player body state, and advancing current time on `/merch`. Header, footer links, and mobile navigation remained operational. The merch browser console and the forced-fallback browser console contained no errors or warnings.

## Accessibility results

- Keyboard `Enter` activated the Hats filter and reduced the visible grid to one item.
- Focus remained on the activated button, matched `:focus-visible`, and used the site-wide 3 px focus-ring box shadow.
- Filter buttons measured 44 px high at the validated viewport; product actions also have a 44 px minimum height.
- Selected state is available visually and through `aria-pressed`.
- Result changes use a visible `role="status"` / polite live region.
- Product images retain meaningful alt text and `object-fit: contain` behavior.
- Product cards contain one non-nested outbound action and preserve headings, category, price, and descriptions.

## Repository and route validation

- `npm ls --depth=0`: exit 0. The pre-existing `@img/sharp-wasm32@0.35.3` installation is reported as extraneous; no dependency or lockfile changed.
- `npx eslint .`: pass, no output.
- `npx tsc --noEmit --incremental false`: pass.
- `NEXT_PUBLIC_SITE_URL=https://broey.net SITE_VISIBILITY=public npm run build`: pass under Next.js 16.3.0; all 54 static pages generated and `/merch` remained a dynamic route.
- `git diff --check`: pass before the implementation commit and before documentation.
- Runtime status: `/`, `/music`, `/about`, `/contact`, `/merch`, `/press`, and `/privacy` returned 200. `/robots.txt` and `/sitemap.xml` returned 200. The intentionally unavailable `/watch` route remained 404.
- Public sitemap: includes `https://broey.net/merch`; continues to exclude `/design-system`, `/gate`, and `/watch`.
- Public robots: continues to allow `/` and references `https://broey.net/sitemap.xml`.
- No old `MerchMobileBrowser` import or old `merch-mobile-*` selector remains in application code. A historical audit report still names the removed component as past-state documentation.

## Remaining limitations

- Checkout completion was intentionally not tested because this task authorized only the existing outbound handoff and explicitly prohibited completing an order.
- The empty state cannot occur with the current page-generated category list and fallback guarantee; its component branch was validated directly rather than by introducing a fake catalog category.
- The known Shopify API-version fall-forward finding and owner-dependent `Crewbeck` naming issue remain outside this focused change.
- `npm ls` still notes the pre-existing extraneous Sharp WASM package; this task did not modify dependencies.

## Isolation and next step

The separate `C:\Users\phill\Desktop\Scripts\Broey-Website-Umami` worktree and analytics branch were not opened for editing, modified, stashed, reset, merged, pushed, or deployed. No analytics instrumentation was added or removed here.

The merch implementation is ready for analytics reconciliation. The next step is to reconcile the later Umami work against `MerchBrowser` rather than restoring or re-importing `MerchMobileBrowser`, while preserving the unified responsive grid and avoiding duplicate tracking/rendering paths.
