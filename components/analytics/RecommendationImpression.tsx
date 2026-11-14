"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";
import { observeRecommendationImpression, recommendationProperties, type RecommendationContext } from "@/lib/recommendation-analytics";

export function RecommendationImpression({ context }: { context: RecommendationContext }) {
  const marker = useRef<HTMLSpanElement>(null);
  const counted = useRef(new Set<string>());
  const { source_release_slug, recommended_release_slug, recommendation_slot, recommendation_position, curated_override, personalized } = context;

  useEffect(() => {
    const card = marker.current?.parentElement;
    const context = { source_release_slug, recommended_release_slug, recommendation_slot, recommendation_position, curated_override, ...(personalized ? { personalized } : {}) };
    const key = JSON.stringify(context);
    if (!card || counted.current.has(key)) return;
    return observeRecommendationImpression(card, () => {
      if (counted.current.has(key)) return;
      counted.current.add(key);
      trackEvent("recommendation_impression", recommendationProperties(context, "impression"));
    });
  }, [source_release_slug, recommended_release_slug, recommendation_slot, recommendation_position, curated_override, personalized]);

  return <span ref={marker} hidden />;
}
