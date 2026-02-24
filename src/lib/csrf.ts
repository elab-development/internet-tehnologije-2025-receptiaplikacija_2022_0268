import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const CSRF_COOKIE = "csrf";

export async function ensureCsrfToken() {
  const store = await cookies(); 
  let token = store.get(CSRF_COOKIE)?.value;

  if (!token) {
    token = randomUUID();
    store.set(CSRF_COOKIE, token, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  return token;
}

export async function verifyCsrf(req: Request) {
  const store = await cookies(); 
  const cookieToken = store.get(CSRF_COOKIE)?.value || "";
  const headerToken = req.headers.get("x-csrf-token") || "";

  return !!cookieToken && cookieToken === headerToken;
}