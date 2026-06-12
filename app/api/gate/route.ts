import { NextRequest, NextResponse } from "next/server";
import {
  createGateCookieValue,
  gateCookieName,
  getSitePasscode,
  isSitePrivate,
  sanitizeGateNext,
} from "@/lib/site-visibility";

export const dynamic = "force-dynamic";

const cookieMaxAge = 60 * 60 * 24 * 14;

async function readGatePayload(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    return {
      passcode: String(body.passcode ?? "").trim(),
      next: sanitizeGateNext(body.next),
    };
  }

  const formData = await request.formData();

  return {
    passcode: String(formData.get("passcode") ?? "").trim(),
    next: sanitizeGateNext(formData.get("next")),
  };
}

function gateRedirect(request: NextRequest, nextPath: string, error?: string) {
  const redirectUrl = new URL("/gate", request.url);

  redirectUrl.searchParams.set("next", sanitizeGateNext(nextPath));

  if (error) {
    redirectUrl.searchParams.set("error", error);
  }

  return NextResponse.redirect(redirectUrl, 303);
}

function isSecureRequest(request: NextRequest) {
  return (
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https"
  );
}

export async function POST(request: NextRequest) {
  const { passcode, next } = await readGatePayload(request);
  const configuredPasscode = getSitePasscode();

  if (!isSitePrivate()) {
    return NextResponse.redirect(new URL(next, request.url), 303);
  }

  if (!configuredPasscode) {
    return gateRedirect(request, next, "missing-config");
  }

  if (passcode !== configuredPasscode) {
    return gateRedirect(request, next, "invalid");
  }

  const response = NextResponse.redirect(new URL(next, request.url), 303);

  response.cookies.set({
    name: gateCookieName,
    value: await createGateCookieValue(configuredPasscode),
    httpOnly: true,
    secure: isSecureRequest(request),
    sameSite: "lax",
    maxAge: cookieMaxAge,
    path: "/",
  });

  return response;
}
