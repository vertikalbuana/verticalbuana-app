import { prisma } from "../../../lib/prisma";
import Link from "next/link";
import { Plus, MapPin, Users } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DeleteProjectButton from "./DeleteProjectButton";

export default async function ProjectsPage() {
 const session = await getServerSession(authOptions);
const role = (session?.user as any)?.role;
const userId = (session?.user as any)?.id;
const isAdmin = role === "ADMIN";

const projects = await prisma.project.findMany({
  where: role === "LEADER" ? { leaderId: userId } : {},
  orderBy: { createdAt: "desc" },
  include: {
    _count: { select: { workers: true } },
    leader: { select: { name: true } },
  },
});

  return (
    <div className="space-y-6 text-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daftar Project</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola semua proyek konstruksi PT Vertikal Buana
          </p>
        </div>

        {isAdmin && (
          <Link
            href="/dashboard/project/new"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2.5 rounded-xl transition"
          >
            <Plus className="w-5 h-5" />
            Tambah Project
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition p-5"
          >
            <Link href={`/dashboard/project/${project.id}`} className="block">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                  {project.name}
                </h3>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                    project.status === "AKTIF"
                      ? "bg-green-50 text-green-600"
                      : project.status === "TERTUNDA"
                      ? "bg-yellow-50 text-yellow-600"
                      : project.status === "SELESAI"
                      ? "bg-blue-50 text-blue-600"
                      : project.status === "DIBATALKAN"
                      ? "bg-red-50 text-red-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {project.status}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{project.location}</span>
              </div>

              {project.description && (
                <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                  {project.description}
                </p>
              )}
            </Link>

            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>{project._count.workers} pekerja</span>
              </div>

              <div className="flex items-center gap-3">
                {project.leader && (
                  <span className="text-xs text-gray-400">
                    Leader: {project.leader.name}
                  </span>
                )}
                {isAdmin && (
                  <DeleteProjectButton id={project.id} name={project.name} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-500">Belum ada project</p>
          {isAdmin && (
            <Link
              href="/dashboard/project/new"
              className="inline-flex items-center gap-2 mt-4 text-orange-500 hover:text-orange-600 font-medium"
            >
              <Plus className="w-4 h-4" />
              Tambah Project Pertama
            </Link>
          )}
        </div>
      )}
    </div>
  );
}