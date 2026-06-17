import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/register", "/verify-email", "/forgot-password", "/reset-password", "/"];

const ROLE_HOME: Record<string, string> = {
  PATIENT: "/dashboard",
  DOCTOR: "/provider/dashboard",
  ADMIN: "/admin/dashboard",
  STAFF: "/provider/dashboard",
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;

  const isPublic = PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );

  // Unauthenticated user hitting a protected route → login
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Authenticated user hitting an auth page → their home
  if (token && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
