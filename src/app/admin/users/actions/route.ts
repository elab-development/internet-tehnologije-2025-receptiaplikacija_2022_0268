export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/authz";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const form = await req.formData();
  const userId = String(form.get("userId") || "");
  const action = String(form.get("action") || "");

  const back = NextResponse.redirect(new URL("/admin/users", req.url));

  if (!userId) return back;

  const base = new URL(req.url).origin;
  const cookie = req.headers.get("cookie") || "";

  let url = "";
  let method: "PATCH" | "DELETE" = "PATCH";

  if (action === "block") {
    url = `${base}/api/admin/users/${userId}/block`;
    method = "PATCH";
  } else if (action === "reactivate") {
    url = `${base}/api/admin/users/${userId}/reactivate`;
    method = "PATCH";
  } else if (action === "delete") {
    url = `${base}/api/admin/users/${userId}`;
    method = "DELETE";
  } else {
    return back;
  }

  const res = await fetch(url, {
    method,
    headers: { cookie },
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    console.error("ADMIN USERS ACTION FAILED", res.status, data);
  }

  return back;
}
