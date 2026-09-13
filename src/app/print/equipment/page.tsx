"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Item = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  condition: string;
  notes?: string | null;
};

export default function EquipmentPrintPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "";
  const [items, setItems] = useState<Item[]>([]);
  const [projectName, setProjectName] = useState("-");
  const [leaderName, setLeaderName] = useState("-");

  useEffect(() => {
    const load = async () => {
      const query = projectId && projectId !== "all" ? `?projectId=${projectId}` : "";
      const res = await fetch(`/api/equipment${query}`, { cache: "no-store" });
      const data = await res.json();

      setItems(Array.isArray(data?.items) ? data.items : []);
      setProjectName(data?.project?.name || data?.projects?.[0]?.name || "Semua Project");
      setLeaderName(
        data?.project?.leader?.name ||
        data?.projects?.[0]?.leader?.name ||
        data?.items?.[0]?.project?.leader?.name ||
        "-"
      );

      setTimeout(() => window.print(), 400);
    };
    load();
  }, [projectId]);

  return (
    <div className="p-10 bg-white text-black min-h-screen">
      <h1 className="text-2xl font-bold">Laporan Peralatan Safety</h1>
      <p className="mt-2">PT Vertikal Buana</p>
      <p>Project: {projectName}</p>
      <p>Leader: {leaderName}</p>
      <p className="mb-6">Tanggal cetak: {new Date().toLocaleDateString("id-ID")}</p>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="border p-2 text-left">No</th>
            <th className="border p-2 text-left">Peralatan</th>
            <th className="border p-2 text-left">Kategori</th>
            <th className="border p-2 text-left">Jumlah</th>
            <th className="border p-2 text-left">Kondisi</th>
            <th className="border p-2 text-left">Catatan</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id}>
              <td className="border p-2">{i + 1}</td>
              <td className="border p-2">{item.name}</td>
              <td className="border p-2">{item.category}</td>
              <td className="border p-2">{item.quantity}</td>
              <td className="border p-2">{item.condition}</td>
              <td className="border p-2">{item.notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}