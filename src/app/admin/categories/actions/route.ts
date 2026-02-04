export const runtime = "nodejs";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/authz";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const form = await req.formData();
  const action = String(form.get("action") || "");

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const cookie = req.headers.get("cookie") || "";

  if (action === "create") {
    const name = String(form.get("name") || "").trim();
    if (!name) redirect("/admin/categories");

    await fetch(`${base}/api/admin/categories`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ name }),
      cache: "no-store",
    });

    redirect("/admin/categories");
  }

  if (action === "rename") {
    const id = String(form.get("id") || "");
    const name = String(form.get("name") || "").trim();
    if (!id || !name) redirect("/admin/categories");

    await fetch(`${base}/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ name }),
      cache: "no-store",
    });

    redirect("/admin/categories");
  }

  if (action === "delete") {
    const id = String(form.get("id") || "");
    if (!id) redirect("/admin/categories");

    await fetch(`${base}/api/admin/categories/${id}`, {
      method: "DELETE",
      headers: { cookie },
      cache: "no-store",
    });

    redirect("/admin/categories");
  }

  redirect("/admin/categories");
}
