"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";

type Item = {
  id: string;
  description: string;
  photoUrl?: string | null;
  photos?: string[];
  createdAt: string;
};

export default function ProjectProgress({
  projectId,
  canEdit,
  isAdmin,
}: {
  projectId: string;
  canEdit: boolean;
  isAdmin: boolean;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [editId, setEditId] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const res = await fetch(`/api/progress?projectId=${projectId}`, { cache: "no-store" });
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    setItems(
      list.map((item: Item) => ({
        ...item,
        photos: item.photos && item.photos.length > 0
          ? item.photos
          : item.photoUrl
          ? [item.photoUrl]
          : [],
      }))
    );
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const handlePhotos = (files?: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        if (result) setPhotos((prev) => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const resetForm = () => {
    setDescription("");
    setPhotos([]);
    setEditId("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/progress", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId || undefined,
        projectId,
        description,
        photos,
        photoUrl: photos[0] || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Gagal menyimpan progress");
      return;
    }

    resetForm();
    load();
  };

  const handleEdit = (item: Item) => {
    setEditId(item.id);
    setDescription(item.description);
    setPhotos(item.photos || (item.photoUrl ? [item.photoUrl] : []));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus progress ini?")) return;
    const res = await fetch("/api/progress", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) load();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 text-gray-900">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-semibold text-gray-900">Update Progress Pekerjaan</h2>
        <a
          href={`/print/progress?projectId=${projectId}`}
          target="_blank"
          className="text-sm bg-gray-900 text-white px-4 py-2 rounded-xl font-medium"
        >
          Unduh Semua PDF
        </a>
      </div>

      {canEdit && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white"
            rows={3}
            placeholder="Tulis deskripsi progress hari ini"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handlePhotos(e.target.files)}
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            <Camera className="w-4 h-4" />
            {photos.length > 0 ? `Upload Foto (${photos.length})` : "Upload Foto"}
          </button>

          {photos.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {photos.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt={`Foto ${i + 1}`} className="w-24 h-24 object-cover rounded-xl border" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full text-xs"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            {editId && (
              <button type="button" onClick={resetForm} className="px-4 py-2.5 rounded-xl border">
                Batal
              </button>
            )}
            <button
              disabled={loading}
              className="bg-orange-500 text-white px-4 py-2.5 rounded-xl font-medium disabled:opacity-70"
            >
              {loading ? "Menyimpan..." : editId ? "Simpan Perubahan" : "Tambah Progress"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada update progress</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="border border-gray-100 rounded-xl p-4 space-y-2">
              {(item.photos || []).length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {item.photos!.map((src, i) => (
                    <img key={i} src={src} alt="Progress" className="w-40 h-40 object-cover rounded-xl" />
                  ))}
                </div>
              )}
              <p className="text-gray-900">{item.description}</p>
              <p className="text-xs text-gray-500">
                {new Date(item.createdAt).toLocaleString("id-ID")}
              </p>
              <div className="flex gap-3">
                {canEdit && (
                  <button onClick={() => handleEdit(item)} className="text-orange-600 text-sm font-medium">
                    Edit
                  </button>
                )}
                {isAdmin && (
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 text-sm font-medium">
                    Hapus
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}