export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";
import { verifyCsrf } from "@/lib/csrf";

export async function POST(req: Request) {
  if (!(await verifyCsrf(req))) {
    return NextResponse.json(
      { ok: false, error: "CSRF blocked." },
      { status: 403 }
    );
  }

  await deleteSession();

  return NextResponse.json({ ok: true });
}