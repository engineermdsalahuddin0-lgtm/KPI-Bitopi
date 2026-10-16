# Bitopi Group — Industry KPI Management System
## System Architecture & Technical Memory Reference

---

### 1. Executive Overview
The Bitopi Group Industry KPI Management System is a production-grade, enterprise performance evaluation and tracking platform built for high-volume manufacturing, garment operations, and corporate business units. It enforces SMART goal principles, hierarchical organizational cascading, and performance scoring.

---

### 2. Multi-Level Organizational Hierarchy
The organizational architecture supports a 4-tier hierarchical cascading structure:
```
[ UNIT / Business Unit / Facility ]
       │
       ▼
[ DEPARTMENT (e.g. IE, HR, QA, Production, Commercial, Finance) ]
       │
       ▼
[ SECTION (e.g. Line Optimization, Sewing Assembly, Quality Control) ]
       │
       ▼
[ SUB-SECTION (e.g. High-Speed Sewing Lines, AQL Audit Cell, SMV Lab) ]
```

Each tier supports:
1. **Direct KPI Ownership**: KPIs can be assigned at Unit, Department, Section, or Sub-section level.
2. **Access Control**: Users can authenticate at Admin, Unit, Department, Section, or Sub-section levels.
3. **Data Isolation**: Filter queries isolate KPIs strictly by their assigned organizational boundary.

---

### 3. Core Database Entities & Schema (`supabase-schema.sql`)

#### A. `units`
- `id` (TEXT, PK, UUID)
- `name` (TEXT, e.g. "Bitopi Apparels Ltd. - Unit 1")
- `code` (VARCHAR(20), UNIQUE, e.g. "BAL-U1")
- `location` (TEXT)
- `status` ('active' | 'disabled')
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### B. `departments`
- `id` (TEXT, PK, UUID)
- `unit_id` (TEXT, FK -> units(id))
- `name` (TEXT, e.g. "Industrial Engineering")
- `short_code` (VARCHAR(15), e.g. "IE")
- `department_id` (VARCHAR(25), UNIQUE, e.g. "IE-7F29")
- `access_code` (TEXT, e.g. "X8K-29P-Q7M")
- `status` ('active' | 'disabled')
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### C. `sections`
- `id` (TEXT, PK, UUID)
- `department_id` (TEXT, FK -> departments(id) ON DELETE CASCADE)
- `name` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### D. `subsections`
- `id` (TEXT, PK, UUID)
- `section_id` (TEXT, FK -> sections(id) ON DELETE CASCADE)
- `name` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### E. `kpis`
- `id` (TEXT, PK, UUID)
- `kpi_code` (VARCHAR(30), UNIQUE, e.g. "KPI-001")
- `unit_id` (TEXT, NULLABLE FK -> units(id))
- `department_id` (TEXT, FK -> departments(id) ON DELETE CASCADE)
- `section_id` (TEXT, NULLABLE FK -> sections(id) ON DELETE SET NULL)
- `subsection_id` (TEXT, NULLABLE FK -> subsections(id) ON DELETE SET NULL)
- `kra` (TEXT, Key Result Area)
- `major_objective` (TEXT, Major Objective)
- `aligned_org_goal_level` ('unit' | 'department' | 'section' | 'subsection')
- `aligned_org_goal_id` (TEXT)
- `aligned_org_goal_label` (TEXT)
- `smart_kpi_text` (TEXT)
- SMART builder fields: `specific_s`, `measure_m`, `achievable_a`, `relevant_r`, `time_t`
- `perspective` ('Process' | 'Account' | 'Learning & Development' | 'Customer')
- `responsible_concern` (TEXT[], chip tags)
- `requirements` (TEXT)
- `datasource` (TEXT)
- `weight` (NUMERIC(5,2), 0-100, max 100% per department allocation)
- `baseline_value`, `baseline_unit` ('percentage' | 'number' | 'unit' | 'day' | 'currency_bdt')
- `target_value`, `target_unit` ('percentage' | 'number' | 'unit' | 'day' | 'currency_bdt')
- `target_policy` ('fixed' | 'workload_adjusted')
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### F. `kpi_monthly_entries`
- `id` (TEXT, PK, UUID)
- `kpi_id` (TEXT, FK -> kpis(id) ON DELETE CASCADE)
- `year` (INT, 2020-2100)
- `month` (INT, 1-12)
- `achievement_value` (NUMERIC(14,2))
- `achievement_unit` (VARCHAR(20))
- `status` ('Completed' | 'Pending' | 'Delayed' | 'No Input' | 'N/A')
- `remarks` (TEXT)
- `monthly_target_override` (NUMERIC(14,2))
- `eligible_input` (NUMERIC(14,2), for workload adjustment)
- `effective_target` (NUMERIC(14,2))
- `performance` (NUMERIC(7,2))
- CONSTRAINT `unique_kpi_year_month` UNIQUE (kpi_id, year, month)

#### G. `audit_logs`
- `id` (TEXT, PK)
- `user_role` (VARCHAR(20))
- `user_identifier` (TEXT)
- `action` (VARCHAR(50))
- `entity_type` (VARCHAR(50))
- `entity_id` (TEXT)
- `description` (TEXT)
- `created_at` (TIMESTAMPTZ)

---

### 4. Mathematical Engine & Scoring Rules
- **Effective Target**:
  - `fixed`: equals `monthly_target_override ?? target_value`
  - `workload_adjusted`: equals `(monthly_target_override ?? target_value) * (eligible_input / target_value)` (if eligible_input is provided)
- **Individual Performance %**:
  - `(achievement_value / effective_target) * 100` (capped according to policy or standard 0-100% range)
- **Overall Department / Unit Performance %**:
  - Weight-weighted sum: `SUM(kpi_performance * weight) / SUM(scored_kpis_weight)`
- **Coverage %**:
  - `(Count of Completed or Scored Entries) / (Total Active KPIs)`

---

### 5. Frontend Component Hierarchy
- `App.tsx` — Top level router, auth state provider, active view controller
  - `TopNav.tsx` — Navigation header with user badge, live Supabase sync indicator, tab switching
  - `LoginView.tsx` — Role-based tabbed authentication (Admin, Department, Section, Subsection)
  - `KPIDashboard.tsx` — Main operational KPI workbench
    - Filter Bar (Unit -> Department -> Section -> Subsection -> Level -> Perspective -> Search)
    - `PerformanceSummary.tsx` — Scorecard metrics, progress gauges, weight utilization
    - `KPITable.tsx` — Sticky-header frozen-column grid displaying 12 monthly slots
      - `KPIRow.tsx` — Expandable KPI row, badge indicators, chip tags
      - `KPIMonthCell.tsx` — Color-coded monthly achievement & status indicator
      - `KPIExpandPanel.tsx` — In-depth SMART breakdown, datasource, audit trails
    - `KPIWizard.tsx` — 5-step modal wizard for creating/updating KPIs with SMART builder
    - `KPICellEditModal.tsx` — Modal for inputting monthly actuals, workload adjustments, remarks
    - `DeleteConfirmModal.tsx` — Two-step confirmation for deleting KPIs
  - `ReportsDashboard.tsx` — Analytics, trends, department comparison, PDF/Excel export
  - `DepartmentManagement.tsx` — Admin tool for managing Units, Departments, Sections, Subsections, and credentials

---

### 6. Persistence & Realtime Synchronization Layer
- **Dual Engine**: `localStorage` (offline-first & instant reactive UI) + Supabase PostgreSQL (`nzqfceokfhzwlxihvjhr`).
- **Broadcast Channel**: Multi-tab live sync via web standard `BroadcastChannel('bitopi_kpi_channel')`.
- **Row-Level Security**: Enabled on all tables with public access policy for the client integration.
