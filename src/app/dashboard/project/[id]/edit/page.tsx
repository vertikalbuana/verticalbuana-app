"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Leader = { id: string; name: string };

function toInputDate(value?: string | Date | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

async function readJson(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }
  return res.json();
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    const load = async () => {
      try {
        const [projectRes, leaderRes] = await Promise.all([
          fetch(`/api/projects/${id}`),
          fetch("/api/leaders"),
        ]);

        const project = await readJson(projectRes);
        const leaderData = await readJson(leaderRes);

        if (!projectRes.ok || !project) {
          throw new Error("Gagal memuat data project");
        }

        setLeaders(Array.isArray(leaderData) ? leaderData : []);
        setForm({
          name: project.name || "",
          location: project.location || "",
          description: project.description || "",
          status: project.status || "AKTIF",
          leaderId: project.leaderId || "",
          startDate: toInputDate(project.startDate),
          endDate: toInputDate(project.endDate),
        });
      } catch (err: any) {
        setError(err.message || "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError("Deadline tidak boleh lebih awal dari tanggal mulai");
      return;
    }

    setSaving(true);
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);

    if (res.ok) {
      router.push(`/dashboard/project/${id}`);
      router.refresh();
      return;
    }

    const data = await readJson(res);
    setError(data?.error || "Gagal menyimpan project");
  };

  const inputClass =
    "w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white";

  if (loading) {
    return <p className="text-gray-600">Memuat data project...</p>;
  }

  return (
    <div className="max-w-xl space-y-6 text-gray-900">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
        <p className="text-sm text-gray-600 mt-1">
          Ubah data project, tanggal mulai, dan deadline
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

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
            <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Deadline</label>
            <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Status</label>
          <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
            <option value="SOON">SOON</option>
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

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="px-4 py-2.5 rounded-xl border border-gray-300">
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-orange-500 text-white font-medium disabled:opacity-70"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}