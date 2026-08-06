export type AnalyticsSourceSurface =
  | "home"
  | "music_catalog"
  | "release_page"
  | "recommendations"
  | "project_tracklist"
  | "merch_page"
  | "press"
  | "about"
  | "contact_page"
  | "footer";

type AudioEventProperties = {
  release_slug?: string;
  track_slug?: string;
  track_title?: string;
  project_slug?: string;
  genre?: string;
};

export type AnalyticsEventMap = {
  audio_play: AudioEventProperties;
  audio_25_percent: AudioEventProperties;
  audio_50_percent: AudioEventProperties;
  audio_75_percent: AudioEventProperties;
  audio_complete: AudioEventProperties;
  streaming_click: {
    release_slug?: string;
    track_slug?: string;
    platform: string;
    destination_type: string;
    source_surface: AnalyticsSourceSurface;
  };
  genre_filter: {
    genre: string;
    result_count: number;
  };
  release_open: {
    release_slug: string;
    source_surface: AnalyticsSourceSurface;
  };
  newsletter_signup: {
    source_surface: AnalyticsSourceSurface;
    page_path: string;
  };
  contact_submit: {
    source_surface: AnalyticsSourceSurface;
    page_path: string;
  };
  merch_click: {
    product_title: string;
    category: string;
    source_surface: AnalyticsSourceSurface;
  };
  press_click: {
    publication: string;
    source_surface: AnalyticsSourceSurface;
  };
};

export type AnalyticsEventName = keyof AnalyticsEventMap;

export function isAnalyticsConversionSuccess(
  responseOk: boolean,
  payload: { ok?: boolean; analyticsEligible?: boolean } | null,
) {
  return responseOk && payload?.ok === true && payload.analyticsEligible === true;
}

declare global {
  interface Window {
    umami?: {
      track?: (eventName: string, properties?: Record<string, string | number | boolean>) => void;
    };
  }
}

export function trackEvent<Name extends AnalyticsEventName>(
  eventName: Name,
  properties: AnalyticsEventMap[Name],
) {
  try {
    const track = window.umami?.track;

    if (typeof track !== "function") {
      return;
    }

    const factualProperties = Object.fromEntries(
      Object.entries(properties).filter(([, value]) =>
        typeof value === "number" || typeof value === "boolean" ||
        (typeof value === "string" && value.length > 0),
      ),
    ) as Record<string, string | number | boolean>;

    track(eventName, factualProperties);
  } catch {
    // Analytics must never interfere with the visitor experience.
  }
}
