"use client";

import { createAuthClient } from "better-auth/react";

export function getAuthClient() {
  return createAuthClient();
}