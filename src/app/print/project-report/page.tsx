"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function ProjectReportContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "";
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/project-report?projectId=${projectId}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Gagal memuat laporan");
        return;
      }
      setData(json);
      setTimeout(() => window.print(), 1200);
    };
    if (projectId) load();
  }, [projectId]);

  if (error) return <div className="p-10 text-red-600">{error}</div>;
  if (!data) return <div className="p-10">Menyiapkan laporan...</div>;

  const project = data.project;

  return (
    <div className="p-10 bg-white text-black min-h-screen">
      <h1 className="text-2xl font-bold">Laporan Lengkap Project</h1>
      <p>PT Vertikal Buana</p>
      <p>Tanggal cetak: {new Date().toLocaleDateString("id-ID")}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. Data Project</h2>
      <p>Nama: {project.name}</p>
      <p>Lokasi: {project.location}</p>
      <p>Status: {project.status}</p>
      <p>Leader: {project.leader?.name || "-"}</p>
      <p>
        Mulai: {project.startDate ? new Date(project.startDate).toLocaleDateString("id-ID") : "-"}
      </p>
      <p>
        Deadline: {project.endDate ? new Date(project.endDate).toLocaleDateString("id-ID") : "-"}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. Daftar Pekerja</h2>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="border p-2 text-left">No</th>
            <th className="border p-2 text-left">Nama</th>
            <th className="border p-2 text-left">Jabatan</th>
          </tr>
        </thead>
        <tbody>
          {(project.workers || []).map((w: any, i: number) => (
            <tr key={w.id || i}>
              <td className="border p-2">{i + 1}</td>
              <td className="border p-2">{w.name}</td>
              <td className="border p-2">{w.position}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Peralatan Safety</h2>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="border p-2 text-left">No</th>
            <th className="border p-2 text-left">Peralatan</th>
            <th className="border p-2 text-left">Kategori</th>
            <th className="border p-2 text-left">Jumlah</th>
            <th className="border p-2 text-left">Kondisi</th>
          </tr>
        </thead>
        <tbody>
          {(data.equipments || []).map((item: any, i: number) => (
            <tr key={item.id}>
              <td className="border p-2">{i + 1}</td>
              <td className="border p-2">{item.name}</td>
              <td className="border p-2">{item.category}</td>
              <td className="border p-2">{item.quantity}</td>
              <td className="border p-2">{item.condition}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Data Absensi</h2>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="border p-2 text-left">No</th>
            <th className="border p-2 text-left">Tanggal</th>
            <th className="border p-2 text-left">Pekerja</th>
            <th className="border p-2 text-left">Tipe</th>
            <th className="border p-2 text-left">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {(data.attendances || []).map((item: any, i: number) => (
            <tr key={item.id}>
              <td className="border p-2">{i + 1}</td>
              <td className="border p-2">{new Date(item.datetime).toLocaleString("id-ID")}</td>
              <td className="border p-2">{item.worker?.name || "-"}</td>
              <td className="border p-2">{item.type}</td>
              <td className="border p-2">{item.notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Progress Pekerjaan</h2>
      {(data.progresses || []).map((item: any, i: number) => (
        <div key={item.id} className="mb-6 border-b pb-4">
          <p className="font-semibold">Progress {i + 1}</p>
          <p className="text-sm">{new Date(item.createdAt).toLocaleString("id-ID")}</p>
          <p className="my-2">{item.description}</p>
          <div className="flex flex-wrap gap-3">
            {(item.photos || []).map((src: string, idx: number) => (
              <img key={idx} src={src} alt="Progress" className="w-40 h-40 object-cover border" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProjectReportPage() {
  return (
    <Suspense fallback={<div className="p-10">Menyiapkan laporan...</div>}>
      <ProjectReportContent />
    </Suspense>
  );
}