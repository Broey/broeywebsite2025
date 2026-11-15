"use client";

import { useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MusicInvitationStore, WELCOME_DELAY_MS, welcomeEligible } from "@/lib/music-invitation";
import { PlaylistPromptVisibility } from "@/components/audio/PlaylistPromptVisibility";
import { useMusicPreferences, useMusicPreferenceStore } from "./MusicPreferencesProvider";

const dismissal = new MusicInvitationStore(() => window.localStorage);
const serverDismissed = () => true;

export function HomeMusicInvitation() {
  const profile = useMusicPreferences();
  const store = useMusicPreferenceStore();
  const pathname = usePathname();
  const playlistVisible = useContext(PlaylistPromptVisibility);
  const dismissed = useSyncExternalStore(dismissal.subscribe, dismissal.getSnapshot, serverDismissed);
  const [elapsed, setElapsed] = useState(false);
  // Memory only: survive SPA navigation, but never carry an unanswered popup into a new load.
  const [hasAppeared, setHasAppeared] = useState(false);
  const [message, setMessage] = useState("");
  const panel = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const canAppear = welcomeEligible(pathname, elapsed, profile.enabled, dismissed, playlistVisible);
  const visible = hasAppeared && !profile.enabled && !dismissed && !playlistVisible;
  useEffect(() => {
    if (hasAppeared && (profile.enabled || dismissed)) {
      const frame = requestAnimationFrame(() => setHasAppeared(false));
      return () => cancelAnimationFrame(frame);
    }
  }, [hasAppeared, profile.enabled, dismissed]);
  useEffect(() => {
    if (!canAppear || hasAppeared) return;
    const frame = requestAnimationFrame(() => setHasAppeared(true));
    return () => cancelAnimationFrame(frame);
  }, [canAppear, hasAppeared]);
  useEffect(() => {
    if (pathname !== "/" || hasAppeared) return;
    const timer = window.setTimeout(() => setElapsed(true), WELCOME_DELAY_MS);
    return () => { window.clearTimeout(timer); setElapsed(false); };
  }, [pathname, hasAppeared]);
  useEffect(() => {
    dismissal.refresh();
    const refresh = () => dismissal.refresh();
    const expiry = window.setInterval(refresh, 60000);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(expiry);
      window.removeEventListener("storage", refresh); window.removeEventListener("focus", refresh);
    };
  }, []);
  useEffect(() => {
    if (visible) previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }, [visible]);
  const finish = (enable: boolean) => {
    if (enable && !store.enable()) {
      setMessage("Browser storage is unavailable. Personalization is off. You can still explore all the music.");
      return;
    }
    if (panel.current?.contains(document.activeElement) && previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true });
    if (enable) dismissal.clear(); else dismissal.dismiss();
  };
  useEffect(() => {
    if (!visible) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (panel.current?.contains(document.activeElement) && previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true });
        dismissal.dismiss();
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [visible]);
  if (!visible) return null;
  return <aside ref={panel} className="playlist-prompt home-discovery-popup" aria-labelledby="home-discovery-title" aria-describedby="home-discovery-description">
    <button type="button" className="playlist-prompt-close" aria-label="Dismiss discovery invitation" onClick={() => finish(false)}><span aria-hidden="true">×</span></button>
    <div aria-live="polite">
      <p className="release-detail-section-kicker">Make yourself at home</p>
      <h2 id="home-discovery-title">Discover your sound</h2>
      <p id="home-discovery-description">Make Broey.net your own. Remember the music you explore and discover more releases that match your taste.</p>
      <p className="mt-3">Optional. Your music preferences stay on this device and can be cleared anytime. <Link href="/privacy" className="underline">Privacy notice</Link>.</p>
    </div>
    <div className="playlist-prompt-links">
      <button type="button" className="homepage-section-cta" onClick={() => finish(true)}>Enable personalization</button>
      <button type="button" className="music-filter-button" onClick={() => finish(false)}>Not now</button>
    </div>
    <p role="status">{message}</p>
  </aside>;
}
