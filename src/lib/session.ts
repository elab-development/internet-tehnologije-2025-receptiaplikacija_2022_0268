import { cookies } from "next/headers";

const SESSION_KEY = "session";

export async function createSession(userId: string) {
  const store = await cookies();

  store.set(SESSION_KEY, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, 
  });
}

export async function getSession() {
  const store = await cookies();
  return store.get(SESSION_KEY)?.value ?? null;
}

export async function deleteSession() {
  const store = await cookies();
  store.delete(SESSION_KEY);
}

