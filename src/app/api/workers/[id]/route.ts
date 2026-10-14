import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Admin" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const worker = await prisma.worker.update({
      where: { id },
      data: {
        name: body.name,
        position: body.position,
        nik: body.nik || null,
        phone: body.phone || null,
        employmentType: body.employmentType || undefined,
        dailyRate: body.dailyRate !== undefined && body.dailyRate !== "" ? Number(body.dailyRate) : undefined,
        monthlySalary:
          body.monthlySalary !== undefined && body.monthlySalary !== ""
            ? Number(body.monthlySalary)
            : undefined,
      },
    });

    return NextResponse.json(worker);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mengubah data pekerja" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Admin" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.attendance.deleteMany({ where: { workerId: id } });
    await prisma.projectWorker.deleteMany({ where: { workerId: id } });
    await prisma.worker.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menghapus pekerja" }, { status: 500 });
  }
}