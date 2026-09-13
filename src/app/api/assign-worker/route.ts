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

    const { projectId, workerId } = await req.json();
    if (!projectId || !workerId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    await prisma.projectWorker.deleteMany({
      where: { workerId },
    });

    await prisma.projectWorker.create({
      data: { projectId, workerId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memindahkan pekerja" }, { status: 500 });
  }
}