import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

process.env.NODE_ENV = "development";
delete process.env.NEXT_PUBLIC_SITE_URL;

const { joinPageMetadata, staticSitemapRoutes } = await import(
  "../content/page-metadata.ts"
);
const { createPageMetadata } = await import("../content/seo.ts");
const { newsletterAnalyticsProperties, trackEvent } = await import(
  "../lib/analytics.ts"
);

test("join page is noindex/follow, canonical, and excluded from the sitemap", () => {
  const metadata = createPageMetadata(joinPageMetadata);

  assert.deepEqual(metadata.robots, { index: false, follow: true });
  assert.equal(metadata.alternates?.canonical, "http://localhost:3000/join");
  assert.equal(metadata.openGraph?.url, "http://localhost:3000/join");
  assert.equal(staticSitemapRoutes.includes("/join"), false);
});

test("join page reuses the production signup route and tracks its requested lifecycle", async () => {
  const [pageSource, signupSource, analyticsSource] = await Promise.all([
    fs.readFile(new URL("../app/join/page.tsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../components/sections/EmailSignup.tsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../lib/analytics.ts", import.meta.url), "utf8"),
  ]);

  assert.match(pageSource, /<EmailSignup/);
  assert.match(pageSource, /sourceSurface="join"/);
  assert.match(pageSource, /successActions=\{\[/);
  assert.match(pageSource, /href: "\/music"/);
  assert.match(pageSource, /EXPLORE THE MUSIC/);
  assert.match(pageSource, /trackLifecycleEvents/);
  assert.match(signupSource, /action \?\? "\/api\/newsletter"/);
  assert.match(signupSource, /submissionLockRef/);
  assert.match(analyticsSource, /join_page_view/);
  assert.match(analyticsSource, /newsletter_signup_submit/);
  assert.match(analyticsSource, /newsletter_signup_success/);
  assert.match(analyticsSource, /newsletter_signup_error/);
  assert.match(analyticsSource, /newsletter_signup_followup_click/);
});

test("join analytics retain campaign attribution without affecting the form", () => {
  let capturedEvent;

  globalThis.window = {
    location: {
      pathname: "/join",
      search: "?utm_source=instagram&utm_medium=social&utm_campaign=release&utm_content=bio",
    },
    umami: {
      track(eventName, properties) {
        capturedEvent = { eventName, properties };
      },
    },
  };

  const properties = newsletterAnalyticsProperties("join");
  trackEvent("join_page_view", properties);

  assert.deepEqual(capturedEvent, {
    eventName: "join_page_view",
    properties: {
      source_surface: "join",
      page_path: "/join",
      utm_source: "instagram",
      utm_medium: "social",
      utm_campaign: "release",
      utm_content: "bio",
    },
  });

  delete globalThis.window;
});
