"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useMusicPreferences, useMusicPreferenceStore } from "./MusicPreferencesProvider";
import { preferredClosest, recentReleases, type PreferenceCandidate, type PreferenceRelease } from "@/lib/music-preferences";
import { trackEvent } from "@/lib/analytics";

export function MusicPersonalization({ catalog, cards }: {
  catalog: PreferenceRelease[];
  cards: { slug: string; card: ReactNode }[];
}) {
  const profile = useMusicPreferences();
  const store = useMusicPreferenceStore();
  const [message, setMessage] = useState({ profile, text: "" });
  const recent = useMemo(() => recentReleases(profile, catalog), [profile, catalog]);
  const change = (action: "enable" | "disable" | "clear") => {
    const success = store[action]();
    setMessage({ profile: store.getSnapshot(), text: success ? action === "clear" ? "Music preferences cleared." : action === "enable"
      ? "Personalization enabled on this browser." : "Personalization disabled and music preferences removed."
      : "Browser storage is unavailable. Personalization is off. If removal was blocked, clear this site's music preferences in your browser settings." });
    if (success && action !== "clear") trackEvent("personalization_change", { enabled: action === "enable", source_surface: "music_catalog" });
  };
  return <>
    <section className="mt-8 border-t border-white/10 py-5" aria-labelledby="music-personalization-title">
      <h2 id="music-personalization-title" className="release-detail-section-kicker">Personalize music discovery</h2>
      <p className="mt-3 text-sm text-white/70" id="music-personalization-description">
        Remember the genres and releases you explore on this device to help you discover more music you might like.
        Optional preferences stay in this browser for up to 90 days; they do not sync across devices. <Link href="/privacy" className="underline">Privacy notice</Link>.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className="music-filter-button" aria-describedby="music-personalization-description"
          aria-pressed={profile.enabled} onClick={() => change(profile.enabled ? "disable" : "enable")}>
          {profile.enabled ? "Disable personalization" : "Enable personalization"}
        </button>
        {profile.enabled ? <button type="button" className="music-filter-button" onClick={() => change("clear")}>Clear music preferences</button> : null}
      </div>
      <p className="mt-3 text-sm text-white/70" role="status">{(message.profile === profile && message.text) || (profile.enabled ? "Personalization is on." : "Personalization is off.")}</p>
    </section>
    {recent.length ? <section className="mt-5 mb-8" aria-labelledby="recently-played-title">
      <h2 id="recently-played-title" className="release-detail-section-kicker">Recently played</h2>
      <p className="mt-3 text-sm text-white/70">Music you chose to play in this browser.</p>
      <div className="mt-5 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {recent.map((release) => <div key={release.slug}>{cards.find((entry) => entry.slug === release.slug)?.card}</div>)}
      </div>
    </section> : null}
  </>;
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
