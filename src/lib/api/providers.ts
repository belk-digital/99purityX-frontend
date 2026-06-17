import { apiClient } from "./client";
import type { Provider } from "@/types/provider";

export interface CreateProviderRequest {
  user_id: string;
  provider_type: string;
  speciality: string;
  license_number?: string;
  years_experience?: number;
  bio?: string;
  consultation_fee?: number;
}

export const providersApi = {
  getAll: () =>
    apiClient.get<Provider[]>("/providers").then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Provider>(`/providers/${id}`).then((r) => r.data),

  create: (data: CreateProviderRequest) =>
    apiClient.post<Provider>("/providers", data).then((r) => r.data),
};
