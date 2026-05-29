import "server-only";

import { getAuth } from "@/lib/auth";

export async function getServerSession(headers: Headers) {
  return getAuth().api.getSession({
    headers,
  });
}
export async function signOutServer(headers: Headers) {
  return getAuth().api.signOut({
    headers,
    returnHeaders: true,
    returnStatus: true,
  });
}
