import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const protectedPaths = ["/cart"];

  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!isProtected) return NextResponse.next();

  const session = req.cookies.get("session")?.value;

  if (!session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";

    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/cart/:path*"],
};
