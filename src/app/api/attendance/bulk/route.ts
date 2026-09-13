import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

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
    const projectId = body.projectId as string;
    const workerIds = (body.workerIds || []) as string[];
    const notes = (body.notes || "Absensi manual") as string;
    const dateText = String(body.date || "").slice(0, 10);

    if (!projectId || workerIds.length === 0) {
      return NextResponse.json(
        { error: "Project dan pekerja wajib dipilih" },
        { status: 400 }
      );
    }

    const baseDate = dateText ? new Date(`${dateText}T08:00:00`) : new Date();
    const start = new Date(baseDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const existing = await prisma.attendance.findMany({
      where: {
        projectId,
        type: "MASUK",
        workerId: { in: workerIds },
        datetime: { gte: start, lt: end },
      },
      select: { workerId: true },
    });

    const already = new Set(existing.map((item) => item.workerId));
    const toCreate = workerIds.filter((id) => !already.has(id));

    if (toCreate.length > 0) {
      await prisma.attendance.createMany({
        data: toCreate.map((workerId) => ({
          projectId,
          workerId,
          type: "MASUK",
          datetime: baseDate,
          notes: `${notes} (${dateText || "hari ini"})`,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      created: toCreate.length,
      skipped: already.size,
      date: dateText,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menyimpan absensi" }, { status: 500 });
  }
}