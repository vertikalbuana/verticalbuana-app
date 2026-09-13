import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";

async function saveVisiblePassword(id: string, password: string) {
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "visiblePassword" = $1 WHERE id = $2`,
      password,
      id
    );
  } catch (error) {
    console.error("Kolom visiblePassword belum ada", error);
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const leaders = await prisma.user.findMany({
      where: { role: "LEADER" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });

    let passwordMap = new Map<string, string>();
    try {
      const rows = await prisma.$queryRawUnsafe<
        Array<{ id: string; visiblePassword: string | null }>
      >(`SELECT id, "visiblePassword" FROM "User" WHERE role = 'LEADER'`);
      passwordMap = new Map(
        rows.map((r) => [r.id, r.visiblePassword || "-"])
      );
    } catch {
      passwordMap = new Map();
    }

    return NextResponse.json(
      leaders.map((l) => ({
        ...l,
        visiblePassword: passwordMap.get(l.id) || "-",
      }))
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mengambil data leader" }, { status: 500 });
  }
}

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
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const existing = await prisma.user.findFirst({ where: { email } });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { name, password: hashed, role: "LEADER" },
      });
      await saveVisiblePassword(existing.id, password);
      return NextResponse.json({
        id: existing.id,
        name,
        email,
        visiblePassword: password,
      });
    }

    const leader = await prisma.user.create({
      data: { name, email, password: hashed, role: "LEADER" },
      select: { id: true, name: true, email: true },
    });

    await saveVisiblePassword(leader.id, password);
    return NextResponse.json({ ...leader, visiblePassword: password }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Email sudah dipakai" }, { status: 400 });
    }
    return NextResponse.json({ error: error?.message || "Gagal menambah leader" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, password } = await req.json();
    if (!id || !password) {
      return NextResponse.json({ error: "ID dan password baru wajib diisi" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(String(password), 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashed },
    });
    await saveVisiblePassword(id, password);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mengubah password" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
    }

    await prisma.project.updateMany({
      where: { leaderId: id },
      data: { leaderId: null },
    });
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menghapus leader" }, { status: 500 });
  }
}