import { NextRequest, NextResponse } from "next/server";
import { getTokenCookie } from "./lib/cookie";

export default async function proxy(request: NextRequest) {
  const token = await getTokenCookie();

  // Unauthenticated users cannot access protected routes
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/user/:path*", "/workspace/:path*"],
};
