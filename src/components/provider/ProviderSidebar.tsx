"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Video,
  BarChart3,
  Heart,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/provider/dashboard", icon: LayoutDashboard },
  { label: "Appointments", href: "/provider/appointments", icon: Calendar },
  { label: "Patients", href: "/provider/patients", icon: Users },
  { label: "Consultations", href: "/provider/consultations", icon: Video },
  { label: "Analytics", href: "/provider/analytics", icon: BarChart3 },
];

interface ProviderSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function ProviderSidebar({ open, onClose }: ProviderSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-slate-900 transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold text-white">Longevity+</span>
              <span className="ml-1.5 rounded-full bg-violet-500/20 px-1.5 py-px text-[10px] font-medium text-violet-300">
                Provider
              </span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/provider/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-violet-500/20 text-violet-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-slate-800">
          <p className="text-xs text-slate-500">Longevity & Optimization</p>
          <p className="text-xs text-slate-600">Provider Portal</p>
        </div>
      </aside>
    </>
  );
}
