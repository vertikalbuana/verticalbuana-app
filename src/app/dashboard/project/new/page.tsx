"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Leader = {
  id: string;
  name: string;
};

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [leaders, setLeaders] = useState<Leader[]>([]);

  const [form, setForm] = useState({
    name: "",
    location: "",
    description: "",
    status: "AKTIF",
    leaderId: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetch("/api/leaders")
      .then((res) => res.json())
      .then((data) => setLeaders(Array.isArray(data) ? data : []))
      .catch(() => setLeaders([]));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError("Tanggal deadline tidak boleh lebih awal dari tanggal mulai");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          leaderId: form.leaderId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menambah project");
      }

      router.push("/dashboard/project");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white";

  return (
    <div className="max-w-xl space-y-6 text-gray-900">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Project</h1>
        <p className="text-sm text-gray-600 mt-1">
          Isi tanggal mulai dan deadline project
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Nama Project</label>
          <input name="name" value={form.name} onChange={handleChange} required className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Lokasi</label>
          <input name="location" value={form.location} onChange={handleChange} required className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Deskripsi</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3} className={inputClass} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Tanggal Mulai</label>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Deadline</label>
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Status</label>
          <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
            <option value="AKTIF">AKTIF</option>
            <option value="SELESAI">SELESAI</option>
            <option value="TERTUNDA">TERTUNDA</option>
            <option value="DIBATALKAN">DIBATALKAN</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Leader</label>
          <select name="leaderId" value={form.leaderId} onChange={handleChange} className={inputClass}>
            <option value="">Pilih leader (opsional)</option>
            {leaders.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{error}</div>}

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="px-4 py-2.5 rounded-xl border border-gray-300">
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-orange-500 text-white font-medium disabled:opacity-70"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}