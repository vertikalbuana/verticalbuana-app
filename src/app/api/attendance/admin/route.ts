import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Admin" }, { status: 403 });
    }

    const { workerId, projectId, date, halfDay, notes } = await req.json();
    if (!workerId || !projectId || !date) {
      return NextResponse.json({ error: "Data belum lengkap" }, { status: 400 });
    }

    const datetime = new Date(`${date}T08:00:00`);

    const exists = await prisma.attendance.findFirst({
      where: {
        workerId,
        projectId,
        type: "MASUK",
        datetime: {
          gte: new Date(`${date}T00:00:00`),
          lt: new Date(`${date}T23:59:59`),
        },
      },
    });

    if (exists) {
      return NextResponse.json({ error: "Absensi tanggal ini sudah ada" }, { status: 400 });
    }

    const item = await prisma.attendance.create({
      data: {
        workerId,
        projectId,
        type: "MASUK",
        datetime,
        halfDay: Boolean(halfDay),
        notes: notes || (halfDay ? "Setengah hari (admin)" : "Ditambahkan admin"),
      },
    });

    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Admin" }, { status: 403 });
    }

    const { id } = await req.json();
    await prisma.attendance.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}