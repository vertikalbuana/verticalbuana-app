"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function AddWorkerPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    position: "",
    nik: "",
    phone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, projectId }),
      });

      if (!res.ok) {
        throw new Error("Gagal menambah pekerja");
      }

      router.push(`/dashboard/project/${projectId}`);
      router.refresh();
    } catch (error) {
      alert("Terjadi kesalahan");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/project/${projectId}`}
          className="p-2 rounded-xl hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Pekerja</h1>
          <p className="text-sm text-gray-500">Tambahkan pekerja ke project ini</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Contoh: Budi Santoso"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Jabatan <span className="text-red-500">*</span>
          </label>
          <select
            name="position"
            value={form.position}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          >
            <option value="">Pilih Jabatan</option>
            <option value="Mandor">Mandor</option>
            <option value="Tukang">Tukang</option>
            <option value="Tukang Besi">Tukang Besi</option>
            <option value="Tukang Kayu">Tukang Kayu</option>
            <option value="Tukang Batu">Tukang Batu</option>
            <option value="Helper">Helper</option>
            <option value="Operator">Operator</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            NIK
          </label>
          <input
            type="text"
            name="nik"
            value={form.nik}
            onChange={handleChange}
            placeholder="Nomor Induk Kependudukan"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            No. Telepon
          </label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="08xxxxxxxxxx"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-xl transition disabled:opacity-70"
          >
            <Save className="w-5 h-5" />
            {loading ? "Menyimpan..." : "Simpan Pekerja"}
          </button>
          <Link
            href={`/dashboard/project/${projectId}`}
            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}