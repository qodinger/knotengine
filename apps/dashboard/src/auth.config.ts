import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes — always accessible
  const publicPaths = ["/login", "/register", "/api/auth", "/sw.js", "/api/sw"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (isPublic) return NextResponse.next();

  // Protected routes — require session
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
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
     * - service worker
     */
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|api/sw|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
