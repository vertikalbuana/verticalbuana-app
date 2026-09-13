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

    const workers = await prisma.worker.findMany({
      orderBy: { name: "asc" },
      include: {
        projects: {
          include: {
            project: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: { attendances: true },
        },
      },
    });

    return NextResponse.json(workers);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      position,
      nik,
      phone,
      projectId,
      employmentType,
      dailyRate,
      monthlySalary,
      photoUrl,
    } = body;

    if (!name || !position) {
      return NextResponse.json(
        { error: "Nama dan jabatan wajib diisi" },
        { status: 400 }
      );
    }

    const worker = await prisma.worker.create({
      data: {
        name,
        position,
        nik: nik || null,
        phone: phone || null,
        photoUrl: photoUrl || null,
        employmentType: employmentType || "HARIAN",
        dailyRate: Number(dailyRate || 0),
        monthlySalary: Number(monthlySalary || 0),
      },
    });

    if (projectId) {
      await prisma.projectWorker.create({
        data: {
          projectId,
          workerId: worker.id,
        },
      });
    }

    return NextResponse.json(worker, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}