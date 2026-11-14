import type { RecommendationSlot } from "../content/release-recommendations.ts";

export type RecommendationContext = {
  source_release_slug: string;
  recommended_release_slug: string;
  recommendation_slot: RecommendationSlot;
  recommendation_position: 1 | 2 | 3;
  curated_override: boolean;
  personalized?: boolean;
};

export type RecommendationInteraction = "impression" | "open" | "play" | "pause" | "resume" | "replay";
export type PlaybackTrigger = "direct" | "recommendation" | "automatic" | "queue_selection";
export type RecommendationAudioProperties = Partial<RecommendationContext> & {
  source_surface?: "recommendations";
  playback_trigger?: PlaybackTrigger;
};

export function recommendationProperties<Interaction extends RecommendationInteraction>(context: RecommendationContext, interaction: Interaction) {
  return { ...context, source_surface: "recommendations" as const, interaction_type: interaction };
}

// One pending SPA navigation and one active playback origin; never persisted.
export class RecommendationPlaybackAttribution {
  private pending?: { context: RecommendationContext; expiresAt: number };
  private active?: { key: string; properties: RecommendationAudioProperties };

  rememberNavigation(context: RecommendationContext, now = Date.now()) {
    this.pending = { context, expiresAt: now + 5 * 60 * 1000 };
  }

  visit(pathname: string) {
    if (this.pending && pathname !== `/music/${this.pending.context.recommended_release_slug}`) {
      this.pending = undefined;
    }
  }

  select(key: string, releaseSlug: string | undefined, pathname: string, context?: RecommendationContext, now = Date.now()) {
    const pending = this.pending;
    this.pending = undefined;
    const origin = context ?? (pending && now < pending.expiresAt &&
      pathname === `/music/${pending.context.recommended_release_slug}` ? pending.context : undefined);
    const properties: RecommendationAudioProperties = origin && origin.recommended_release_slug === releaseSlug
      ? { ...origin, source_surface: "recommendations", playback_trigger: "recommendation" }
      : { playback_trigger: "direct" };
    const changed = this.active?.key !== key || JSON.stringify(this.active.properties) !== JSON.stringify(properties);
    this.active = { key, properties };
    return changed;
  }

  advance(key: string, trigger: "automatic" | "queue_selection") {
    this.pending = undefined;
    this.active = { key, properties: { playback_trigger: trigger } };
  }

  properties(key: string): RecommendationAudioProperties {
    return this.active?.key === key ? this.active.properties : {};
  }

  resume(key: string, releaseSlug: string | undefined, pathname: string, context?: RecommendationContext, now = Date.now()) {
    // Ordinary player resumes preserve origin; a pending navigation can establish a new one.
    return context || this.pending ? this.select(key, releaseSlug, pathname, context, now) : false;
  }
}

// Geometry-based visibility, not proof of attention. No observer means no impression.
export function observeRecommendationImpression(element: Element, onImpression: () => void) {
  if (typeof IntersectionObserver === "undefined") return () => {};
  let visible = false;
  let fired = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => { clearTimeout(timer); timer = undefined; };
  const update = () => {
    cancel();
    if (!visible || document.visibilityState !== "visible" || fired) return;
    timer = setTimeout(() => {
      if (!visible || document.visibilityState !== "visible" || fired) return;
      fired = true;
      observer.disconnect();
      onImpression();
    }, 1000);
  };
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.target !== element) continue;
      const nextVisible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
      if (nextVisible !== visible) { visible = nextVisible; update(); }
    }
  }, { threshold: [0, 0.5] });
  observer.observe(element);
  document.addEventListener("visibilitychange", update);
  return () => { cancel(); observer.disconnect(); document.removeEventListener("visibilitychange", update); };
}
