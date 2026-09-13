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
  project?: { name: string };
};

export default function EquipmentPrintPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "";
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState("Semua Project");

  useEffect(() => {
    const load = async () => {
      const query = projectId && projectId !== "all" ? `?projectId=${projectId}` : "";
      const res = await fetch(`/api/equipment${query}`, { cache: "no-store" });
      const data = await res.json();
      const list = Array.isArray(data?.items) ? data.items : [];
      setItems(list);
      if (projectId && projectId !== "all") {
        const project = (data?.projects || []).find((p: any) => p.id === projectId);
        setTitle(project?.name || "Project");
      }
      setTimeout(() => window.print(), 500);
    };
    load();
  }, [projectId]);

  return (
    <div className="p-8 bg-white text-black">
      <h1 className="text-2xl font-bold">Laporan Peralatan Safety</h1>
      <p className="text-sm mt-1">PT Vertikal Buana</p>
      <p className="text-sm mt-1">Project: {title}</p>
      <p className="text-sm mb-6">
        Tanggal cetak: {new Date().toLocaleDateString("id-ID")}
      </p>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="border p-2 text-left">No</th>
            <th className="border p-2 text-left">Project</th>
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
              <td className="border p-2">{item.project?.name || "-"}</td>
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