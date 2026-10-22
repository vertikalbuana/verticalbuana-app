import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

function countWorkerDays(attendances: Array<{ datetime: Date; halfDay?: boolean | null }>) {
  const byDate = new Map<string, boolean>();
  for (const a of attendances) {
    const key = new Date(a.datetime).toISOString().slice(0, 10);
    const half = Boolean(a.halfDay);
    if (!byDate.has(key)) byDate.set(key, half);
    else if (!half) byDate.set(key, false);
  }
  let fullDays = 0;
  let halfDays = 0;
  for (const isHalf of byDate.values()) {
    if (isHalf) halfDays += 1;
    else fullDays += 1;
  }
  return { fullDays, halfDays, attendanceDays: fullDays + halfDays * 0.5 };
}

function countLeaderDays(rows: Array<{ datetime: Date | string }>) {
  const dates = new Set<string>();
  for (const r of rows) {
    const key = new Date(r.datetime).toISOString().slice(0, 10);
    dates.add(key);
  }
  const days = dates.size;
  return { fullDays: days, halfDays: 0, attendanceDays: days };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
          where: { type: "MASUK", datetime: { gte: start, lt: end } },
        },
        cashAdvances: { where: { date: { gte: start, lt: end } } },
        salaries: { where: { month, year } },
      },
    });

    const workerData = workers.map((w) => {
      const days = countWorkerDays(w.attendances as any);
      const cashAdvanceTotal = w.cashAdvances.reduce((a, b) => a + b.amount, 0);
      const totalAmount =
        w.employmentType === "HARIAN" || w.employmentType === "BORONGAN"
          ? (w.dailyRate || 0) * days.attendanceDays
          : w.monthlySalary || 0;

      return {
        id: w.id,
        workerId: w.id,
        name: w.name,
        position: w.position,
        type: "PEKERJA",
        employmentType: w.employmentType,
        dailyRate: w.dailyRate,
        monthlySalary: w.monthlySalary,
        fullDays: days.fullDays,
        halfDays: days.halfDays,
        attendanceDays: days.attendanceDays,
        cashAdvanceTotal,
        totalAmount,
        netAmount: totalAmount - cashAdvanceTotal,
        salary: w.salaries[0] || null,
        month,
        year,
      };
    });

    let leaders: any[] = [];
    try {
      leaders = await prisma.$queryRawUnsafe(`
        SELECT id, name, "employmentType", "dailyRate", "monthlySalary"
        FROM "User"
        WHERE role = 'LEADER'
        ORDER BY name ASC
      `);
    } catch {
      leaders = [];
    }

    let leaderAttendances: Array<{ userId: string; datetime: Date }> = [];
    try {
      leaderAttendances = await prisma.$queryRawUnsafe(
        `SELECT "userId", datetime FROM "LeaderAttendance" WHERE datetime >= $1 AND datetime < $2`,
        start,
        end
      );
    } catch {
      leaderAttendances = [];
    }

    let leaderKasbons: Array<{ userId: string; amount: number }> = [];
    try {
      leaderKasbons = await prisma.$queryRawUnsafe(
        `SELECT "userId", "amount" FROM "LeaderCashAdvance" WHERE "createdAt" >= $1 AND "createdAt" < $2`,
        start,
        end
      );
    } catch {
      leaderKasbons = [];
    }

    const leaderData = leaders.map((l) => {
      const employmentType = l.employmentType || "BULANAN";
      const dailyRate = Number(l.dailyRate || 0);
      const monthlySalary = Number(l.monthlySalary || 0);

      const myAtt = leaderAttendances.filter((a) => a.userId === l.id);
      const days = countLeaderDays(myAtt);

      const cashAdvanceTotal = leaderKasbons
        .filter((k) => k.userId === l.id)
        .reduce((a, b) => a + Number(b.amount || 0), 0);

      const totalAmount =
        employmentType === "HARIAN" || employmentType === "BORONGAN"
          ? dailyRate * days.attendanceDays
          : monthlySalary;

      return {
        id: l.id,
        workerId: l.id,
        name: l.name,
        position: "Leader",
        type: "LEADER",
        employmentType,
        dailyRate,
        monthlySalary,
        fullDays: days.fullDays,
        halfDays: days.halfDays,
        attendanceDays: days.attendanceDays,
        cashAdvanceTotal,
        totalAmount,
        netAmount: totalAmount - cashAdvanceTotal,
        salary: null,
        month,
        year,
      };
    });

    return NextResponse.json([...leaderData, ...workerData]);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, type, employmentType, dailyRate, monthlySalary } = body;
    if (!id || !type) return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });

    if (type === "LEADER") {
      await prisma.$executeRawUnsafe(
        `UPDATE "User"
         SET "employmentType" = $1, "dailyRate" = $2, "monthlySalary" = $3, "updatedAt" = NOW()
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal menyimpan gaji" }, { status: 500 });
  }
}