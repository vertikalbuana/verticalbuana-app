"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface Props {
  projectId: string;
  workerId: string;
  workerName: string;
}

export default function RemoveWorkerButton({ projectId, workerId, workerName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    if (!confirm(`Yakin ingin menghapus ${workerName} dari project ini?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/project-workers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, workerId }),
      });

      if (!res.ok) {
        alert("Gagal menghapus pekerja");
        return;
      }

      router.refresh();
    } catch (error) {
      alert("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
      title="Hapus dari project"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}