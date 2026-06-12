"use client";

import Link from "next/link";
import { type FormEvent, useId, useState } from "react";

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
  action?: string;
  emailFieldName?: string;
  hiddenFields?: Record<string, string>;
};

const defaultCopy: Record<
  EmailSignupVariant,
  Required<Pick<EmailSignupProps, "eyebrow" | "heading" | "body" | "inputPlaceholder" | "buttonLabel" | "finePrint">>
> = {
  panel: {
    eyebrow: "MAILING LIST",
    heading: "Stay close to the music.",
    body: "Get release notes, early links, merch drops, and occasional updates from Broey. No spam. Just the important stuff.",
    inputPlaceholder: "Email address",
    buttonLabel: "Join List",
    finePrint:
      "By signing up, you agree to receive occasional emails from Broey. Unsubscribe anytime.",
  },
  footer: {
    eyebrow: "JOIN THE LIST",
    heading: "Join the list",
    body: "Release notes, early links, merch drops, and occasional updates.",
    inputPlaceholder: "Email address",
    buttonLabel: "Join",
    finePrint: "Unsubscribe anytime.",
  },
};

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
  action,
  emailFieldName = "email",
  hiddenFields = {},
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get(emailFieldName) ?? "").trim();

    if (!email) {
      setStatus({
        tone: "error",
        message: "Enter an email address before joining the list.",
      });
      return;
    }

    if (emailFieldName !== "email") {
      formData.set("email", email);
    }

    if (!formData.get("source")) {
      formData.set("source", signupId);
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
        | EmailSignupStatus & { ok?: boolean }
        | null;
      const message =
        payload?.message ??
        (response.ok
          ? "You are on the list. Thanks for staying close to the music."
          : "Mailing list signup is not connected yet. Please try again soon.");

      setStatus({
        tone: response.ok && payload?.ok !== false ? "success" : response.status === 503 ? "notice" : "error",
        message,
      });

      if (response.ok && payload?.ok !== false) {
        event.currentTarget.reset();
      }
    } catch {
      setStatus({
        tone: "error",
        message: "Mailing list signup could not be reached. Please try again in a bit.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id={signupId}
      className={["email-signup", `email-signup--${variant}`, className]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby={headingId}
    >
      <div className="email-signup-copy">
        <p className="release-detail-section-kicker">{eyebrow ?? copy.eyebrow}</p>
        <h2 id={headingId} className="email-signup-heading">
          {heading ?? copy.heading}
        </h2>
        <p className="email-signup-body">{body ?? copy.body}</p>
      </div>

      <form
        className="email-signup-form"
        action={endpoint}
        method="post"
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
          <button className="email-signup-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Joining..." : (buttonLabel ?? copy.buttonLabel)}
          </button>
        </div>
        <p id={finePrintId} className="email-signup-fine-print">
          {finePrint ?? copy.finePrint}
        </p>
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
    </section>
  );
}
