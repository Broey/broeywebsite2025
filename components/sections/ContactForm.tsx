"use client";

import Link from "next/link";
import { type FormEvent, useRef, useState } from "react";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/components/forms/TurnstileWidget";
import { siteConfig } from "@/content/site";
import { rateLimitMessage } from "@/lib/form-client";

type ContactFormStatus = {
  tone: "notice" | "success" | "error";
  message: string;
};

type ContactApiResponse = {
  ok: boolean;
  message: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
const providerFallbackMessage = `Message sending is not connected yet. Please email ${siteConfig.contact.email} or join Discord for the fastest route right now.`;

export function ContactForm() {
  const [status, setStatus] = useState<ContactFormStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileActive, setTurnstileActive] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    if (!firstName) {
      setStatus({
        tone: "error",
        message: "Add your first name before sending.",
      });
      return;
    }

    if (!lastName) {
      setStatus({
        tone: "error",
        message: "Add your last name before sending.",
      });
      return;
    }

    if (!email || !emailPattern.test(email)) {
      setStatus({
        tone: "error",
        message: "Enter a valid email address before sending your message.",
      });
      return;
    }

    if (!message) {
      setStatus({
        tone: "error",
        message: "Add a message before sending.",
      });
      return;
    }

    if (turnstileSiteKey && !turnstileToken) {
      setTurnstileActive(true);
      setStatus({
        tone: "error",
        message: "Complete the verification before sending your message.",
      });
      return;
    }

    formData.set("source", "contact-page");
    if (turnstileToken) {
      formData.set("turnstileToken", turnstileToken);
    }
    setIsSubmitting(true);
    setStatus({
      tone: "notice",
      message: "Sending your message...",
    });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as ContactApiResponse | null;
      const messageText = response.status === 429
        ? rateLimitMessage(response.headers.get("Retry-After"))
        : payload?.message ??
          (response.ok
            ? "Message sent. Thanks for reaching out."
            : providerFallbackMessage);

      setStatus({
        tone: response.ok && payload?.ok !== false ? "success" : response.status === 503 ? "notice" : "error",
        message: messageText,
      });

      if (response.ok && payload?.ok !== false) {
        form.reset();
      }
    } catch {
      setStatus({
        tone: "error",
        message: `Message sending could not be reached. Please email ${siteConfig.contact.email} or try again in a bit.`,
      });
    } finally {
      turnstileRef.current?.reset();
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form
        className="contact-form"
        action="/api/contact"
        method="post"
        aria-describedby={`contact-form-required-note contact-form-note contact-form-privacy${status ? " contact-form-status" : ""}`}
        onFocusCapture={() => setTurnstileActive(true)}
        onChange={() => setTurnstileActive(true)}
        onSubmit={handleSubmit}
      >
        <input
          className="sr-only"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <p id="contact-form-required-note" className="contact-form-required-note">
          All fields are required.
        </p>
        <div className="contact-form-grid">
          <label className="contact-form-label">
            <span>First name (required)</span>
            <input
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              aria-required="true"
            />
          </label>
          <label className="contact-form-label">
            <span>Last name (required)</span>
            <input
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              aria-required="true"
            />
          </label>
          <label className="contact-form-label contact-form-label-wide">
            <span>Email (required)</span>
            <input
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              aria-required="true"
            />
          </label>
          <label className="contact-form-label contact-form-label-wide">
            <span>Message (required)</span>
            <textarea name="message" rows={7} required aria-required="true" />
          </label>
        </div>
        <p id="contact-form-privacy" className="contact-form-disclosure">
          Messages are processed to respond to your inquiry. See the{" "}
          <Link href="/privacy">Privacy Notice</Link>.
        </p>
        <TurnstileWidget
          ref={turnstileRef}
          active={turnstileActive}
          siteKey={turnstileSiteKey}
          onTokenChange={setTurnstileToken}
        />
        <button type="submit" className="contact-form-button button-primary cta-primary" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Note"}
        </button>
      </form>
      <p id="contact-form-note" className="contact-form-note">
        Direct, human, and specific is best.
      </p>
      {status ? (
        <p
          id="contact-form-status"
          className="contact-form-status"
          data-tone={status.tone}
          role="status"
          aria-live="polite"
        >
          {status.message}
        </p>
      ) : null}
    </>
  );
}
