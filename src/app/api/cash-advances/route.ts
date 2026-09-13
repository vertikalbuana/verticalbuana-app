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

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { workerId, amount, notes } = body;

    if (!workerId || !amount) {
      return NextResponse.json(
        { error: "Pekerja dan jumlah kasbon wajib diisi" },
        { status: 400 }
      );
    }

    const cashAdvance = await prisma.cashAdvance.create({
      data: {
        workerId,
        amount: Number(amount),
        notes: notes || null,
      },
    });

    return NextResponse.json(cashAdvance, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}