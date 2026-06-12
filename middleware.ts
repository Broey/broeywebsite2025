import { NextRequest, NextResponse } from "next/server";
import {
  gateCookieName,
  isSitePrivate,
  isValidGateCookie,
  sanitizeGateNext,
} from "@/lib/site-visibility";

const gatePath = "/gate";

export async function middleware(request: NextRequest) {
  if (!isSitePrivate()) {
    return NextResponse.next();
  }

  if (
    request.nextUrl.pathname === gatePath ||
    request.nextUrl.pathname.startsWith(`${gatePath}/`)
  ) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(gateCookieName)?.value;

  if (await isValidGateCookie(cookieValue)) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  const requestedPath = sanitizeGateNext(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  redirectUrl.pathname = gatePath;
  redirectUrl.search = "";
  redirectUrl.searchParams.set("next", requestedPath);

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_next/data|assets|images|favicon.ico|robots.txt|.*\\..*).*)",
  ],
};
