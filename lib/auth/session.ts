import { cookies } from "next/headers";
import { getUserById } from "@/lib/repositories/users";

const COOKIE_KEY = "firmlynk_user";

export async function getSessionUserId() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_KEY)?.value;
}

export async function getSessionUser() {
  const userId = await getSessionUserId();
  if (!userId) return undefined;
  return getUserById(userId);
}

export async function setSessionUserId(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_KEY, userId, {
    httpOnly: false,
    path: "/",
  });
}

export async function clearSessionUserId() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_KEY);
}

