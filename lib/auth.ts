import "server-only";

import { getAuth as _getAuth } from "@/auth";

export function getAuth() {
  return _getAuth();
}
