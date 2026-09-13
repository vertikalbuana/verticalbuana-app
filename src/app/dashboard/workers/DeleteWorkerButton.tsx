"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteWorkerButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const ok = confirm(`Hapus pekerja "${name}"?`);
    if (!ok) return;

    setLoading(true);
    const res = await fetch(`/api/workers/${id}`, {
      method: "DELETE",
    });
    setLoading(false);

    if (res.ok) {
      router.refresh();
    } else {
      alert("Gagal menghapus pekerja");
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-60"
    >
      {loading ? "Menghapus..." : "Hapus"}
    </button>
  );
}