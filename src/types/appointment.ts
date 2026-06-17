export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  patient_id: string;
  provider_id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentRequest {
  provider_id: string;
  scheduled_start: string;
  scheduled_end: string;
  reason?: string;
}

export interface UpdateAppointmentRequest {
  status?: AppointmentStatus;
  notes?: string;
  scheduled_start?: string;
  scheduled_end?: string;
}
