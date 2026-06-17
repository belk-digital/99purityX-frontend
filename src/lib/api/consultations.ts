import { apiClient } from "./client";
import type {
  Consultation,
  CreateConsultationRequest,
  UpdateConsultationRequest,
  ConsultationListParams,
} from "@/types/consultation";

export const consultationsApi = {
  create: (data: CreateConsultationRequest) =>
    apiClient.post<Consultation>("/consultations", data).then((r) => r.data),

  getMe: (params?: ConsultationListParams) =>
    apiClient
      .get<Consultation[]>("/consultations/me", { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Consultation>(`/consultations/${id}`).then((r) => r.data),

  update: (id: string, data: UpdateConsultationRequest) =>
    apiClient
      .put<Consultation>(`/consultations/${id}`, data)
      .then((r) => r.data),

  getVideoToken: (id: string) =>
    apiClient
      .post<{ token: string; room_name: string; identity: string }>(
        `/consultations/${id}/video-token`
      )
      .then((r) => r.data),
};
