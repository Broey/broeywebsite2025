"use client";

import { useEffect, useState } from "react";
import { campaignUrl, isOnlyUReleased, onlyUCampaign, onlyUCountdown } from "@/content/only-u-campaign";
import { newsletterAnalyticsProperties, rememberCampaignAttribution, trackEvent } from "@/lib/analytics";

export function useOnlyUReleased(enabled = true) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!enabled) return;
    rememberCampaignAttribution();
    const update = () => setNow(Date.now());
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [enabled]);
  return { released: now !== null && isOnlyUReleased(now), now };
}

export function trackOnlyUPresave(surface: "home" | "release_banner") {
  trackEvent("presave_click", {
    ...newsletterAnalyticsProperties(surface),
    release_slug: onlyUCampaign.slug,
    destination_type: "presave",
  });
}

export function OnlyUCountdownBanner() {
  const { released, now } = useOnlyUReleased();
  if (released) return null;
  return (
    <aside className="release-countdown-banner" aria-label="Upcoming release">
      <div className="release-countdown-copy">
        <strong>{onlyUCampaign.title}</strong>
        <span>Just A Gent &amp; Broey. · October 15</span>
      </div>
      <span className="release-countdown-clock" aria-label="Time until release">
        {now === null ? "Coming October 15" : onlyUCountdown(now)}
      </span>
      <a href={campaignUrl(onlyUCampaign.presaveUrl, "release_banner")} target="_blank" rel="noopener noreferrer"
        className="release-countdown-cta" onClick={() => trackOnlyUPresave("release_banner")}>
        Presave {onlyUCampaign.title}
      </a>
    </aside>
  );
}
