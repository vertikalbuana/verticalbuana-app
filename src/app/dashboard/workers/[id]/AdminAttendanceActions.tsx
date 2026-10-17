"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminAttendanceActions({
  workerId,
  projects,
  mode,
  attendanceId,
}: {
  workerId?: string;
  projects?: { id: string; name: string }[];
  mode?: "delete";
  attendanceId?: string;
}) {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [projectId, setProjectId] = useState(projects?.[0]?.id || "");
  const [halfDay, setHalfDay] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (mode === "delete" && attendanceId) {
    const hapus = async () => {
      if (!confirm("Hapus absensi ini?")) return;
      setLoading(true);
      await fetch("/api/attendance/admin", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: attendanceId }),
      });
      setLoading(false);
      router.refresh();
    };

    return (
      <button
        onClick={hapus}
        disabled={loading}
        className="text-red-600 text-sm font-medium"
      >
        {loading ? "Menghapus..." : "Hapus"}
      </button>
    );
  }

  const tambah = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/attendance/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workerId, projectId, date, halfDay, notes }),
    });
    setLoading(false);
    if (res.ok) {
      setNotes("");
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Gagal menambah");
    }
  };

  const input =
    "border border-gray-300 rounded-xl px-3 py-2 text-gray-900 bg-white";

  return (
    <form onSubmit={tambah} className="bg-white rounded-2xl border p-4 space-y-3">
      <h2 className="font-semibold">Tambah Absensi (Admin)</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={input}
          required
        />
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className={input}
          required
        >
          {projects?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={halfDay}
            onChange={(e) => setHalfDay(e.target.checked)}
          />
          1/2 hari
        </label>
        <input
          placeholder="Catatan (opsional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={input}
        />
      </div>
      <button
        disabled={loading}
        className="bg-orange-500 text-white px-4 py-2 rounded-xl font-medium"
      >
        {loading ? "Menyimpan..." : "Tambah Absensi"}
      </button>
    </form>
  );
}