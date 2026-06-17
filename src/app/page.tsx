"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { Loader2 } from "lucide-react";

const ROLE_HOME: Record<string, string> = {
  PATIENT: "/dashboard",
  DOCTOR: "/provider/dashboard",
  ADMIN: "/admin/dashboard",
  STAFF: "/provider/dashboard",
};

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(ROLE_HOME[user.role] ?? "/dashboard");
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );
}
