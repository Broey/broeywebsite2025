import { NextResponse } from "next/server";
import { siteConfig } from "@/content/site";

type ApiResponse = {
  ok: boolean;
  message: string;
};

type RequestPayload = Record<string, string>;
type TurnstileSiteverifyResponse = {
  success?: boolean;
  "error-codes"?: string[];
};

const emailPattern =
  /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;
const maxNameLength = 120;
const maxSubjectLength = 160;
const maxMessageLength = 5000;
const turnstileVerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const resendApiBaseUrl =
  process.env.RESEND_API_BASE_URL?.trim().replace(/\/+$/, "") ?? "https://api.resend.com";
const contactEmail = siteConfig.contact.email;
const contactProviderMissingMessage = `Message sending is not connected yet. Please email ${contactEmail} or join Discord for the fastest route right now.`;

const trimValue = (value: unknown) => String(value ?? "").trim();

const jsonResponse = (payload: ApiResponse, status: number) =>
  NextResponse.json(payload, { status });

async function readPayload(request: Request): Promise<RequestPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    return Object.fromEntries(
      Object.entries(body).map(([key, value]) => [key, trimValue(value)]),
    );
  }

  const formData = await request.formData();
  const payload: RequestPayload = {};

  formData.forEach((value, key) => {
    if (typeof value === "string") {
      payload[key] = value.trim();
    }
  });

  return payload;
}

const normalizeOptIn = (value: string) =>
  ["1", "true", "yes", "on"].includes(value.toLowerCase()) ? "yes" : "no";

const getResendApiKey = () => process.env.RESEND_API_KEY?.trim() ?? "";

const getContactFromEmail = () => process.env.RESEND_FROM_EMAIL?.trim() ?? "";

const getContactFromName = () => process.env.RESEND_FROM_NAME?.trim() || "Broey Website";

const hasContactEmailConfig = () => Boolean(getResendApiKey() && getContactFromEmail());

const isValidEmail = (email: string) =>
  email.length <= 254 &&
  emailPattern.test(email) &&
  email
    .split("@")
    .every((part) => part.length > 0) &&
  email
    .split("@")
    .at(-1)
    ?.split(".")
    .every((part) => part.length <= 63) === true;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatFrom = (name: string, email: string) => {
  const safeName = name.replace(/[\r\n"]/g, "").trim();

  return safeName ? `${safeName} <${email}>` : email;
};

const buildEmailText = (payload: RequestPayload) =>
  [
    "New contact form message from broey.com",
    "",
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Updates opt-in: ${payload.updatesOptIn}`,
    `Source: ${payload.source}`,
    "",
    "Message:",
    payload.message,
  ].join("\n");

const buildEmailHtml = (payload: RequestPayload) => {
  const safeMessage = escapeHtml(payload.message).replace(/\n/g, "<br />");

  return [
    "<h2>New contact form message from broey.com</h2>",
    "<dl>",
    `<dt>Name</dt><dd>${escapeHtml(payload.name)}</dd>`,
    `<dt>Email</dt><dd>${escapeHtml(payload.email)}</dd>`,
    `<dt>Updates opt-in</dt><dd>${escapeHtml(payload.updatesOptIn)}</dd>`,
    `<dt>Source</dt><dd>${escapeHtml(payload.source)}</dd>`,
    "</dl>",
    "<h3>Message</h3>",
    `<p>${safeMessage}</p>`,
  ].join("");
};

async function verifyTurnstile(payload: RequestPayload, request: Request) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!secretKey) {
    return null;
  }

  const token = trimValue(payload["cf-turnstile-response"] || payload.turnstileToken);

  if (!token) {
    return jsonResponse(
      {
        ok: false,
        message: "Please complete the spam check before sending your message.",
      },
      400,
    );
  }

  const verificationBody = new URLSearchParams({
    secret: secretKey,
    response: token,
  });
  const remoteIp =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (remoteIp) {
    verificationBody.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch(turnstileVerifyUrl, {
      method: "POST",
      body: verificationBody,
      cache: "no-store",
    });
    const result = (await response.json().catch(() => null)) as
      | TurnstileSiteverifyResponse
      | null;

    if (!response.ok || result?.success !== true) {
      return jsonResponse(
        {
          ok: false,
          message: "The spam check did not pass. Please refresh and try again.",
        },
        400,
      );
    }
  } catch {
    return jsonResponse(
      {
        ok: false,
        message: "The spam check could not be reached. Please try again in a bit.",
      },
      502,
    );
  }

  return null;
}

async function forwardToProvider(payload: RequestPayload) {
  const apiKey = getResendApiKey();
  const fromEmail = getContactFromEmail();

  if (!apiKey || !fromEmail) {
    return jsonResponse(
      {
        ok: false,
        message: contactProviderMissingMessage,
      },
      503,
    );
  }

  const subject = payload.subject || "Website contact message";
  const body = {
    from: formatFrom(getContactFromName(), fromEmail),
    to: [contactEmail],
    reply_to: payload.email,
    subject: `[Broey contact] ${subject}`,
    text: buildEmailText(payload),
    html: buildEmailHtml(payload),
  };

  try {
    const response = await fetch(`${resendApiBaseUrl}/emails`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      return jsonResponse(
        {
          ok: false,
          message:
            "The contact provider did not accept the message. Please try again in a bit.",
        },
        502,
      );
    }
  } catch {
    return jsonResponse(
      {
        ok: false,
        message:
          "The contact provider could not be reached. Please try again in a bit.",
      },
      502,
    );
  }

  return jsonResponse(
    {
      ok: true,
      message: "Message sent. Thanks for reaching out.",
    },
    200,
  );
}

export async function POST(request: Request) {
  const payload = await readPayload(request);
  const firstName = trimValue(payload.firstName);
  const lastName = trimValue(payload.lastName);
  const name = trimValue(payload.name || [firstName, lastName].filter(Boolean).join(" "));
  const subject = trimValue(payload.subject || "Website contact message").slice(
    0,
    maxSubjectLength,
  );
  const email = trimValue(payload.email).toLowerCase();
  const message = trimValue(payload.message);
  const updatesOptIn = normalizeOptIn(trimValue(payload.updatesOptIn));
  const source = trimValue(payload.source || "website-contact");
  const website = trimValue(payload.website);

  if (website) {
    return jsonResponse(
      {
        ok: true,
        message: "Message sent. Thanks for reaching out.",
      },
      200,
    );
  }

  if (!name || name.length > maxNameLength) {
    return jsonResponse(
      {
        ok: false,
        message: "Add your name before sending.",
      },
      400,
    );
  }

  if (!email || !isValidEmail(email)) {
    return jsonResponse(
      {
        ok: false,
        message: "Enter a valid email address before sending your message.",
      },
      400,
    );
  }

  if (!message) {
    return jsonResponse(
      {
        ok: false,
        message: "Add a message before sending.",
      },
      400,
    );
  }

  if (message.length > maxMessageLength) {
    return jsonResponse(
      {
        ok: false,
        message: "Keep the message under 5,000 characters.",
      },
      400,
    );
  }

  if (!hasContactEmailConfig()) {
    return jsonResponse(
      {
        ok: false,
        message: contactProviderMissingMessage,
      },
      503,
    );
  }

  const turnstileError = await verifyTurnstile(payload, request);

  if (turnstileError) {
    return turnstileError;
  }

  return forwardToProvider({
    firstName,
    lastName,
    name,
    subject,
    email,
    message,
    updatesOptIn,
    source,
  });
}
