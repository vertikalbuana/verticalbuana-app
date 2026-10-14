import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya Admin" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const datetime = new Date(`${body.date}T${body.time || "08:00"}:00`);

  const item = await prisma.attendance.update({
    where: { id },
    data: {
      datetime,
      type: body.type,
      notes: body.notes || null,
    },
  });

  return NextResponse.json(item);
}