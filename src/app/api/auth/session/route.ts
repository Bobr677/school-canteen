import { NextResponse } from "next/server";
import { getSessionClassId } from "@/lib/session";

export async function GET(request: Request) {
  const classId = getSessionClassId(request);
  return NextResponse.json({ classId });
}
