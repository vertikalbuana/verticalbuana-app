"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type WorkerItem = {
  workerId: string;
  name: string;
  position: string;
  alreadyPresent: boolean;
};

function todayText() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function BulkAttendance({
  projectId,
  workers,
}: {
  projectId: string;
  workers: WorkerItem[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [halfDay, setHalfDay] = useState<string[]>([]);
  const [date, setDate] = useState(todayText());
  const [saving, setSaving] = useState(false);

  const available = useMemo(() => {
    if (date === todayText()) return workers.filter((w) => !w.alreadyPresent);
    return workers;
  }, [workers, date]);

  const toggleFull = (workerId: string) => {
    setSelected((prev) =>
      prev.includes(workerId) ? prev.filter((id) => id !== workerId) : [...prev, workerId]
    );
    setHalfDay((prev) => prev.filter((id) => id !== workerId));
  };

  const toggleHalf = (workerId: string) => {
    const active = halfDay.includes(workerId);
    setHalfDay((prev) =>
      active ? prev.filter((id) => id !== workerId) : [...prev, workerId]
    );
    setSelected((prev) =>
      active ? prev.filter((id) => id !== workerId) : prev.includes(workerId) ? prev : [...prev, workerId]
    );
  };

  const toggleAll = () => {
    if (selected.length === available.length) {
      setSelected([]);
      setHalfDay([]);
    } else {
      setSelected(available.map((w) => w.workerId));
    }
  };

  const handleSave = async () => {
    if (selected.length === 0) return;
    setSaving(true);

    const res = await fetch("/api/attendance/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        workerIds: selected,
        halfDayIds: halfDay,
        date,
        notes: "Absensi checklist leader",
      }),
    });

    setSaving(false);

    if (res.ok) {
      setSelected([]);
      setHalfDay([]);
      router.refresh();
      alert("Absensi berhasil disimpan");
    } else {
      const data = await res.json();
      alert(data.error || "Gagal menyimpan absensi");
    }
  };

  if (workers.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 text-gray-900">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">Absensi Checklist Leader</h2>
          <p className="text-sm text-gray-500 mt-1">
            Centang Hadir untuk sehari penuh. Centang 1/2 hari hanya untuk pekerja yang terlambat atau pulang lebih awal.
          </p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setSelected([]);
            setHalfDay([]);
          }}
          className="border border-gray-300 rounded-xl px-3 py-2 text-gray-900 bg-white"
        />
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={toggleAll} className="text-sm text-orange-600 font-medium">
          {selected.length === available.length ? "Batal semua" : "Pilih semua hadir penuh"}
        </button>
      </div>

      <div className="space-y-2">
        {workers.map((w) => {
          const locked = date === todayText() && w.alreadyPresent;
          const isHalf = halfDay.includes(w.workerId);
          const isFull = selected.includes(w.workerId) && !isHalf;

          return (
            <div
              key={w.workerId}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                locked ? "bg-green-50 border-green-100" : "bg-white border-gray-200"
              }`}
            >
              <div>
                <p className="font-medium text-gray-900">{w.name}</p>
                <p className="text-xs text-gray-500">{w.position}</p>
              </div>

              {locked ? (
                <span className="text-xs font-medium text-green-600">Sudah hadir hari ini</span>
              ) : (
                <div className="flex items-center gap-4">
                  <label className="text-sm flex items-center gap-2">
                    <input type="checkbox" checked={isFull} onChange={() => toggleFull(w.workerId)} />
                    Hadir penuh
                  </label>
                  <label className="text-sm text-orange-600 flex items-center gap-2">
                    <input type="checkbox" checked={isHalf} onChange={() => toggleHalf(w.workerId)} />
                    1/2 hari
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || selected.length === 0}
        className="bg-orange-500 text-white px-4 py-2.5 rounded-xl font-medium disabled:opacity-60"
      >
        {saving ? "Menyimpan..." : `Simpan absensi ${selected.length} pekerja (${date})`}
      </button>
    </div>
  );
}