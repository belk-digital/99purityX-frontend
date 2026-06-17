import { apiClient } from "./client";
import type {
  LabOrder,
  LabOrderDetail,
  UpdateLabOrderRequest,
  LabListParams,
} from "@/types/lab";

export const labsApi = {
  getOrders: (params?: LabListParams) =>
    apiClient.get<LabOrder[]>("/labs/orders", { params }).then((r) => r.data),

  getOrderDetail: (id: string) =>
    apiClient.get<LabOrderDetail>(`/labs/orders/${id}`).then((r) => r.data),

  updateOrder: (id: string, data: UpdateLabOrderRequest) =>
    apiClient.put<LabOrder>(`/labs/orders/${id}`, data).then((r) => r.data),

  getPatientOrders: (patientId: string, params?: LabListParams) =>
    apiClient
      .get<LabOrderDetail[]>(`/labs/patient/${patientId}`, { params })
      .then((r) => r.data),
};
