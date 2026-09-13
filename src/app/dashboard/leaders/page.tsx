"use client";

import { useEffect, useState } from "react";

type Leader = {
  id: string;
  name: string;
  email: string;
  visiblePassword?: string | null;
};

async function readJson(res: Response) {
  const type = res.headers.get("content-type") || "";
  if (!type.includes("application/json")) return null;
  return res.json();
}

export default function LeadersPage() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [updating, setUpdating] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    const res = await fetch("/api/leaders", { cache: "no-store" });
    const data = await readJson(res);
    setLeaders(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    setName("");
    setEmail("");
    setPassword("");
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/leaders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data?.error || "Gagal menambah leader");
      setSuccess(`Leader ${data.name} berhasil ditambahkan`);
      setName("");
      setEmail("");
      setPassword("");
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (leader: Leader) => {
    if (!confirm(`Hapus leader "${leader.name}"?`)) return;
    setDeleting(leader.id);
    const res = await fetch("/api/leaders", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: leader.id }),
    });
    setDeleting("");
    const data = await readJson(res);
    if (res.ok) await load();
    else alert(data?.error || "Gagal menghapus leader");
  };

  const handleChangePassword = async (leader: Leader) => {
    const nextPassword = prompt(
      `Password baru untuk ${leader.name}\nPassword sekarang: ${leader.visiblePassword || "-"}`
    );
    if (!nextPassword) return;

    setUpdating(leader.id);
    const res = await fetch("/api/leaders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: leader.id, password: nextPassword }),
    });
    setUpdating("");
    const data = await readJson(res);
    if (res.ok) {
      await load();
      alert(`Password ${leader.name} berhasil diubah`);
    } else {
      alert(data?.error || "Gagal mengubah password");
    }
  };

  const inputClass =
    "w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 bg-white outline-none focus:ring-2 focus:ring-orange-500";

  return (
    <div className="space-y-6 text-gray-900">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Akun Leader</h1>
        <p className="text-sm text-gray-600 mt-1">
          Tambah, lihat password, ubah password, atau hapus akun leader
        </p>
      </div>

      <form onSubmit={handleSubmit} autoComplete="off" className="bg-white rounded-2xl border p-5 space-y-4 max-w-xl">
        <input
          className={inputClass}
          placeholder="Nama leader"
          name="vb_leader_name"
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className={inputClass}
          type="text"
          placeholder="Email login"
          name="vb_leader_email"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className={inputClass}
          type="text"
          placeholder="Password"
          name="vb_leader_password"
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 text-sm px-4 py-2 rounded-lg">{success}</div>}
        <button disabled={loading} className="bg-orange-500 text-white px-4 py-2.5 rounded-xl font-medium disabled:opacity-70">
          {loading ? "Menyimpan..." : "Tambah Leader"}
        </button>
      </form>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-sm text-gray-900">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3">Nama</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Password</th>
              <th className="text-left px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {leaders.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  Belum ada data leader
                </td>
              </tr>
            ) : (
              leaders.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 font-medium">{l.name}</td>
                  <td className="px-4 py-3">{l.email}</td>
                  <td className="px-4 py-3 font-mono">{l.visiblePassword || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleChangePassword(l)} disabled={updating === l.id} className="text-orange-600 text-sm font-medium">
                        {updating === l.id ? "Mengubah..." : "Ubah Password"}
                      </button>
                      <button onClick={() => handleDelete(l)} disabled={deleting === l.id} className="text-red-600 text-sm font-medium">
                        {deleting === l.id ? "Menghapus..." : "Hapus"}
                      </button>
                    </div>
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