import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes — always accessible
  const publicPaths = ["/login", "/register", "/api/auth"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (isPublic) return NextResponse.next();

  // Protected routes — require session
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    // Preserve the original URL to redirect back after login
    // loginUrl.searchParams.set("callbackUrl", req.nextUrl.toString()); // Optional
    return NextResponse.redirect(loginUrl);
  }

  // ──────────────────────────────────────────────
  // Onboarding Logic
  // ──────────────────────────────────────────────
  // @ts-expect-error - Next-auth types
  const merchants = req.auth.user?.merchants || [];
  const isOnboardingPage = pathname === "/dashboard/onboarding";
  const hasStores = merchants.length > 0;

  // 1. User has NO stores -> Force them to /dashboard/onboarding
  if (!hasStores && !isOnboardingPage && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/dashboard/onboarding", req.url));
  }

  // 2. User HAS stores -> Prevent them from visiting /dashboard/onboarding (redirect to main dashboard)
  if (hasStores && isOnboardingPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
