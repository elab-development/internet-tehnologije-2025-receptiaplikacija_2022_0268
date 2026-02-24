import { NextResponse } from "next/server";
import { ensureCsrfToken } from "@/lib/csrf";

export async function GET() {
  const token = ensureCsrfToken();
  return NextResponse.json({ csrfToken: token });
}