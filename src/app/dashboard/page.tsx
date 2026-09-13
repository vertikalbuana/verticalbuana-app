import { prisma } from "@/lib/prisma";
import { FolderKanban, Users, CheckCircle, Clock } from "lucide-react";

async function getStats() {
  const [totalProjects, totalWorkers, todayAttendances, lateAttendances] =
    await Promise.all([
      prisma.project.count(),
      prisma.worker.count(),
      prisma.attendance.count({
        where: {
          type: "MASUK",
          datetime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.attendance.count({
        where: {
          type: "MASUK",
          lateMinutes: { gt: 0 },
          datetime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

  return { totalProjects, totalWorkers, todayAttendances, lateAttendances };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    {
      title: "Total Projects",
      value: stats.totalProjects,
      icon: FolderKanban,
      color: "bg-blue-500",
      description: "Proyek aktif & selesai",
    },
    {
      title: "Active Workers",
      value: stats.totalWorkers,
      icon: Users,
      color: "bg-orange-500",
      description: "Total tenaga kerja",
    },
    {
      title: "Today Attendance",
      value: stats.todayAttendances,
      icon: CheckCircle,
      color: "bg-green-500",
      description: "Hadir hari ini",
    },
    {
      title: "Late Workers",
      value: stats.lateAttendances,
      icon: Clock,
      color: "bg-red-500",
      description: "Terlambat hari ini",
    },
  ];

  const projects = await prisma.project.findMany({
    take: 4,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { workers: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{card.description}</p>
                </div>
                <div className={`${card.color} w-11 h-11 rounded-xl flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Proyek Terbaru</h3>
          <a href="/projects" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
            Lihat semua →
          </a>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="border border-gray-100 rounded-xl p-4 hover:border-orange-200 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{project.name}</h4>
                  <p className="text-sm text-gray-500 mt-0.5">{project.location}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    project.status === "AKTIF"
                      ? "bg-green-50 text-green-600"
                      : project.status === "TERTUNDA"
                      ? "bg-yellow-50 text-yellow-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {project.status}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                <span>{project._count.workers} pekerja</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}