import { apiClient } from "./client";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  VerifyEmailRequest,
  ResendOtpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  RefreshTokenResponse,
  UserMe,
} from "@/types/auth";

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>("/auth/login", data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    apiClient.post("/auth/register", data).then((r) => r.data),

  verifyEmail: (data: VerifyEmailRequest) =>
    apiClient.post("/auth/verify-email", data).then((r) => r.data),

  resendOtp: (data: ResendOtpRequest) =>
    apiClient.post("/auth/resend-otp", data).then((r) => r.data),

  forgotPassword: (data: ForgotPasswordRequest) =>
    apiClient.post("/auth/forgot-password", data).then((r) => r.data),

  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.post("/auth/reset-password", data).then((r) => r.data),

  refresh: (refresh_token: string) =>
    apiClient
      .post<RefreshTokenResponse>("/auth/refresh", { refresh_token })
      .then((r) => r.data),

  logout: (refresh_token: string) =>
    apiClient.post("/auth/logout", { refresh_token }).then((r) => r.data),

  me: () => apiClient.get<UserMe>("/auth/me").then((r) => r.data),

  googleLogin: (token: string) =>
    apiClient
      .post<LoginResponse>("/auth/google-login", { token })
      .then((r) => r.data),

  getUsers: (params?: { limit?: number; offset?: number }) =>
    apiClient
      .get<{ users: AdminUser[]; total: number }>("/auth/users", { params })
      .then((r) => r.data),

  changeUserRole: (userId: string, roleName: string) =>
    apiClient
      .put(`/auth/users/${userId}/role?role_name=${encodeURIComponent(roleName)}`)
      .then((r) => r.data),
};

export interface AdminUser {
  id: string;
  email: string;
  role: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string | null;
}
