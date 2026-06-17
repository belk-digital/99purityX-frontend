import { apiClient } from "./client";
import type { PatientProfile, UpdatePatientRequest } from "@/types/patient";

export const patientsApi = {
  getMe: () =>
    apiClient.get<PatientProfile>("/patients/me").then((r) => r.data),

  updateMe: (data: UpdatePatientRequest) =>
    apiClient.put<PatientProfile>("/patients/me", data).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<PatientProfile>(`/patients/${id}`).then((r) => r.data),
};
