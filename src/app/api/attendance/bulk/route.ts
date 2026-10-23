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

function getLateMinutes(datetime: Date) {
  const jakarta = new Date(datetime.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const hours = jakarta.getHours();
  const minutes = jakarta.getMinutes();
  if (hours < 9 || (hours === 9 && minutes === 0)) return 0;
  return (hours - 9) * 60 + minutes;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "ADMIN" && role !== "LEADER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { projectId, workerIds, halfDayIds, date } = body;

    console.log("=== BULK ABSENSI ===");
    console.log("projectId:", projectId);
    console.log("workerIds:", workerIds);
    console.log("date:", date);

    if (!projectId || !Array.isArray(workerIds) || workerIds.length === 0) {
      return NextResponse.json({ error: "Pilih pekerja dulu" }, { status: 400 });
    }

    const halfSet = new Set(Array.isArray(halfDayIds) ? halfDayIds : []);
    const datetime = date ? buildDate(date) : jakartaNow();
    const lateMinutes = getLateMinutes(datetime);

    console.log("datetime yang dipakai:", datetime.toISOString());

    const start = new Date(datetime);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    let saved = 0;
    const errors: string[] = [];

    for (const workerId of workerIds) {
      try {
        const exists = await prisma.attendance.findFirst({
          where: {
            projectId,
            workerId,
            type: "MASUK",
            datetime: { gte: start, lt: end },
          },
        });

        if (exists) {
          console.log("Sudah ada, skip:", workerId);
          continue;
        }

        const isHalfDay = halfSet.has(workerId);
        const id = `att_${Date.now()}_${workerId.slice(-6)}`;

        await prisma.$executeRawUnsafe(
          `INSERT INTO "Attendance" 
           (id, "projectId", "workerId", type, datetime, "halfDay", "lateMinutes", notes, "createdAt")
           VALUES ($1, $2, $3, 'MASUK', (NOW() AT TIME ZONE 'Asia/Jakarta'), $4, $5, $6, NOW())`,
          id,
          projectId,
          workerId,
          isHalfDay,
          lateMinutes,
          isHalfDay ? "Setengah hari" : "Absensi checklist leader"
        );

        console.log("Berhasil simpan:", id, "worker:", workerId);
        saved++;
      } catch (err: any) {
        console.error("Gagal simpan worker", workerId, err.message);
        errors.push(`${workerId}: ${err.message}`);
      }
    }

    console.log("Total saved:", saved);
    return NextResponse.json({ success: true, saved, lateMinutes, errors });
  } catch (error: any) {
    console.error("ERROR BULK:", error);
    return NextResponse.json({ error: error.message || "Gagal menyimpan absensi" }, { status: 500 });
  }
}