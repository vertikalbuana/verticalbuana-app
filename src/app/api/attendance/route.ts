import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attendances = await prisma.attendance.findMany({
      orderBy: { datetime: "desc" },
      include: {
        worker: { select: { name: true, position: true } },
        project: { select: { name: true } },
      },
      take: 50,
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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
    const { projectId, workerId, type, notes, photoUrl } = body;

    if (!projectId || !workerId || !type) {
      return NextResponse.json(
        { error: "Project, pekerja, dan tipe absensi wajib diisi" },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        projectId,
        workerId,
        type,
        notes: notes || null,
        photoUrl: photoUrl || null,
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}