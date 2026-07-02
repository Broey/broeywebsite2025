# Broey. Website Copy Audit

Date: 2026-06-26

Scope: copy and content-structure audit only. No live site copy was changed.

Primary sources audited:

- Route files in `app/`
- Shared section and UI components in `components/`
- Site, navigation, press, merch, watch, social, SEO, and release data in `content/`
- Generated music registry copy in `content/musicRegistry.generated.ts`, because it feeds several live release descriptions through `content/releases.ts`
- User-facing API/form response strings for newsletter and contact flows

## 1. Executive Summary

The site is close structurally, and the copy already understands the right territory: Broey as a producer-led electronic project with lo-fi roots, club influence, hands-on production, and a self-directed catalog. The strongest writing appears when it gets concrete: "dusty chords, clipped drums, warped samples," "drum machines, bass sequencing and samplers," "radio and extended mixes," "UKG, bassline, trance and speed-house." Those phrases feel like they come from the music.

The main issue is that the site often stops one layer too early. Instead of staying with the specific musical material, it falls back to broad artist-site words: motion, movement, energy, texture, emotional, world, current era, genre-fluid. None of these are wrong, but they have become the site's default connective tissue. The result is polished and coherent, but sometimes generic. Broey sounds more like an artist being positioned than a producer explaining the work.

The copy needs tightening around three priorities:

- Replace abstract framing with concrete production language.
- Make section headers and eyebrows less template-like and more intentional.
- Give priority releases stronger descriptions that name sound, process, and catalog context without sounding like a brand campaign.

The site does not need a tonal overhaul. It needs a specificity pass.

## 2. Sitewide Voice Assessment

The current voice is generally aligned with Broey's identity, but uneven. It knows the musical lane: house, UKG, jungle, DnB, bass, lo-fi, sax, guitar, vocal chops, analog warmth, late-night club shape. It also knows Broey is producer-minded and self-directed. The best moments are understated and credible.

Where the voice works:

- It frames Broey as a working producer and audio engineer rather than only a performer.
- It acknowledges the lo-fi foundation without making the whole site feel stuck in chillhop.
- It treats current releases as an active catalog, not just a list of singles.
- It uses some strong, grounded terms: clipped drums, warped samples, warm noise, dusty 90s deep house, drum machines, bass sequencing, samplers, UKG, bassline, trance, speed-house.
- It keeps CTAs mostly clear and functional.

Where the voice slips:

- "Current era" appears too often and starts to feel like internal positioning language.
- "World" is used to describe the catalog/site in ways that feel more brand-deck than artist-led.
- "Motion" and "movement" are overused as all-purpose substitutes for rhythm, groove, bounce, swing, pulse, drums, bass, or arrangement.
- "Emotional" is accurate but over-relied on. The copy should show emotion through musical detail more often.
- "Genre-fluid" is useful in metadata, but too corporate as a primary identity phrase.
- Some section labels are generic containers rather than meaningful editorial cues: Bio, Highlights, Context, Foundations, Shopify store, Start here.
- The release pages have a strong structure, but many descriptions are too similar in shape: "A [release type] with [abstract quality], [abstract quality], and [genre/electronic term]."

Overall diagnosis: confident but too polished in places. The next pass should make the copy sound less like a launch site and more like a producer with taste describing what he is making.

## 3. Repeated Language / Vocabulary Audit

Keyword counts from `app/`, `components/`, and `content/`, excluding CSS and imported raw JSON:

| Term | Count excluding generated registry | Count including generated registry |
|---|---:|---:|
| emotional | 26 | 30 |
| motion | 23 | 27 |
| movement | 21 | 27 |
| raw | 14 | 20 |
| genre-fluid | 13 | 13 |
| feeling | 11 | 14 |
| energy | 11 | 32 |
| world | 9 | 11 |
| texture | 8 | 8 |
| current era | 7 | 7 |
| textures | 5 | 14 |
| momentum | 2 | 16 |

Assessment:

- Motion / movement: overused. These should be reserved for moments where physical movement is truly the point. Most instances could become groove, swing, pulse, bounce, drum programming, bass movement, rhythmic push, or arrangement detail.
- Energy / momentum: overused in generated registry copy, especially release and track blurbs. Fine occasionally, but too vague as default praise.
- Texture / textures / textured: useful for lo-fi roots and sound design, but currently doing too much work. Replace some instances with specific materials: tape noise, vinyl haze, dusty drums, chopped vocals, sampler grit, warm low-end, glossy synths, sax lines.
- Emotional / feeling: aligned with Broey, but should be paired with concrete sound. "Emotional production" is less effective than "minor-key vocal chops over warm low-end" or "soft synth pressure against loose drums."
- World: too abstract for this artist. Use catalog, site, release run, community, visual side, or body of work unless "world" is doing something specific.
- Current era: useful internally, but should be reduced in public copy. The site can show the current sound through releases and musical language.
- Genre-fluid: accurate but slightly corporate. Better as metadata or occasional bio language than repeated front-facing positioning.
- Raw: effective for dancing dumpster fire and rough-edged polish, but should not become a universal virtue.

Useful vocabulary to introduce more often:

- chopped vocals
- loose drums
- dusty drums
- warm low-end
- bassline
- breakbeat
- UKG swing
- deep-house groove
- sampler grit
- drum machines
- club pressure
- late-night bounce
- radio edit
- extended mix
- melodic pressure
- rough-edged polish
- home-studio detail
- sample-driven rhythm
- producer instincts

Repeated structural patterns:

- "Explore Selected Releases" appears across homepage, About, Music, and archive components. Clear, but a little stiff.
- "Stay close" appears in newsletter/footer success language. It is warm, but repeated enough to feel like a slogan.
- "Release notes" appears across homepage, footer, About, and signup flows. Good concept, but it should be clarified: notes from Broey, production notes, drop notes, or first links?
- "Community" is used for newsletter and Discord. This blurs two different actions: email updates versus Discord participation.

## 4. Page-by-Page Audit

## Page: Homepage `/`

### Section: Music Carousel Hero

- Current role of the section: First impression and release discovery surface. Shows highlighted releases with current badge, artwork, and play/open actions.
- What is working: The hero is music-first. It avoids a generic landing-page pitch and lets releases carry the page. The `/ Broey` and `/ Now out` label row is minimal and direct.
- What feels unclear, vague, repetitive, or over-written: The carousel intentionally suppresses release descriptions, so the opening relies on metadata, artwork, and titles. That is visually strong, but editorially thin if a visitor does not already know Broey.
- Eyebrow assessment: `/ Broey` works as a brand signal. `/ Now out` is functional but could be sharper if it tied directly to FREE or the current release run.
- Header assessment: The visible H1 is screen-reader-only: "Highlighted Releases." This is technically useful but not editorially expressive.
- Subtext assessment: No visible subtext. This helps keep the hero lean, but it leaves the current sonic identity to be inferred.
- CTA assessment: "Open" and "Play" are simple and good inside a carousel. They should stay functional.
- Suggested editorial direction: Keep the release-first experience, but consider one compact line somewhere near the hero that names the current sound in concrete terms: house pulse, chopped vocals, low-end, rough polish, etc.
- Priority: Medium

### Section: Homepage Music Archive / Mailing List Split

- Current role of the section: Push visitors to the music archive and collect email signups.
- What is working: "Current Broey. catalog" is clear. "New tracks, drop notes, odd scraps." has the right human looseness and is one of the better short lines on the site.
- What feels unclear, vague, repetitive, or over-written: "Current-era singles, EPs, remixes, and release notes" repeats the "current era" framing. The newsletter heading "Join the Community" blurs email signup with Discord/community.
- Eyebrow assessment: "selected releases" and "mailing list" are clear but generic. "mailing list" is fine because the utility is obvious.
- Header assessment: "Current Broey. catalog" is accurate, though slightly internal.
- Subtext assessment: The music subtext is too category-based. The newsletter subtext is stronger because it feels specific and human.
- CTA assessment: "Explore Selected Releases" is clear but repeated across the site. "Join" is direct and good.
- Suggested editorial direction: Make the catalog line more sonic and make the newsletter label clearly email-specific. Preserve the "odd scraps" casualness.
- Priority: High

### Section: Homepage Press Preview

- Current role of the section: Establish outside validation without making the homepage feel press-driven.
- What is working: The section is short and names real outlets. Press callouts use pull quotes and direct "READ COVERAGE" actions.
- What feels unclear, vague, repetitive, or over-written: "Broey has been covered by outlets like..." is serviceable but plain. It does not say what the coverage helps prove: producer evolution, club direction, or release credibility.
- Eyebrow assessment: The underlying `Press & Mentions` eyebrow and heading repeat each other in source copy, though the preview component mainly shows the heading.
- Header assessment: "Press & Mentions" is clear and conventional.
- Subtext assessment: Too list-like. It could use one specific clause about why the coverage matters.
- CTA assessment: "VIEW PRESS ARCHIVE" is clear. The all-caps style is consistent but less human than the rest of the desired voice.
- Suggested editorial direction: Keep outlet names, but connect the coverage to Broey's shift from lo-fi roots into club-focused electronic releases.
- Priority: Medium

## Page: Music `/music`

### Section: Page Intro

- Current role of the section: Frames the selected catalog and defines the current Broey sound.
- What is working: It correctly prioritizes the current catalog and names many real styles: house, UK garage, jungle, drum and bass, sax, guitar.
- What feels unclear, vague, repetitive, or over-written: The paragraph is long and dense. "Emotionally driven," "vocal texture," "restless production instincts," "current era," and "sound and direction that define Broey. now" stack into positioning language.
- Eyebrow assessment: `/ music` is simple and works.
- Header assessment: "Broey. Selects" has taste and restraint. Good direction.
- Subtext assessment: Overloaded. It should become shorter and more concrete, with fewer abstract identity claims.
- CTA assessment: No CTA in the intro itself.
- Suggested editorial direction: Cut the intro roughly in half. Lead with selected catalog, then name sound in a tighter list: house pulse, UKG swing, breakbeat pressure, chopped vocals, sax/guitar traces, warm low-end.
- Priority: High

### Section: Featured Release

- Current role of the section: Highlights FREE as current focus with artwork, metadata, mood copy, play, and release view.
- What is working: "Featured release" plus "Current focus" makes the hierarchy obvious. "Listen to Latest Release" is clear.
- What feels unclear, vague, repetitive, or over-written: FREE's current mood is "Concise, emotional, and built for motion." This is too abstract for the most important current release. It says almost nothing about what the track sounds like.
- Eyebrow assessment: "Featured release" and "Current focus" are clear, but using both close together feels slightly redundant.
- Header assessment: The release title does the work.
- Subtext assessment: The mood line needs the most work on the page.
- CTA assessment: "Listen to Latest Release" and "View Release" are clear and useful.
- Suggested editorial direction: Give FREE a concrete one-line description that names the beat, vocal or synth behavior, low-end, and club-facing shape.
- Priority: High

### Section: Selected Catalog

- Current role of the section: Main grid of current-era releases.
- What is working: The catalog grouping is useful. The cards create a clean browse flow.
- What feels unclear, vague, repetitive, or over-written: The section description repeats the intro's positioning: "feeling-first production," "house, bass, UKG, jungle," "raw electronic forms." Good ingredients, but still general.
- Eyebrow assessment: No eyebrow in this header. That is fine.
- Header assessment: "Selected Catalog" is clear but somewhat archival.
- Subtext assessment: Needs more specific musical promise or could be removed. The cards already carry the catalog.
- CTA assessment: Card CTAs are consistent: play and view release.
- Suggested editorial direction: Treat this as an editor's shelf: newest tracks, club-facing singles, EPs, and remixes. Avoid repeating the bio language.
- Priority: Medium

### Section: Transition Works

- Current role of the section: Separates Warning, Hold On, and hysteria as pre-current-context works.
- What is working: The concept is good. It prevents the catalog from flattening everything into one era.
- What feels unclear, vague, repetitive, or over-written: "Before the current era fully arrived" sounds like an internal timeline note. "Faster, more physical electronic music" is useful but could be anchored in DnB, heavier percussion, sharper club pressure, or collaboration.
- Eyebrow assessment: "Context" is too generic. This section is really about the bridge out of lo-fi.
- Header assessment: "Transition Works" is accurate but stiff.
- Subtext assessment: Decent but abstract.
- CTA assessment: Same card CTAs as catalog, which works.
- Suggested editorial direction: Rename around "Bridge out of lo-fi" or similar, and describe the sonic shift more directly.
- Priority: Medium

### Section: Foundations

- Current role of the section: Keeps early lo-fi/chillhop roots in the story without centering them.
- What is working: It explains the old catalog's influence on current instincts. "Warm guitars, vinyl haze, jazz textures" is good.
- What feels unclear, vague, repetitive, or over-written: The last phrase "build their own world inside the track" is the abstract artist-site language the audit should reduce.
- Eyebrow assessment: "Foundations" works.
- Header assessment: "Where the instincts started" is good. Producer-minded and not too polished.
- Subtext assessment: Mostly good, but it should end with something more concrete than "world."
- CTA assessment: None.
- Suggested editorial direction: Keep the lo-fi bridge, but replace "world inside the track" with listening-space or arrangement language.
- Priority: Medium

## Page: Release Detail Template `/music/[slug]`

### Section: Hero

- Current role of the section: Release title, artist, metadata, description/mood, tags, play/share/back actions.
- What is working: The template is strong. It gives every release a consistent page, supports local audio, and keeps platform links below the fold.
- What feels unclear, vague, repetitive, or over-written: The hero eyebrow "Broey. release" is generic on every page. The mood/description line is often abstract and becomes the first visible impression of the release.
- Eyebrow assessment: Too generic. It could be "Single," "EP," "Remix," or a more useful catalog label.
- Header assessment: Release titles are clear. The title should remain primary.
- Subtext assessment: This is the biggest release-copy problem. Priority releases need more concrete hero lines.
- CTA assessment: "Play," "Share," and "Back to Selected Releases" are clear. "Back to Selected Releases" appears twice on the page and can feel heavy.
- Suggested editorial direction: Keep the layout. Rewrite the hero line per priority release using a consistent formula: what it is, what it sounds like, where it sits.
- Priority: High

### Section: Platform Links

- Current role of the section: Gives DSP/listening links.
- What is working: "Find your platform" is functional and casual. "Save, playlist, or stream wherever you listen" is clear.
- What feels unclear, vague, repetitive, or over-written: "Available elsewhere" for one platform is a little awkward, but acceptable.
- Eyebrow assessment: Lowercase "find your platform" fits the understated style.
- Header assessment: Functional.
- Subtext assessment: Good enough and not over-written.
- CTA assessment: Platform buttons use direct verbs: Listen, Watch, Download, Shop. Good.
- Suggested editorial direction: Keep mostly as is. Only revisit single-platform heading.
- Priority: Low

### Section: About This Release

- Current role of the section: Longer release context or auto-generated fallback.
- What is working: Authored registry descriptions sometimes contain strong story details, especially STEREO LUV and I Can't Wait For Love.
- What feels unclear, vague, repetitive, or over-written: The fallback generator creates sentences like "[release] moves with..." and "sits in the selected Broey. catalog," which are serviceable but generic. Some generated registry page descriptions are more concrete but still use "energy," "momentum," and "world."
- Eyebrow assessment: "about this release" is clear but generic.
- Header assessment: Functional.
- Subtext assessment: Varies widely by release. Priority pages should not depend on fallback copy.
- CTA assessment: None in this section.
- Suggested editorial direction: Create hand-authored about copy for Tier 1 releases. Use the formula in section 5 and keep most release pages to two short paragraphs.
- Priority: High

### Section: Details / Credits / Tracklist / More From Broey

- Current role of the section: Structured facts, credits, tracks, and related releases.
- What is working: "release details," "credits," "tracklist," "versions," and "more from broey" are utilitarian and easy to scan.
- What feels unclear, vague, repetitive, or over-written: "More from broey" cards inherit the same abstract mood lines, so the problem repeats.
- Eyebrow assessment: These section labels are fine because they are factual tools.
- Header assessment: Clear.
- Subtext assessment: Not applicable except inherited card blurbs.
- CTA assessment: "Selected Releases," "View Track," and "Back to Selected Releases" are clear, though "Selected Releases" is repeated a lot.
- Suggested editorial direction: Keep factual labels. Improve inherited release blurbs.
- Priority: Medium

## Page: About `/about`

### Section: Hero

- Current role of the section: Introduces Joe Montaro/Broey, sets identity, gives music/contact actions.
- What is working: "A Real Sound Guy." is memorable, human, and better than a standard artist tagline. "Lo-fi roots. Club instincts. Electronic music from Scranton, Pennsylvania." is concise and aligned.
- What feels unclear, vague, repetitive, or over-written: The summary repeats "warm texture" and "emotional movement," which are among the site's default abstractions.
- Eyebrow assessment: "About Broey." is clear. It does not need to be clever.
- Header assessment: Strong. Keep or preserve its spirit.
- Subtext assessment: Positioning line is strong. Summary should get more concrete.
- CTA assessment: "Explore Selected Releases" and "Contact" are clear.
- Suggested editorial direction: Keep the hero headline and positioning. Rewrite the summary around producer practice: sampling, engineering, low-end, loose rhythm, club records, and lo-fi residue.
- Priority: High

### Section: Bio

- Current role of the section: Main artist narrative.
- What is working: The first paragraph has strong concrete detail: dusty chords, clipped drums, warped samples, warm noise, small imperfections. This is exactly the direction to expand.
- What feels unclear, vague, repetitive, or over-written: The bio returns to "world," "texture," "feeling," "movement," "emotional center," and "current era" repeatedly. Paragraphs 3 to 6 are long and sometimes sound like positioning notes rather than a person.
- Eyebrow assessment: "Bio" is plain but acceptable.
- Header assessment: "About Broey." repeats the page eyebrow and could be more specific.
- Subtext assessment: The bio itself is the subtext. It needs trimming and more producer detail.
- CTA assessment: None in the section.
- Suggested editorial direction: Make the bio less comprehensive and more vivid. Use 3 to 4 tighter paragraphs: origin, sonic shift, current sound, independent/home-base note.
- Priority: High

### Section: Highlights

- Current role of the section: Quick proof points for experience, catalog, platforms, labels, coverage, scenes.
- What is working: The numbered cards make credibility easy to scan. "15+ years behind the sound" is good.
- What feels unclear, vague, repetitive, or over-written: Several cards are broad: "wider electronic future," "without a fixed lane," "built across scenes." They say true things, but not always specific things.
- Eyebrow assessment: "Highlights" is generic.
- Header assessment: "Behind the sound" is good and producer-minded.
- Subtext assessment: Individual card copy needs sharpening.
- CTA assessment: None.
- Suggested editorial direction: Turn highlights into concrete credentials or working principles: production/engineering years, self-released catalog, physical/vinyl history, DSP/editorial support, label collaborations, club-facing current direction.
- Priority: Medium

### Section: Timeline

- Current role of the section: Shows the arc from early roots to current era.
- What is working: Timeline structure is useful. "Learning the language" and "Warmth and intimacy" are good.
- What feels unclear, vague, repetitive, or over-written: "Motion and raw electronic feeling" is a perfect example of the words to reduce. The current-era copy repeats movement/raw/electronic feeling.
- Eyebrow assessment: "The Arc" is slightly grand for the understated direction.
- Header assessment: "From early roots to the current era" is clear but repeats current-era language.
- Subtext assessment: Good timeline shape, but current-era language needs concrete sound.
- CTA assessment: None.
- Suggested editorial direction: Replace "Motion and raw electronic feeling" with a sound-specific era label, such as "House pressure and loose club tracks" or another artist-approved phrase.
- Priority: High

### Section: Press Mentions

- Current role of the section: Pulls credibility into About.
- What is working: It uses real coverage and does not overstuff the page.
- What feels unclear, vague, repetitive, or over-written: The description uses "broader electronic evolution," which is vague. "Outside coverage and context" is accurate but a little dry.
- Eyebrow assessment: "Press & Mentions" is clear.
- Header assessment: "Outside coverage and context" is serviceable but not especially Broey-specific.
- Subtext assessment: Needs tighter, more concrete framing.
- CTA assessment: "View Press Archive" is clear.
- Suggested editorial direction: Frame press as documentation of the shift from lo-fi foundations to current club-facing releases.
- Priority: Medium

### Section: Final CTA

- Current role of the section: Sends users to catalog, visuals, merch, press, community.
- What is working: It gives multiple paths and keeps music first.
- What feels unclear, vague, repetitive, or over-written: "Follow the next era" and "as the next era takes shape" repeat era language. "Explore the catalog, watch the visuals, browse merch..." is a list, not a strong close.
- Eyebrow assessment: "Start here" is okay but generic.
- Header assessment: "Follow the next era." is polished but a bit campaign-like.
- Subtext assessment: Too broad.
- CTA assessment: Clear.
- Suggested editorial direction: End on the music or direct connection, not "era." Use a more grounded invitation.
- Priority: Medium

## Page: Press `/press`

### Section: Page Intro

- Current role of the section: Introduces press archive.
- What is working: It clearly identifies independent coverage, releases, interviews, and the current electronic story.
- What feels unclear, vague, repetitive, or over-written: "The story around the current electronic era" is vague and repeats current-era framing.
- Eyebrow assessment: `/ press` works.
- Header assessment: "Press & Mentions" is clear.
- Subtext assessment: Needs a sharper reason to care: coverage of specific releases and the move from lo-fi roots into club/electronic production.
- CTA assessment: None.
- Suggested editorial direction: Name the concrete coverage clusters: dancing dumpster fire, Fragments, early interviews, producer background.
- Priority: Medium

### Section: Coverage Archive

- Current role of the section: Full press list grouped by coverage type/era.
- What is working: Grouping is useful. The entries are concise and give outlet, release/topic, pull quote, summary, and CTA.
- What feels unclear, vague, repetitive, or over-written: Group descriptions use "genre-fluid electronic direction," "electronic motion," and "evolution." The summaries are mostly fine but could be less abstract.
- Eyebrow assessment: "Press Archive" is clear.
- Header assessment: "Coverage archive" is functional.
- Subtext assessment: Slightly too press-kit-like.
- CTA assessment: "Read feature," "Read review," "Listen," and "Watch" are clear.
- Suggested editorial direction: Keep structure. Rewrite group descriptions to be more factual: recent EP/single coverage, Fragments reviews, early production interviews, podcasts/videos.
- Priority: Medium

### Section: Press Groups

- Current role of the section: Organizes current-era, Fragments, origin, and media coverage.
- What is working: The group model is useful for a growing archive.
- What feels unclear, vague, repetitive, or over-written: "Current Era Coverage" and "Fragments Coverage" are obvious but not very editorial. "Origin Interviews" is stronger.
- Eyebrow assessment: Not applicable beyond group titles.
- Header assessment: Group labels are clear but could be more precise.
- Subtext assessment: Needs fewer abstractions.
- CTA assessment: External links are clear.
- Suggested editorial direction: Use group names based on content type and release context, not era language.
- Priority: Low

## Page: Merch `/merch`

### Section: Page Intro

- Current role of the section: Introduces merch page.
- What is working: "Merch" is direct. "Broey wearables and physical pieces" is short.
- What feels unclear, vague, repetitive, or over-written: "Physical pieces" is a little vague because the actual inventory is apparel. If non-apparel is not live, the copy should not imply it too strongly.
- Eyebrow assessment: `/ merch` works.
- Header assessment: "Merch" is right.
- Subtext assessment: Too generic but not harmful.
- CTA assessment: None.
- Suggested editorial direction: Say what is actually there: hoodies, crewnecks, hats, and store pieces.
- Priority: Medium

### Section: Featured Piece

- Current role of the section: Highlights the Beats Hoodie.
- What is working: Product-first structure is clear.
- What feels unclear, vague, repetitive, or over-written: "The current Broey piece from the official store" is too flat and does not describe why the featured piece is featured.
- Eyebrow assessment: "Featured piece" works.
- Header assessment: Product title works.
- Subtext assessment: Needs product specificity or should be removed.
- CTA assessment: "Shop featured piece" and "View item" are clear.
- Suggested editorial direction: Use the product description or reason for feature: washed boxy fit, distressed details, worn-in feel.
- Priority: Medium

### Section: Available Pieces

- Current role of the section: Product grid with category filters and Shopify links.
- What is working: Product descriptions are practical and specific enough: washed hoodie, low-profile hat, front pouch pocket, colorways.
- What feels unclear, vague, repetitive, or over-written: "Shopify store" as an eyebrow is internal/vendor-specific. It may be useful for trust, but it is not artist-led.
- Eyebrow assessment: "Shopify store" is functional but not expressive.
- Header assessment: "Available Pieces" is clear.
- Subtext assessment: The meta count/categories are useful.
- CTA assessment: "View item" is clear.
- Suggested editorial direction: Keep product copy simple. Consider whether "Official store" is warmer than "Shopify store."
- Priority: Low

## Page: Contact `/contact`

### Section: Page Intro

- Current role of the section: Defines contact use cases.
- What is working: The page is direct and practical.
- What feels unclear, vague, repetitive, or over-written: "Music, collaborations, audio work, press, community, or project notes" appears in several places and feels like a category dump. "Project notes" is unclear to an outside visitor.
- Eyebrow assessment: `/ contact` works.
- Header assessment: "Contact" is right.
- Subtext assessment: Needs fewer categories and clearer examples.
- CTA assessment: None in intro.
- Suggested editorial direction: Prioritize actual likely intents: music inquiries, collaborations, mixing/audio work, press, bookings, or direct notes.
- Priority: Medium

### Section: Contact Form

- Current role of the section: Main inquiry form with validation and opt-in.
- What is working: "Direct, human, and specific is best" is excellent. It matches the desired tone and should be preserved.
- What feels unclear, vague, repetitive, or over-written: "Send an Inquiry" is formal compared with the human note. "Anything connected to Broey" is broad.
- Eyebrow assessment: "Message" is simple and fine.
- Header assessment: "Send an Inquiry" is clear but a bit corporate.
- Subtext assessment: The description repeats the intro category list.
- CTA assessment: "Send Inquiry" is functional but formal.
- Suggested editorial direction: Keep the practical form labels. Make the surrounding copy less category-heavy and more conversational.
- Priority: Medium

### Section: Discord Aside

- Current role of the section: Alternative contact/community path.
- What is working: It explains Discord as casual and direct.
- What feels unclear, vague, repetitive, or over-written: "Community, updates, direct sharing" repeats twice. "Prefer Discord?" is clear but could be more specific about what belongs there versus email.
- Eyebrow assessment: "Community" is accurate.
- Header assessment: "Prefer Discord?" works.
- Subtext assessment: Repetitive.
- CTA assessment: "Join the Community" is clear for Discord, but confusing when the homepage email signup also uses the same phrase.
- Suggested editorial direction: Reserve "Join the Community" for Discord. Use "Join the list" or "Get drop notes" for email.
- Priority: High

## Page: Watch `/watch`

### Section: Hero

- Current role of the section: Hidden/direct page for videos, visualizers, clips, and future embeds.
- What is working: The page clearly marks that video is not fully populated yet. It avoids broken empty content.
- What feels unclear, vague, repetitive, or over-written: "Visuals are warming up" is cute but vague. "Behind-the-scenes motion work" repeats the motion issue. "A featured embed will appear here once a verified YouTube video ID is selected" is internal implementation language.
- Eyebrow assessment: `/ watch` and `WATCH` are redundant but understandable.
- Header assessment: "Watch" is direct.
- Subtext assessment: Too much staging language. It tells users about CMS/content readiness rather than the artist's visual side.
- CTA assessment: "Open YouTube" is clear.
- Suggested editorial direction: If the page stays hidden, lower priority. If it returns to nav, rewrite it around actual video types and remove implementation phrasing.
- Priority: Medium

### Section: Video Channels

- Current role of the section: External social/video channel links.
- What is working: Simple and functional.
- What feels unclear, vague, repetitive, or over-written: TikTok description uses "day-to-day motion posts." Instagram description overlaps with "visual snippets" and "release clips."
- Eyebrow assessment: "video channels" is clear.
- Header assessment: Functional.
- Subtext assessment: Platform descriptions should be shorter.
- CTA assessment: Platform links are clear.
- Suggested editorial direction: Use platform-specific behavior: full uploads, short edits, reels, clips, studio/process.
- Priority: Low

### Section: In The Queue

- Current role of the section: Placeholder categories for future visual content.
- What is working: Release visualizers, studio clips, and live/social cuts are the right buckets.
- What feels unclear, vague, repetitive, or over-written: Status labels "Coming soon," "Queued," and "In progress" feel production-board-ish to public visitors.
- Eyebrow assessment: "in the queue" fits Broey better than many labels. Good.
- Header assessment: Functional.
- Subtext assessment: Descriptions are clear enough.
- CTA assessment: None.
- Suggested editorial direction: Keep this only if the page remains hidden or intentionally preview-like. For public launch, replace statuses with actual links or remove.
- Priority: Low

## Page: Global Header / Navigation / Footer

### Section: Header Navigation

- Current role of the section: Primary site navigation.
- What is working: Music, Merch, About, Contact is clean. Hiding Watch from nav aligns with current content state.
- What feels unclear, vague, repetitive, or over-written: No major copy issue.
- Eyebrow assessment: Not applicable.
- Header assessment: Not applicable.
- Subtext assessment: Not applicable.
- CTA assessment: Navigation labels are clear.
- Suggested editorial direction: Keep nav short. Add Watch back only when visual content is real.
- Priority: Low

### Section: Mobile Menu

- Current role of the section: Mobile navigation.
- What is working: "Menu" / "Close" is plain and accessible.
- What feels unclear, vague, repetitive, or over-written: No copy issue.
- Eyebrow assessment: Not applicable.
- Header assessment: Not applicable.
- Subtext assessment: Not applicable.
- CTA assessment: Works.
- Suggested editorial direction: Keep as is.
- Priority: Low

### Section: Footer Brand / Newsletter / Links

- Current role of the section: Site close, signup, navigation, social/streaming links.
- What is working: "Music, visuals, merch, and release notes from Broey." is compact. Footer columns are clear.
- What feels unclear, vague, repetitive, or over-written: "Stay close to the next Broey. era" repeats era language. "New releases, merch drops, release notes, and occasional updates" is serviceable but generic.
- Eyebrow assessment: "JOIN THE LIST" in default footer signup is clear.
- Header assessment: Footer heading should be less "era" based.
- Subtext assessment: Needs a more specific promise: new tracks, first links, drop notes, merch, process notes.
- CTA assessment: "Join" is clear.
- Suggested editorial direction: Align footer signup with homepage signup and reserve "community" for Discord.
- Priority: Medium

## 5. Release / Track Page Audit

### A. Current Release-Page Copy Structure

Release pages are built from `app/music/[slug]/page.tsx` and `content/releases.ts`, with generated registry fields merged in from `content/musicRegistry.generated.ts`.

Visible release copy is structured as:

- Breadcrumb: Home / Music / Release title
- Kicker row: `/ music` plus "Current" badge if featured
- Hero eyebrow: "Broey. release"
- Title
- Artist
- Type/date metadata
- Hero description: `release.mood ?? release.description`
- Tags
- CTA row: play/share/back
- Platform link section
- About this release: `release.about`, generated `pageDescription`, or fallback auto-copy
- Release details / credits / catalog info
- Tracklist or versions
- More from Broey cards using `release.mood ?? release.description`

Important data behavior:

- Generated registry `shortDescription` overrides manual `description` for matched releases.
- Manual `about` takes precedence. If missing, generated `pageDescription` is used.
- If no `about` exists, fallback copy is generated with "moves through/moves with" language.
- Several child track pages are hidden from archive but still statically generated and can be visited directly.

### B. Recurring Issues In Release Descriptions

- Too many blurbs begin with "A [release type]..." and follow a predictable template.
- "Motion," "movement," "energy," "emotional," "texture," and "world" stand in for musical detail.
- Some descriptions are strong but still slightly promotional: "chaotic, cathartic EP," "fan-supported release with early Audius momentum."
- Current priority release FREE has one of the most abstract hero lines, despite being the current focus.
- LiNK's pending-platform explanation is clear, but its actual sound description is thin.
- blu. is marked "Public / Copy Needed" in generated metadata and its page description admits fuller artist narrative is missing.
- Project-track child pages use short, repetitive descriptions. That is acceptable if they remain hidden, but not if they become public entry points.
- Generated registry copy is often stronger than hand-authored placeholders because it includes process details, but it still repeats energy/momentum.

### C. Length / Similarity Assessment

- Too vague: FREE, several project tracks, Watch page copy, About current-era language.
- Too abstract: STEREO LUV manual mood, FREE mood, many child track moods, About timeline current era.
- Too repetitive: Fragments child tracks, dancing dumpster fire child tracks, footer/homepage/signup language.
- Too long: Music page intro, About bio, About final CTA cluster.
- Too short: Merch intro, featured merch copy, LiNK sound framing.
- Too similar: Track descriptions for project children and remix children.

### D. Recommended Repeatable Release-Description Formula

Use three beats, usually 2 to 3 sentences total:

1. One-sentence summary: what is the release?
2. Sound description: what does it actually sound like?
3. Catalog context: where does it sit in Broey's body of work?

Practical template:

- Sentence 1: `[Title] is a [single/EP/remix] built around [genre/format/process].`
- Sentence 2: `It moves through [specific musical details: drums, bass, vocals, synths, samples, arrangement].`
- Sentence 3: `In the catalog, it [bridges/extends/sharpens/opens] [specific Broey era or release relationship].`

Do:

- Name genre and production material.
- Mention collaborators when relevant.
- Mention radio edit, extended mix, EP, remix companion, focus track, or preview state when relevant.
- Keep the hero line shorter than the about copy.

Avoid:

- "Full of motion, texture, and emotion"
- "A journey through sound"
- "An immersive world"
- "Current era" as a repeated crutch
- "Genre-fluid" as the only description

## 6. Priority Release Tiers

### Tier 1: Current / Priority Releases

These deserve the most polished descriptions and strongest about copy.

- FREE: current featured release. Needs the highest priority rewrite because its current line is abstract.
- LiNK: visible preview/manual listen. Needs clear pending-platform copy plus stronger sound framing.
- blu.: high current-priority release with generated metadata marked "Copy Needed." Needs fuller artist narrative.
- STEREO LUV: strong registry details around home studio, dusty 90s warmth, analog tools, and stereo field. Polish and preserve.
- dancing dumpster fire: important EP with strong concept. Keep the rough, funny, honest framing, but refine the abstract bits.

### Tier 2: Supporting Catalog Releases

These need clean, accurate, specific descriptions, but not as much polish as current lead releases.

- Fragments: key turning-point EP. Needs a strong final form because it anchors the lo-fi-to-dance transition.
- Fragments (Remixes): good structure. Needs less "world" and more contributor/style specificity.
- 4u: useful collaboration story. Tighten "energy/momentum" language.
- I Can't Wait For Love: strong origin story with Bitbird/Create Together and Broken Blythe. Polish for specificity.
- Mean Something: personal pivot. Needs careful tone so it does not become vague "personal/chill" language.
- Like That: standalone and Fragments-related. Needs accurate context.
- Hold On, Warning, hysteria: transition works. Need consistency and direct genre/process language.

### Tier 3: Older / Archive / Child Release Pages

These need consistency and basic clarity unless they become public campaign pages.

- Project tracks from dancing dumpster fire: shake!, old fashion, lil luv, brainrot, GLFM, i can do better (broey. remix), 4u vip.
- Project tracks from Fragments: Run For Cover, Wanted, Numbers, Breathing Room, Eyes On Me.
- Remix child pages from Fragments (Remixes): Numbers (tom_ecko Remix), Eyes On Me remixes, Like That (notminimal. Remix), Wanted remixes.
- Older/archive singles: After You, Paradise.

Notes:

- GLFM currently appears as a child/project track but is typed as `ep` in manual data. Verify intended public role before rewriting.
- Some child pages are hidden from archive but still generated. Decide whether to polish them as public pages or keep them as minimal direct-access pages.

## 7. Recommended Copy System

### Eyebrows

- Use eyebrows for orientation, not decoration.
- Route eyebrows like `/ music`, `/ about`, `/ contact` are fine.
- Section eyebrows should answer "what kind of thing is this?" rather than repeat the heading.
- Avoid generic labels when a more useful label exists: replace "Context" with the actual context, "The Arc" with a clearer timeline role, and "Shopify store" with "Official store" if public-facing.
- Do not stack multiple similar eyebrows close together, such as "Featured release" and "Current focus," unless both add distinct meaning.

### Headers

- Keep headers short: 2 to 6 words for most sections.
- Let release titles stay as titles. Do not over-frame them.
- Prefer producer-minded headers over campaign headers.
- Avoid repeated "era" headers unless an actual timeline section needs the term.

### Subtext

- Use subtext only when it adds context the header cannot.
- Keep page intro subtext to one tight paragraph or two short sentences.
- Replace abstract identity statements with musical ingredients.
- If a section is self-explanatory, skip subtext rather than filling space.

### CTAs

- Keep CTAs direct and functional.
- Good existing patterns: Play, Share, View Release, View item, Open YouTube, Join.
- Reduce repeated "Explore Selected Releases" by varying based on context: Browse the catalog, Start with the music, Open the music page, View the catalog.
- Reserve "Join the Community" for Discord. Use "Join the list" or "Get drop notes" for email.

### Release Descriptions

- Hero description: one concise sound-forward sentence.
- About section: 2 short paragraphs max for priority releases.
- Cards: one concrete line, not a mini bio.
- Track pages: one sentence is enough unless the track has a story.
- Remix pages: name the remixer's angle or genre shift.

### Use More Often

- chopped vocals
- warm low-end
- loose drums
- dusty drums
- UKG swing
- breakbeat pressure
- deep-house groove
- bassline
- sample-driven rhythm
- drum machines
- bass sequencing
- sampler grit
- late-night bounce
- rough-edged polish
- home-studio detail
- radio edit
- extended mix
- vocal chop
- glossy synths
- sax line
- guitar trace

### Use Less Often

- motion
- movement
- energy
- texture
- world
- journey
- immersive
- evolving
- emotional
- feeling
- genre-fluid
- current era
- atmosphere
- momentum

## 8. Highest-Impact Fixes

| Priority | Location | Issue | Suggested Direction |
|---|---|---|---|
| 1 | FREE release hero and cards | Current focus release uses "Concise, emotional, and built for motion," which is too abstract. | Rewrite around concrete sound: house pulse, vocal/sample treatment, low-end, arrangement, club-facing shape. |
| 2 | Music page intro | Long, positioning-heavy paragraph repeats current-era framing. | Cut by half and use direct sonic language: house, UKG swing, breakbeats, chopped vocals, sax/guitar traces, warm low-end. |
| 3 | About hero summary | Strong headline is undercut by "warm texture" and "emotional movement." | Keep "A Real Sound Guy." but ground the summary in production, engineering, sampling, low-end, and loose club rhythm. |
| 4 | About bio | Good concrete opening, then slips into "world/texture/feeling/movement." | Tighten to 3 to 4 paragraphs and keep specificity from the first paragraph throughout. |
| 5 | Newsletter/community language | "Join the Community" is used for email while Discord also owns community. | Separate terms: email is list/drop notes; Discord is community. |
| 6 | Release description system | Many releases use the same "A [type] with..." abstract formula. | Adopt a 3-beat formula: what it is, what it sounds like, catalog context. |
| 7 | blu. release copy | Generated metadata says "Copy Needed" and page description admits missing narrative. | Add artist-approved context for why blu. matters and what distinguishes radio vs extended versions. |
| 8 | Watch page | Copy exposes content-production state: verified YouTube ID, warming up, motion work. | If public, rewrite as a real video page; if hidden, keep minimal or noindex-style placeholder. |
| 9 | Press group descriptions | Press copy uses evolution/electronic motion/current era language. | Make groups factual: recent EP/single coverage, Fragments reviews, early production interviews, podcasts/videos. |
| 10 | Footer signup | "Stay close to the next Broey. era" repeats era language and sounds campaign-like. | Replace with a direct promise: first links, drop notes, new tracks, merch, occasional process notes. |

## 9. Questions / Unknowns

- What exactly should FREE be known for sonically: house, deep house, UKG, vocal chop, bassline, sample source, club tool, emotional single?
- Is LiNK meant to be a teaser, a private/manual listen, a pre-release, or a public release with pending DSP links?
- What is the intended release priority order after FREE: LiNK, blu., STEREO LUV, dancing dumpster fire, or another upcoming single?
- Should "current era" remain a public-facing phrase, or should it be replaced with sound-specific language?
- Should "genre-fluid" remain part of the SEO/meta identity, or be reduced in visible copy?
- Is "A Real Sound Guy." approved as the durable About hero headline? It is distinctive and worth keeping if it matches Broey's taste.
- Should the Watch page stay hidden until actual embeds are selected, or should it be rewritten as a public video hub now?
- Are child track pages intended to be polish-worthy public pages or mostly hidden direct-access pages for sitemap/audio support?
- Does GLFM need to be treated as an EP, a track from dancing dumpster fire, or a standalone catalog item?
- Which release stories are artist-approved: studio calibration for STEREO LUV, Bitbird/Create Together origin for I Can't Wait For Love, "old ideas left imperfect" for dancing dumpster fire, and copy-needed status for blu.?
- Should the site say "lo-fi" or "lofi" consistently? Both appear.
- Should "Broey." always include the period in prose, or only in logo/title contexts? Current copy mixes "Broey" and "Broey."
