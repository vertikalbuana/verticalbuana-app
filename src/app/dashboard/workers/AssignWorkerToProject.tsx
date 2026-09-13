"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Project = { id: string; name: string };
type Worker = { id: string; name: string; position: string };

export default function AssignWorkerToProject({
  projects,
}: {
  projects: Project[];
}) {
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerId, setWorkerId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/workers")
      .then((res) => res.json())
      .then((data) => setWorkers(Array.isArray(data) ? data : []))
      .catch(() => setWorkers([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/assign-worker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workerId, projectId }),
    });

    setLoading(false);

    if (res.ok) {
      setWorkerId("");
      setProjectId("");
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Gagal memindahkan pekerja");
    }
  };

  const inputClass =
    "border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-3 gap-3"
    >
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

      <select
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
        required
        className={inputClass}
      >
        <option value="">Pilih project tujuan</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={loading}
        className="bg-orange-500 text-white rounded-xl px-4 py-2.5 font-medium disabled:opacity-70"
      >
        {loading ? "Memindahkan..." : "Pindahkan ke Project"}
      </button>
    </form>
  );
}