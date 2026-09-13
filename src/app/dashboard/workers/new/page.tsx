"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewWorkerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    nik: "",
    position: "",
    phone: "",
    employmentType: "HARIAN",
    dailyRate: "",
    monthlySalary: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          nik: form.nik || null,
          position: form.position,
          phone: form.phone || null,
          employmentType: form.employmentType,
          dailyRate: Number(form.dailyRate || 0),
          monthlySalary: Number(form.monthlySalary || 0),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menambah pekerja");
      }

      router.push("/dashboard/workers");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white placeholder:text-gray-400";

  return (
    <div className="max-w-xl space-y-6 text-gray-900">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Pekerja</h1>
        <p className="text-sm text-gray-600 mt-1">
          Hanya Admin yang dapat menambah data pekerja
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            Nama
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            NIK
          </label>
          <input
            name="nik"
            value={form.nik}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            Jabatan
          </label>
          <input
            name="position"
            value={form.position}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            No. HP
          </label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            Jenis Kontrak
          </label>
          <select
            name="employmentType"
            value={form.employmentType}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="HARIAN">Harian</option>
            <option value="BULANAN">Bulanan</option>
            <option value="PKWT">PKWT</option>
            <option value="BORONGAN">Borongan</option>
          </select>
        </div>

        {(form.employmentType === "HARIAN" ||
          form.employmentType === "BORONGAN") && (
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Tarif Harian (Rp)
            </label>
            <input
              type="number"
              name="dailyRate"
              value={form.dailyRate}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        )}

        {(form.employmentType === "BULANAN" ||
          form.employmentType === "PKWT") && (
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Gaji Bulanan (Rp)
            </label>
            <input
              type="number"
              name="monthlySalary"
              value={form.monthlySalary}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-800 bg-white"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-orange-500 text-white font-medium disabled:opacity-70"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}