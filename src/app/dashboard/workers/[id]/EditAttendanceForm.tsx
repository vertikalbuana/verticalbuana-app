"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditAttendanceForm({
  id,
  datetime,
  type,
  notes,
}: {
  id: string;
  datetime: string;
  type: string;
  notes: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: datetime.slice(0, 10),
    time: datetime.slice(11, 16),
    type,
    notes,
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/attendance/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Gagal menyimpan");
    }
  };

  const input = "w-full border border-gray-300 rounded-xl px-3 py-2 text-gray-900 bg-white";

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-orange-600 text-sm font-medium">
        Edit
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={save} className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3">
            <h3 className="font-semibold text-gray-900">Edit Absensi</h3>
            <input className={input} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <input className={input} type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
            <select className={input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="MASUK">MASUK</option>
              <option value="SELESAI">SELESAI</option>
            </select>
            <textarea className={input} rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border">Batal</button>
              <button disabled={loading} className="bg-orange-500 text-white px-4 py-2 rounded-xl">
                {loading ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}