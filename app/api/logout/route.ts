// /app/api/logout/route.ts
import { NextResponse } from "next/server";

import { signOutServer } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const result = await signOutServer(request.headers);

  const redirectResponse = NextResponse.redirect(new URL("/login", request.url));

  result.headers?.forEach((value: string, key: string) => {
    if (key.toLowerCase() === "set-cookie") {
      redirectResponse.headers.append(key, value);
      return;
    }

    redirectResponse.headers.set(key, value);
  });

  return redirectResponse;
}