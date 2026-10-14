import { prisma } from "../../../../lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkerAttendancePage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if ((session?.user as any)?.role !== "ADMIN") {
    notFound();
  }

  const worker = await prisma.worker.findUnique({
    where: { id },
    include: {
      attendances: {
        include: { project: { select: { name: true } } },
        orderBy: { datetime: "desc" },
      },
    },
  });

  if (!worker) {
    notFound();
  }

  return (
    <div className="space-y-6 text-gray-900">
      <div>
        <Link href="/dashboard/workers" className="text-sm text-orange-600">
          Kembali ke pekerja
        </Link>
        <h1 className="text-2xl font-bold mt-2">{worker.name}</h1>
        <p className="text-sm text-gray-500">{worker.position}</p>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3">Tanggal</th>
              <th className="text-left px-4 py-3">Project</th>
              <th className="text-left px-4 py-3">Tipe</th>
              <th className="text-left px-4 py-3">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {worker.attendances.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3">
                  {new Date(a.datetime).toLocaleString("id-ID", {
                    timeZone: "Asia/Jakarta",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3">{a.project?.name || "-"}</td>
                <td className="px-4 py-3">{a.type}</td>
                <td className="px-4 py-3">{a.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {worker.attendances.length === 0 && (
          <div className="p-8 text-center text-gray-500">Belum ada absensi</div>
        )}
      </div>
    </div>
  );
}