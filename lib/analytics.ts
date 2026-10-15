import { onlyUCampaign } from "../content/only-u-campaign.ts";

export type AnalyticsSourceSurface =
  | "home"
  | "release_banner"
  | "music_catalog"
  | "release_page"
  | "playlist_prompt"
  | "recommendations"
  | "project_tracklist"
  | "merch_page"
  | "press"
  | "about"
  | "contact_page"
  | "join"
  | "footer";

type CampaignAttributionProperties = {
  page_path: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

type NewsletterLifecycleProperties = CampaignAttributionProperties & {
  source_surface: AnalyticsSourceSurface;
};

type AudioEventProperties = {
  release_slug?: string;
  track_slug?: string;
  track_title?: string;
  project_slug?: string;
  genre?: string;
};

export type AnalyticsEventMap = {
  presave_click: CampaignAttributionProperties & {
    release_slug: string;
    source_surface: AnalyticsSourceSurface;
    destination_type: "presave";
  };
  audio_play: AudioEventProperties;
  audio_25_percent: AudioEventProperties;
  audio_50_percent: AudioEventProperties;
  audio_75_percent: AudioEventProperties;
  audio_complete: AudioEventProperties;
  playlist_prompt_view: AudioEventProperties & { source_surface: "playlist_prompt" };
  playlist_prompt_dismiss: AudioEventProperties & { source_surface: "playlist_prompt" };
  playlist_prompt_click: AudioEventProperties & {
    source_surface: "playlist_prompt";
    platform: string;
    destination_type: string;
  };
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
  join_page_view: NewsletterLifecycleProperties;
  newsletter_signup_submit: NewsletterLifecycleProperties;
  newsletter_signup_success: NewsletterLifecycleProperties;
  newsletter_signup_error: NewsletterLifecycleProperties & {
    error_type: string;
  };
  newsletter_signup_followup_click: NewsletterLifecycleProperties & {
    destination: string;
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

const campaignAttributionKey = "broey-campaign-attribution";
const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export function rememberCampaignAttribution() {
  try {
    const params = new URLSearchParams(window.location.search);
    const values = Object.fromEntries(utmKeys.map(key => [key, params.get(key)?.trim()])
      .filter(([, value]) => Boolean(value)));
    if (Object.keys(values).length) {
      window.sessionStorage.setItem(campaignAttributionKey, JSON.stringify(values));
    }
  } catch { /* Tracking remains optional when storage is unavailable. */ }
}

export function campaignAnalyticsProperties() {
  rememberCampaignAttribution();
  let stored: Record<string, string> = {};
  try {
    const value = JSON.parse(window.sessionStorage.getItem(campaignAttributionKey) ?? "{}");
    stored = Object.fromEntries(utmKeys.filter(key => typeof value?.[key] === "string")
      .map(key => [key, value[key]]));
  } catch { /* Do not let analytics affect navigation or playback. */ }
  return { page_path: window.location.pathname, campaign: onlyUCampaign.campaign, ...stored };
}

export function newsletterAnalyticsProperties(
  sourceSurface: AnalyticsSourceSurface,
): NewsletterLifecycleProperties {
  const searchParams = new URLSearchParams(window.location.search);
  const campaignProperties = Object.fromEntries(
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
      .map((key) => [key, searchParams.get(key)?.trim()] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[1])),
  );

  return {
    source_surface: sourceSurface,
    page_path: window.location.pathname,
    ...campaignProperties,
  };
}

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
      Object.entries({
        ...("release_slug" in properties && properties.release_slug === onlyUCampaign.slug
          ? campaignAnalyticsProperties() : {}),
        ...properties,
      }).filter(([, value]) =>
        typeof value === "number" || typeof value === "boolean" ||
        (typeof value === "string" && value.length > 0),
      ),
    ) as Record<string, string | number | boolean>;

    track(eventName, factualProperties);
  } catch {
    // Analytics must never interfere with the visitor experience.
  }
}
