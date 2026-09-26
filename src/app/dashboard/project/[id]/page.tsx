import { prisma } from "../../../../lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Users, Clock } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AttendanceButton from "./AttendanceButton";
import RemoveWorkerButton from "./RemoveWorkerButton";
import BulkAttendance from "./BulkAttendance";
import LeaderSelfAttendance from "./LeaderSelfAttendance";
import ProjectEquipment from "./ProjectEquipment";
import ProjectProgress from "./ProjectProgress";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const currentUserId = (session?.user as any)?.id;
  const isAdmin = role === "ADMIN";

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      workers: {
        include: {
          worker: true,
        },
      },
      leader: {
        select: { name: true },
      },
    },
  });

  if (!project) {
    notFound();
  }

  if (role === "LEADER" && project.leaderId !== currentUserId) {
    notFound();
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayAttendances = await prisma.attendance.findMany({
    where: {
      projectId: id,
      datetime: { gte: today },
    },
  });

  const masukMap = new Map(
    todayAttendances.filter((a) => a.type === "MASUK").map((a) => [a.workerId, a])
  );
  const selesaiMap = new Map(
    todayAttendances.filter((a) => a.type === "SELESAI").map((a) => [a.workerId, a])
  );

  const leaderRows = currentUserId
    ? await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM "LeaderAttendance"
        WHERE "projectId" = ${id}
          AND "userId" = ${currentUserId}
          AND "datetime" >= ${today}
        LIMIT 1
      `
    : [];

  const leaderToday = leaderRows[0] || null;

  return (
    <div className="space-y-6 text-gray-900">
      <div className="flex items-start gap-4">
        <Link
          href="/dashboard/project"
          className="p-2 rounded-xl hover:bg-gray-100 transition mt-1"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>

        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                project.status === "AKTIF"
                  ? "bg-green-50 text-green-600"
                  : project.status === "TERTUNDA"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {project.status}
            </span>

            {isAdmin && (
              <Link
                href={`/dashboard/project/${project.id}/edit`}
                className="text-sm bg-white border border-gray-300 text-gray-800 px-3 py-1.5 rounded-lg"
              >
                {isAdmin && (
  <a
    href={`/print/project-report?projectId=${project.id}`}
    target="_blank"
    className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg"
  >
    Unduh Laporan Lengkap
  </a>
)}
                Edit Project
              </Link>
              
            )}
          </div>

          <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
            <MapPin className="w-4 h-4" />
            {project.location}
          </div>

          <p className="text-sm text-gray-500 mt-1">
            Mulai:{" "}
            {project.startDate
              ? new Date(project.startDate).toLocaleDateString("id-ID")
              : "-"}
            {" | "}
            Deadline:{" "}
            {project.endDate
              ? new Date(project.endDate).toLocaleDateString("id-ID")
              : "-"}
          </p>

          {project.leader && (
            <p className="text-sm text-gray-400 mt-1">
              Leader: {project.leader.name}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            Total Pekerja
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {project.workers.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            Hadir Hari Ini
          </div>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {masukMap.size}
          </p>
        </div>
      </div>

      {(role === "LEADER" || role === "ADMIN") && (
        <LeaderSelfAttendance
          projectId={project.id}
          alreadyPresent={!!leaderToday}
        />
      )}

      <BulkAttendance
        projectId={project.id}
        workers={project.workers.map((pw) => ({
          workerId: pw.workerId,
          name: pw.worker.name,
          position: pw.worker.position,
          alreadyPresent: masukMap.has(pw.workerId),
        }))}
      />

      <ProjectEquipment
        projectId={project.id}
        canEdit={role === "ADMIN" || role === "LEADER"}
      />
<ProjectProgress
  projectId={project.id}
  canEdit={role === "ADMIN" || role === "LEADER"}
  isAdmin={role === "ADMIN"}
/>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            Daftar Pekerja ({project.workers.length})
          </h2>

          {isAdmin && (
            <Link
              href={`/dashboard/project/${project.id}/add-worker`}
              className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition"
            >
              + Tambah Pekerja
            </Link>
          )}
        </div>

        <div className="divide-y divide-gray-50">
          {project.workers.map((pw) => {
            const attendance = masukMap.get(pw.workerId);
            const isPresent = !!attendance;
            const isFinished = selesaiMap.has(pw.workerId);
            const isLate = !!(attendance && attendance.lateMinutes > 0);

            return (
              <div
                key={pw.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold">
                    {pw.worker.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{pw.worker.name}</p>
                    <p className="text-sm text-gray-500">{pw.worker.position}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isPresent ? (
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        isLate
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      {isLate
                        ? `Terlambat ${attendance?.lateMinutes} mnt`
                        : "Hadir"}
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                      Belum Absen
                    </span>
                  )}

                  <AttendanceButton
                    projectId={project.id}
                    workerId={pw.workerId}
                    workerName={pw.worker.name}
                    alreadyPresent={isPresent}
                    alreadyFinished={isFinished}
                  />

                  {isAdmin && (
                    <RemoveWorkerButton
                      projectId={project.id}
                      workerId={pw.workerId}
                      workerName={pw.worker.name}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {project.workers.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Belum ada pekerja di project ini
            </div>
          )}
        </div>
      </div>
    </div>
  );
}