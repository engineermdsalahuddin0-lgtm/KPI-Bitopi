export type UserRole = 'admin' | 'department' | 'section' | 'subsection';

export interface UserSession {
  role: UserRole;
  email?: string;
  departmentId?: string; // locked to this department UUID
  departmentName?: string;
  departmentCode?: string;
  sectionId?: string;    // locked to this section UUID if role is section or subsection
  sectionName?: string;
  subsectionId?: string; // locked to this subsection UUID if role is subsection
  subsectionName?: string;
}

export type UnitType = 'percentage' | 'number' | 'unit' | 'day' | 'currency_bdt';

export type KPIScoreStatus = 'Completed' | 'Pending' | 'Delayed' | 'No Input' | 'N/A';

export type PerspectiveType = 'Process' | 'Account' | 'Learning & Development' | 'Customer';

export type TargetPolicyType = 'fixed' | 'workload_adjusted';

export type OrgGoalLevel = 'department' | 'section' | 'subsection';

export interface Department {
  id: string; // UUID
  name: string;
  short_code: string;
  department_id: string; // e.g. IE-7F29
  access_code: string;   // e.g. X8K-29P-Q7M
  status: 'active' | 'disabled';
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: string;
  department_id: string;
  name: string;
  created_at: string;
  updated_at?: string;
}

export interface Subsection {
  id: string;
  section_id: string;
  name: string;
  created_at: string;
  updated_at?: string;
}

export interface KPI {
  id: string; // UUID
  kpi_code: string; // e.g. KPI-001
  department_id: string;
  section_id?: string;
  subsection_id?: string;

  kra: string; // One KRA per field
  major_objective: string; // One MO per field

  aligned_org_goal_level: OrgGoalLevel;
  aligned_org_goal_id: string;
  aligned_org_goal_label?: string;

  smart_kpi_text: string;

  // SMART Builder breakdown
  specific_s?: string;
  measure_m?: string;
  achievable_a?: boolean;
  relevant_r?: boolean;
  time_t?: string;

  perspective: PerspectiveType;

  responsible_concern: string[]; // Chip tags e.g. ['Rahim', 'Karim']
  requirements: string;
  datasource: string;

  weight: number; // e.g. 20 (percent)

  baseline_value: number;
  baseline_unit: UnitType;

  target_value: number;
  target_unit: UnitType;

  target_policy: TargetPolicyType; // 'fixed' | 'workload_adjusted'

  created_at: string;
  updated_at: string;
}

export interface KPIMonthlyEntry {
  id: string; // UUID
  kpi_id: string;
  year: number; // e.g. 2026
  month: number; // 1 to 12

  achievement_value?: number | null;
  achievement_unit: UnitType;

  status: KPIScoreStatus;
  remarks?: string;

  monthly_target_override?: number | null;
  eligible_input?: number | null;
  effective_target?: number;

  performance?: number | null; // e.g. 90 (%)

  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_role: UserRole;
  user_identifier: string;
  action: 'create_kpi' | 'edit_kpi' | 'delete_kpi' | 'update_monthly' | 'create_department' | 'edit_department' | 'regenerate_code';
  entity_type: 'kpi' | 'monthly_entry' | 'department' | 'section';
  entity_id: string;
  description: string;
  created_at: string;
}

export interface PerformanceCalculationResult {
  performance: number | null; // null if pending or N/A
  effectiveTarget: number;
  isEligibleForScoring: boolean;
  isPending: boolean;
  isNoInput: boolean;
  isZero: boolean;
}

export interface DepartmentSummaryMetrics {
  overallPerformance: number; // %
  coverage: number;           // %
  assignedWeight: number;     // e.g. 100%
  scoredWeight: number;       // e.g. 92%
  totalKPIs: number;
  completedEntriesCount: number;
  pendingEntriesCount: number;
  noInputEntriesCount: number;
}
