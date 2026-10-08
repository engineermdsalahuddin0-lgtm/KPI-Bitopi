-- ============================================================================
-- BITOPI GROUP — INDUSTRY KPI MANAGEMENT SYSTEM
-- PostgreSQL Database Schema & Seed Data for Supabase
-- Target Supabase Project: nzqfceokfhzwlxihvjhr
-- ============================================================================

-- 1. DROP EXISTING CONSTRAINTS/TABLES IF NEEDED (IDEMPOTENT SETUP)
-- Uncomment below if you want a complete clean rebuild:
-- DROP TABLE IF EXISTS audit_logs CASCADE;
-- DROP TABLE IF EXISTS kpi_monthly_entries CASCADE;
-- DROP TABLE IF EXISTS kpis CASCADE;
-- DROP TABLE IF EXISTS subsections CASCADE;
-- DROP TABLE IF EXISTS sections CASCADE;
-- DROP TABLE IF EXISTS departments CASCADE;

-- 2. CREATE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 3. CORE TABLES DEFINITION (100% ALIGNED WITH FRONTEND TYPES)
-- ============================================================================

-- A. DEPARTMENTS TABLE (#51)
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    short_code VARCHAR(15) NOT NULL UNIQUE,
    department_id VARCHAR(25) NOT NULL UNIQUE,
    access_code TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_departments_dept_id ON departments(department_id);
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(short_code);

-- B. SECTIONS TABLE (#52)
CREATE TABLE IF NOT EXISTS sections (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_sections_dept_id ON sections(department_id);

-- C. SUBSECTIONS TABLE (#53)
CREATE TABLE IF NOT EXISTS subsections (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_subsections_sec_id ON subsections(section_id);

-- D. KPIS TABLE (#54)
CREATE TABLE IF NOT EXISTS kpis (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    kpi_code VARCHAR(30) NOT NULL UNIQUE,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    section_id TEXT REFERENCES sections(id) ON DELETE SET NULL,
    subsection_id TEXT REFERENCES subsections(id) ON DELETE SET NULL,

    kra TEXT NOT NULL,
    major_objective TEXT NOT NULL,

    aligned_org_goal_level VARCHAR(20) NOT NULL DEFAULT 'department' CHECK (aligned_org_goal_level IN ('department', 'section', 'subsection')),
    aligned_org_goal_id TEXT NOT NULL,
    aligned_org_goal_label TEXT,

    smart_kpi_text TEXT NOT NULL,

    specific_s TEXT,
    measure_m TEXT,
    achievable_a BOOLEAN DEFAULT TRUE,
    relevant_r BOOLEAN DEFAULT TRUE,
    time_t TEXT,

    perspective VARCHAR(30) NOT NULL DEFAULT 'Process' CHECK (perspective IN ('Process', 'Account', 'Learning & Development', 'Customer')),

    responsible_concern TEXT[] NOT NULL DEFAULT '{}',
    requirements TEXT DEFAULT '',
    datasource TEXT NOT NULL DEFAULT '',

    weight NUMERIC(5,2) NOT NULL CHECK (weight >= 0 AND weight <= 100),

    baseline_value NUMERIC(14,2) NOT NULL,
    baseline_unit VARCHAR(20) NOT NULL DEFAULT 'percentage' CHECK (baseline_unit IN ('percentage', 'number', 'unit', 'day', 'currency_bdt')),

    target_value NUMERIC(14,2) NOT NULL,
    target_unit VARCHAR(20) NOT NULL DEFAULT 'percentage' CHECK (target_unit IN ('percentage', 'number', 'unit', 'day', 'currency_bdt')),

    target_policy VARCHAR(30) NOT NULL DEFAULT 'fixed' CHECK (target_policy IN ('fixed', 'workload_adjusted')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_kpis_dept_id ON kpis(department_id);
CREATE INDEX IF NOT EXISTS idx_kpis_section_id ON kpis(section_id);
CREATE INDEX IF NOT EXISTS idx_kpis_subsection_id ON kpis(subsection_id);
CREATE INDEX IF NOT EXISTS idx_kpis_code ON kpis(kpi_code);

-- E. KPI MONTHLY ENTRIES TABLE (#55: MANDATORY: NO jan, feb COLUMNS IN TABLE)
CREATE TABLE IF NOT EXISTS kpi_monthly_entries (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    kpi_id TEXT NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
    year INT NOT NULL CHECK (year >= 2020 AND year <= 2100),
    month INT NOT NULL CHECK (month >= 1 AND month <= 12),

    achievement_value NUMERIC(14,2),
    achievement_unit VARCHAR(20) NOT NULL DEFAULT 'percentage' CHECK (achievement_unit IN ('percentage', 'number', 'unit', 'day', 'currency_bdt')),

    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Completed', 'Pending', 'Delayed', 'No Input', 'N/A')),
    remarks TEXT DEFAULT '',

    monthly_target_override NUMERIC(14,2),
    eligible_input NUMERIC(14,2),
    effective_target NUMERIC(14,2),
    performance NUMERIC(7,2),

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

    -- UNIQUE CONSTRAINT REQUIREMENT (#29): UNIQUE(kpi_id, year, month)
    CONSTRAINT unique_kpi_year_month UNIQUE(kpi_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_kpi_id ON kpi_monthly_entries(kpi_id);
CREATE INDEX IF NOT EXISTS idx_monthly_year_month ON kpi_monthly_entries(year, month);

-- F. AUDIT LOGS TABLE (#68)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_role VARCHAR(20) NOT NULL,
    user_identifier TEXT NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- ============================================================================
-- 4. GRANTS & ROW LEVEL SECURITY (RLS) FOR SUPABASE CLIENT ACCESS
-- ============================================================================

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsections ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_monthly_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Grant API access to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Development & Production RLS Policies
-- Allow Read/Write operations for application client
DROP POLICY IF EXISTS "Public access to departments" ON departments;
CREATE POLICY "Public access to departments" ON departments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to sections" ON sections;
CREATE POLICY "Public access to sections" ON sections FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to subsections" ON subsections;
CREATE POLICY "Public access to subsections" ON subsections FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to kpis" ON kpis;
CREATE POLICY "Public access to kpis" ON kpis FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to monthly entries" ON kpi_monthly_entries;
CREATE POLICY "Public access to monthly entries" ON kpi_monthly_entries FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to audit logs" ON audit_logs;
CREATE POLICY "Public access to audit logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 5. INITIAL SEED DATA (ALL 21 DEPARTMENTS FROM SECTION 12 & INITIAL KPIS)
-- ============================================================================

INSERT INTO departments (id, name, short_code, department_id, access_code, status)
VALUES
  ('dept-ie', 'Industrial Engineering', 'IE', 'IE-7F29', 'X8K-29P-Q7M', 'active'),
  ('dept-hr', 'HR & Admin', 'HR', 'HR-2K81', 'M4P-82W-R1B', 'active'),
  ('dept-cad', 'CAD & Sample', 'CAD', 'CAD-3M19', 'Q9T-44L-Z2N', 'active'),
  ('dept-com', 'Commercial', 'COM', 'COM-5P82', 'V3R-91K-C8H', 'active'),
  ('dept-eng', 'Engineering & Services', 'ENG', 'ENG-6W41', 'L7D-25X-J4P', 'active'),
  ('dept-it', 'ERP & IT', 'IT', 'IT-8K12', 'F2W-68Y-K9T', 'active'),
  ('dept-fin', 'Finance & Accounts', 'FIN', 'FIN-9P22', 'T5N-73D-W8K', 'active'),
  ('dept-gen', 'General', 'GEN', 'GEN-1A44', 'H8C-19M-P6L', 'active'),
  ('dept-hrc', 'HR, Admin & Compliance', 'HRC', 'HRC-4B77', 'Z6K-32V-N5X', 'active'),
  ('dept-mis', 'MIS & Internal Audit', 'MIS', 'MIS-7C90', 'R1Y-84P-G3D', 'active'),
  ('dept-prod', 'Production', 'PROD', 'PROD-2D33', 'E9M-57T-K2W', 'active'),
  ('dept-ppc', 'Production Planning & Control', 'PPC', 'PPC-5E66', 'C3X-71R-J8M', 'active'),
  ('dept-qa', 'QA, Audit & Technical', 'QA', 'QA-8F11', 'B7T-94K-L1P', 'active'),
  ('dept-stw', 'Store & Warehouse', 'STW', 'STW-3G55', 'W4N-62D-P9H', 'active'),
  ('dept-tech', 'Technical', 'TECH', 'TECH-6H88', 'Y8L-35V-M4C', 'active'),
  ('dept-wash', 'Washing', 'WASH', 'WASH-9J22', 'K2R-81W-T7F', 'active'),
  ('dept-dpd', 'Design & Product Development', 'DPD', 'DPD-1K44', 'P6D-49X-C3K', 'active'),
  ('dept-esg', 'ESG', 'ESG', 'ESG-4L77', 'G1T-73M-R8B', 'active'),
  ('dept-mm', 'Marketing & Merchandising', 'MM', 'MM-7N00', 'N5K-26P-W2Y', 'active'),
  ('dept-scm', 'Supply Chain', 'SCM', 'SCM-2P33', 'D9W-58L-J4T', 'active'),
  ('dept-ie2', 'IE Special Projects', 'IES', 'IES-9R66', 'X3M-89K-Q1V', 'active')
ON CONFLICT (department_id) DO NOTHING;

-- SECTIONS SEED
INSERT INTO sections (id, department_id, name)
VALUES
  ('sec-ie-1', 'dept-ie', 'Line Optimization & Work Study'),
  ('sec-ie-2', 'dept-ie', 'Method Engineering & Layout'),
  ('sec-ie-3', 'dept-ie', 'Cost Reduction & SMV Analysis'),
  ('sec-prod-1', 'dept-prod', 'Sewing Assembly Lines'),
  ('sec-prod-2', 'dept-prod', 'Automated Cutting Division'),
  ('sec-qa-1', 'dept-qa', 'In-Line Process Audits'),
  ('sec-qa-2', 'dept-qa', 'Final Inspection & AQL')
ON CONFLICT (id) DO NOTHING;

-- SUBSECTIONS SEED
INSERT INTO subsections (id, section_id, name)
VALUES
  ('sub-ie-1a', 'sec-ie-1', 'High-Speed Sewing Floors'),
  ('sub-ie-1b', 'sec-ie-1', 'Finishing & Packing Flow'),
  ('sub-ie-2a', 'sec-ie-2', 'SMV Benchmarking Lab'),
  ('sub-prod-1a', 'sec-prod-1', 'Unit 1 Modular Lines'),
  ('sub-qa-1a', 'sec-qa-1', 'Traffic Light Quality Cell')
ON CONFLICT (id) DO NOTHING;

-- (KPIS & MONTHLY ENTRIES: Department users will create their own department KPIs dynamically)
-- No sample KPIs seeded so departments start fresh with clean records.

