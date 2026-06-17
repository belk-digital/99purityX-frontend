import { apiClient } from "./client";
import type {
  Appointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
} from "@/types/appointment";

export const appointmentsApi = {
  create: (data: CreateAppointmentRequest) =>
    apiClient.post<Appointment>("/appointments", data).then((r) => r.data),

  getMe: () =>
    apiClient.get<Appointment[]>("/appointments/me").then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Appointment>(`/appointments/${id}`).then((r) => r.data),

  update: (id: string, data: UpdateAppointmentRequest) =>
    apiClient
      .put<Appointment>(`/appointments/${id}`, data)
      .then((r) => r.data),
};
