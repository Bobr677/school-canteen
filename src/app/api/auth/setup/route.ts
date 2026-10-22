import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { isValidClassKey } from "@/lib/school-data";
import { createSessionToken, sessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    classId?: unknown;
    pin?: unknown;
  } | null;

  const classId = typeof body?.classId === "string" ? body.classId : "";
  const pin = typeof body?.pin === "string" ? body.pin : "";

  if (!isValidClassKey(classId)) {
    return NextResponse.json({ error: "Выберите класс из списка" }, { status: 400 });
  }
  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: "Код должен состоять из 6 цифр" }, { status: 400 });
  }

  const existing = await db.classAuth.findUnique({ where: { classId }, select: { id: true } });
  if (existing) {
    return NextResponse.json(
      { error: "Код для этого класса уже создан — войдите с ним" },
      { status: 409 },
    );
  }

  const pinHash = await bcrypt.hash(pin, 10);
  await db.classAuth.create({ data: { classId, pinHash } });

  const res = NextResponse.json({ classId });
  res.cookies.set(sessionCookie(createSessionToken(classId)));
  return res;
}
