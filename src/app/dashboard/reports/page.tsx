import { prisma } from "../../../lib/prisma";

export default async function ReportsPage() {
  const attendances = await prisma.attendance.findMany({
    orderBy: { datetime: "desc" },
    take: 50,
    include: {
      worker: true,
      project: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laporan Absensi</h1>
        <p className="text-sm text-gray-500 mt-1">
          Riwayat absensi pekerja di semua project
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Waktu</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Pekerja</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Project</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Tipe</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Selfie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {attendances.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-900">
                    {new Date(item.datetime).toLocaleString("id-ID")}
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900">{item.worker.name}</div>
                    <div className="text-xs text-gray-500">{item.worker.position}</div>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{item.project.name}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        item.type === "MASUK"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-purple-50 text-purple-600"
                      }`}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {item.type === "MASUK" ? (
                      item.lateMinutes > 0 ? (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-50 text-yellow-700">
                          Terlambat {item.lateMinutes} mnt
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-600">
                          Tepat Waktu
                        </span>
                      )
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {item.photoUrl ? (
                      <img
                        src={item.photoUrl}
                        alt="Selfie"
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {attendances.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            Belum ada data absensi
          </div>
        )}
      </div>
    </div>
  );
}