import { apiClient } from "./client";
import type {
  HealthGoal,
  HealthGoalDetail,
  GoalProgress,
  CreateGoalRequest,
  UpdateGoalRequest,
  CreateGoalProgressRequest,
  GoalListParams,
} from "@/types/goal";

export const goalsApi = {
  create: (data: CreateGoalRequest) =>
    apiClient.post<HealthGoal>("/goals", data).then((r) => r.data),

  getAll: (params?: GoalListParams) =>
    apiClient.get<HealthGoal[]>("/goals", { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<HealthGoalDetail>(`/goals/${id}`).then((r) => r.data),

  update: (id: string, data: UpdateGoalRequest) =>
    apiClient.put<HealthGoal>(`/goals/${id}`, data).then((r) => r.data),

  recordProgress: (data: CreateGoalProgressRequest) =>
    apiClient.post<GoalProgress>("/goals/progress", data).then((r) => r.data),

  getProgress: (progressId: string) =>
    apiClient
      .get<GoalProgress>(`/goals/progress/${progressId}`)
      .then((r) => r.data),

  getPatientGoals: (patientId: string, params?: GoalListParams) =>
    apiClient
      .get<HealthGoal[]>(`/goals/patient/${patientId}`, { params })
      .then((r) => r.data),
};
