export const privacyNotice = {
  effectiveDate: "August 6, 2026",
  contactEmail: "broey@broey.net",
  introduction:
    "This notice explains the limited information the Broey website may process for aggregate analytics, when you send a message, or when you intentionally join the mailing list.",
  sections: [
    {
      title: "Privacy-focused analytics",
      paragraphs: [
        "The website uses Umami Cloud to understand aggregate traffic and engagement. It may measure pages viewed, general referral sources, standard campaign parameters, browser and device categories, approximate geographic region where Umami provides it, and anonymous events such as music playback, streaming-link clicks, release and genre activity, merchandise and press clicks, and successful newsletter or Contact submissions.",
        "Names, email addresses, Contact subjects, message contents, newsletter form contents, subscriber identifiers, and provider responses are not sent to Umami. The current analytics implementation does not use advertising or behavioral-tracking cookies, persistent visitor identifiers, cross-site tracking, fingerprinting, or Umami identify features.",
        "Analytics may be unavailable when blocked by a browser or network tool; the rest of the website continues to work normally.",
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
        "The selected hosting provider may process request, network, security, and operational information needed to deliver and protect the website. The permanent production-hosting provider has not yet been selected.",
      ],
    },
    {
      title: "Retention, requests, and deletion",
      paragraphs: [
        "Information is retained only as reasonably necessary to respond to inquiries, operate requested subscriptions, maintain appropriate records, prevent abuse, and support website security and reliability. No fixed retention period is promised.",
        "Privacy questions and deletion requests may be sent to the address below. Reasonable requests will be reviewed and handled subject to operational, security, and legal requirements; provider backups and necessary security records may not be deleted immediately.",
      ],
    },
  ],
} as const;
