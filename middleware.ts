import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE = "pubg_admin";
const PROTECTED_PREFIXES = ["/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loggedIn = request.cookies.get(ADMIN_COOKIE)?.value === "1";

  if (pathname === "/login") {
    if (loggedIn) {
      return NextResponse.redirect(new URL("/admin/overview", request.url));
    }
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !loggedIn) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin", "/admin/:path*"],
};
