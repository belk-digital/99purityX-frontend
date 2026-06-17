import { apiClient } from "./client";
import type { AuditLog, AuditListParams } from "@/types/audit";

export const auditApi = {
  getLogs: (params?: AuditListParams) =>
    apiClient.get<AuditLog[]>("/audit/logs", { params }).then((r) => r.data),
};
