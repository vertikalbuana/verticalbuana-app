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

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const workers = await prisma.worker.findMany({
      orderBy: { name: "asc" },
      include: {
        attendances: {
          where: {
            type: "MASUK",
            datetime: { gte: start, lt: end },
          },
        },
        cashAdvances: {
          where: {
            date: { gte: start, lt: end },
          },
        },
        salaries: {
          where: { month, year },
        },
      },
    });

    const workerData = workers.map((w) => {
      const attendanceDays = w.attendances.length;
      const cashAdvanceTotal = w.cashAdvances.reduce((a, b) => a + b.amount, 0);

      let totalAmount = 0;
      if (w.employmentType === "HARIAN" || w.employmentType === "BORONGAN") {
        totalAmount = (w.dailyRate || 0) * attendanceDays;
      } else {
        totalAmount = w.monthlySalary || 0;
      }

      return {
        id: w.id,
        workerId: w.id,
        name: w.name,
        position: w.position,
        type: "PEKERJA",
        employmentType: w.employmentType,
        dailyRate: w.dailyRate,
        monthlySalary: w.monthlySalary,
        attendanceDays,
        cashAdvanceTotal,
        totalAmount,
        netAmount: totalAmount - cashAdvanceTotal,
        salary: w.salaries[0] || null,
        month,
        year,
      };
    });

    const leaders = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        name: string;
        employmentType: string | null;
        dailyRate: number | null;
        monthlySalary: number | null;
      }>
    >(`
      SELECT id, name, "employmentType", "dailyRate", "monthlySalary"
      FROM "User"
      WHERE role = 'LEADER'
      ORDER BY name ASC
    `);

    const leaderAttendances = await prisma.$queryRawUnsafe<
      Array<{ userId: string; days: number }>
    >(`
      SELECT "userId", COUNT(*)::int AS days
      FROM "LeaderAttendance"
      WHERE "datetime" >= $1 AND "datetime" < $2
      GROUP BY "userId"
    `, start, end);

    const leaderDays = new Map(leaderAttendances.map((a) => [a.userId, a.days]));

    const leaderData = leaders.map((l) => {
      const attendanceDays = leaderDays.get(l.id) || 0;
      const employmentType = l.employmentType || "BULANAN";
      const dailyRate = Number(l.dailyRate || 0);
      const monthlySalary = Number(l.monthlySalary || 0);

      let totalAmount = 0;
      if (employmentType === "HARIAN" || employmentType === "BORONGAN") {
        totalAmount = dailyRate * attendanceDays;
      } else {
        totalAmount = monthlySalary;
      }

      return {
        id: l.id,
        workerId: l.id,
        name: l.name,
        position: "Leader",
        type: "LEADER",
        employmentType,
        dailyRate,
        monthlySalary,
        attendanceDays,
        cashAdvanceTotal: 0,
        totalAmount,
        netAmount: totalAmount,
        salary: null,
        month,
        year,
      };
    });

    return NextResponse.json([...leaderData, ...workerData]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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

    const body = await req.json();
    const { id, type, employmentType, dailyRate, monthlySalary } = body;

    if (!id || !type) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    if (type === "LEADER") {
      await prisma.$executeRawUnsafe(
        `UPDATE "User"
         SET "employmentType" = $1,
             "dailyRate" = $2,
             "monthlySalary" = $3,
             "updatedAt" = NOW()
         WHERE id = $4`,
        employmentType || "BULANAN",
        Number(dailyRate || 0),
        Number(monthlySalary || 0),
        id
      );
    } else {
      await prisma.worker.update({
        where: { id },
        data: {
          employmentType: employmentType || undefined,
          dailyRate: dailyRate !== undefined ? Number(dailyRate) : undefined,
          monthlySalary: monthlySalary !== undefined ? Number(monthlySalary) : undefined,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menyimpan gaji" }, { status: 500 });
  }
}