import { apiClient } from "./client";
import type {
  Document,
  DocumentDownloadResponse,
  UpdateDocumentRequest,
  DocumentListParams,
} from "@/types/document";

export const documentsApi = {
  upload: (formData: FormData) =>
    apiClient
      .post<Document>("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),

  getAll: (params?: DocumentListParams) =>
    apiClient.get<Document[]>("/documents", { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Document>(`/documents/${id}`).then((r) => r.data),

  getDownloadUrl: (id: string) =>
    apiClient
      .get<DocumentDownloadResponse>(`/documents/${id}/download`)
      .then((r) => r.data),

  update: (id: string, data: UpdateDocumentRequest) =>
    apiClient.put<Document>(`/documents/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/documents/${id}`).then((r) => r.data),
};
