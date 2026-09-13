import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role as string | undefined;
    const userId = (session.user as any).id as string | undefined;

    const projects = await prisma.project.findMany({
      where: role === "LEADER" && userId ? { leaderId: userId } : {},
      orderBy: { name: "asc" },
      include: {
        workers: {
          include: {
            worker: {
              select: { id: true, name: true, position: true },
            },
          },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}