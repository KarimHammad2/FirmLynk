"use server";

import { clearSessionUserId, setSessionUserId } from "@/lib/auth/session";

export async function setSession(userId: string) {
  await setSessionUserId(userId);
}

export async function clearSession() {
  await clearSessionUserId();
}

