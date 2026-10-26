import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Admin" }, { status: 403 });
    }

    const { projectId, workerId, date, notes } = await req.json();
    if (!projectId || !workerId || !date) {
      return NextResponse.json({ error: "Project, pekerja, dan tanggal wajib diisi" }, { status: 400 });
    }

    // Simpan tepat di tanggal yang dipilih, jam 08:00 WIB
    const datetime = new Date(`${date}T08:00:00+07:00`);

    const start = new Date(datetime);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const exists = await prisma.attendance.findFirst({
      where: {
        projectId,
        workerId,
        type: "MASUK",
        datetime: { gte: start, lt: end },
      },
    });

    if (exists) {
      return NextResponse.json({ success: true, message: "Sudah ada absensi di tanggal itu" });
    }

    await prisma.attendance.create({
      data: {
        projectId,
        workerId,
        type: "MASUK",
        datetime,
        notes: notes || "Absensi manual admin",
        lateMinutes: 0,
        halfDay: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menyimpan absensi" }, { status: 500 });
  }
}