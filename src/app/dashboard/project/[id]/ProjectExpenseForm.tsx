"use client";

import { useEffect, useState } from "react";

type Expense = {
  id: string;
  amount: number;
  description: string | null;
  status: string;
  createdAt: string;
};

function money(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

export default function ProjectExpenseForm({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [rows, setRows] = useState<Expense[]>([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/expenses?projectId=${projectId}`, { cache: "no-store" });
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, projectName, amount, description }),
    });
    setSaving(false);
    if (res.ok) {
      setAmount("");
      setDescription("");
      load();
    } else {
      alert("Gagal menyimpan pengeluaran");
    }
  };

  const input = "border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 text-gray-900">
      <h2 className="font-semibold">Pengeluaran Project</h2>
      <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Jumlah"
          required
          className={input}
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Kebutuhan, contoh: tali, cat"
          className={input}
        />
        <button
          disabled={saving}
          className="bg-orange-500 text-white rounded-xl px-4 py-2.5 font-medium disabled:opacity-70"
        >
          {saving ? "Menyimpan..." : "Tambah Pengeluaran"}
        </button>
      </form>

      <div className="space-y-2">
        {rows.length === 0 && <p className="text-sm text-gray-500">Belum ada pengeluaran</p>}
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between border rounded-xl px-3 py-2 text-sm">
            <div>
              <p className="font-medium">{r.description || "Pengeluaran"}</p>
              <p className="text-xs text-gray-500">
                {new Date(r.createdAt).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{money(r.amount)}</p>
              <p className={r.status === "SUDAH" ? "text-green-600 text-xs" : "text-orange-600 text-xs"}>
                {r.status === "SUDAH" ? "Sudah direimburse" : "Menunggu"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}