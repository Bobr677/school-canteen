import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidClassKey } from "@/lib/school-data";

export async function GET(request: Request) {
  const classId = new URL(request.url).searchParams.get("classId") ?? "";
  if (!isValidClassKey(classId)) {
    return NextResponse.json({ error: "Неизвестный класс" }, { status: 400 });
  }
  const row = await db.classAuth.findUnique({ where: { classId }, select: { id: true } });
  return NextResponse.json({ registered: Boolean(row) });
}
