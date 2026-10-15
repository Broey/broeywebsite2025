"use client";

import { useEffect } from "react";
import { ExternalServiceButton } from "@/components/ui/ExternalServiceButton";
import { onlyUCampaign } from "@/content/only-u-campaign";

export function OnlyUPlaylistPrompt({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [onDismiss]);

  return (
    <aside className="playlist-prompt" aria-labelledby="playlist-prompt-title">
      <button type="button" className="playlist-prompt-close" aria-label="Dismiss playlist reminder" onClick={onDismiss}>
        <span aria-hidden="true">×</span>
      </button>
      <div aria-live="polite">
        <p className="release-detail-section-kicker">Keep it on repeat</p>
        <h2 id="playlist-prompt-title">Add OnlyU to your playlist.</h2>
        <p>Choose your preferred streaming service.</p>
      </div>
      <div className="playlist-prompt-links">
        {onlyUCampaign.stores.filter(store => !["iTunes", "YouTube"].includes(store.platform)).map(store => (
          <ExternalServiceButton key={store.platform} {...store} label={store.platform} kind="streaming"
            showActionLabel={false}
            analytics={{ releaseSlug: onlyUCampaign.slug, sourceSurface: "playlist_prompt" }} />
        ))}
      </div>
    </aside>
  );
}
