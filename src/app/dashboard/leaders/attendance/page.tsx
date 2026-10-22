"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Leader = { id: string; name: string };
type Attendance = {
  id: string;
  userId: string;
  projectId: string | null;
  datetime: string;
  notes: string | null;
};

export default function LeaderAttendancePage() {
  const router = useRouter();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [selected, setSelected] = useState("");
  const [rows, setRows] = useState<Attendance[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const loadLeaders = async () => {
    const res = await fetch("/api/leaders", { cache: "no-store" });
    const data = await res.json();
    setLeaders(Array.isArray(data) ? data : []);
  };

  const loadAttendance = async (userId: string) => {
    if (!userId) return setRows([]);
    const res = await fetch(`/api/leader-attendance?userId=${userId}`, { cache: "no-store" });
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadLeaders();
  }, []);

  useEffect(() => {
    loadAttendance(selected);
  }, [selected]);

  const tambah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    const res = await fetch("/api/leader-attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selected, date, notes }),
    });
    setLoading(false);
    if (res.ok) {
      setNotes("");
      loadAttendance(selected);
    } else {
      const data = await res.json();
      alert(data.error || "Gagal menambah");
    }
  };

  const hapus = async (id: string) => {
    if (!confirm("Hapus absensi leader ini?")) return;
    await fetch("/api/leader-attendance", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadAttendance(selected);
  };

  const input = "border border-gray-300 rounded-xl px-3 py-2 text-gray-900 bg-white";

  return (
    <div className="space-y-6 text-gray-900">
      <h1 className="text-2xl font-bold">Absensi Leader</h1>

      <div className="bg-white rounded-2xl border p-4">
        <label className="block text-sm font-medium mb-1">Pilih Leader</label>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className={input + " w-full max-w-md"}
        >
          <option value="">-- Pilih Leader --</option>
          {leaders.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <>
          <form onSubmit={tambah} className="bg-white rounded-2xl border p-4 space-y-3">
            <h2 className="font-semibold">Tambah Absensi Leader</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} required />
              <input
                placeholder="Catatan (opsional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={input}
              />
              <button disabled={loading} className="bg-orange-500 text-white rounded-xl px-4 py-2 font-medium">
                {loading ? "Menyimpan..." : "Tambah"}
              </button>
            </div>
          </form>

          <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3">Tanggal</th>
                  <th className="text-left px-4 py-3">Catatan</th>
                  <th className="text-left px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                      Belum ada absensi
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3">
                        {new Date(r.datetime).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
                      </td>
                      <td className="px-4 py-3">{r.notes || "-"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => hapus(r.id)} className="text-red-600 font-medium">
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}