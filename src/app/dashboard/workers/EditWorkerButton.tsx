"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditWorkerButton({ worker }: { worker: any }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: worker.name || "",
    position: worker.position || "",
    nik: worker.nik || "",
    phone: worker.phone || "",
    employmentType: worker.employmentType || "HARIAN",
    dailyRate: worker.dailyRate || "",
    monthlySalary: worker.monthlySalary || "",
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/workers/${worker.id}`, {
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
      <button type="button" onClick={() => setOpen(true)} className="text-orange-600 text-sm font-medium mr-3">
        Edit
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={save} className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3 text-gray-900">
            <h3 className="font-semibold">Edit Pekerja</h3>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className={input} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} required />
            <input className={input} placeholder="NIK" value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} />
            <input className={input} placeholder="Telepon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <select className={input} value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
              <option value="HARIAN">HARIAN</option>
              <option value="BULANAN">BULANAN</option>
              <option value="PKWT">PKWT</option>
              <option value="BORONGAN">BORONGAN</option>
            </select>
            <input className={input} type="number" placeholder="Upah harian" value={form.dailyRate} onChange={(e) => setForm({ ...form, dailyRate: e.target.value })} />
            <input className={input} type="number" placeholder="Gaji bulanan" value={form.monthlySalary} onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })} />
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