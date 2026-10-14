"use client";

import { useEffect, useState } from "react";

type Expense = {
  id: string;
  projectName: string;
  userName: string;
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

export default function ExpensesPanel() {
  const [rows, setRows] = useState<Expense[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    const res = await fetch("/api/expenses", { cache: "no-store" });
    const text = await res.text();
    try {
      const data = text ? JSON.parse(text) : [];
      if (!res.ok) {
        setError(data.error || "Gagal memuat pengeluaran");
        setRows([]);
        return;
      }
      setError("");
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setError("API pengeluaran tidak mengembalikan data");
      setRows([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Hapus pengeluaran ini? Data juga hilang di halaman Leader.")) return;
    await fetch("/api/expenses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const waiting = rows.reduce((a, b) => a + Number(b.amount || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Pengeluaran yang Harus Direimburse</h2>
        <p className="text-sm text-orange-600 font-medium">Total: {money(waiting)}</p>
      </div>
      {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}
      <table className="w-full text-sm text-gray-900">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3">Tanggal</th>
            <th className="text-left px-4 py-3">Project</th>
            <th className="text-left px-4 py-3">Leader</th>
            <th className="text-left px-4 py-3">Kebutuhan</th>
            <th className="text-left px-4 py-3">Jumlah</th>
            <th className="text-left px-4 py-3">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                Belum ada pengeluaran
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  {new Date(r.createdAt).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })}
                </td>
                <td className="px-4 py-3">{r.projectName}</td>
                <td className="px-4 py-3">{r.userName}</td>
                <td className="px-4 py-3">{r.description || "-"}</td>
                <td className="px-4 py-3 font-medium">{money(r.amount)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => remove(r.id)} className="text-red-600 font-medium">
                    Hapus setelah reimburse
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}