import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

function jakartaNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
}

function buildDate(date: string) {
  const now = jakartaNow();
  const selected = new Date(`${date}T00:00:00`);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (selected.getTime() === today.getTime()) return now;

  selected.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
  return selected;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "ADMIN" && role !== "LEADER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { projectId, workerIds, halfDayIds, date } = await req.json();
    if (!projectId || !Array.isArray(workerIds) || workerIds.length === 0) {
      return NextResponse.json({ error: "Pilih pekerja dulu" }, { status: 400 });
    }

    const halfSet = new Set(Array.isArray(halfDayIds) ? halfDayIds : []);
    const datetime = date ? buildDate(date) : jakartaNow();
    const start = new Date(datetime);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    let saved = 0;
    for (const workerId of workerIds) {
      const exists = await prisma.attendance.findFirst({
        where: {
          projectId,
          workerId,
          type: "MASUK",
          datetime: { gte: start, lt: end },
        },
      });
      if (exists) continue;

      const isHalfDay = halfSet.has(workerId);

      await prisma.attendance.create({
        data: {
          projectId,
          workerId,
          type: "MASUK",
          datetime,
          halfDay: isHalfDay,
          notes: isHalfDay ? "Setengah hari" : "Absensi checklist leader",
        },
      });
      saved++;
    }

    return NextResponse.json({ success: true, saved });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menyimpan absensi" }, { status: 500 });
  }
}