import "server-only";
import { auth } from "@/auth";

export function getAuth() {
  return auth;
}

