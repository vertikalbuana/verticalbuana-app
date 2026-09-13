import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    if (role !== "LEADER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { projectId, notes } = await req.json();
    if (!projectId || !userId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM "LeaderAttendance"
      WHERE "projectId" = ${projectId}
        AND "userId" = ${userId}
        AND "datetime" >= ${today}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        alreadyPresent: true,
        message: "Leader sudah absen hari ini",
      });
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    await prisma.$executeRaw`
      INSERT INTO "LeaderAttendance" ("id", "datetime", "notes", "createdAt", "projectId", "userId")
      VALUES (${id}, NOW(), ${notes || "Absensi kehadiran leader"}, NOW(), ${projectId}, ${userId})
    `;

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal menyimpan absensi leader" },
      { status: 500 }
    );
  }
}