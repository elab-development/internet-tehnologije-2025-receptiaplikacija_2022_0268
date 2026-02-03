export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
  const store = await cookies();
  const token = store.get("session")?.value;

  if (!token) {
    return NextResponse.json({ error: "NO_SESSION" }, { status: 401 });
  }

  const session = await prisma.session.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json({ error: "SESSION_EXPIRED" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const oldPassword = typeof body.oldPassword === "string" ? body.oldPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!oldPassword || !newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { passwordHash: true },
  });

  if (!user) {
    return NextResponse.json({ error: "NO_USER" }, { status: 401 });
  }

  const ok = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "WRONG_PASSWORD" }, { status: 400 });
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: session.userId },
    data: { passwordHash: hash },
  });

  return NextResponse.json({ ok: true });
}
