"use client";

import { useEffect } from "react";
import { newsletterAnalyticsProperties, trackEvent } from "@/lib/analytics";

export function JoinPageView() {
  useEffect(() => {
    trackEvent("join_page_view", newsletterAnalyticsProperties("join"));
  }, []);

  return null;
}
