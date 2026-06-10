// /app/api/auth/[...all]/route.ts

import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "@/lib/auth";

export const runtime = "nodejs";

let handler: ReturnType<typeof toNextJsHandler> | undefined;

function getHandler() {
  if (handler) return handler;

  handler = toNextJsHandler(getAuth());
  return handler;
}

export async function GET(request: Request) {
  return getHandler().GET(request);
}

export async function POST(request: Request) {
  return getHandler().POST(request);
}
