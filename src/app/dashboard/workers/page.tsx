import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteWorkerButton from "./DeleteWorkerButton";
import AssignWorkerToProject from "./AssignWorkerToProject";

export default async function WorkersPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const { projectId } = await searchParams;

  const projects = await prisma.project.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const workers = await prisma.worker.findMany({
    where: projectId
      ? {
          projects: {
            some: { projectId },
          },
        }
      : {},
    orderBy: { name: "asc" },
    include: {
      projects: {
        include: {
          project: { select: { id: true, name: true } },
        },
      },
      _count: {
        select: { attendances: true },
      },
    },
  });

  return (
    <div className="space-y-6 text-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daftar Pekerja</h1>
          <p className="text-sm text-gray-500 mt-1">
            Admin dapat melihat dan menempatkan pekerja ke masing-masing project
          </p>
        </div>

        {isAdmin && (
          <Link
            href="/dashboard/workers/new"
            className="bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            + Tambah Pekerja
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/workers"
          className={`px-4 py-2 rounded-xl text-sm font-medium border ${
            !projectId
              ? "bg-orange-500 text-white border-orange-500"
              : "bg-white text-gray-700 border-gray-200"
          }`}
        >
          Semua Project
        </Link>

        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/dashboard/workers?projectId=${p.id}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium border ${
              projectId === p.id
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            {p.name}
          </Link>
        ))}
      </div>

      {isAdmin && <AssignWorkerToProject projects={projects} />}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-900">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-700">Nama</th>
                <th className="text-left px-5 py-3 font-medium text-gray-700">Jabatan</th>
                <th className="text-left px-5 py-3 font-medium text-gray-700">NIK</th>
                <th className="text-left px-5 py-3 font-medium text-gray-700">Project</th>
                <th className="text-left px-5 py-3 font-medium text-gray-700">Absensi</th>
                {isAdmin && (
                  <th className="text-left px-5 py-3 font-medium text-gray-700">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {workers.map((worker) => (
                <tr key={worker.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium">{worker.name}</td>
                  <td className="px-5 py-3">{worker.position}</td>
                  <td className="px-5 py-3 text-gray-600">{worker.nik || "-"}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {worker.projects.length > 0 ? (
                        worker.projects.map((pw) => (
                          <span
                            key={pw.id}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"
                          >
                            {pw.project.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">Belum ditempatkan</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">{worker._count.attendances}</td>
                  {isAdmin && (
                    <td className="px-5 py-3">
                      <DeleteWorkerButton id={worker.id} name={worker.name} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {workers.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            Belum ada pekerja pada filter ini
          </div>
        )}
      </div>
    </div>
  );
}