"use client";

import { Menu, Bell, ChevronDown, LogOut, User, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProviderTopbarProps {
  onMenuToggle: () => void;
}

function getInitials(email: string) {
  const parts = email.split("@")[0].split(/[._-]/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export function ProviderTopbar({ onMenuToggle }: ProviderTopbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const initials = user?.email ? getInitials(user.email) : "D";
  const displayName = user?.email?.split("@")[0] ?? "Provider";

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <button onClick={onMenuToggle} className="lg:hidden rounded-md p-2 text-slate-500 hover:bg-slate-100">
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <button className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-violet-500" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition-colors outline-none">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500 text-xs font-semibold text-white">
              {initials}
            </div>
            <span className="hidden text-sm font-medium text-slate-700 sm:block">{displayName}</span>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-slate-800 truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/provider/dashboard")}>
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/provider/dashboard")}>
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="flex items-center gap-2 cursor-pointer text-red-600" data-variant="destructive">
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
