"use client";

import { useEffect, useState } from "react";

type Item = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  condition: string;
  notes?: string | null;
};

const PRESETS = [
  "Full Body Harness",
  "Sit Harness",
  "Helmet",
  "Carabiner Locking",
  "Carabiner Scaffold Hook",
  "Descender (I'D / Stop / Rig)",
  "Hand Ascender",
  "Chest Ascender / Croll",
  "Backup Device (ASAP / Shunt)",
  "Cow's Tail / Lanyard",
  "Static Rope",
  "Anchor Sling",
  "Pulley",
  "Gloves",
  "Safety Boots",
];

export default function ProjectEquipment({
  projectId,
  canEdit,
}: {
  projectId: string;
  canEdit: boolean;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState("BAIK");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/equipment?projectId=${projectId}`, { cache: "no-store" });
    const data = await res.json();
    setItems(Array.isArray(data?.items) ? data.items : []);
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        name,
        category: "PPE",
        quantity,
        condition,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setName("");
      setQuantity(1);
      load();
    } else {
      const data = await res.json();
      alert(data.error || "Gagal menambah peralatan");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus peralatan ini?")) return;
    const res = await fetch("/api/equipment", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) load();
  };

  const inputClass = "border border-gray-300 rounded-xl px-3 py-2 text-gray-900 bg-white";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 text-gray-900">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-gray-900">Peralatan Safety Project</h2>
        <a
          href={`/print/equipment?projectId=${projectId}`}
          target="_blank"
          className="text-sm text-orange-600 font-medium"
        >
          Unduh PDF
        </a>
      </div>

      {canEdit && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required>
            <option value="">Pilih peralatan</option>
            {PRESETS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
          <select className={inputClass} value={condition} onChange={(e) => setCondition(e.target.value)}>
            <option value="BAIK">BAIK</option>
            <option value="PERLU_CEK">PERLU CEK</option>
            <option value="RUSAK">RUSAK</option>
          </select>
          <button disabled={loading} className="bg-orange-500 text-white rounded-xl px-4 py-2 font-medium">
            {loading ? "Menyimpan..." : "Tambah"}
          </button>
        </form>
      )}

      <div className="divide-y">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">Belum ada peralatan di project ini</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {item.quantity} unit • {item.condition.replace("_", " ")}
                </p>
              </div>
              {canEdit && (
                <button onClick={() => handleDelete(item.id)} className="text-red-600 text-sm">
                  Hapus
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}