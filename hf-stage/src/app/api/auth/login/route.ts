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
    return NextResponse.json({ error: "Введите все 6 цифр" }, { status: 400 });
  }

  const row = await db.classAuth.findUnique({ where: { classId } });
  if (!row) {
    return NextResponse.json(
      { error: "Для этого класса ещё нет кода — придумайте его при первом входе" },
      { status: 404 },
    );
  }

  const ok = await bcrypt.compare(pin, row.pinHash);
  if (!ok) {
    return NextResponse.json({ error: "Неверный код" }, { status: 401 });
  }

  const res = NextResponse.json({ classId });
  res.cookies.set(sessionCookie(createSessionToken(classId)));
  return res;
}
