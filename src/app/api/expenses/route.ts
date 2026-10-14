import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    const projectId = new URL(req.url).searchParams.get("projectId");

    const rows =
      role === "ADMIN"
        ? await prisma.$queryRawUnsafe(`SELECT * FROM "ProjectExpense" ORDER BY "createdAt" DESC`)
        : await prisma.$queryRawUnsafe(
            `SELECT * FROM "ProjectExpense" WHERE "projectId" = $1 ORDER BY "createdAt" DESC`,
            projectId
          );

    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    const userId = (session.user as any).id;
    const userName = session.user?.name || "Leader";
    if (role !== "LEADER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const amount = Number(body.amount || 0);
    if (!body.projectId || !body.projectName || amount <= 0) {
      return NextResponse.json({ error: "Data belum lengkap" }, { status: 400 });
    }

    const id = `exp_${Date.now()}`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "ProjectExpense"
        ("id", "projectId", "projectName", "userId", "userName", "amount", "description", "status", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'MENUNGGU', NOW())`,
      id,
      body.projectId,
      body.projectName,
      userId,
      userName,
      amount,
      body.description || null
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal menyimpan" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Admin" }, { status: 403 });
    }

    const { id } = await req.json();
    await prisma.$executeRawUnsafe(`DELETE FROM "ProjectExpense" WHERE id = $1`, id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}