export type GoalCategory =
  | "weight_loss"
  | "muscle_gain"
  | "metabolic_health"
  | "hormone_health"
  | "sleep"
  | "recovery"
  | "cardiovascular"
  | "longevity"
  | "biomarker"
  | "custom";

export type GoalStatus = "active" | "achieved" | "paused" | "cancelled";

export interface HealthGoal {
  id: string;
  patient_id: string;
  provider_id?: string;
  title: string;
  description?: string;
  category: GoalCategory;
  target_value?: number;
  current_value?: number;
  start_value?: number;
  unit?: string;
  target_date?: string;
  status: GoalStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface GoalProgress {
  id: string;
  goal_id: string;
  value: number;
  notes?: string;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

export interface HealthGoalDetail extends HealthGoal {
  progress_records: GoalProgress[];
}

export interface CreateGoalRequest {
  title: string;
  category: GoalCategory;
  description?: string;
  target_value?: number;
  start_value?: number;
  unit?: string;
  target_date?: string;
  notes?: string;
}

export interface UpdateGoalRequest {
  title?: string;
  status?: GoalStatus;
  current_value?: number;
  notes?: string;
  target_date?: string;
}

export interface CreateGoalProgressRequest {
  goal_id: string;
  value: number;
  notes?: string;
}

export interface GoalListParams {
  status?: GoalStatus;
  limit?: number;
  offset?: number;
}
