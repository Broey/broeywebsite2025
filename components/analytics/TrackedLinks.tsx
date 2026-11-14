"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, ComponentProps, MouseEvent } from "react";
import { trackEvent, type AnalyticsSourceSurface } from "@/lib/analytics";
import { useAudioPlayer } from "@/components/audio/useAudioPlayer";
import { recommendationProperties, type RecommendationContext } from "@/lib/recommendation-analytics";

type TrackedReleaseLinkProps = ComponentProps<typeof Link> & {
  releaseSlug: string;
  sourceSurface: AnalyticsSourceSurface;
  recommendation?: RecommendationContext;
};

export function TrackedReleaseLink({
  releaseSlug,
  sourceSurface,
  recommendation,
  onClick,
  onNavigate,
  ...props
}: TrackedReleaseLinkProps) {
  const { rememberRecommendationNavigation } = useAudioPlayer();
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackEvent("release_open", {
          release_slug: releaseSlug,
          source_surface: sourceSurface,
          ...(recommendation ? recommendationProperties(recommendation, "open") : {}),
        });
        onClick?.(event);
      }}
      onNavigate={(event) => {
        let prevented = false;
        onNavigate?.({ preventDefault: () => { prevented = true; event.preventDefault(); } });
        if (recommendation && !prevented) rememberRecommendationNavigation(recommendation);
      }}
    />
  );
}

type ExternalLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
};

type TrackedMerchLinkProps = ExternalLinkProps & {
  productTitle: string;
  category: string;
  sourceSurface: AnalyticsSourceSurface;
};

export function TrackedMerchLink({
  productTitle,
  category,
  sourceSurface,
  onClick,
  ...props
}: TrackedMerchLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    trackEvent("merch_click", {
      product_title: productTitle,
      category,
      source_surface: sourceSurface,
    });
    onClick?.(event);
  };

  return <a {...props} onClick={handleClick} />;
}

type TrackedPressLinkProps = ExternalLinkProps & {
  publication: string;
  sourceSurface: AnalyticsSourceSurface;
};

export function TrackedPressLink({
  publication,
  sourceSurface,
  onClick,
  ...props
}: TrackedPressLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    trackEvent("press_click", {
      publication,
      source_surface: sourceSurface,
    });
    onClick?.(event);
  };

  return <a {...props} onClick={handleClick} />;
}
