export type LabOrderStatus =
  | "ordered"
  | "sample_collected"
  | "completed"
  | "cancelled";

export interface LabResult {
  id: string;
  lab_order_id: string;
  biomarker_name: string;
  value: string;
  unit: string | null;
  reference_min: string | null;
  reference_max: string | null;
  notes: string | null;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

export interface LabOrder {
  id: string;
  patient_id: string;
  provider_id: string;
  consultation_id: string;
  lab_name: string;
  notes: string | null;
  status: LabOrderStatus;
  ordered_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LabOrderDetail extends LabOrder {
  results: LabResult[];
}

export interface CreateLabOrderRequest {
  patient_id: string;
  provider_id: string;
  consultation_id: string;
  lab_name: string;
  notes?: string;
}

export interface UpdateLabOrderRequest {
  status?: LabOrderStatus;
  notes?: string;
  completed_at?: string;
}

export interface LabListParams {
  status?: LabOrderStatus;
  limit?: number;
  offset?: number;
}
