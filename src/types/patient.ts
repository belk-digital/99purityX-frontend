export interface PatientProfile {
  id: string;
  user_id: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  blood_group?: string;
  height?: number;
  weight?: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  timezone?: string;
  language?: string;
  created_at: string;
  updated_at: string;
}

export type UpdatePatientRequest = Partial<Omit<PatientProfile, "id" | "user_id" | "created_at" | "updated_at">>;
