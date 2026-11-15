export const privacyNotice = {
  effectiveDate: "November 14, 2026",
  contactEmail: "broey@broey.net",
  introduction:
    "This notice explains optional browser-local music preferences, aggregate analytics, and the limited information processed when you send a message or intentionally join the mailing list.",
  sections: [
    {
      title: "Privacy-focused analytics",
      paragraphs: [
        "The website uses Umami Cloud to understand aggregate traffic and engagement. It may measure pages viewed, general referral sources, standard campaign parameters, browser and device categories, approximate geographic region where Umami provides it, and anonymous events such as music playback, streaming-link clicks, release and genre activity, merchandise and press clicks, and successful newsletter or Contact submissions.",
        "We may measure whether music recommendations were visible, whether visitors opened suggested releases, and whether recommendations led to on-site playback, using basic release and interaction metadata. Aggregate events may indicate that personalization was enabled or disabled, or that a recommendation was adjusted. Your locally stored music preferences and recently played history are not sent to Umami.",
        "Names, email addresses, Contact subjects, message contents, newsletter form contents, subscriber identifiers, and provider responses are not sent to Umami. The current analytics implementation does not use advertising or behavioral-tracking cookies, persistent visitor identifiers, cross-site tracking, fingerprinting, or Umami identify features.",
        "Analytics may be unavailable when blocked by a browser or network tool; the rest of the website continues to work normally.",
      ],
    },
    {
      title: "Optional music personalization on this device",
      paragraphs: [
        "Personalization is off by default. You can enable it using Discover your sound on the homepage or the Personalize switch on the Music page. Manage preferences provides details and a reset control. After you enable it, explicit genre filter choices and successful on-site playback you intentionally start or select can build broad genre-interest scores and a short recent-release history. Automatic queue continuation, recommendation impressions, playback position and seeks, and outbound streaming clicks do not build these preferences. We do not measure confirmed listening on other services.",
        "Preferences use localStorage in this browser only: a schema version, enabled status, broad genre scores, public release slugs, and coarse dates for decay, ordering and expiration. There are no listener identifiers, accounts, server-side profiles, or cross-device synchronization. No music preferences are saved before you opt in. Storage blocked by your browser leaves ordinary discovery available.",
        "Music preferences expire after 90 days without activity. Individual stored genre scores and recent releases are removed after 90 days without a corresponding update, when the site next reads them. Scores also decay over time; the recent list holds at most 12 releases. Pick up where you left off displays one eligible recent release distinct from the featured release. Dates are stored by day, not as precise playback timelines.",
        "Choosing Not now, closing the homepage welcome popup, or pressing Escape only dismisses the invitation; it does not enable personalization or infer music preferences. The broey-discovery-invitation-dismissed localStorage key holds only an expiration time, for up to 30 days across browser restarts. It is deleted when next checked after expiry or when you enable from the invitation; you can also remove it in browser settings. It contains no visitor identifier or listening activity and is not sent to analytics. If storage is unavailable, dismissal lasts in memory during navigation, up to the same 30-day limit.",
        "On the Music page, switching personalization Off stops collection and removes the stored music preference profile. Clear music preferences resets the scores and recent list while keeping personalization enabled. These controls do not change audio volume, unrelated browser settings, cookies, or analytics-provider records. You can also remove this site's local storage in your browser settings; removal there is needed if the browser blocks the site's deletion request. Browser-local personalization is separate from the aggregate Umami analytics described above.",
      ],
    },
    {
      title: "Contact messages",
      paragraphs: [
        "The Contact form may collect your first name, last name, email address, subject, message, form source or page context, and basic request information used for abuse prevention and website security.",
        "This information is used to receive, review, and respond to inquiries; protect the website and form providers against spam and abuse; and maintain website reliability and security. Resend processes and delivers Contact-form messages.",
        "Submitting the Contact form does not subscribe you to marketing emails.",
      ],
    },
    {
      title: "Newsletter subscriptions",
      paragraphs: [
        "The newsletter form may collect your email address, form source or page context, and basic request information used for abuse prevention and website security.",
        "This information is used to add you to the Broey mailing list after an intentional submission, send music, release, merchandise, event, and other Broey-related updates, and protect the mailing list from spam and abuse. MailerLite processes and manages subscriptions, subscriber status, and unsubscribe activity.",
        "You can unsubscribe using the link in a marketing email or contact the privacy address below for assistance.",
      ],
    },
    {
      title: "Abuse prevention and hosting",
      paragraphs: [
        "Cloudflare Turnstile may process browser, device, request, and network signals to distinguish legitimate submissions from abuse.",
        "DigitalOcean may process request, network, security, and operational information needed to deliver and protect the website through its App Platform hosting service.",
      ],
    },
    {
      title: "Retention, requests, and deletion",
      paragraphs: [
        "Except for the browser-local music preferences described above, information is retained only as reasonably necessary to respond to inquiries, operate requested subscriptions, maintain appropriate records, prevent abuse, and support website security and reliability. No fixed retention period is promised for those other categories.",
        "Privacy questions and deletion requests may be sent to the address below. Reasonable requests will be reviewed and handled subject to operational, security, and legal requirements; provider backups and necessary security records may not be deleted immediately.",
      ],
    },
  ],
} as const;
