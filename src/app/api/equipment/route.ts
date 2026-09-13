import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

const prismaClient = prisma as any;
const equipmentModel =
  prismaClient.equipment ??
  prismaClient.equipmentItem ??
  prismaClient.equipmentItems ??
  prismaClient.equipments;

if (!equipmentModel) {
  throw new Error("Prisma equipment model is not available in the generated client.");
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || undefined;

    const items = await equipmentModel.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(role === "LEADER" ? { project: { leaderId: userId } } : {}),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            leader: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const projects = await prisma.project.findMany({
      where:
        role === "LEADER"
          ? { leaderId: userId, ...(projectId ? { id: projectId } : {}) }
          : projectId
          ? { id: projectId }
          : {},
      select: {
        id: true,
        name: true,
        leader: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });

    const project = projectId
      ? await prisma.project.findUnique({
          where: { id: projectId },
          select: {
            id: true,
            name: true,
            leader: { select: { name: true } },
          },
        })
      : null;

    return NextResponse.json({ items, projects, project });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mengambil data peralatan" }, { status: 500 });
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
    const name = String(body.name || "").trim();
    const category = String(body.category || "Umum").trim();
    const quantity = Number(body.quantity || 1);
    const condition = String(body.condition || "BAIK");
    const notes = body.notes ? String(body.notes) : null;
    const projectId = String(body.projectId || "");

    if (!name || !projectId) {
      return NextResponse.json({ error: "Nama peralatan dan project wajib diisi" }, { status: 400 });
    }

    const item = await equipmentModel.create({
      data: {
        name,
        category,
        quantity: quantity > 0 ? quantity : 1,
        condition,
        notes,
        projectId,
        createdBy: (session.user as any).id,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menambah peralatan" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "ADMIN" && role !== "LEADER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
    }

    await equipmentModel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menghapus peralatan" }, { status: 500 });
  }
}