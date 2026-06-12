import { NextResponse } from "next/server";

type ApiResponse = {
  ok: boolean;
  message: string;
};

type RequestPayload = Record<string, string>;

const mailerLiteBaseUrl =
  process.env.MAILERLITE_API_BASE_URL?.trim().replace(/\/+$/, "") ??
  "https://connect.mailerlite.com/api";
const emailPattern =
  /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;

const trimValue = (value: unknown) => String(value ?? "").trim();

const jsonResponse = (payload: ApiResponse, status: number) =>
  NextResponse.json(payload, { status });

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

async function forwardToProvider(payload: RequestPayload) {
  const apiKey = process.env.MAILERLITE_API_KEY?.trim();
  const groupId = process.env.MAILERLITE_GROUP_ID?.trim();

  if (!apiKey || !groupId) {
    return jsonResponse(
      {
        ok: false,
        message:
          "Mailing list signup is not connected yet. Please try again soon or join Discord for updates.",
      },
      503,
    );
  }

  const body = {
    email: payload.email,
    groups: [groupId],
  };

  try {
    const response = await fetch(`${mailerLiteBaseUrl}/subscribers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (response.status === 200 || response.status === 201) {
      return jsonResponse(
        {
          ok: true,
          message: "You are on the list. Thanks for staying close to the music.",
        },
        200,
      );
    }

    if (response.status === 422) {
      return jsonResponse(
        {
          ok: false,
          message: "Enter a valid email address before joining the list.",
        },
        400,
      );
    }

    return jsonResponse(
      {
        ok: false,
        message:
          "The mailing list provider did not accept the signup. Please try again in a bit.",
      },
      502,
    );
  } catch {
    return jsonResponse(
      {
        ok: false,
        message:
          "The mailing list provider could not be reached. Please try again in a bit.",
      },
      502,
    );
  }
}

export async function POST(request: Request) {
  const payload = await readPayload(request);
  const email = trimValue(payload.email).toLowerCase();
  const website = trimValue(payload.website);

  if (website) {
    return jsonResponse(
      {
        ok: true,
        message: "Thanks for joining the list.",
      },
      200,
    );
  }

  if (!email || !isValidEmail(email)) {
    return jsonResponse(
      {
        ok: false,
        message: "Enter a valid email address before joining the list.",
      },
      400,
    );
  }

  return forwardToProvider({
    email,
  });
}
