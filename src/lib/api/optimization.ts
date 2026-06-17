import { apiClient } from "./client";
import type {
  OptimizationProgram,
  HabitProtocol,
  HabitLog,
  CreateHabitLogRequest,
  PeptideProtocol,
  OptimizationListParams,
} from "@/types/optimization";

export const programsApi = {
  getAll: (params?: OptimizationListParams) =>
    apiClient
      .get<OptimizationProgram[]>("/optimization/programs", { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<OptimizationProgram>(`/optimization/programs/${id}`)
      .then((r) => r.data),
};

export const habitsApi = {
  getAll: (params?: OptimizationListParams) =>
    apiClient
      .get<HabitProtocol[]>("/optimization/habits", { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<HabitProtocol>(`/optimization/habits/${id}`)
      .then((r) => r.data),

  createLog: (data: CreateHabitLogRequest) =>
    apiClient
      .post<HabitLog>("/optimization/habit-logs", data)
      .then((r) => r.data),

  getLogs: (params?: { limit?: number; offset?: number }) =>
    apiClient
      .get<HabitLog[]>("/optimization/habit-logs", { params })
      .then((r) => r.data),
};

export const peptidesApi = {
  getAll: (params?: OptimizationListParams) =>
    apiClient
      .get<PeptideProtocol[]>("/optimization/peptides", { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<PeptideProtocol>(`/optimization/peptides/${id}`)
      .then((r) => r.data),
};
