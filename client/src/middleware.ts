import { NextRequest, NextResponse } from "next/server";
import { getTokenCookie, getUserData } from "./lib/cookie";

const publicRoutes = ["/login", "/register"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getTokenCookie();
  const user = token ? await getUserData() : null;

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  // Not authenticated → block protected routes
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Authenticated users should not see login/register
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/user/:path*", "/login", "/register", "/workspace:path*"],
};
