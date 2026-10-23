import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
export const revalidate = 60;
function jakartaNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
}

function getLateMinutes(datetime: Date) {
  const jakarta = new Date(datetime.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const hours = jakarta.getHours();
  const minutes = jakarta.getMinutes();
  if (hours < 9 || (hours === 9 && minutes === 0)) return 0;
  return (hours - 9) * 60 + minutes;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attendances = await prisma.attendance.findMany({
      orderBy: { datetime: "desc" },
      include: {
        worker: { select: { id: true, name: true, position: true } },
        project: { select: { id: true, name: true } },
      },
      take: 100,
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "ADMIN" && role !== "LEADER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    let { projectId, workerId, type, notes, latitude, longitude } = body;

    if (!projectId || !type) {
      return NextResponse.json(
        { error: "Project dan tipe absensi wajib diisi" },
        { status: 400 }
      );
    }

    if (type !== "MASUK" && type !== "SELESAI") {
      return NextResponse.json({ error: "Tipe absensi tidak valid" }, { status: 400 });
    }

    if ((!workerId || workerId === "") && role === "LEADER") {
      const leaderName = session.user?.name || "Leader";

      let worker = await prisma.worker.findFirst({
        where: { name: leaderName },
      });

      if (!worker) {
        worker = await prisma.worker.create({
          data: {
            name: leaderName,
            position: "Leader",
          },
        });
      }

      workerId = worker.id;

      const existingLink = await prisma.projectWorker.findFirst({
        where: {
          projectId,
          workerId: worker.id,
        },
      });

      if (!existingLink) {
        await prisma.projectWorker.create({
          data: {
            projectId,
            workerId: worker.id,
          },
        });
      }
    }

    if (!workerId) {
      return NextResponse.json(
        { error: "Pekerja / Leader tidak ditemukan" },
        { status: 400 }
      );
    }

    const now = jakartaNow();
    let lateMinutes = 0;

    if (type === "MASUK") {
      lateMinutes = getLateMinutes(now);

      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const alreadyMasuk = await prisma.attendance.findFirst({
        where: {
          projectId,
          workerId,
          type: "MASUK",
          datetime: { gte: todayStart },
        },
      });

      if (alreadyMasuk) {
        return NextResponse.json(
          { error: "Sudah absen masuk hari ini" },
          { status: 400 }
        );
      }
    }

    const attendance = await prisma.attendance.create({
      data: {
        projectId,
        workerId,
        type,
        datetime: now,
        lateMinutes,
        notes: notes || null,
        latitude: latitude || null,
        longitude: longitude || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        attendance,
        lateMinutes,
        message:
          type === "MASUK"
            ? lateMinutes > 0
              ? `Berhasil absen masuk (Terlambat ${lateMinutes} menit)`
              : "Berhasil absen masuk tepat waktu"
            : "Berhasil absen selesai",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Attendance error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}