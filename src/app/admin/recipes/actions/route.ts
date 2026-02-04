export const runtime = "nodejs";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/authz";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const form = await req.formData();
  const recipeId = String(form.get("recipeId") || "");
  const action = String(form.get("action") || "");

  if (!recipeId || action !== "delete") redirect("/admin/recipes");

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const cookie = req.headers.get("cookie") || "";

  await fetch(`${base}/api/admin/recipes/${recipeId}`, {
    method: "DELETE",
    headers: { cookie },
    cache: "no-store",
  });

  redirect("/admin/recipes");
}
