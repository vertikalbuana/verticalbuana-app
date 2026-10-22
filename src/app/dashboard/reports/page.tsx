import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ReportsPage() {
  const projects = await prisma.project.findMany({
    include: {
      _count: { select: { workers: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laporan Kehadiran</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ringkasan kehadiran per project (klik untuk detail)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/dashboard/reports/${project.id}`}
            className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-orange-200 transition"
          >
            <h3 className="font-semibold text-gray-900">{project.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{project.location}</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-600">{project._count.workers} pekerja</span>
              <span className="text-orange-500 font-medium">Lihat Laporan →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}