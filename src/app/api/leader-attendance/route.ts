import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Admin" }, { status: 403 });
    }

    const userId = new URL(req.url).searchParams.get("userId");

    const rows = userId
      ? await prisma.$queryRawUnsafe(
          `SELECT * FROM "LeaderAttendance" WHERE "userId" = $1 ORDER BY datetime DESC`,
          userId
        )
      : await prisma.$queryRawUnsafe(
          `SELECT * FROM "LeaderAttendance" ORDER BY datetime DESC LIMIT 200`
        );

    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Admin" }, { status: 403 });
    }

    const { userId, projectId, date, notes } = await req.json();
    if (!userId || !date) {
      return NextResponse.json({ error: "Data belum lengkap" }, { status: 400 });
    }

    const id = `la_${Date.now()}`;
    const datetime = new Date(`${date}T08:00:00`);

    await prisma.$executeRawUnsafe(
      `INSERT INTO "LeaderAttendance" (id, "userId", "projectId", datetime, notes, "createdAt")
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      id,
      userId,
      projectId || null,
      datetime,
      notes || "Ditambahkan admin"
    );

    return NextResponse.json({ success: true });
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
    await prisma.$executeRawUnsafe(`DELETE FROM "LeaderAttendance" WHERE id = $1`, id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}