import { prisma } from "@/lib/prisma";

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
  });
}

function isLate(datetime: Date | string) {
  const d = new Date(datetime);
  const jakarta = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const hours = jakarta.getHours();
  const minutes = jakarta.getMinutes();
  return hours > 9 || (hours === 9 && minutes > 0);
}

export default async function AttendancePage() {
  const attendances = await prisma.attendance.findMany({
    orderBy: { datetime: "desc" },
    include: {
      worker: true,
      project: true,
    },
  });

  const grouped: Record<string, any> = {};

  for (const item of attendances) {
    const dateKey = formatDate(item.datetime);
    const key = `${item.workerId}-${dateKey}-${item.projectId}`;

    if (!grouped[key]) {
      grouped[key] = {
        worker: item.worker,
        project: item.project,
        date: dateKey,
        masuk: null as any,
        selesai: null as any,
      };
    }

    if (item.type === "MASUK") grouped[key].masuk = item;
    if (item.type === "SELESAI") grouped[key].selesai = item;
  }

  const rows = Object.values(grouped);

  return (
    <div className="space-y-6 text-gray-900">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Absensi</h1>
        <p className="text-sm text-gray-600 mt-1">
          Data kehadiran pekerja & leader. Batas tepat waktu jam 09:00 WIB.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-900 min-w-[720px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Tanggal</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Nama</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Jabatan</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Project</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Masuk</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Selesai</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row: any, idx) => {
                const late = row.masuk ? isLate(row.masuk.datetime) : false;
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{row.date}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.worker?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-800">{row.worker?.position || "-"}</td>
                    <td className="px-4 py-3 text-gray-800">{row.project?.name || "-"}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {row.masuk ? formatTime(row.masuk.datetime) : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {row.selesai ? formatTime(row.selesai.datetime) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {row.masuk ? (
                        late ? (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                            Terlambat
                          </span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            Tepat Waktu
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-gray-500">Belum absen</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <div className="p-10 text-center text-gray-500">Belum ada data absensi</div>
        )}
      </div>
    </div>
  );
}