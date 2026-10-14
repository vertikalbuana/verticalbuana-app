import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Admin" }, { status: 403 });
    }

    const body = await req.json();
    const amount = Number(body.amount || 0);
    const notes = body.notes || null;
    const type = body.type || "PEKERJA";

    if (!body.workerId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Nama dan jumlah wajib diisi" }, { status: 400 });
    }

    if (type === "LEADER") {
      const id = `lca_${Date.now()}`;
      await prisma.$executeRaw`
        INSERT INTO "LeaderCashAdvance" ("id", "userId", "amount", "notes", "createdAt")
        VALUES (${id}, ${body.workerId}, ${amount}, ${notes}, NOW())
      `;
      return NextResponse.json({ success: true });
    }

    const item = await prisma.cashAdvance.create({
      data: {
        workerId: body.workerId,
        amount,
        notes,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menambah kasbon" }, { status: 500 });
  }
}