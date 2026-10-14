"use client";

import { useEffect, useState } from "react";

export default function ManualAttendancePage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/attendance/form-data")
      .then((r) => r.json())
      .then((d) => setProjects(Array.isArray(d) ? d : []));
  }, []);

  const project = projects.find((p) => p.id === projectId);
  const workers = project?.workers || [];

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/attendance/backdate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, workerId, date }),
    });
    const data = await res.json();
    setLoading(false);
    setMessage(res.ok ? "Absensi tersimpan dan ikut terhitung di gaji" : data.error || "Gagal");
  };

  const input = "w-full border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white";

  return (
    <div className="max-w-xl space-y-4 text-gray-900">
      <h1 className="text-2xl font-bold">Absensi Tanggal Lampau</h1>
      <p className="text-sm text-gray-500">Hanya Admin. Data ini langsung dipakai perhitungan gaji.</p>
      <form onSubmit={save} className="bg-white border rounded-2xl p-5 space-y-3">
        <select className={input} value={projectId} onChange={(e) => { setProjectId(e.target.value); setWorkerId(""); }} required>
          <option value="">Pilih project</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className={input} value={workerId} onChange={(e) => setWorkerId(e.target.value)} required>
          <option value="">Pilih pekerja</option>
          {workers.map((pw: any) => (
            <option key={pw.workerId || pw.worker?.id} value={pw.workerId || pw.worker?.id}>
              {pw.worker?.name || pw.name}
            </option>
          ))}
        </select>
        <input className={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        {message && <p className="text-sm">{message}</p>}
        <button disabled={loading} className="bg-orange-500 text-white px-4 py-2.5 rounded-xl">
          {loading ? "Menyimpan..." : "Simpan Absensi"}
        </button>
      </form>
    </div>
  );
}