import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

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

    const items = await prisma.workProgress.findMany({
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

    return NextResponse.json(items);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mengambil progress" }, { status: 500 });
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
    const description = String(body.description || "").trim();
    const projectId = String(body.projectId || "");
    const photoUrl = body.photoUrl ? String(body.photoUrl) : null;

    if (!description || !projectId) {
      return NextResponse.json(
        { error: "Deskripsi dan project wajib diisi" },
        { status: 400 }
      );
    }

    const item = await prisma.workProgress.create({
      data: {
        description,
        photoUrl,
        projectId,
        createdBy: (session.user as any).id,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menambah progress" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
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
    const id = String(body.id || "");
    const description = String(body.description || "").trim();
    const photoUrl = body.photoUrl ? String(body.photoUrl) : undefined;

    if (!id || !description) {
      return NextResponse.json({ error: "ID dan deskripsi wajib diisi" }, { status: 400 });
    }

    const item = await prisma.workProgress.update({
      where: { id },
      data: {
        description,
        ...(photoUrl ? { photoUrl } : {}),
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mengubah progress" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Admin yang boleh menghapus" }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
    }

    await prisma.workProgress.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menghapus progress" }, { status: 500 });
  }
}