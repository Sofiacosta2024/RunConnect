import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  const { headers } = await import("next/headers");
  const session = await getAdminSession(await headers());

  return NextResponse.json({ admin: !!session });
}
