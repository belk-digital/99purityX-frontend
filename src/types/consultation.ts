export type ConsultationStatus = "in_progress" | "completed" | "cancelled";

export interface Consultation {
  id: string;
  appointment_id: string;
  patient_id: string;
  provider_id: string;
  started_at?: string;
  ended_at?: string;
  status: ConsultationStatus;
  chief_complaint?: string;
  provider_notes?: string;
  summary?: string;
  follow_up_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateConsultationRequest {
  appointment_id: string;
  chief_complaint?: string;
}

export interface UpdateConsultationRequest {
  status?: ConsultationStatus;
  provider_notes?: string;
  summary?: string;
  follow_up_required?: boolean;
  ended_at?: string;
}

export interface ConsultationListParams {
  status?: ConsultationStatus;
  limit?: number;
  offset?: number;
}
