import "server-only";

import { getAuth } from "@/lib/auth";

export async function getServerSession(headers: Headers) {
  return getAuth().api.getSession({
    headers,
  });
}
