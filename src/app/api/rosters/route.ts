import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const rows = await db.classRoster.findMany({ orderBy: { classId: "asc" } });
  return NextResponse.json({
    rosters: rows.map((r) => ({
      classId: r.classId,
      students: JSON.parse(r.students) as string[],
    })),
  });
}
