"use client";

import Script from "next/script";
import { type FormEvent, useState } from "react";
import { siteConfig } from "@/content/site";

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const name = [firstName, lastName].filter(Boolean).join(" ");
    const email = String(formData.get("email") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    if (!name) {
      setStatus({
        tone: "error",
        message: "Add your name before sending.",
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

    formData.set("source", "contact-page");
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
      const messageText =
        payload?.message ??
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
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form
        className="contact-form"
        action="/api/contact"
        method="post"
        aria-describedby={`contact-form-note${status ? " contact-form-status" : ""}`}
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
        {turnstileSiteKey ? (
          <>
            <Script
              src="https://challenges.cloudflare.com/turnstile/v0/api.js"
              strategy="afterInteractive"
            />
            <div
              className="contact-form-turnstile cf-turnstile"
              data-sitekey={turnstileSiteKey}
              data-theme="dark"
            />
          </>
        ) : null}
        <div className="contact-form-grid">
          <label className="contact-form-label">
            <span>First name</span>
            <input name="firstName" type="text" autoComplete="given-name" required />
          </label>
          <label className="contact-form-label">
            <span>Last name</span>
            <input name="lastName" type="text" autoComplete="family-name" />
          </label>
          <label className="contact-form-label contact-form-label-wide">
            <span>Email</span>
            <input name="email" type="email" inputMode="email" autoComplete="email" required />
          </label>
          <label className="contact-form-label contact-form-label-wide">
            <span>Message</span>
            <textarea name="message" rows={7} required />
          </label>
        </div>
        <label className="contact-form-checkbox">
          <input name="updatesOptIn" type="checkbox" value="yes" />
          <span>Send me occasional Broey updates, release notes, and merch drops.</span>
        </label>
        <button type="submit" className="contact-form-button" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Inquiry"}
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
