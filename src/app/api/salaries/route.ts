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

    const workers = await prisma.worker.findMany({
      orderBy: { name: "asc" },
      include: {
        attendances: {
          where: {
            type: "MASUK",
            datetime: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1),
            },
          },
        },
        cashAdvances: {
          where: {
            date: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1),
            },
          },
        },
        salaries: {
          where: { month, year },
        },
      },
    });

    const data = workers.map((w) => {
      const attendanceDays = w.attendances.length;
      const cashAdvanceTotal = w.cashAdvances.reduce((a, b) => a + b.amount, 0);

      let totalAmount = 0;
      if (w.employmentType === "HARIAN" || w.employmentType === "BORONGAN") {
        totalAmount = (w.dailyRate || 0) * attendanceDays;
      } else {
        totalAmount = w.monthlySalary || 0;
      }

      const netAmount = totalAmount - cashAdvanceTotal;

      return {
        workerId: w.id,
        name: w.name,
        position: w.position,
        employmentType: w.employmentType,
        dailyRate: w.dailyRate,
        monthlySalary: w.monthlySalary,
        attendanceDays,
        cashAdvanceTotal,
        totalAmount,
        netAmount,
        salary: w.salaries[0] || null,
        month,
        year,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}