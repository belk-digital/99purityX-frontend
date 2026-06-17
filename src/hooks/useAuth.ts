"use client";

import { useAuthStore } from "@/stores/auth.store";
import { authApi } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { LoginRequest, RegisterRequest } from "@/types/auth";

type RegisterFormData = RegisterRequest & { confirm_password?: string };

export function useAuth() {
  const { user, isAuthenticated, setTokens, setUser, logout: clearAuth } = useAuthStore();
  const router = useRouter();

  async function login(data: LoginRequest) {
    const res = await authApi.login(data);
    setTokens(res.access_token, res.refresh_token);

    // Set cookie so the proxy can detect auth state (localStorage is not readable in middleware)
    document.cookie = `access_token=${res.access_token}; path=/; max-age=${60 * 30}; SameSite=Lax`;

    // Backend doesn't return user in login response — fetch it separately
    const me = await authApi.me();
    setUser(me);

    const roleHome: Record<string, string> = {
      PATIENT: "/dashboard",
      DOCTOR: "/provider/dashboard",
      NUTRITIONIST: "/provider/dashboard",
      CARE_COORDINATOR: "/provider/dashboard",
      ADMIN: "/admin/dashboard",
      STAFF: "/provider/dashboard",
    };
    router.push(roleHome[me.role] ?? "/dashboard");
    toast.success("Welcome back!");
  }

  async function register(data: RegisterFormData) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirm_password, ...payload } = data;
    await authApi.register(payload);
    router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    toast.success("Account created! Check your email for the OTP.");
  }

  async function logout() {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // best-effort
    } finally {
      document.cookie = "access_token=; path=/; max-age=0";
      clearAuth();
      router.push("/login");
    }
  }

  async function refreshUser() {
    const me = await authApi.me();
    setUser(me);
    return me;
  }

  return { user, isAuthenticated, login, register, logout, refreshUser };
}
