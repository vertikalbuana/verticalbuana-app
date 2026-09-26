import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

function toPhotos(value?: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {}
  return [value];
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Admin yang boleh mengunduh laporan" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "projectId wajib diisi" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        leader: { select: { name: true, email: true } },
        workers: {
          include: { worker: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project tidak ditemukan" }, { status: 404 });
    }

    const [equipments, attendances, progresses] = await Promise.all([
      prisma.equipment.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.attendance.findMany({
        where: { projectId },
        include: { worker: { select: { name: true, position: true } } },
        orderBy: { datetime: "asc" },
      }),
      prisma.workProgress.findMany({
        where: { projectId },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        location: project.location,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        leader: project.leader,
        workers: project.workers.map((pw) => pw.worker),
      },
      equipments,
      attendances,
      progresses: progresses.map((item) => ({
        ...item,
        photos: toPhotos(item.photoUrl),
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mengambil laporan" }, { status: 500 });
  }
}