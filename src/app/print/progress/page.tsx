"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Item = {
  id: string;
  description: string;
  photoUrl?: string | null;
  photos?: string[];
  createdAt: string;
  project?: {
    name?: string;
    leader?: { name?: string } | null;
  };
};

function toPhotos(item: Item) {
  if (Array.isArray(item.photos) && item.photos.length > 0) {
    return item.photos.filter(Boolean);
  }
  if (!item.photoUrl) return [];
  try {
    const parsed = JSON.parse(item.photoUrl);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {}
  return [item.photoUrl];
}

function ProgressPrintContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "";
  const [items, setItems] = useState<Item[]>([]);
  const [projectName, setProjectName] = useState("-");
  const [leaderName, setLeaderName] = useState("-");

  useEffect(() => {
    const load = async () => {
      const query = projectId ? `?projectId=${projectId}` : "";
      const res = await fetch(`/api/progress${query}`, { cache: "no-store" });
      const data = await res.json();
      const list: Item[] = Array.isArray(data) ? data : [];
      setItems(list);
      setProjectName(list[0]?.project?.name || "-");
      setLeaderName(list[0]?.project?.leader?.name || "-");

      setTimeout(() => window.print(), 1200);
    };
    load();
  }, [projectId]);

  return (
    <div className="p-10 bg-white text-black min-h-screen print:p-0">
      <h1 className="text-2xl font-bold">Laporan Progress Pekerjaan</h1>
      <p className="mt-2">PT Vertikal Buana</p>
      <p>Project: {projectName}</p>
      <p>Leader: {leaderName}</p>
      <p className="mb-6">Tanggal cetak: {new Date().toLocaleDateString("id-ID")}</p>

      {items.map((item, i) => {
        const photos = toPhotos(item);
        return (
          <div key={item.id} className="mb-8 border-b pb-6 break-inside-avoid">
            <p className="font-semibold">Progress {items.length - i}</p>
            <p className="text-sm mb-2">
              {new Date(item.createdAt).toLocaleString("id-ID")}
            </p>
            <p className="mb-3">{item.description}</p>
            {photos.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {photos.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt={`Foto progress ${idx + 1}`}
                    className="w-48 h-48 object-cover border"
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Tidak ada foto</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ProgressPrintPage() {
  return (
    <Suspense fallback={<div className="p-10">Menyiapkan PDF...</div>}>
      <ProgressPrintContent />
    </Suspense>
  );
}