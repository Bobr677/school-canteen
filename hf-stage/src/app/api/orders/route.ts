import { NextResponse } from "next/server";
import type { DailyOrder, StudentMark } from "@prisma/client";
import { db } from "@/lib/db";
import { formatMoscowTime, getClass, todayKey } from "@/lib/school-data";
import { getSessionClassId } from "@/lib/session";

interface MarkInput {
  name: string;
  breakfast: boolean;
  lunch: boolean;
}

interface OrderJson {
  classId: string;
  sent: boolean;
  sentAt?: string;
  marks: MarkInput[];
}

function serializeOrder(row: DailyOrder & { marks: StudentMark[] }): OrderJson {
  return {
    classId: row.classId,
    sent: row.sent,
    sentAt: row.sentAt ? formatMoscowTime(row.sentAt) : undefined,
    marks: row.marks.map((m) => ({ name: m.name, breakfast: m.breakfast, lunch: m.lunch })),
  };
}

export async function GET(request: Request) {
  const dateParam = new URL(request.url).searchParams.get("date");
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayKey();

  const rows = await db.dailyOrder.findMany({
    where: { date },
    include: { marks: true },
    orderBy: { classId: "asc" },
  });

  return NextResponse.json({ date, orders: rows.map(serializeOrder) });
}

export async function PUT(request: Request) {
  const classId = getSessionClassId(request);
  if (!classId) {
    return NextResponse.json({ error: "Сначала войдите как староста" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    marks?: unknown;
    sent?: unknown;
  } | null;

  if (!body || !Array.isArray(body.marks)) {
    return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 });
  }
  const sent = body.sent === true;

  const roster = getClass(classId).students;
  const allowed = new Set(roster.map((s) => s.name));
  const provided = new Map<string, { breakfast: boolean; lunch: boolean }>();
  for (const raw of body.marks) {
    if (!raw || typeof raw !== "object") continue;
    const rec = raw as Record<string, unknown>;
    if (typeof rec.name !== "string" || !allowed.has(rec.name)) continue;
    provided.set(rec.name, {
      breakfast: rec.breakfast === true,
      lunch: rec.lunch === true,
    });
  }

  const date = todayKey();
  const order = await db.$transaction(async (tx) => {
    const existing = await tx.dailyOrder.findUnique({
      where: { classId_date: { classId, date } },
    });
    const row =
      existing ?? (await tx.dailyOrder.create({ data: { classId, date, sent } }));

    await tx.studentMark.deleteMany({ where: { orderId: row.id } });
    await tx.studentMark.createMany({
      data: roster.map((s) => {
        const m = provided.get(s.name);
        return {
          orderId: row.id,
          name: s.name,
          breakfast: m?.breakfast ?? false,
          lunch: m?.lunch ?? false,
        };
      }),
    });

    return tx.dailyOrder.update({
      where: { id: row.id },
      data: { sent, sentAt: sent ? new Date() : null },
      include: { marks: true },
    });
  });

  return NextResponse.json({ ok: true, order: serializeOrder(order) });
}
