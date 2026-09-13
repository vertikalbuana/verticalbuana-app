"use client";

import { useEffect, useState } from "react";

type SalaryRow = {
  workerId: string;
  name: string;
  position: string;
  employmentType: string;
  dailyRate: number;
  monthlySalary: number;
  attendanceDays: number;
  cashAdvanceTotal: number;
  totalAmount: number;
  netAmount: number;
};

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function SalariesPage() {
  const [data, setData] = useState<SalaryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [workerId, setWorkerId] = useState("");
  const [employmentType, setEmploymentType] = useState("HARIAN");
  const [dailyRate, setDailyRate] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [savingSalary, setSavingSalary] = useState(false);

  const [kasbonWorkerId, setKasbonWorkerId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [savingKasbon, setSavingKasbon] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const res = await fetch("/api/salaries");
    const json = await res.json();
    setData(Array.isArray(json) ? json : []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const selected = data.find((w) => w.workerId === workerId);
    if (selected) {
      setEmploymentType(selected.employmentType || "HARIAN");
      setDailyRate(String(selected.dailyRate || ""));
      setMonthlySalary(String(selected.monthlySalary || ""));
    }
  }, [workerId, data]);

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId) return;

    setSavingSalary(true);
    const res = await fetch(`/api/workers/${workerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employmentType,
        dailyRate: Number(dailyRate || 0),
        monthlySalary: Number(monthlySalary || 0),
      }),
    });
    setSavingSalary(false);

    if (res.ok) {
      await loadData();
      alert("Data gaji berhasil disimpan");
    } else {
      alert("Gagal menyimpan data gaji");
    }
  };

  const handleKasbon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKasbon(true);

    const res = await fetch("/api/cash-advances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workerId: kasbonWorkerId,
        amount,
        notes,
      }),
    });

    setSavingKasbon(false);

    if (res.ok) {
      setAmount("");
      setNotes("");
      loadData();
    } else {
      alert("Gagal menambah kasbon");
    }
  };

  const totalAnggaran = data.reduce((a, b) => a + b.totalAmount, 0);
  const totalKasbon = data.reduce((a, b) => a + b.cashAdvanceTotal, 0);
  const totalBersih = data.reduce((a, b) => a + b.netAmount, 0);

  return (
    <div className="space-y-6 text-gray-900">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Gaji Pekerja</h1>
        <p className="text-sm text-gray-600 mt-1">
          Hanya Admin yang dapat melihat dan mengelola gaji
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Anggaran Gaji</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {formatRupiah(totalAnggaran)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Kasbon</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {formatRupiah(totalKasbon)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Gaji Bersih</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {formatRupiah(totalBersih)}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSaveSalary}
        className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3"
      >
        <h2 className="font-semibold text-gray-900">Input Data Gaji Pekerja</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={workerId}
            onChange={(e) => setWorkerId(e.target.value)}
            required
            className="border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white"
          >
            <option value="">Pilih pekerja</option>
            {data.map((w) => (
              <option key={w.workerId} value={w.workerId}>
                {w.name}
              </option>
            ))}
          </select>

          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white"
          >
            <option value="HARIAN">Harian</option>
            <option value="BULANAN">Bulanan</option>
            <option value="PKWT">PKWT</option>
            <option value="BORONGAN">Borongan</option>
          </select>

          {(employmentType === "HARIAN" || employmentType === "BORONGAN") && (
            <input
              type="number"
              placeholder="Tarif harian"
              value={dailyRate}
              onChange={(e) => setDailyRate(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white"
            />
          )}

          {(employmentType === "BULANAN" || employmentType === "PKWT") && (
            <input
              type="number"
              placeholder="Gaji bulanan"
              value={monthlySalary}
              onChange={(e) => setMonthlySalary(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white"
            />
          )}

          <button
            type="submit"
            disabled={savingSalary}
            className="bg-orange-500 text-white rounded-xl px-4 py-2.5 font-medium disabled:opacity-70"
          >
            {savingSalary ? "Menyimpan..." : "Simpan Gaji"}
          </button>
        </div>
      </form>

      <form
        onSubmit={handleKasbon}
        className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3"
      >
        <h2 className="font-semibold text-gray-900">Tambah Kasbon</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={kasbonWorkerId}
            onChange={(e) => setKasbonWorkerId(e.target.value)}
            required
            className="border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white"
          >
            <option value="">Pilih pekerja</option>
            {data.map((w) => (
              <option key={w.workerId} value={w.workerId}>
                {w.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Jumlah kasbon"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white"
          />

          <input
            placeholder="Catatan"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white"
          />

          <button
            type="submit"
            disabled={savingKasbon}
            className="bg-orange-500 text-white rounded-xl px-4 py-2.5 font-medium disabled:opacity-70"
          >
            {savingKasbon ? "Menyimpan..." : "Tambah Kasbon"}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-900">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Nama</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Jenis</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Tarif</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Hari Absen</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Total Gaji</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Kasbon</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Gaji Bersih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Belum ada data pekerja
                  </td>
                </tr>
              ) : (
                data.map((w) => (
                  <tr key={w.workerId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{w.name}</div>
                      <div className="text-xs text-gray-500">{w.position}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-800">{w.employmentType}</td>
                    <td className="px-4 py-3 text-gray-800">
                      {w.employmentType === "HARIAN" || w.employmentType === "BORONGAN"
                        ? formatRupiah(w.dailyRate)
                        : formatRupiah(w.monthlySalary)}
                    </td>
                    <td className="px-4 py-3 text-gray-800">{w.attendanceDays} hari</td>
                    <td className="px-4 py-3 text-gray-800">{formatRupiah(w.totalAmount)}</td>
                    <td className="px-4 py-3 text-gray-800">{formatRupiah(w.cashAdvanceTotal)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {formatRupiah(w.netAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}