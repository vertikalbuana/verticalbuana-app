import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const param = new URL(req.url).searchParams.get("userId");

  try {
    const rows =
      role === "ADMIN"
        ? await prisma.$queryRawUnsafe(
            param
              ? `SELECT * FROM "LeaderAttendance" WHERE "userId" = $1 ORDER BY datetime DESC`
              : `SELECT * FROM "LeaderAttendance" ORDER BY datetime DESC LIMIT 200`,
            ...(param ? [param] : [])
          )
        : await prisma.$queryRawUnsafe(
            `SELECT * FROM "LeaderAttendance" WHERE "userId" = $1 ORDER BY datetime DESC`,
            userId
          );
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const sessionUserId = (session.user as any).id;
  const body = await req.json();

  console.log("=== ABSEN LEADER ===");
  console.log("role:", role);
  console.log("sessionUserId:", sessionUserId);
  console.log("body:", body);

  try {
    // Leader absen sendiri
    if (role === "LEADER") {
      if (!body.projectId) {
        return NextResponse.json({ error: "projectId kosong" }, { status: 400 });
      }

      const id = `la_${Date.now()}`;

      const result = await prisma.$executeRawUnsafe(
        `INSERT INTO "LeaderAttendance" (id, "userId", "projectId", datetime, notes, "createdAt")
         VALUES ($1, $2, $3, (NOW() AT TIME ZONE 'Asia/Jakarta'), $4, NOW())`,
        id,
        sessionUserId,
        body.projectId,
        body.notes || "Leader hadir"
      );

      console.log("insert result:", result);
      return NextResponse.json({ success: true, id, result });
    }

    // Admin menambah manual
    if (role === "ADMIN") {
      if (!body.userId || !body.date) {
        return NextResponse.json({ error: "Data admin belum lengkap" }, { status: 400 });
      }

      const id = `la_${Date.now()}`;
      const datetime = new Date(`${body.date}T08:00:00`);

      await prisma.$executeRawUnsafe(
        `INSERT INTO "LeaderAttendance" (id, "userId", "projectId", datetime, notes, "createdAt")
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        id,
        body.userId,
        body.projectId || "manual",
        datetime,
        body.notes || "Ditambahkan admin"
      );

      return NextResponse.json({ success: true, id });
    }

    return NextResponse.json({ error: "Role tidak diizinkan" }, { status: 403 });
  } catch (error: any) {
    console.error("ERROR INSERT:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya Admin" }, { status: 403 });
  }
  const { id } = await req.json();
  await prisma.$executeRawUnsafe(`DELETE FROM "LeaderAttendance" WHERE id = $1`, id);
  return NextResponse.json({ success: true });
}