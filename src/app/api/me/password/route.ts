export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { verifyCsrf } from "@/lib/csrf";

export async function PUT(req: Request) {
  if (!(await verifyCsrf(req))) {
    return NextResponse.json({ ok: false, error: "CSRF blocked." }, { status: 403 });
  }

  const store = await cookies();
  const token = store.get("session")?.value;

  if (!token) {
    return NextResponse.json({ ok: false, error: "NO_SESSION" }, { status: 401 });
  }

  const session = await prisma.session.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json({ ok: false, error: "SESSION_EXPIRED" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const oldPassword = typeof body.oldPassword === "string" ? body.oldPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!oldPassword || !newPassword || newPassword.length < 8 || newPassword.length > 200) {
    return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { passwordHash: true, isBlocked: true },
  });

  if (!user || user.isBlocked) {
    return NextResponse.json({ ok: false, error: "NO_USER" }, { status: 401 });
  }

  const ok = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "WRONG_PASSWORD" }, { status: 400 });
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: { id: session.userId },
      data: { passwordHash: hash },
    });

    if (updated.count === 0) throw new Error("NO_USER");

    await tx.session.deleteMany({ where: { userId: session.userId } });
  });

  return NextResponse.json({ ok: true });
}