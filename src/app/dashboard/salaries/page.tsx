"use client";

import { useEffect, useState } from "react";
import ExpensesPanel from "./ExpensesPanel";

type SalaryRow = {
  workerId: string;
  name: string;
  position: string;
  type?: "LEADER" | "PEKERJA";
  employmentType: string;
  dailyRate: number;
  monthlySalary: number;
  fullDays?: number;
  halfDays?: number;
  attendanceDays: number;
  cashAdvanceTotal: number;
  incentiveTotal?: number;
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
  const [current, setCurrent] = useState<SalaryRow[]>([]);
  const [previous, setPrevious] = useState<SalaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SalaryRow | null>(null);
  const [monthTab, setMonthTab] = useState<"current" | "previous">("current");

  const [workerId, setWorkerId] = useState("");
  const [employmentType, setEmploymentType] = useState("HARIAN");
  const [dailyRate, setDailyRate] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [savingSalary, setSavingSalary] = useState(false);

  const [kasbonWorkerId, setKasbonWorkerId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [savingKasbon, setSavingKasbon] = useState(false);

  const [incentiveWorkerId, setIncentiveWorkerId] = useState("");
  const [incentiveAmount, setIncentiveAmount] = useState("");
  const [incentiveNotes, setIncentiveNotes] = useState("");
  const [savingIncentive, setSavingIncentive] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/salaries");
      const json = await res.json();
      setCurrent(Array.isArray(json.current) ? json.current : []);
      setPrevious(Array.isArray(json.previous) ? json.previous : []);
    } catch {
      setCurrent([]);
      setPrevious([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const data = monthTab === "current" ? current : previous;
  const allPeople = current.length ? current : previous;

  useEffect(() => {
    const person = allPeople.find((w) => w.workerId === workerId);
    if (person) {
      setEmploymentType(person.employmentType || "HARIAN");
      setDailyRate(String(person.dailyRate || ""));
      setMonthlySalary(String(person.monthlySalary || ""));
    }
  }, [workerId, current, previous]);

  const selectedPerson = allPeople.find((w) => w.workerId === workerId);
  const leaders = allPeople.filter((w) => w.type === "LEADER");
  const workers = allPeople.filter((w) => w.type !== "LEADER");

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId || !selectedPerson) return;
    setSavingSalary(true);
    const res = await fetch("/api/salaries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: workerId,
        type: selectedPerson.type || "PEKERJA",
        employmentType,
        dailyRate: Number(dailyRate || 0),
        monthlySalary: Number(monthlySalary || 0),
      }),
    });
    setSavingSalary(false);
    if (res.ok) {
      await loadData();
      alert("Data gaji berhasil disimpan");
    } else alert("Gagal menyimpan data gaji");
  };

  const handleKasbon = async (e: React.FormEvent) => {
    e.preventDefault();
    const person = allPeople.find((w) => w.workerId === kasbonWorkerId);
    if (!person) return;
    setSavingKasbon(true);
    const res = await fetch("/api/cash-advances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workerId: kasbonWorkerId,
        type: person.type || "PEKERJA",
        amount,
        notes,
      }),
    });
    setSavingKasbon(false);
    if (res.ok) {
      setAmount("");
      setNotes("");
      loadData();
      alert("Kasbon berhasil ditambahkan");
    } else alert("Gagal menambah kasbon");
  };

  const handleIncentive = async (e: React.FormEvent) => {
    e.preventDefault();
    const person = allPeople.find((w) => w.workerId === incentiveWorkerId);
    if (!person || !incentiveAmount) return;
    setSavingIncentive(true);
    const res = await fetch("/api/salaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workerId: incentiveWorkerId,
        type: person.type || "PEKERJA",
        amount: Number(incentiveAmount),
        notes: incentiveNotes || "Insentif / Bonus",
      }),
    });
    setSavingIncentive(false);
    if (res.ok) {
      setIncentiveAmount("");
      setIncentiveNotes("");
      loadData();
      alert("Insentif berhasil ditambahkan");
    } else alert("Gagal menambah insentif");
  };

  const printPayslip = () => {
    if (!selected) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const period = monthTab === "current" ? "Bulan Berjalan" : "Bulan Sebelumnya";
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip - ${selected.name}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; padding: 40px; color: #1e293b; }
            .payslip { max-width: 700px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #ea580c, #f97316); color: white; padding: 32px; }
            .header h1 { font-size: 22px; letter-spacing: 1px; }
            .header p { opacity: 0.9; margin-top: 4px; font-size: 13px; }
            .body { padding: 32px; }
            .name { font-size: 24px; font-weight: 700; color: #0f172a; }
            .meta { color: #64748b; margin-top: 4px; font-size: 14px; }
            .period { display: inline-block; background: #fff7ed; color: #c2410c; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-top: 12px; }
            table { width: 100%; margin-top: 24px; border-collapse: collapse; }
            td { padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .label { color: #64748b; }
            .value { text-align: right; font-weight: 500; }
            .total-row td { border-bottom: none; padding-top: 16px; }
            .total-label { font-weight: 700; font-size: 16px; }
            .total-value { font-weight: 700; font-size: 18px; color: #ea580c; text-align: right; }
            .footer { padding: 20px 32px; background: #f8fafc; text-align: center; font-size: 12px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="payslip">
            <div class="header">
              <h1>PT VERTIKAL BUANA</h1>
              <p>Payslip Gaji Karyawan</p>
            </div>
            <div class="body">
              <div class="name">${selected.name}</div>
              <div class="meta">${selected.position} · ${selected.type === "LEADER" ? "Leader" : "Pekerja"}</div>
              <div class="period">${period}</div>
              <table>
                <tr><td class="label">Jenis Gaji</td><td class="value">${selected.employmentType}</td></tr>
                <tr><td class="label">Hari Absen</td><td class="value">${selected.attendanceDays} hari</td></tr>
                <tr><td class="label">Hari Penuh</td><td class="value">${selected.fullDays || 0}</td></tr>
                <tr><td class="label">Setengah Hari</td><td class="value">${selected.halfDays || 0}</td></tr>
                <tr><td class="label">Insentif / Bonus</td><td class="value">${formatRupiah(selected.incentiveTotal || 0)}</td></tr>
                <tr><td class="label">Total Gaji</td><td class="value">${formatRupiah(selected.totalAmount)}</td></tr>
                <tr><td class="label">Kasbon</td><td class="value">${formatRupiah(selected.cashAdvanceTotal)}</td></tr>
                <tr class="total-row">
                  <td class="total-label">Gaji Bersih</td>
                  <td class="total-value">${formatRupiah(selected.netAmount)}</td>
                </tr>
              </table>
            </div>
            <div class="footer">Dicetak pada ${new Date().toLocaleString("id-ID")} · PT Vertikal Buana</div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  return (
    <div className="space-y-6 text-gray-900">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Gaji</h1>
        <p className="text-sm text-gray-600 mt-1">Klik nama untuk melihat detail dan unduh payslip</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setMonthTab("current")} className={`px-4 py-2 rounded-xl text-sm font-medium ${monthTab === "current" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700"}`}>Bulan Ini</button>
        <button onClick={() => setMonthTab("previous")} className={`px-4 py-2 rounded-xl text-sm font-medium ${monthTab === "previous" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700"}`}>Bulan Lalu</button>
      </div>

      <form onSubmit={handleSaveSalary} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <h2 className="font-semibold text-gray-900">Input Data Gaji</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={workerId} onChange={(e) => setWorkerId(e.target.value)} required className="border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white">
            <option value="">Pilih nama</option>
            <optgroup label="Leader">{leaders.map((w) => <option key={`L-${w.workerId}`} value={w.workerId}>{w.name} - Leader</option>)}</optgroup>
            <optgroup label="Pekerja">{workers.map((w) => <option key={`P-${w.workerId}`} value={w.workerId}>{w.name} - {w.position}</option>)}</optgroup>
          </select>
          <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white">
            <option value="HARIAN">Harian</option>
            <option value="BULANAN">Bulanan</option>
            <option value="PKWT">PKWT</option>
            <option value="BORONGAN">Borongan</option>
          </select>
          {(employmentType === "HARIAN" || employmentType === "BORONGAN") && (
            <input type="number" placeholder="Tarif harian" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white" />
          )}
          {(employmentType === "BULANAN" || employmentType === "PKWT") && (
            <input type="number" placeholder="Gaji bulanan" value={monthlySalary} onChange={(e) => setMonthlySalary(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white" />
          )}
          <button type="submit" disabled={savingSalary} className="bg-orange-500 text-white rounded-xl px-4 py-2.5 font-medium disabled:opacity-70">{savingSalary ? "Menyimpan..." : "Simpan Gaji"}</button>
        </div>
      </form>

      <form onSubmit={handleKasbon} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <h2 className="font-semibold text-gray-900">Tambah Kasbon</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={kasbonWorkerId} onChange={(e) => setKasbonWorkerId(e.target.value)} required className="border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white">
            <option value="">Pilih nama</option>
            <optgroup label="Leader">{leaders.map((w) => <option key={`KL-${w.workerId}`} value={w.workerId}>{w.name}</option>)}</optgroup>
            <optgroup label="Pekerja">{workers.map((w) => <option key={`KP-${w.workerId}`} value={w.workerId}>{w.name}</option>)}</optgroup>
          </select>
          <input type="number" placeholder="Jumlah" value={amount} onChange={(e) => setAmount(e.target.value)} required className="border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white" />
          <input placeholder="Catatan" value={notes} onChange={(e) => setNotes(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white" />
          <button type="submit" disabled={savingKasbon} className="bg-orange-500 text-white rounded-xl px-4 py-2.5 font-medium disabled:opacity-70">{savingKasbon ? "Menyimpan..." : "Tambah Kasbon"}</button>
        </div>
      </form>

      <form onSubmit={handleIncentive} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <h2 className="font-semibold text-gray-900">Tambah Insentif / Bonus</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={incentiveWorkerId} onChange={(e) => setIncentiveWorkerId(e.target.value)} required className="border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white">
            <option value="">Pilih nama</option>
            <optgroup label="Leader">{leaders.map((w) => <option key={`I-${w.workerId}`} value={w.workerId}>{w.name}</option>)}</optgroup>
            <optgroup label="Pekerja">{workers.map((w) => <option key={`IP-${w.workerId}`} value={w.workerId}>{w.name}</option>)}</optgroup>
          </select>
          <input type="number" placeholder="Jumlah insentif" value={incentiveAmount} onChange={(e) => setIncentiveAmount(e.target.value)} required className="border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white" />
          <input placeholder="Catatan (bonus, lembur, dll)" value={incentiveNotes} onChange={(e) => setIncentiveNotes(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white" />
          <button type="submit" disabled={savingIncentive} className="bg-orange-500 text-white rounded-xl px-4 py-2.5 font-medium disabled:opacity-70">{savingIncentive ? "Menyimpan..." : "Tambah Insentif"}</button>
        </div>
      </form>

      <ExpensesPanel />

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-900">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Nama</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Tipe</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Hari Absen</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Insentif</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Total Gaji</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Gaji Bersih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Belum ada data</td></tr>
              ) : (
                data.map((w) => (
                  <tr key={`${w.type}-${w.workerId}`} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(w)}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-orange-600 hover:underline">{w.name}</div>
                      <div className="text-xs text-gray-500">{w.position}</div>
                    </td>
                    <td className="px-4 py-3">{w.type === "LEADER" ? "Leader" : "Pekerja"}</td>
                    <td className="px-4 py-3">{w.attendanceDays} hari</td>
                    <td className="px-4 py-3">{formatRupiah(w.incentiveTotal || 0)}</td>
                    <td className="px-4 py-3">{formatRupiah(w.totalAmount)}</td>
                    <td className="px-4 py-3 font-semibold">{formatRupiah(w.netAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selected.name}</h2>
                <p className="text-sm text-gray-500">{selected.position} · {selected.type === "LEADER" ? "Leader" : "Pekerja"}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Jenis</span><span>{selected.employmentType}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Hari Absen</span><span>{selected.attendanceDays} hari</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Penuh / Setengah</span><span>{selected.fullDays || 0} / {selected.halfDays || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Insentif</span><span>{formatRupiah(selected.incentiveTotal || 0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Gaji</span><span>{formatRupiah(selected.totalAmount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Kasbon</span><span>{formatRupiah(selected.cashAdvanceTotal)}</span></div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t"><span>Gaji Bersih</span><span>{formatRupiah(selected.netAmount)}</span></div>
            </div>
            <button onClick={printPayslip} className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-medium">Unduh Payslip</button>
          </div>
        </div>
      )}
    </div>
  );
}