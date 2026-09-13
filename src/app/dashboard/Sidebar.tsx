"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  ClipboardList,
  LogOut,
  HardHat,
} from "lucide-react";
import { signOut } from "next-auth/react";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

const allMenuItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "LEADER", "PENGAWAS"],
  },
  {
    href: "/dashboard/project",
    label: "Projects",
    icon: FolderKanban,
    roles: ["ADMIN", "LEADER", "PENGAWAS"],
  },
  {
    href: "/dashboard/workers",
    label: "Workers",
    icon: Users,
    roles: ["ADMIN", "LEADER", "PENGAWAS"],
  },
  {
  href: "/dashboard/attendance",
  label: "Absensi",
  icon: ClipboardList,
  roles: ["ADMIN", "LEADER"],
},
  {
    href: "/dashboard/salaries",
    label: "Gaji",
    icon: ClipboardList,
    roles: ["ADMIN"],
  },
  {
    href: "/dashboard/reports",
    label: "Reports",
    icon: ClipboardList,
    roles: ["ADMIN", "LEADER", "PENGAWAS"],
  },

  {
  href: "/dashboard/leaders",
  label: "Leader",
  icon: Users,
  roles: ["ADMIN"],
},
  
];

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = allMenuItems.filter((item) =>
    item.roles.includes(user.role || "PENGAWAS")
  );

  return (
    <aside className="w-64 bg-[#0B1C2C] text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="PT Vertikal Buana"
            className="w-10 h-10 rounded-xl object-cover"
          />
          <div>
            <h1 className="font-bold text-sm leading-tight">PT VERTIKAL</h1>
            <p className="text-xs text-orange-400">BUANA</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="px-4 py-2 mb-2">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-gray-400 truncate">{user.role}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}