"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LeaderSelfAttendance({
  projectId,
  alreadyPresent,
}: {
  projectId: string;
  alreadyPresent: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAbsen = async () => {
    setLoading(true);
    const res = await fetch("/api/leader-attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        notes: "Leader hadir di lokasi project",
      }),
    });
    setLoading(false);

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Gagal absen");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
      <div>
        <h2 className="font-semibold text-gray-900">Kehadiran Leader</h2>
        <p className="text-sm text-gray-500 mt-1">
          {alreadyPresent
            ? "Anda sudah absen hari ini di project ini"
            : "Klik tombol untuk menandai Anda hadir hari ini"}
        </p>
      </div>

      {alreadyPresent ? (
        <span className="text-sm font-medium bg-green-50 text-green-700 px-3 py-1.5 rounded-lg">
          Leader Hadir
        </span>
      ) : (
        <button
          onClick={handleAbsen}
          disabled={loading}
          className="bg-orange-500 text-white px-4 py-2.5 rounded-xl font-medium disabled:opacity-70"
        >
          {loading ? "Menyimpan..." : "Saya Hadir"}
        </button>
      )}
    </div>
  );
}