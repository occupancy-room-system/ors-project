import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that are always public (no auth required)
const PUBLIC_PATHS = ["/auth/login", "/auth/register", "/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public auth routes, Next.js internals, and static files
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for auth token stored in cookies (set during login)
  const token = request.cookies.get("ors_token")?.value;

  // If no token found, redirect to login
  if (!token) {
    const loginUrl = new URL("/auth/login", request.url);
    // Preserve intended destination so we can redirect after login
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)",
  ],
};
