"use client";

import Link from "next/link";
import { type FormEvent, useId, useRef, useState } from "react";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/components/forms/TurnstileWidget";
import { rateLimitMessage } from "@/lib/form-client";
import {
  isAnalyticsConversionSuccess,
  newsletterAnalyticsProperties,
  trackEvent,
  type AnalyticsSourceSurface,
} from "@/lib/analytics";

type EmailSignupStatus = {
  tone: "notice" | "success" | "error";
  message: string;
};

type EmailSignupVariant = "panel" | "footer";

type EmailSignupAction = {
  href: string;
  label: string;
};

type EmailSignupProps = {
  id?: string;
  className?: string;
  variant?: EmailSignupVariant;
  eyebrow?: string;
  heading?: string;
  body?: string;
  inputPlaceholder?: string;
  buttonLabel?: string;
  finePrint?: string;
  secondaryActions?: EmailSignupAction[];
  successActions?: EmailSignupAction[];
  action?: string;
  emailFieldName?: string;
  hiddenFields?: Record<string, string>;
  sourceSurface?: AnalyticsSourceSurface;
  headingAs?: "h1" | "h2";
  trackLifecycleEvents?: boolean;
};

const defaultCopy: Record<
  EmailSignupVariant,
  Required<Pick<EmailSignupProps, "eyebrow" | "heading" | "body" | "inputPlaceholder" | "buttonLabel" | "finePrint">>
> = {
  panel: {
    eyebrow: "MAILING LIST",
    heading: "Get drop notes.",
    body: "New tracks, first links, merch drops, and occasional notes from Broey. No spam.",
    inputPlaceholder: "Email address",
    buttonLabel: "Join List",
    finePrint:
      "By subscribing, you agree to receive Broey updates. You can unsubscribe at any time.",
  },
  footer: {
    eyebrow: "JOIN THE LIST",
    heading: "Join the list",
    body: "New tracks, first links, merch drops, and occasional notes.",
    inputPlaceholder: "Email address",
    buttonLabel: "Join",
    finePrint: "By subscribing, you agree to receive Broey updates. You can unsubscribe at any time.",
  },
};
const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

export function EmailSignup({
  id,
  className,
  variant = "panel",
  eyebrow,
  heading,
  body,
  inputPlaceholder,
  buttonLabel,
  finePrint,
  secondaryActions = [],
  successActions = [],
  action,
  emailFieldName = "email",
  hiddenFields = {},
  sourceSurface = variant === "footer" ? "footer" : "home",
  headingAs: Heading = "h2",
  trackLifecycleEvents = false,
}: EmailSignupProps) {
  const copy = defaultCopy[variant];
  const reactId = useId().replace(/:/g, "");
  const signupId = id ?? `email-signup-${reactId}`;
  const headingId = `${signupId}-title`;
  const finePrintId = `${signupId}-fine-print`;
  const statusId = `${signupId}-status`;
  const endpoint = (action ?? "/api/newsletter").trim();
  const [status, setStatus] = useState<EmailSignupStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileActive, setTurnstileActive] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const submissionLockRef = useRef(false);
  const isComplete = status?.tone === "success" && successActions.length > 0;

  const trackLifecycle = (
    eventName:
      | "newsletter_signup_submit"
      | "newsletter_signup_success"
      | "newsletter_signup_error",
    errorType?: string,
  ) => {
    if (!trackLifecycleEvents) {
      return;
    }

    const properties = newsletterAnalyticsProperties(sourceSurface);

    if (eventName === "newsletter_signup_error") {
      trackEvent(eventName, {
        ...properties,
        error_type: errorType ?? "unknown",
      });
      return;
    }

    trackEvent(eventName, properties);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submissionLockRef.current) {
      return;
    }

    submissionLockRef.current = true;
    trackLifecycle("newsletter_signup_submit");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get(emailFieldName) ?? "").trim();

    if (!email) {
      setStatus({
        tone: "error",
        message: "Enter an email address before joining the list.",
      });
      trackLifecycle("newsletter_signup_error", "missing_email");
      submissionLockRef.current = false;
      return;
    }

    if (turnstileSiteKey && !turnstileToken) {
      setTurnstileActive(true);
      setStatus({
        tone: "error",
        message: "Complete the verification before joining the list.",
      });
      trackLifecycle("newsletter_signup_error", "verification_required");
      submissionLockRef.current = false;
      return;
    }

    if (emailFieldName !== "email") {
      formData.set("email", email);
    }

    if (!formData.get("source")) {
      formData.set("source", signupId);
    }

    if (turnstileToken) {
      formData.set("turnstileToken", turnstileToken);
    }

    setIsSubmitting(true);
    setStatus({
      tone: "notice",
      message: "Joining the list...",
    });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as
        | EmailSignupStatus & { ok?: boolean; analyticsEligible?: boolean }
        | null;
      const message = response.status === 429
        ? rateLimitMessage(response.headers.get("Retry-After"))
        : payload?.message ??
          (response.ok
            ? "You are on the list. Thanks for joining."
            : "Mailing list signup is not connected yet. Please try again soon.");

      setStatus({
        tone: response.ok && payload?.ok !== false ? "success" : response.status === 503 ? "notice" : "error",
        message,
      });

      if (isAnalyticsConversionSuccess(response.ok, payload)) {
        trackEvent("newsletter_signup", {
          source_surface: sourceSurface,
          page_path: window.location.pathname,
        });
        trackLifecycle("newsletter_signup_success");
      } else {
        trackLifecycle("newsletter_signup_error", `http_${response.status}`);
      }

      if (response.ok && payload?.ok !== false) {
        form.reset();
      }
    } catch {
      setStatus({
        tone: "error",
        message: "Mailing list signup could not be reached. Please try again in a bit.",
      });
      trackLifecycle("newsletter_signup_error", "network");
    } finally {
      turnstileRef.current?.reset();
      setIsSubmitting(false);
      submissionLockRef.current = false;
    }
  };

  return (
    <section
      id={signupId}
      className={["email-signup", `email-signup--${variant}`, className]
        .filter(Boolean)
        .join(" ")}
      data-state={isComplete ? "complete" : "ready"}
      aria-label={isComplete ? "Mailing list signup complete" : undefined}
      aria-labelledby={isComplete ? undefined : headingId}
    >
      {isComplete ? (
        <div
          id={statusId}
          className="email-signup-complete"
          role="status"
          aria-live="polite"
        >
          <p className="release-detail-section-kicker email-signup-complete-kicker">
            SIGNUP COMPLETE
          </p>
          <p className="email-signup-complete-message">{status.message}</p>
          <div className="email-signup-action-row email-signup-success-action-row">
            {successActions.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className="email-signup-secondary-action email-signup-success-action"
                onClick={() => {
                  if (trackLifecycleEvents) {
                    trackEvent("newsletter_signup_followup_click", {
                      ...newsletterAnalyticsProperties(sourceSurface),
                      destination: item.href,
                    });
                  }
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="email-signup-copy">
            <p className="release-detail-section-kicker">{eyebrow ?? copy.eyebrow}</p>
            <Heading id={headingId} className="email-signup-heading">
              {heading ?? copy.heading}
            </Heading>
            <p className="email-signup-body">{body ?? copy.body}</p>
          </div>

          <form
            className="email-signup-form"
            action={endpoint}
            method="post"
            onFocusCapture={() => setTurnstileActive(true)}
            onChange={() => setTurnstileActive(true)}
            onSubmit={handleSubmit}
          >
        {Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <input
          className="sr-only"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <div className="email-signup-field-row">
          <label className="sr-only" htmlFor={`${signupId}-email`}>
            Email address
          </label>
          <input
            id={`${signupId}-email`}
            className="email-signup-input"
            name={emailFieldName}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={inputPlaceholder ?? copy.inputPlaceholder}
            aria-describedby={`${finePrintId}${status ? ` ${statusId}` : ""}`}
            required
          />
          <button className="email-signup-button button-primary cta-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Joining..." : (buttonLabel ?? copy.buttonLabel)}
          </button>
        </div>
        <p id={finePrintId} className="email-signup-fine-print">
          {finePrint ?? copy.finePrint} See the <Link href="/privacy">Privacy Notice</Link>.
        </p>
        <TurnstileWidget
          ref={turnstileRef}
          active={turnstileActive}
          siteKey={turnstileSiteKey}
          onTokenChange={setTurnstileToken}
        />
        {status ? (
          <p
            id={statusId}
            className="email-signup-status"
            data-tone={status.tone}
            role="status"
            aria-live="polite"
          >
            {status.message}
          </p>
        ) : null}
        {secondaryActions.length ? (
          <div className="email-signup-action-row">
            {secondaryActions.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className="email-signup-secondary-action"
              >
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
          </form>
        </>
      )}
    </section>
  );
}
