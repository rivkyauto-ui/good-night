import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isPublicPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/join" ||
    pathname.startsWith("/api/");

  const hasAuthCookie = request.cookies.getAll().some(
    (cookie) => cookie.name.startsWith("sb-")
  );

  if (!hasAuthCookie && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasAuthCookie && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
