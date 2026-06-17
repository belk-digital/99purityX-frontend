export type DocumentType =
  | "lab_report"
  | "prescription"
  | "consultation_attachment"
  | "medical_record"
  | "insurance_document"
  | "consent_form"
  | "optimization_program_document"
  | "progress_report"
  | "other";

export type DocumentStatus = "active" | "archived" | "deleted";

export interface Document {
  id: string;
  patient_id: string;
  provider_id: string | null;
  uploaded_by_user_id: string;
  consultation_id: string | null;
  lab_order_id: string | null;
  optimization_program_id: string | null;
  document_type: DocumentType;
  title: string;
  description: string | null;
  file_name: string;
  original_file_name: string;
  mime_type: string;
  file_size: number;
  status: DocumentStatus;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
  download_url: string;
}

export interface DocumentDownloadResponse {
  document_id: string;
  download_url: string;
  expires_in_seconds: number;
}

export interface UpdateDocumentRequest {
  title?: string;
  description?: string;
  document_type?: DocumentType;
  status?: DocumentStatus;
}

export interface DocumentListParams {
  document_type?: DocumentType;
  patient_id?: string;
  provider_id?: string;
  status?: DocumentStatus;
  limit?: number;
  offset?: number;
}
