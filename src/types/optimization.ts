// ─── Programs ────────────────────────────────────────────────────────────────

export type ProgramStatus = "draft" | "active" | "paused" | "completed" | "cancelled";

export interface OptimizationProgram {
  id: string;
  patient_id: string;
  provider_id: string;
  consultation_id: string;
  name: string;
  goal: string | null;
  status: ProgramStatus;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Habits ──────────────────────────────────────────────────────────────────

export type HabitFrequency = "daily" | "weekly" | "monthly";
export type HabitStatus = "active" | "paused" | "completed" | "cancelled";

export interface HabitProtocol {
  id: string;
  program_id: string;
  patient_id: string;
  provider_id: string;
  title: string;
  description: string | null;
  target_value: string | null;
  target_unit: string | null;
  frequency: HabitFrequency;
  status: HabitStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_protocol_id: string;
  patient_id: string;
  date: string;
  actual_value: string | null;
  completed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateHabitLogRequest {
  habit_protocol_id: string;
  date: string;
  actual_value?: number;
  completed: boolean;
  notes?: string;
}

// ─── Peptides ────────────────────────────────────────────────────────────────

export type PeptideRoute = "subcutaneous" | "intramuscular" | "oral" | "topical" | "intravenous";
export type PeptideStatus = "planned" | "active" | "paused" | "completed" | "cancelled";

export interface PeptideProtocol {
  id: string;
  program_id: string;
  patient_id: string;
  provider_id: string;
  peptide_name: string;
  purpose: string | null;
  dosage: string;
  frequency: string;
  route: PeptideRoute;
  status: PeptideStatus;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── List params ─────────────────────────────────────────────────────────────

export interface OptimizationListParams {
  status?: string;
  limit?: number;
  offset?: number;
}
