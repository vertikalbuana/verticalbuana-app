"use client";

import { useEffect, useMemo, useState } from "react";

type Project = { id: string; name: string };
type Item = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  condition: string;
  notes?: string | null;
  projectId: string;
  project?: { id: string; name: string };
};

const PRESETS = [
  "Full Body Harness",
  "Sit Harness",
  "Chest Harness",
  "Helmet",
  "Carabiner Locking",
  "Carabiner Scaffold Hook",
  "Descender (I'D / Stop / Rig)",
  "Hand Ascender",
  "Chest Ascender / Croll",
  "Backup Device (ASAP / Shunt)",
  "Cow's Tail / Lanyard",
  "Energy Absorber",
  "Static Rope",
  "Anchor Sling",
  "Pulley",
  "Rope Protector",
  "Work Positioning Lanyard",
  "Gloves",
  "Safety Boots",
  "Gear Bag",
];

async function readJson(res: Response) {
  const type = res.headers.get("content-type") || "";
  if (!type.includes("application/json")) return null;
  return res.json();
}

export default function EquipmentPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("PPE");
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState("BAIK");
  const [notes, setNotes] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async (pid?: string) => {
    const query = pid ? `?projectId=${pid}` : "";
    const res = await fetch(`/api/equipment${query}`, { cache: "no-store" });
    const data = await readJson(res);
    setItems(Array.isArray(data?.items) ? data.items : []);
    setProjects(Array.isArray(data?.projects) ? data.projects : []);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!filterProject) return items;
    return items.filter((i) => i.projectId === filterProject);
  }, [items, filterProject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category,
        quantity,
        condition,
        notes,
        projectId,
      }),
    });

    const data = await readJson(res);
    setLoading(false);

    if (!res.ok) {
      setError(data?.error || "Gagal menambah peralatan");
      return;
    }

    setName("");
    setNotes("");
    setQuantity(1);
    await load(filterProject || undefined);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus peralatan ini?")) return;
    const res = await fetch("/api/equipment", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) load(filterProject || undefined);
  };

  const downloadPdf = () => {
    const pid = filterProject || "all";
    window.open(`/print/equipment?projectId=${pid}`, "_blank");  };

  const inputClass =
    "w-full border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white";

  return (
    <div className="space-y-6 text-gray-900">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Peralatan Safety</h1>
          <p className="text-sm text-gray-500 mt-1">
            Inventaris rope access per project. Leader mengisi, Admin dapat melihat dan unduh PDF.
          </p>
        </div>
        <button
          onClick={downloadPdf}
          className="bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
        >
          Unduh PDF
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <select className={inputClass} value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
          <option value="">Pilih project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required>
          <option value="">Pilih peralatan</option>
          {PRESETS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="PPE">PPE</option>
          <option value="Connector">Connector</option>
          <option value="Rope">Rope</option>
          <option value="Device">Device</option>
          <option value="Anchor">Anchor</option>
          <option value="Aksesoris">Aksesoris</option>
        </select>

        <input
          type="number"
          min={1}
          className={inputClass}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          placeholder="Jumlah"
        />

        <select className={inputClass} value={condition} onChange={(e) => setCondition(e.target.value)}>
          <option value="BAIK">BAIK</option>
          <option value="PERLU_CEK">PERLU CEK</option>
          <option value="RUSAK">RUSAK</option>
        </select>

        <input
          className={inputClass}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan (opsional)"
        />

        {error && <div className="md:col-span-2 bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{error}</div>}

        <div className="md:col-span-2">
          <button disabled={loading} className="bg-orange-500 text-white px-4 py-2.5 rounded-xl font-medium disabled:opacity-70">
            {loading ? "Menyimpan..." : "Tambah Peralatan"}
          </button>
        </div>
      </form>

      <div className="flex gap-3">
        <select
          className="border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white"
          value={filterProject}
          onChange={(e) => {
            setFilterProject(e.target.value);
            load(e.target.value || undefined);
          }}
        >
          <option value="">Semua Project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-sm text-gray-900">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3">Project</th>
              <th className="text-left px-4 py-3">Peralatan</th>
              <th className="text-left px-4 py-3">Kategori</th>
              <th className="text-left px-4 py-3">Jumlah</th>
              <th className="text-left px-4 py-3">Kondisi</th>
              <th className="text-left px-4 py-3">Catatan</th>
              <th className="text-left px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Belum ada data peralatan
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">{item.project?.name || "-"}</td>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">{item.condition.replace("_", " ")}</td>
                  <td className="px-4 py-3">{item.notes || "-"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 text-sm font-medium">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}