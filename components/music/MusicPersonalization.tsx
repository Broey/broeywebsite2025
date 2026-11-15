"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useMusicPreferences, useMusicPreferenceStore } from "./MusicPreferencesProvider";
import { lastPlayedRelease, preferredClosest, type PreferenceCandidate, type PreferenceRelease } from "@/lib/music-preferences";
import { trackEvent } from "@/lib/analytics";

export function LastPlayedRelease({ catalog, cards, featuredSlug }: {
  catalog: PreferenceRelease[];
  cards: { slug: string; card: ReactNode }[];
  featuredSlug: string;
}) {
  const profile = useMusicPreferences();
  const recent = useMemo(() => lastPlayedRelease(profile, catalog, featuredSlug), [profile, catalog, featuredSlug]);
  const card = cards.find((entry) => entry.slug === recent?.slug)?.card;
  if (!card) return null;
  return <section className="music-returning-listen" aria-labelledby="last-played-title">
    <h2 id="last-played-title" className="release-detail-section-kicker">Pick up where you left off</h2>
    <p className="mt-2 text-sm text-white/70">Jump back into the music you were exploring.</p>
    <div className="mt-4">{card}</div>
  </section>;
}

export function MusicPersonalization() {
  const profile = useMusicPreferences();
  const store = useMusicPreferenceStore();
  const [message, setMessage] = useState({ profile, text: "", error: false });
  const change = (action: "enable" | "disable" | "clear") => {
    const success = store[action]();
    setMessage({ profile: store.getSnapshot(), error: !success, text: success ? action === "clear" ? "Music preferences cleared." : action === "enable"
      ? "Personalization enabled on this browser." : "Personalization disabled and music preferences removed."
      : "Browser storage is unavailable. Personalization is off. If removal was blocked, clear this site's music preferences in your browser settings." });
    if (success && action !== "clear") trackEvent("personalization_change", { enabled: action === "enable", source_surface: "music_catalog" });
  };
  return <section className="music-discovery-preferences" aria-labelledby="music-preferences-label">
    <div className="music-discovery-toggle-row">
      <span id="music-preferences-label">Personalize</span>
      <button type="button" role="switch" aria-checked={profile.enabled}
        aria-label="Enable personalized music discovery"
        aria-describedby="music-personalization-description" className="music-discovery-switch"
        onClick={() => change(profile.enabled ? "disable" : "enable")}>
        <span aria-hidden="true" className="music-discovery-switch-thumb" />
        <span aria-hidden="true" className="music-discovery-switch-on">On</span>
        <span aria-hidden="true" className="music-discovery-switch-off">Off</span>
      </button>
    </div>
    <p className="sr-only" id="music-personalization-description">
      Optional. Remember music on this device for up to 90 days. Turning off removes your music preferences.
    </p>
    <details className="music-discovery-details" onToggle={(event) => {
      if (event.currentTarget.open) event.currentTarget.scrollIntoView({ block: "nearest" });
    }}>
      <summary>Manage preferences</summary>
      <div className="pb-4">
        <p className="mt-2 text-sm text-white/70">
          Optional preferences remember the music you explore in this browser for up to 90 days.
          They stay on this device. Turning off removes your preferences. <Link href="/privacy" className="underline">Privacy notice</Link>.
        </p>
        {profile.enabled ? <button type="button" className="music-filter-button mt-3" onClick={() => change("clear")}>Clear music preferences</button> : null}
      </div>
    </details>
    <p className={message.profile === profile && message.error ? "pt-2 text-sm text-white/70" : "sr-only"} role="status">
      {(message.profile === profile && message.text) || (profile.enabled ? "Personalization is on." : "Personalization is off.")}
    </p>
  </section>;

}

export function PersonalizedRecommendations({ choices, day, children }: {
  choices: (PreferenceCandidate & { card: ReactNode })[];
  day: number;
  children: ReactNode;
}) {
  const profile = useMusicPreferences();
  const slug = useMemo(() => preferredClosest(choices, profile, day), [choices, profile, day]);
  return <div className="release-detail-recommendation-grid">
    {choices.find((choice) => choice.slug === slug)?.card}
    {children}
  </div>;
}
