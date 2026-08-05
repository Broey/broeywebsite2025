# V1 audio-player fix validation

## Executive result

**PASS — ready for owner review and merge.**

The persistent player now follows the authoritative `<audio>` element during play, pause, resume, navigation, filtering, track changes, completion, and replay. The production-candidate failure—audio playing while the player remained paused/loading and could not pause—did not reproduce after the fix.

This task did not merge, push, deploy, change hosting or DNS, configure providers, submit forms, or add dependencies. The existing untracked DigitalOcean report was preserved.

## Revision and scope

| Item | Value |
| --- | --- |
| Branch | `codex/fix-persistent-audio-player` |
| Starting commit | `2b887772ebe016af6ba0f0cf5af4b44223e23229` |
| Ending commit | `6ff9ab412cfe9f939b3a6367eaab57e17e96b67e` |
| Fix commit | `6ff9ab4 Fix persistent audio playback state` |
| Tracked file changed | `components/audio/AudioPlayerProvider.tsx` |
| Dependencies/lockfile | Unchanged |

## Root cause

Commit `e41414d` moved track-source state initialization into `requestAnimationFrame` while resolving the Next.js 16/React 19 lint migration. On a fast or cached local audio response, the element could load and dispatch `playing` before that animation-frame callback ran. The callback then overwrote the valid media-event result with `isPlaying=false` and `isLoading=true` while `audio.paused` was already `false` and playback time continued advancing.

The transport also decided whether to pause from the stale React `isPlaying` value. Once the delayed reset produced the mismatch, activating the control called `play()` again instead of `pause()`. This explains the exact DigitalOcean evidence: real audio at ready state 4 with advancing time, while the UI remained `data-state="paused"`, announced Loading/Ready, and exposed `Play FREE`.

## State/event model

### Before

- Track-source state reset was delayed one animation frame and could run after `playing`.
- `onPlaying` correctly set the UI active, but the delayed reset could immediately undo it.
- The transport used React `isPlaying` to choose between `pause()` and `play()`.
- A successful `play()` promise did not independently confirm the element's resulting state.

### After

- Per-track time, duration fallback, ended, error, metadata, loading, and playing state reset synchronously from the audio element's `loadstart` lifecycle event. It cannot run after `playing` for that load.
- Both queued autoplay and transport resume use one `requestPlayback()` path.
- The `play()` promise is handled asynchronously. Resolution confirms `!audio.paused && !audio.ended` before exposing Pause/Playing; rejection clears playing/loading without exposing the internal error.
- The transport uses `audio.paused` and `audio.ended` as the authority. An actually active or pending-unpaused element is paused even if a React render were stale.
- `pause`, `playing`, `waiting`, `canplay`, `ended`, and `error` remain declarative handlers on the one provider-owned audio element. React owns their cleanup; no duplicate manual listener set was introduced.

## Repeatable browser validation harness

The browser checks paired the real media element and visible state on every checkpoint:

- Authoritative element: `audio[data-broey-global-audio]`
- Transport: `.global-audio-player__play`
- Announced status: `.global-audio-player [aria-live="polite"]`
- Track title: `.global-audio-player__title`
- Progress control: accessible name `Seek through <track>`

At each play/pause/resume checkpoint, record:

1. Audio element count, `paused`, `ended`, `currentTime`, `duration`, `readyState`, and source.
2. Transport `data-state` and `aria-label`.
3. Live status and visible track title.
4. A second time sample after 0.7–1.4 seconds.

Pass criteria are: exactly one audio element; time advances only while active; paused time has zero meaningful delta; source/title/action stay aligned; and status does not contradict the current lifecycle.

## Browser test results

### Basic play, pause, and resume — pass

- Starting FREE produced one audio element with `paused=false`, `ended=false`, ready state 4, source `/audio/free.mp3`, `data-state="playing"`, `Pause FREE`, and live status `Playing`.
- Time advanced from 1.543773 s to 2.984327 s (+1.440554 s).
- Keyboard Space paused the actual element. Both paused samples were exactly 18.023618 s over a 1.4-second interval; state changed to `paused`, label to `Play FREE`, and status to `Ready`.
- Keyboard Enter resumed from the paused position. Time advanced from 18.613619 s to 19.981758 s (+1.368139 s); state and action returned to Playing/Pause.

### Navigation persistence — pass

- Client-side Music → About navigation kept exactly one audio element, the same `/audio/free.mp3` source, and active playback.
- Time advanced from 27.516532 s to 30.951289 s during navigation.
- Pause on About held at exactly 33.985958 s across the interval, then resume advanced to 34.768239 s with `Pause FREE`/Playing restored.

### Genre filtering — pass

- With FREE playing, selecting Drum & Bass removed all FREE play cards from the filtered results while keeping one audio element and `/audio/free.mp3`.
- Time advanced from 45.661387 s to 48.477202 s during the filter change.
- Pause held exactly at 50.875326 s, resume advanced again, and returning to All restored the FREE cards without resetting the player.

### Track switching — pass

- Switching from FREE at 63.088907 s to STEREO LUV replaced the one element's source with `/audio/stereo-luv.mp3` and reset progress to 1.002335 s.
- The title and action changed to `STEREO LUV` / `Pause STEREO LUV` and the new track advanced to 2.145900 s.
- Rapid FREE → STEREO LUV selection settled on STEREO LUV with Playing/Pause, with no stale FREE state visible.

### Completion and replay — pass

- Seeking the final archive track, hysteria, to its end produced `currentTime=duration=222.850111`, `ended=true`, `paused=true`, `data-state="ended"`, `Replay hysteria`, and live status `Ended`.
- Replay reset progress and returned to active playback at 0.951971 s with `Pause hysteria` / Playing.
- Ending a non-final queued track advanced to the next source and kept the new track's title, progress, and active state aligned.

### Loading and failure paths — pass with noted live-test limits

- `loadstart` now reports Loading while resetting prior-track state; `playing` and the resolved `play()` promise are the only paths that confirm active playback.
- `waiting` reports Loading ahead of Playing in the live-status priority, while the Pause action remains available for the real unpaused element.
- Both play entry points catch rejection and clear `isPlaying`/`isLoading`; the error event also clears those states and marks audio unavailable.
- Local audio reached ready state 4 too quickly to hold a natural waiting state for a stable screenshot.
- The in-app browser bridge exposes media state read-only and freezes DOM methods, so it rejected an attempted transient `play()` override. A synthetic rejected promise could not be injected without changing application files or dependencies. The guarded rejection branch was therefore verified by source inspection, lint, types, and the shared code path rather than a forced browser rejection.

### Accessibility — pass

- The transport remained a native button and was keyboard-operable with Space and Enter.
- Focus remained both `:focus` and `:focus-visible` after keyboard activation.
- Accessible action names changed accurately between `Pause FREE`, `Play FREE`, and `Replay hysteria`.
- The polite status changed among Playing, Ready, Loading, and Ended without a second/contradictory player.
- Exactly one authoritative audio element was present.

### Desktop and mobile — pass

- Desktop checks used the browser's standard 2560×1271 viewport and direct media-property assertions.
- A 390×844 override rendered the responsive Menu navigation and mobile player. Warning progress advanced from 59.45 s to 60.25 s, held exactly at 60.37 s while paused, and resumed to 60.91 s. The mobile snapshot changed from Pause/Playing to Play/Ready and back to Pause/Playing.
- The browser bridge could not directly evaluate hidden media properties in the newly created responsive tab, so the mobile checkpoint used the player slider driven by `timeupdate`, control action, live status, and the confirmed single audio-element count. Direct element-property checks passed in the desktop sessions against the same provider and component.

## Repository validation

| Command/check | Result |
| --- | --- |
| `npm ls --depth=0` | Pass; dependency tree resolved. Existing extraneous `@img/sharp-wasm32@0.35.3` was reported; no install or dependency mutation occurred. |
| `npx eslint .` | Pass; no errors or warnings. |
| `npx tsc --noEmit --incremental false` | Pass. |
| `NEXT_PUBLIC_SITE_URL=https://broey.net SITE_VISIBILITY=public npm run build` | Pass with Next.js 16.3.0; 54 static pages generated. |
| `git diff --check` | Pass. |
| Dependency/lockfile diff | Empty. |
| Focused real-browser harness | Pass for play/pause/resume, navigation, filter persistence, track switch, end/replay, keyboard, mobile, and desktop. |
| Route smoke | Pass: `/`, Music, Merch, About, Contact, Press, Privacy, three representative release routes, robots, sitemap, and manifest returned 200. |
| Hidden routes | Pass: `/watch`, `/music/link`, and `/music/paradise` returned 404. |

No form was submitted. No source change touched routes, metadata, hidden-content policy, Privacy, Contact, Newsletter, Turnstile, About, Merch, or DISCO. No uncaught page error or framework error overlay appeared during the browser sequences. The browser-control surface did not expose a separate console-log feed, so console verification is limited to the absence of browser-reported page errors and the successful interactions.

## Remaining limitations

- A real browser-level rejected `play()` promise was not safely injectable with the available read-only DOM bridge; the explicit caught path remains best rechecked on the temporary deployment using a browser/network condition that naturally rejects playback.
- Natural slow-network buffering was not reproducible against localhost; the waiting/loading handler was validated structurally.
- The public mobile build was validated through responsive state/progress and accessibility snapshots; hidden-media property evaluation was available only in the desktop tabs.
- This validation does not replace the previously documented provider, Turnstile, DNS, CDN, security-header, or observability launch work.

## Recommended deployment and retest

After owner approval and merge, update the temporary DigitalOcean app to the merged commit without changing the production domain or enabling public autodeploy. Then repeat this targeted smoke against the temporary URL:

1. Confirm the dashboard deployment hash equals the merged commit.
2. Play FREE and verify real audio time, `audio.paused=false`, `Pause FREE`, `data-state="playing"`, and Playing agree.
3. Pause for at least one second, verify time is stable and the action is Play, then resume.
4. Repeat through an internal route transition and a genre filter that removes FREE.
5. Switch to STEREO LUV and verify source/title/progress alignment.
6. Exercise a natural blocked/rejected play and a throttled waiting state if the test browser permits it.
7. Repeat at desktop and 390×844 mobile sizes and confirm no new console errors.

Do not connect DNS or treat the site as publicly launch-ready until that deployment retest and the existing production-configuration checklist pass.
