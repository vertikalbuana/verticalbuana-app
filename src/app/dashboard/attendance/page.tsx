"use client";

import { useEffect, useState } from "react";

type WorkerOpt = { id: string; name: string; position: string };
type ProjectOpt = {
  id: string;
  name: string;
  workers: { worker: WorkerOpt }[];
};

type AttendanceRow = {
  id: string;
  type: string;
  datetime: string;
  notes: string | null;
  photoUrl: string | null;
  worker: { name: string; position: string };
  project: { name: string };
};

export default function AttendancePage() {
  const [projects, setProjects] = useState<ProjectOpt[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRow[]>([]);
  const [projectId, setProjectId] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [type, setType] = useState("MASUK");
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    const [formRes, listRes] = await Promise.all([
      fetch("/api/attendance/form-data"),
      fetch("/api/attendance"),
    ]);
    const formJson = await formRes.json();
    const listJson = await listRes.json();
    setProjects(Array.isArray(formJson) ? formJson : []);
    setAttendances(Array.isArray(listJson) ? listJson : []);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const selectedProject = projects.find((p) => p.id === projectId);
  const workers = selectedProject?.workers.map((w) => w.worker) || [];

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setUploading(false);

    if (res.ok) {
      setPhotoUrl(data.url);
    } else {
      alert(data.error || "Gagal upload foto");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        workerId,
        type,
        notes,
        photoUrl,
      }),
    });

    setSaving(false);

    if (res.ok) {
      setNotes("");
      setPhotoUrl("");
      setPreview("");
      await loadAll();
      alert("Absensi berhasil disimpan");
    } else {
      const data = await res.json();
      alert(data.error || "Gagal menyimpan absensi");
    }
  };

  const inputClass =
    "w-full border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white outline-none focus:ring-2 focus:ring-orange-500";

  return (
    <div className="space-y-6 text-gray-900">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Absensi & Progress</h1>
        <p className="text-sm text-gray-600 mt-1">
          Leader dapat input absensi harian dan foto progress pekerja
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Project
            </label>
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setWorkerId("");
              }}
              required
              className={inputClass}
            >
              <option value="">Pilih project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Pekerja
            </label>
            <select
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Pilih pekerja</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} - {w.position}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Tipe
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={inputClass}
            >
              <option value="MASUK">Masuk / Hadir</option>
              <option value="SELESAI">Selesai / Pulang</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Foto Progress
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="w-full text-sm text-gray-800"
            />
            {uploading && (
              <p className="text-xs text-orange-600 mt-1">Mengupload foto...</p>
            )}
          </div>
        </div>

        {preview && (
          <img
            src={preview}
            alt="Preview progress"
            className="w-40 h-40 object-cover rounded-xl border"
          />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            Catatan Progress
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Contoh: pengecoran lantai 3 selesai 60%"
          />
        </div>

        <button
          type="submit"
          disabled={saving || uploading}
          className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-medium disabled:opacity-70"
        >
          {saving ? "Menyimpan..." : "Simpan Absensi"}
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-900">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Waktu</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Pekerja</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Project</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Tipe</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Foto</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Belum ada data absensi
                  </td>
                </tr>
              ) : (
                attendances.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3">
                      {new Date(a.datetime).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{a.worker.name}</div>
                      <div className="text-xs text-gray-500">{a.worker.position}</div>
                    </td>
                    <td className="px-4 py-3">{a.project.name}</td>
                    <td className="px-4 py-3">{a.type}</td>
                    <td className="px-4 py-3">
                      {a.photoUrl ? (
                        <a
                          href={a.photoUrl}
                          target="_blank"
                          className="text-orange-600 underline"
                        >
                          Lihat foto
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">{a.notes || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}