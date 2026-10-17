"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  const user = {
    name: session?.user?.name ?? null,
    email: session?.user?.email ?? null,
    role: (session?.user as any)?.role,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="md:hidden sticky top-0 z-40 bg-[#0B1C2C] text-white px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-white/10"
        >
          <Menu className="w-6 h-6" />
        </button>
        <p className="font-semibold text-sm">PT VERTIKAL BUANA</p>
        <div className="w-8" />
      </div>

      <div className="flex">
        <div className="hidden md:block">
          <Sidebar user={user} />
        </div>

        {open && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] h-full">
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 z-10 text-white p-2"
              >
                <X className="w-5 h-5" />
              </button>
              <div onClick={() => setOpen(false)}>
                <Sidebar user={user} />
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}