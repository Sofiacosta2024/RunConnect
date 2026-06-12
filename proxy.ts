import { NextResponse, type NextRequest } from "next/server";

import { getServerSession } from "@/lib/auth-server";

const publicPaths = new Set(["/login", "/registro", "/api/auth"]);
const publicPrefixes = ["/api/auth", "/api/logout", "/_next", "/favicon.ico"];

function isPublicPath(pathname: string) {
  if (publicPaths.has(pathname)) return true;
  //return true;
  return publicPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (process.env.DB_MODE === "sqlite" && pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const session = await getServerSession(request.headers);

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