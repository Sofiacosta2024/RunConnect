import { NextResponse, type NextRequest } from "next/server";

import { getAuth } from "@/lib/auth";

const publicPaths = new Set(["/login", "/registro"]);
const publicPrefixes = ["/api/auth", "/_next", "/favicon.ico"];

function isPublicPath(pathname: string) {
  if (publicPaths.has(pathname)) return true;

  return publicPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (session) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};