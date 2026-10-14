import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Admin" }, { status: 403 });
    }

    const month = new URL(req.url).searchParams.get("month") || new Date().toISOString().slice(0, 7);
    const start = new Date(`${month}-01T00:00:00`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const workers = await prisma.worker.findMany({
      orderBy: { name: "asc" },
      include: {
        attendances: {
          where: { type: "MASUK", datetime: { gte: start, lt: end } },
          select: { datetime: true, halfDay: true },
        },
      },
    });

    const rows = workers.map((w) => {
      const byDate = new Map<string, boolean>();
      for (const a of w.attendances) {
        const key = new Date(a.datetime).toISOString().slice(0, 10);
        const half = Boolean((a as any).halfDay);
        if (!byDate.has(key)) byDate.set(key, half);
        else if (!half) byDate.set(key, false);
      }

      let fullDays = 0;
      let halfDays = 0;
      for (const isHalf of byDate.values()) {
        if (isHalf) halfDays += 1;
        else fullDays += 1;
      }

      const equivalentDays = fullDays + halfDays * 0.5;
      const dailyRate = Number((w as any).dailyRate || 0);
      const monthlySalary = Number((w as any).monthlySalary || 0);
      const type = (w as any).employmentType || "HARIAN";
      const total =
        type === "BULANAN" || type === "PKWT"
          ? monthlySalary
          : dailyRate * equivalentDays;

      return {
        id: w.id,
        name: w.name,
        position: w.position,
        employmentType: type,
        dailyRate,
        monthlySalary,
        fullDays,
        halfDays,
        equivalentDays,
        total,
      };
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menghitung gaji" }, { status: 500 });
  }
}