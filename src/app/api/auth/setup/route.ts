import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { isValidClassKey, MAX_STUDENTS, MIN_STUDENTS } from "@/lib/school-data";
import { createSessionToken, sessionCookie } from "@/lib/session";

const NAME_WORD = "[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?";
const NAME_RE = new RegExp(`^${NAME_WORD}( ${NAME_WORD}){1,2}$`);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    classId?: unknown;
    pin?: unknown;
    students?: unknown;
  } | null;

  const classId = typeof body?.classId === "string" ? body.classId : "";
  const pin = typeof body?.pin === "string" ? body.pin : "";

  if (!isValidClassKey(classId)) {
    return NextResponse.json({ error: "Выберите класс из списка" }, { status: 400 });
  }
  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: "Код должен состоять из 6 цифр" }, { status: 400 });
  }

  if (!Array.isArray(body?.students)) {
    return NextResponse.json(
      { error: "Укажите состав класса: фамилию и имя каждого ученика" },
      { status: 400 },
    );
  }

  const students: string[] = [];
  for (const raw of body.students) {
    if (typeof raw !== "string") {
      return NextResponse.json(
        { error: "В составе класса есть пустая или неверная строка" },
        { status: 400 },
      );
    }
    const name = raw.replace(/\s+/g, " ").trim();
    if (!NAME_RE.test(name) || name.length > 60) {
      return NextResponse.json(
        { error: `Неверное имя: «${name.slice(0, 60)}». Формат — Фамилия Имя, например Иванов Артём` },
        { status: 400 },
      );
    }
    students.push(name);
  }

  if (students.length < MIN_STUDENTS || students.length > MAX_STUDENTS) {
    return NextResponse.json(
      { error: `В классе должно быть от ${MIN_STUDENTS} до ${MAX_STUDENTS} учеников, сейчас указано ${students.length}` },
      { status: 400 },
    );
  }

  const seen = new Set<string>();
  for (const name of students) {
    const key = name.toLowerCase();
    if (seen.has(key)) {
      return NextResponse.json({ error: `Ученик указан дважды: ${name}` }, { status: 400 });
    }
    seen.add(key);
  }

  const existing = await db.classAuth.findUnique({ where: { classId }, select: { id: true } });
  if (existing) {
    return NextResponse.json(
      { error: "Код для этого класса уже создан — войдите с ним" },
      { status: 409 },
    );
  }

  const pinHash = await bcrypt.hash(pin, 10);
  await db.$transaction([
    db.classAuth.create({ data: { classId, pinHash } }),
    db.classRoster.create({ data: { classId, students: JSON.stringify(students) } }),
  ]);

  const res = NextResponse.json({ classId, students });
  res.cookies.set(sessionCookie(createSessionToken(classId)));
  return res;
}
