-- ============================================================================
-- BITOPI GROUP KPI MANAGEMENT SYSTEM - COMPLETE SUPABASE DDL & SEED SCHEMA
-- Compatible with PostgreSQL 14+ / Supabase
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- A. UNITS TABLE (Admin can add/delete/manage business units)
CREATE TABLE IF NOT EXISTS units (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    location TEXT,
    access_code VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_units_code ON units(code);

-- B. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    short_code VARCHAR(30) NOT NULL,
    department_id VARCHAR(50) NOT NULL UNIQUE,
    access_code VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_departments_unit_id ON departments(unit_id);
CREATE INDEX IF NOT EXISTS idx_departments_dept_id ON departments(department_id);

-- C. SECTIONS TABLE
CREATE TABLE IF NOT EXISTS sections (
    id TEXT PRIMARY KEY,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_sections_dept_id ON sections(department_id);

-- D. SUBSECTIONS TABLE
CREATE TABLE IF NOT EXISTS subsections (
    id TEXT PRIMARY KEY,
    section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_subsections_sec_id ON subsections(section_id);

-- E. KPIS TABLE (Stores both unit_id and department_id for every KPI)
CREATE TABLE IF NOT EXISTS kpis (
    id TEXT PRIMARY KEY,
    kpi_code VARCHAR(30) NOT NULL UNIQUE,
    unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
    department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
    section_id TEXT REFERENCES sections(id) ON DELETE SET NULL,
    subsection_id TEXT REFERENCES subsections(id) ON DELETE SET NULL,

    kra TEXT NOT NULL,
    major_objective TEXT NOT NULL,

    aligned_org_goal_level VARCHAR(20) NOT NULL DEFAULT 'department' CHECK (aligned_org_goal_level IN ('unit', 'department', 'section', 'subsection')),
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

-- Ensure unit_id exists even if table was created in an earlier migration
ALTER TABLE IF EXISTS departments ADD COLUMN IF NOT EXISTS unit_id TEXT REFERENCES units(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS kpis ADD COLUMN IF NOT EXISTS unit_id TEXT REFERENCES units(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_kpis_unit_id ON kpis(unit_id);
CREATE INDEX IF NOT EXISTS idx_kpis_dept_id ON kpis(department_id);
CREATE INDEX IF NOT EXISTS idx_kpis_section_id ON kpis(section_id);
CREATE INDEX IF NOT EXISTS idx_kpis_subsection_id ON kpis(subsection_id);
CREATE INDEX IF NOT EXISTS idx_kpis_code ON kpis(kpi_code);

-- F. KPI MONTHLY ENTRIES TABLE
CREATE TABLE IF NOT EXISTS kpi_monthly_entries (
    id TEXT PRIMARY KEY,
    kpi_id TEXT NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
    year INT NOT NULL CHECK (year >= 2020 AND year <= 2100),
    month INT NOT NULL CHECK (month >= 1 AND month <= 12),

    achievement_value NUMERIC(14,2),
    achievement_unit VARCHAR(20) NOT NULL DEFAULT 'percentage' CHECK (achievement_unit IN ('percentage', 'number', 'unit', 'day', 'currency_bdt')),

    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Completed', 'Pending', 'Delayed', 'No Input', 'N/A')),
    remarks TEXT DEFAULT '',

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

    CONSTRAINT uq_kpi_year_month UNIQUE(kpi_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_entries_kpi ON kpi_monthly_entries(kpi_id);

-- G. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_role VARCHAR(30) NOT NULL,
    actor_identifier VARCHAR(120) NOT NULL,
    action VARCHAR(60) NOT NULL,
    target_type VARCHAR(60) NOT NULL,
    target_id VARCHAR(120) NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- H. ENABLE ROW LEVEL SECURITY AND PERMISSIVE POLICIES
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsections ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_monthly_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Public access to units" ON units;
CREATE POLICY "Public access to units" ON units FOR ALL USING (true) WITH CHECK (true);

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
-- SEED DATA
-- ============================================================================

-- 1. UNITS
INSERT INTO units (id, name, code, location, access_code, status)
VALUES
  ('unit-bgl', 'Bitopi Garments Ltd.', 'BGL', 'Mirpur, Dhaka', 'BGL-992-K8P', 'active'),
  ('unit-mgl', 'Misami Garments Ltd.', 'MGL', 'Comilla EPZ', 'MGL-441-R7T', 'active'),
  ('unit-rhl', 'Rimpex Holdings Ltd.', 'RHL', 'Adamjee EPZ, Narayanganj', 'RHL-782-X2M', 'active'),
  ('unit-srsl', 'Sheba Ready Made Solutions Ltd.', 'SRSL', 'Corporate Studio, Dhaka', 'SRS-319-Q5L', 'active'),
  ('unit-tal', 'Tara Atire Ltd.', 'TAL', 'Kashimpur, Gazipur', 'TAL-853-Z9W', 'active')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  location = EXCLUDED.location,
  access_code = EXCLUDED.access_code,
  status = EXCLUDED.status;

-- 2. DEPARTMENTS
INSERT INTO departments (id, unit_id, name, short_code, department_id, access_code, status)
VALUES
  ('dept-bgl-hra-1', 'unit-bgl', 'HR & Admin', 'BGL-HRA', 'BGL-HRA-1511', 'HRA-61K-77P', 'active'),
  ('dept-bgl-ie-2', 'unit-bgl', 'Industrial Engineering', 'BGL-IE', 'BGL-IE-54A', 'IE-52K-37P', 'active'),
  ('dept-bgl-cad-3', 'unit-bgl', 'CAD & Sample', 'BGL-CAD', 'BGL-CAD-23CE', 'CAD-98K-60P', 'active'),
  ('dept-bgl-com-4', 'unit-bgl', 'Commercial', 'BGL-COM', 'BGL-COM-5AE', 'COM-18K-60P', 'active'),
  ('dept-bgl-eng-5', 'unit-bgl', 'Engineering & Services', 'BGL-ENG', 'BGL-ENG-11B8', 'ENG-78K-81P', 'active'),
  ('dept-bgl-it-6', 'unit-bgl', 'ERP & IT', 'BGL-IT', 'BGL-IT-D54', 'IT-31K-64P', 'active'),
  ('dept-bgl-fin-7', 'unit-bgl', 'Finance & Accounts', 'BGL-FIN', 'BGL-FIN-1C51', 'FIN-45K-93P', 'active'),
  ('dept-bgl-gen-8', 'unit-bgl', 'General', 'BGL-GEN', 'BGL-GEN-1CA6', 'GEN-68K-75P', 'active'),
  ('dept-bgl-hrc-9', 'unit-bgl', 'HR, Admin & Compliance', 'BGL-HRC', 'BGL-HRC-14F3', 'HRC-39K-95P', 'active'),
  ('dept-bgl-mis-10', 'unit-bgl', 'MIS & Internal Audit', 'BGL-MIS', 'BGL-MIS-97A', 'MIS-44K-40P', 'active'),
  ('dept-bgl-prod-11', 'unit-bgl', 'Production', 'BGL-PROD', 'BGL-PROD-120A', 'PROD-42K-67P', 'active'),
  ('dept-bgl-ppc-12', 'unit-bgl', 'Production Planning & control', 'BGL-PPC', 'BGL-PPC-1DB5', 'PPC-55K-70P', 'active'),
  ('dept-bgl-qa-13', 'unit-bgl', 'QA, Audit & Technical', 'BGL-QA', 'BGL-QA-1123', 'QA-81K-15P', 'active'),
  ('dept-bgl-stw-14', 'unit-bgl', 'Store & Warehouse', 'BGL-STW', 'BGL-STW-744', 'STW-62K-24P', 'active'),
  ('dept-bgl-tech-15', 'unit-bgl', 'Technical', 'BGL-TECH', 'BGL-TECH-2528', 'TECH-91K-87P', 'active'),
  ('dept-mgl-eng-16', 'unit-mgl', 'Engineering & Services', 'MGL-ENG', 'MGL-ENG-1759', 'ENG-33K-71P', 'active'),
  ('dept-mgl-hra-17', 'unit-mgl', 'HR & Admin', 'MGL-HRA', 'MGL-HRA-1775', 'HRA-48K-96P', 'active'),
  ('dept-mgl-ie-m1', 'unit-mgl', 'Industrial Engineering', 'MGL-IE', 'MGL-IE-1102', 'IE-88K-12P', 'active'),
  ('dept-mgl-prod-m2', 'unit-mgl', 'Production', 'MGL-PROD', 'MGL-PROD-1205', 'PROD-77K-23P', 'active'),
  ('dept-mgl-ppc-m3', 'unit-mgl', 'Production Planning & control', 'MGL-PPC', 'MGL-PPC-1308', 'PPC-44K-81P', 'active'),
  ('dept-mgl-qa-m4', 'unit-mgl', 'QA, Audit & Technical', 'MGL-QA', 'MGL-QA-1411', 'QA-99K-34P', 'active'),
  ('dept-mgl-cad-m5', 'unit-mgl', 'CAD & Sample', 'MGL-CAD', 'MGL-CAD-1514', 'CAD-66K-45P', 'active'),
  ('dept-mgl-com-m6', 'unit-mgl', 'Commercial', 'MGL-COM', 'MGL-COM-1617', 'COM-55K-56P', 'active'),
  ('dept-mgl-it-m7', 'unit-mgl', 'ERP & IT', 'MGL-IT', 'MGL-IT-1720', 'IT-33K-67P', 'active'),
  ('dept-mgl-fin-m8', 'unit-mgl', 'Finance & Accounts', 'MGL-FIN', 'MGL-FIN-1823', 'FIN-22K-78P', 'active'),
  ('dept-mgl-stw-m9', 'unit-mgl', 'Store & Warehouse', 'MGL-STW', 'MGL-STW-1926', 'STW-11K-89P', 'active'),
  ('dept-mgl-gen-m10', 'unit-mgl', 'General', 'MGL-GEN', 'MGL-GEN-2029', 'GEN-99K-90P', 'active'),
  ('dept-rhl-cad-18', 'unit-rhl', 'CAD & Sample', 'RHL-CAD', 'RHL-CAD-1529', 'CAD-21K-15P', 'active'),
  ('dept-rhl-com-19', 'unit-rhl', 'Commercial', 'RHL-COM', 'RHL-COM-1EEE', 'COM-30K-19P', 'active'),
  ('dept-rhl-hra-20', 'unit-rhl', 'HR & Admin', 'RHL-HRA', 'RHL-HRA-1A1B', 'HRA-56K-36P', 'active'),
  ('dept-rhl-prod-21', 'unit-rhl', 'Production', 'RHL-PROD', 'RHL-PROD-2698', 'PROD-68K-66P', 'active'),
  ('dept-rhl-ppc-22', 'unit-rhl', 'Production Planning & control', 'RHL-PPC', 'RHL-PPC-7A5', 'PPC-90K-25P', 'active'),
  ('dept-rhl-eng-23', 'unit-rhl', 'Engineering & Services', 'RHL-ENG', 'RHL-ENG-7A2', 'ENG-49K-14P', 'active'),
  ('dept-rhl-it-24', 'unit-rhl', 'ERP & IT', 'RHL-IT', 'RHL-IT-B80', 'IT-39K-30P', 'active'),
  ('dept-rhl-fin-25', 'unit-rhl', 'Finance & Accounts', 'RHL-FIN', 'RHL-FIN-13DC', 'FIN-95K-42P', 'active'),
  ('dept-rhl-gen-26', 'unit-rhl', 'General', 'RHL-GEN', 'RHL-GEN-D55', 'GEN-90K-51P', 'active'),
  ('dept-rhl-hrc-27', 'unit-rhl', 'HR, Admin & Compliance', 'RHL-HRC', 'RHL-HRC-CA1', 'HRC-87K-21P', 'active'),
  ('dept-rhl-ie-28', 'unit-rhl', 'Industrial Engineering', 'RHL-IE', 'RHL-IE-21C1', 'IE-13K-68P', 'active'),
  ('dept-rhl-mis-29', 'unit-rhl', 'MIS & Internal Audit', 'RHL-MIS', 'RHL-MIS-14BE', 'MIS-19K-66P', 'active'),
  ('dept-rhl-qa-30', 'unit-rhl', 'QA, Audit & Technical', 'RHL-QA', 'RHL-QA-936', 'QA-89K-41P', 'active'),
  ('dept-rhl-stw-31', 'unit-rhl', 'Store & Warehouse', 'RHL-STW', 'RHL-STW-B75', 'STW-57K-17P', 'active'),
  ('dept-rhl-wash-32', 'unit-rhl', 'Washing', 'RHL-WASH', 'RHL-WASH-2597', 'WASH-24K-36P', 'active'),
  ('dept-srsl-dpd-33', 'unit-srsl', 'Design & Product Development', 'SRSL-DPD', 'SRSL-DPD-1741', 'DPD-90K-38P', 'active'),
  ('dept-srsl-fin-34', 'unit-srsl', 'Finance & Accounts', 'SRSL-FIN', 'SRSL-FIN-92B', 'FIN-86K-90P', 'active'),
  ('dept-srsl-gen-35', 'unit-srsl', 'General', 'SRSL-GEN', 'SRSL-GEN-2646', 'GEN-69K-10P', 'active'),
  ('dept-srsl-ie-s1', 'unit-srsl', 'Industrial Engineering', 'SRSL-IE', 'SRSL-IE-2101', 'IE-91K-22P', 'active'),
  ('dept-srsl-prod-s2', 'unit-srsl', 'Production', 'SRSL-PROD', 'SRSL-PROD-2202', 'PROD-82K-33P', 'active'),
  ('dept-srsl-qa-s3', 'unit-srsl', 'QA, Audit & Technical', 'SRSL-QA', 'SRSL-QA-2303', 'QA-73K-44P', 'active'),
  ('dept-srsl-hra-s4', 'unit-srsl', 'HR & Admin', 'SRSL-HRA', 'SRSL-HRA-2404', 'HRA-64K-55P', 'active'),
  ('dept-srsl-ppc-s5', 'unit-srsl', 'Production Planning & control', 'SRSL-PPC', 'SRSL-PPC-2505', 'PPC-55K-66P', 'active'),
  ('dept-srsl-eng-s6', 'unit-srsl', 'Engineering & Services', 'SRSL-ENG', 'SRSL-ENG-2606', 'ENG-46K-77P', 'active'),
  ('dept-srsl-it-s7', 'unit-srsl', 'ERP & IT', 'SRSL-IT', 'SRSL-IT-2707', 'IT-37K-88P', 'active'),
  ('dept-srsl-stw-s8', 'unit-srsl', 'Store & Warehouse', 'SRSL-STW', 'SRSL-STW-2808', 'STW-28K-99P', 'active'),
  ('dept-tal-cad-36', 'unit-tal', 'CAD & Sample', 'TAL-CAD', 'TAL-CAD-A46', 'CAD-74K-12P', 'active'),
  ('dept-tal-com-37', 'unit-tal', 'Commercial', 'TAL-COM', 'TAL-COM-24A7', 'COM-19K-91P', 'active'),
  ('dept-tal-dpd-38', 'unit-tal', 'Design & Product Development', 'TAL-DPD', 'TAL-DPD-13A6', 'DPD-66K-32P', 'active'),
  ('dept-tal-eng-39', 'unit-tal', 'Engineering & Services', 'TAL-ENG', 'TAL-ENG-425', 'ENG-28K-34P', 'active'),
  ('dept-tal-it-40', 'unit-tal', 'ERP & IT', 'TAL-IT', 'TAL-IT-3EB', 'IT-79K-67P', 'active'),
  ('dept-tal-esg-41', 'unit-tal', 'ESG', 'TAL-ESG', 'TAL-ESG-24C7', 'ESG-37K-12P', 'active'),
  ('dept-tal-fin-42', 'unit-tal', 'Finance & Accounts', 'TAL-FIN', 'TAL-FIN-235F', 'FIN-76K-42P', 'active'),
  ('dept-tal-gen-43', 'unit-tal', 'General', 'TAL-GEN', 'TAL-GEN-22A4', 'GEN-36K-16P', 'active'),
  ('dept-tal-hra-44', 'unit-tal', 'HR & Admin', 'TAL-HRA', 'TAL-HRA-1FF7', 'HRA-93K-55P', 'active'),
  ('dept-tal-hrc-45', 'unit-tal', 'HR, Admin & Compliance', 'TAL-HRC', 'TAL-HRC-24A9', 'HRC-86K-52P', 'active'),
  ('dept-tal-ie-46', 'unit-tal', 'Industrial Engineering', 'TAL-IE', 'TAL-IE-899', 'IE-80K-82P', 'active'),
  ('dept-tal-mm-47', 'unit-tal', 'Marketing & Merchandising', 'TAL-MM', 'TAL-MM-1A38', 'MM-47K-86P', 'active'),
  ('dept-tal-mis-48', 'unit-tal', 'MIS & Internal Audit', 'TAL-MIS', 'TAL-MIS-6A7', 'MIS-25K-37P', 'active'),
  ('dept-tal-prod-49', 'unit-tal', 'Production', 'TAL-PROD', 'TAL-PROD-745', 'PROD-84K-17P', 'active'),
  ('dept-tal-ppc-50', 'unit-tal', 'Production Planning & control', 'TAL-PPC', 'TAL-PPC-7F7', 'PPC-61K-53P', 'active'),
  ('dept-tal-qa-51', 'unit-tal', 'QA, Audit & Technical', 'TAL-QA', 'TAL-QA-14FE', 'QA-26K-44P', 'active'),
  ('dept-tal-stw-52', 'unit-tal', 'Store & Warehouse', 'TAL-STW', 'TAL-STW-1F94', 'STW-45K-27P', 'active'),
  ('dept-tal-scm-53', 'unit-tal', 'Supply Chain', 'TAL-SCM', 'TAL-SCM-265A', 'SCM-16K-22P', 'active'),
  ('dept-tal-ie2-54', 'unit-tal', 'IE', 'TAL-IE2', 'TAL-IE2-2627', 'IE2-80K-29P', 'active'),
  ('dept-tal-tech-55', 'unit-tal', 'Technical', 'TAL-TECH', 'TAL-TECH-75C', 'TECH-92K-12P', 'active'),
  ('dept-tal-wash-56', 'unit-tal', 'Washing', 'TAL-WASH', 'TAL-WASH-1770', 'WASH-93K-94P', 'active')
ON CONFLICT (id) DO UPDATE SET
  unit_id = EXCLUDED.unit_id,
  name = EXCLUDED.name,
  short_code = EXCLUDED.short_code,
  department_id = EXCLUDED.department_id,
  access_code = EXCLUDED.access_code,
  status = EXCLUDED.status;

-- 3. SECTIONS
INSERT INTO sections (id, department_id, name)
VALUES
  ('sec-bgl-1', 'dept-bgl-hra-1', 'Admin'),
  ('sec-bgl-2', 'dept-bgl-ie-2', 'IE'),
  ('sec-bgl-3', 'dept-bgl-cad-3', 'CAD'),
  ('sec-bgl-4', 'dept-bgl-com-4', 'Commercial'),
  ('sec-bgl-5', 'dept-bgl-eng-5', 'Maintenance'),
  ('sec-bgl-6', 'dept-bgl-eng-5', 'Utility & Engineering'),
  ('sec-bgl-7', 'dept-bgl-it-6', 'IT'),
  ('sec-bgl-8', 'dept-bgl-fin-7', 'Finance & Accounts'),
  ('sec-bgl-9', 'dept-bgl-gen-8', 'General'),
  ('sec-bgl-10', 'dept-bgl-hrc-9', 'HR'),
  ('sec-bgl-11', 'dept-bgl-hrc-9', 'HR, Admin & Compliance'),
  ('sec-bgl-12', 'dept-bgl-hrc-9', 'Admin'),
  ('sec-bgl-13', 'dept-bgl-mis-10', 'MIS & Internal Audit'),
  ('sec-bgl-14', 'dept-bgl-prod-11', 'Cutting'),
  ('sec-bgl-15', 'dept-bgl-prod-11', 'Production'),
  ('sec-bgl-16', 'dept-bgl-prod-11', 'Finishing'),
  ('sec-bgl-17', 'dept-bgl-prod-11', 'Technical'),
  ('sec-bgl-18', 'dept-bgl-prod-11', 'Sewing'),
  ('sec-bgl-19', 'dept-bgl-prod-11', 'Printing'),
  ('sec-bgl-20', 'dept-bgl-ppc-12', 'Planning'),
  ('sec-bgl-21', 'dept-bgl-qa-13', 'Quality'),
  ('sec-bgl-22', 'dept-bgl-stw-14', 'Store'),
  ('sec-bgl-23', 'dept-bgl-stw-14', 'Warehouse'),
  ('sec-bgl-24', 'dept-bgl-tech-15', 'Technical'),
  ('sec-mgl-25', 'dept-mgl-eng-16', 'Utility & Engineering'),
  ('sec-mgl-26', 'dept-mgl-hra-17', 'Admin'),
  ('sec-mgl-27', 'dept-mgl-hra-17', 'HR'),
  ('sec-mgl-28', 'dept-mgl-ie-m1', 'Work Study & Line Balancing'),
  ('sec-mgl-29', 'dept-mgl-prod-m2', 'Sewing Floor'),
  ('sec-mgl-30', 'dept-mgl-ppc-m3', 'Production Planning'),
  ('sec-mgl-31', 'dept-mgl-qa-m4', 'Quality Audit & Inspection'),
  ('sec-mgl-32', 'dept-mgl-cad-m5', 'Pattern & Sample'),
  ('sec-mgl-33', 'dept-mgl-com-m6', 'Import & Export'),
  ('sec-mgl-34', 'dept-mgl-it-m7', 'ERP & Network'),
  ('sec-mgl-35', 'dept-mgl-fin-m8', 'Accounts & Costing'),
  ('sec-mgl-36', 'dept-mgl-stw-m9', 'Materials & Store'),
  ('sec-mgl-37', 'dept-mgl-gen-m10', 'General Admin'),
  ('sec-srsl-56', 'dept-srsl-ie-s1', 'IE Optimization'),
  ('sec-srsl-57', 'dept-srsl-prod-s2', 'Manufacturing Floor'),
  ('sec-srsl-58', 'dept-srsl-qa-s3', 'Quality & Technical Audit'),
  ('sec-srsl-59', 'dept-srsl-hra-s4', 'HR & Welfare'),
  ('sec-srsl-60', 'dept-srsl-ppc-s5', 'Capacity & Planning'),
  ('sec-srsl-61', 'dept-srsl-eng-s6', 'Engineering Maintenance'),
  ('sec-srsl-62', 'dept-srsl-it-s7', 'ERP Systems'),
  ('sec-srsl-63', 'dept-srsl-stw-s8', 'Central Store'),
  ('sec-rhl-28', 'dept-rhl-cad-18', 'General'),
  ('sec-rhl-29', 'dept-rhl-cad-18', 'Sample'),
  ('sec-rhl-30', 'dept-rhl-cad-18', 'CAD'),
  ('sec-rhl-31', 'dept-rhl-com-19', 'Commercial'),
  ('sec-rhl-32', 'dept-rhl-hra-20', 'Admin'),
  ('sec-rhl-33', 'dept-rhl-prod-21', 'Production'),
  ('sec-rhl-34', 'dept-rhl-prod-21', 'Sewing'),
  ('sec-rhl-35', 'dept-rhl-prod-21', 'Finishing'),
  ('sec-rhl-36', 'dept-rhl-prod-21', 'Cutting'),
  ('sec-rhl-37', 'dept-rhl-ppc-22', 'Planning'),
  ('sec-rhl-38', 'dept-rhl-ppc-22', 'Planning & Coordination'),
  ('sec-rhl-39', 'dept-rhl-eng-23', 'Maintenance'),
  ('sec-rhl-40', 'dept-rhl-eng-23', 'Utility & Engineering'),
  ('sec-rhl-41', 'dept-rhl-it-24', 'IT'),
  ('sec-rhl-42', 'dept-rhl-fin-25', 'Finance & Accounts'),
  ('sec-rhl-43', 'dept-rhl-gen-26', 'General'),
  ('sec-rhl-44', 'dept-rhl-hrc-27', 'HR, Admin & Compliance'),
  ('sec-rhl-45', 'dept-rhl-hrc-27', 'HR'),
  ('sec-rhl-46', 'dept-rhl-hrc-27', 'Sustainability'),
  ('sec-rhl-47', 'dept-rhl-ie-28', 'IE'),
  ('sec-rhl-48', 'dept-rhl-mis-29', 'MIS & Internal Audit'),
  ('sec-rhl-49', 'dept-rhl-qa-30', 'Quality'),
  ('sec-rhl-50', 'dept-rhl-stw-31', 'Store & Warehouse'),
  ('sec-rhl-51', 'dept-rhl-wash-32', 'Washing'),
  ('sec-srsl-52', 'dept-srsl-dpd-33', 'Design & Product Development'),
  ('sec-srsl-53', 'dept-srsl-dpd-33', 'Development'),
  ('sec-srsl-54', 'dept-srsl-fin-34', 'Finance'),
  ('sec-srsl-55', 'dept-srsl-gen-35', 'General Admin'),
  ('sec-tal-56', 'dept-tal-cad-36', 'CAD'),
  ('sec-tal-57', 'dept-tal-cad-36', 'Sample'),
  ('sec-tal-58', 'dept-tal-cad-36', 'CAD & Sample'),
  ('sec-tal-59', 'dept-tal-com-37', 'Commercial'),
  ('sec-tal-60', 'dept-tal-dpd-38', 'Store'),
  ('sec-tal-61', 'dept-tal-dpd-38', 'Design & Product Development'),
  ('sec-tal-62', 'dept-tal-eng-39', 'Maintenance'),
  ('sec-tal-63', 'dept-tal-eng-39', 'Utility & Engineering'),
  ('sec-tal-64', 'dept-tal-eng-39', 'Civil'),
  ('sec-tal-65', 'dept-tal-it-40', 'General'),
  ('sec-tal-66', 'dept-tal-it-40', 'ERP'),
  ('sec-tal-67', 'dept-tal-it-40', 'IT'),
  ('sec-tal-68', 'dept-tal-esg-41', 'Social'),
  ('sec-tal-69', 'dept-tal-esg-41', 'EMS'),
  ('sec-tal-70', 'dept-tal-fin-42', 'Finance & Accounts'),
  ('sec-tal-71', 'dept-tal-fin-42', 'Finance'),
  ('sec-tal-72', 'dept-tal-gen-43', 'General Admin'),
  ('sec-tal-73', 'dept-tal-gen-43', 'General'),
  ('sec-tal-74', 'dept-tal-hra-44', 'HR'),
  ('sec-tal-75', 'dept-tal-hra-44', 'Admin'),
  ('sec-tal-76', 'dept-tal-hra-44', 'General'),
  ('sec-tal-77', 'dept-tal-hrc-45', 'Admin'),
  ('sec-tal-78', 'dept-tal-hrc-45', 'HR'),
  ('sec-tal-79', 'dept-tal-hrc-45', 'HR & Compliance'),
  ('sec-tal-80', 'dept-tal-hrc-45', 'HR, Admin & Compliance'),
  ('sec-tal-81', 'dept-tal-hrc-45', 'Sustainability'),
  ('sec-tal-82', 'dept-tal-hrc-45', 'Compliance'),
  ('sec-tal-83', 'dept-tal-ie-46', 'IE'),
  ('sec-tal-84', 'dept-tal-ie-46', 'Technical'),
  ('sec-tal-85', 'dept-tal-mm-47', 'Merchandising'),
  ('sec-tal-86', 'dept-tal-mis-48', 'MIS & Internal Audit'),
  ('sec-tal-87', 'dept-tal-prod-49', 'Production'),
  ('sec-tal-88', 'dept-tal-prod-49', 'Cutting'),
  ('sec-tal-89', 'dept-tal-prod-49', 'Finishing'),
  ('sec-tal-90', 'dept-tal-prod-49', 'Sample'),
  ('sec-tal-91', 'dept-tal-prod-49', 'Sewing'),
  ('sec-tal-92', 'dept-tal-prod-49', 'Embroidery'),
  ('sec-tal-93', 'dept-tal-prod-49', 'Warehouse'),
  ('sec-tal-94', 'dept-tal-prod-49', 'Wet Process'),
  ('sec-tal-95', 'dept-tal-ppc-50', 'Planning & Coordination'),
  ('sec-tal-96', 'dept-tal-ppc-50', 'Planning'),
  ('sec-tal-97', 'dept-tal-qa-51', 'Quality'),
  ('sec-tal-98', 'dept-tal-qa-51', 'Sewing'),
  ('sec-tal-99', 'dept-tal-qa-51', 'Finishing'),
  ('sec-tal-100', 'dept-tal-qa-51', 'Raw Material'),
  ('sec-tal-101', 'dept-tal-qa-51', 'Laboratory'),
  ('sec-tal-102', 'dept-tal-stw-52', 'Store'),
  ('sec-tal-103', 'dept-tal-stw-52', 'Warehouse'),
  ('sec-tal-104', 'dept-tal-stw-52', 'Store & Warehouse'),
  ('sec-tal-105', 'dept-tal-scm-53', 'Supply Chain'),
  ('sec-tal-106', 'dept-tal-ie2-54', 'IE'),
  ('sec-tal-107', 'dept-tal-tech-55', 'Technical'),
  ('sec-tal-108', 'dept-tal-wash-56', 'Washing'),
  ('sec-tal-109', 'dept-tal-wash-56', 'Wet Process'),
  ('sec-tal-110', 'dept-tal-wash-56', 'R&D'),
  ('sec-tal-111', 'dept-tal-wash-56', 'Dry Process')
ON CONFLICT (id) DO UPDATE SET
  department_id = EXCLUDED.department_id,
  name = EXCLUDED.name;

-- 4. SUBSECTIONS
INSERT INTO subsections (id, section_id, name)
VALUES
  ('sub-bgl-1', 'sec-bgl-1', 'Transportation Management'),
  ('sub-bgl-2', 'sec-bgl-2', 'IE'),
  ('sub-bgl-3', 'sec-bgl-3', 'CAD'),
  ('sub-bgl-4', 'sec-bgl-4', 'Export'),
  ('sub-bgl-5', 'sec-bgl-5', 'Maintenance'),
  ('sub-bgl-6', 'sec-bgl-6', 'Utility'),
  ('sub-bgl-7', 'sec-bgl-7', 'IT'),
  ('sub-bgl-8', 'sec-bgl-8', 'Accounts'),
  ('sub-bgl-9', 'sec-bgl-9', 'General'),
  ('sub-bgl-10', 'sec-bgl-10', 'Payroll'),
  ('sub-bgl-11', 'sec-bgl-10', 'HR'),
  ('sub-bgl-12', 'sec-bgl-11', 'General'),
  ('sub-bgl-13', 'sec-bgl-11', 'HR'),
  ('sub-bgl-14', 'sec-bgl-11', 'Compliance'),
  ('sub-bgl-15', 'sec-bgl-12', 'Admin'),
  ('sub-bgl-16', 'sec-bgl-13', 'Internal Audit'),
  ('sub-bgl-17', 'sec-bgl-14', 'Cutting'),
  ('sub-bgl-18', 'sec-bgl-14', 'General'),
  ('sub-bgl-19', 'sec-bgl-15', 'Sewing'),
  ('sub-bgl-20', 'sec-bgl-15', 'Finishing'),
  ('sub-bgl-21', 'sec-bgl-15', 'Cutting'),
  ('sub-bgl-22', 'sec-bgl-15', 'Production'),
  ('sub-bgl-23', 'sec-bgl-16', 'Finishing'),
  ('sub-bgl-24', 'sec-bgl-17', 'Technical'),
  ('sub-bgl-25', 'sec-bgl-18', 'Sewing'),
  ('sub-bgl-26', 'sec-bgl-18', 'Technical'),
  ('sub-bgl-27', 'sec-bgl-19', 'Printing'),
  ('sub-bgl-28', 'sec-bgl-20', 'Planning & Controll'),
  ('sub-bgl-29', 'sec-bgl-21', 'Quality'),
  ('sub-bgl-30', 'sec-bgl-21', 'GPQ'),
  ('sub-bgl-31', 'sec-bgl-21', 'Sewing'),
  ('sub-bgl-32', 'sec-bgl-22', 'Store'),
  ('sub-bgl-33', 'sec-bgl-23', 'Warehouse'),
  ('sub-bgl-34', 'sec-bgl-24', 'Technical'),
  ('sub-mgl-35', 'sec-mgl-25', 'Utility'),
  ('sub-mgl-36', 'sec-mgl-26', 'Cafeteria & House Keeping Management'),
  ('sub-mgl-37', 'sec-mgl-26', 'Safety, Security & Emergency Management'),
  ('sub-mgl-38', 'sec-mgl-26', 'Transportation Management'),
  ('sub-mgl-39', 'sec-mgl-27', 'Compensation , Benefits & HR Analytics'),
  ('sub-rhl-40', 'sec-rhl-28', 'General'),
  ('sub-rhl-41', 'sec-rhl-29', 'Sample'),
  ('sub-rhl-42', 'sec-rhl-30', 'CAD'),
  ('sub-rhl-43', 'sec-rhl-31', 'Export'),
  ('sub-rhl-44', 'sec-rhl-32', 'Transportation Management'),
  ('sub-rhl-45', 'sec-rhl-33', 'Production'),
  ('sub-rhl-46', 'sec-rhl-33', 'Cutting'),
  ('sub-rhl-47', 'sec-rhl-34', 'Sewing'),
  ('sub-rhl-48', 'sec-rhl-35', 'Finishing'),
  ('sub-rhl-49', 'sec-rhl-36', 'Cutting'),
  ('sub-rhl-50', 'sec-rhl-37', 'Planning & Controll'),
  ('sub-rhl-51', 'sec-rhl-38', 'Planning & Controll'),
  ('sub-rhl-52', 'sec-rhl-39', 'Maintenance'),
  ('sub-rhl-53', 'sec-rhl-40', 'Utility'),
  ('sub-rhl-54', 'sec-rhl-41', 'IT'),
  ('sub-rhl-55', 'sec-rhl-42', 'Accounts'),
  ('sub-rhl-56', 'sec-rhl-43', 'General'),
  ('sub-rhl-57', 'sec-rhl-44', 'HR'),
  ('sub-rhl-58', 'sec-rhl-45', 'Payroll'),
  ('sub-rhl-59', 'sec-rhl-46', 'Compliance'),
  ('sub-rhl-60', 'sec-rhl-47', 'IE'),
  ('sub-rhl-61', 'sec-rhl-47', 'Finishing'),
  ('sub-rhl-62', 'sec-rhl-47', 'Sewing'),
  ('sub-rhl-63', 'sec-rhl-48', 'Internal Audit'),
  ('sub-rhl-64', 'sec-rhl-49', 'Quality'),
  ('sub-rhl-65', 'sec-rhl-50', 'Store'),
  ('sub-rhl-66', 'sec-rhl-51', 'Washing'),
  ('sub-srsl-67', 'sec-srsl-52', 'Design'),
  ('sub-srsl-68', 'sec-srsl-53', 'Development'),
  ('sub-srsl-69', 'sec-srsl-54', 'Finance'),
  ('sub-srsl-70', 'sec-srsl-55', 'General'),
  ('sub-tal-71', 'sec-tal-56', 'CAD'),
  ('sub-tal-72', 'sec-tal-56', '3D'),
  ('sub-tal-73', 'sec-tal-57', 'Sewing'),
  ('sub-tal-74', 'sec-tal-57', 'Quality'),
  ('sub-tal-75', 'sec-tal-57', 'Cutting'),
  ('sub-tal-76', 'sec-tal-57', 'Sample'),
  ('sub-tal-77', 'sec-tal-57', 'Finishing'),
  ('sub-tal-78', 'sec-tal-57', 'Technical'),
  ('sub-tal-79', 'sec-tal-58', 'Sample'),
  ('sub-tal-80', 'sec-tal-59', 'Export'),
  ('sub-tal-81', 'sec-tal-59', 'Customs'),
  ('sub-tal-82', 'sec-tal-59', 'Import'),
  ('sub-tal-83', 'sec-tal-59', 'C & F'),
  ('sub-tal-84', 'sec-tal-59', 'General'),
  ('sub-tal-85', 'sec-tal-59', 'Cash Incentive'),
  ('sub-tal-86', 'sec-tal-60', 'Store'),
  ('sub-tal-87', 'sec-tal-61', 'Fabric'),
  ('sub-tal-88', 'sec-tal-61', 'Design'),
  ('sub-tal-89', 'sec-tal-62', 'Maintenance'),
  ('sub-tal-90', 'sec-tal-62', 'Sample'),
  ('sub-tal-91', 'sec-tal-62', 'Sewing'),
  ('sub-tal-92', 'sec-tal-62', 'Quilting'),
  ('sub-tal-93', 'sec-tal-62', 'Quick change over Team'),
  ('sub-tal-94', 'sec-tal-62', 'Finishing'),
  ('sub-tal-95', 'sec-tal-62', 'Cutting'),
  ('sub-tal-96', 'sec-tal-62', 'Folding'),
  ('sub-tal-97', 'sec-tal-63', 'Utility'),
  ('sub-tal-98', 'sec-tal-63', 'Sample'),
  ('sub-tal-99', 'sec-tal-63', 'Substation'),
  ('sub-tal-100', 'sec-tal-63', 'Electrical'),
  ('sub-tal-101', 'sec-tal-64', 'Civil'),
  ('sub-tal-102', 'sec-tal-65', 'General'),
  ('sub-tal-103', 'sec-tal-66', 'Support & Customization'),
  ('sub-tal-104', 'sec-tal-66', 'Development'),
  ('sub-tal-105', 'sec-tal-66', 'Database Admin'),
  ('sub-tal-106', 'sec-tal-67', 'Support'),
  ('sub-tal-107', 'sec-tal-67', 'Core Network'),
  ('sub-tal-108', 'sec-tal-67', 'IT'),
  ('sub-tal-109', 'sec-tal-68', 'Social'),
  ('sub-tal-110', 'sec-tal-69', 'EMS'),
  ('sub-tal-111', 'sec-tal-70', 'Accounts'),
  ('sub-tal-112', 'sec-tal-70', 'Cash Incentive'),
  ('sub-tal-113', 'sec-tal-70', 'Finance'),
  ('sub-tal-114', 'sec-tal-71', 'Finance'),
  ('sub-tal-115', 'sec-tal-72', 'Secreteriate'),
  ('sub-tal-116', 'sec-tal-72', 'General'),
  ('sub-tal-117', 'sec-tal-73', 'General'),
  ('sub-tal-118', 'sec-tal-74', 'Compensation , Benefits & HR Analytics'),
  ('sub-tal-119', 'sec-tal-74', 'Talent Acquisition & Onboarding'),
  ('sub-tal-120', 'sec-tal-74', 'PMS, Learning & OD'),
  ('sub-tal-121', 'sec-tal-75', 'Cafeteria & House Keeping Management'),
  ('sub-tal-122', 'sec-tal-75', 'Transportation Management'),
  ('sub-tal-123', 'sec-tal-75', 'Safety, Security & Emergency Management'),
  ('sub-tal-124', 'sec-tal-75', 'General'),
  ('sub-tal-125', 'sec-tal-76', 'General'),
  ('sub-tal-126', 'sec-tal-77', 'General'),
  ('sub-tal-127', 'sec-tal-77', 'Basundhara House'),
  ('sub-tal-128', 'sec-tal-77', 'Transport'),
  ('sub-tal-129', 'sec-tal-77', 'Admin'),
  ('sub-tal-130', 'sec-tal-78', 'Payroll'),
  ('sub-tal-131', 'sec-tal-78', 'HR'),
  ('sub-tal-132', 'sec-tal-78', 'OD & Training'),
  ('sub-tal-133', 'sec-tal-79', 'HR'),
  ('sub-tal-134', 'sec-tal-80', 'HR'),
  ('sub-tal-135', 'sec-tal-80', 'General'),
  ('sub-tal-136', 'sec-tal-80', 'Compliance'),
  ('sub-tal-137', 'sec-tal-80', 'Payroll'),
  ('sub-tal-138', 'sec-tal-80', 'Medical'),
  ('sub-tal-139', 'sec-tal-81', 'Compliance'),
  ('sub-tal-140', 'sec-tal-82', 'EMS'),
  ('sub-tal-141', 'sec-tal-83', 'IE'),
  ('sub-tal-142', 'sec-tal-83', 'Sewing'),
  ('sub-tal-143', 'sec-tal-83', 'Technical'),
  ('sub-tal-144', 'sec-tal-83', 'OPEX'),
  ('sub-tal-145', 'sec-tal-83', 'Finishing'),
  ('sub-tal-146', 'sec-tal-84', 'Sewing'),
  ('sub-tal-147', 'sec-tal-84', 'Technical'),
  ('sub-tal-148', 'sec-tal-85', 'Cluster-6'),
  ('sub-tal-149', 'sec-tal-85', 'Cluster-9'),
  ('sub-tal-150', 'sec-tal-85', 'Cluster-3'),
  ('sub-tal-151', 'sec-tal-85', 'Cluster-8'),
  ('sub-tal-152', 'sec-tal-85', 'Cluster-5'),
  ('sub-tal-153', 'sec-tal-85', 'Cluster-1'),
  ('sub-tal-154', 'sec-tal-85', 'Cluster-7'),
  ('sub-tal-155', 'sec-tal-85', 'Cluster-2'),
  ('sub-tal-156', 'sec-tal-85', 'Cluster-4'),
  ('sub-tal-157', 'sec-tal-86', 'MIS'),
  ('sub-tal-158', 'sec-tal-86', 'Internal Audit'),
  ('sub-tal-159', 'sec-tal-87', 'Production'),
  ('sub-tal-160', 'sec-tal-87', 'Sewing'),
  ('sub-tal-161', 'sec-tal-88', 'Cutting'),
  ('sub-tal-162', 'sec-tal-89', 'Finishing'),
  ('sub-tal-163', 'sec-tal-90', 'Sample'),
  ('sub-tal-164', 'sec-tal-91', 'Sewing'),
  ('sub-tal-165', 'sec-tal-91', 'Pilot Line-01'),
  ('sub-tal-166', 'sec-tal-92', 'Embroidery'),
  ('sub-tal-167', 'sec-tal-93', 'Fabric'),
  ('sub-tal-168', 'sec-tal-94', 'Wet Process'),
  ('sub-tal-169', 'sec-tal-95', 'Planning & Controll'),
  ('sub-tal-170', 'sec-tal-95', 'Planning'),
  ('sub-tal-171', 'sec-tal-96', 'Planning'),
  ('sub-tal-172', 'sec-tal-96', 'Planning & Controll'),
  ('sub-tal-173', 'sec-tal-97', 'Quality'),
  ('sub-tal-174', 'sec-tal-97', 'GPQ'),
  ('sub-tal-175', 'sec-tal-97', 'Sewing'),
  ('sub-tal-176', 'sec-tal-97', 'Sub Contract'),
  ('sub-tal-177', 'sec-tal-97', 'Process Control'),
  ('sub-tal-178', 'sec-tal-98', 'Sewing'),
  ('sub-tal-179', 'sec-tal-99', 'Finishing'),
  ('sub-tal-180', 'sec-tal-100', 'Fabric'),
  ('sub-tal-181', 'sec-tal-101', 'Lab'),
  ('sub-tal-182', 'sec-tal-102', 'Store'),
  ('sub-tal-183', 'sec-tal-103', 'Warehouse'),
  ('sub-tal-184', 'sec-tal-103', 'Trims'),
  ('sub-tal-185', 'sec-tal-103', 'Fabric'),
  ('sub-tal-186', 'sec-tal-104', 'Fabric'),
  ('sub-tal-187', 'sec-tal-105', 'Supply Chain (Local Purchase)'),
  ('sub-tal-188', 'sec-tal-105', 'Supply Chain (CAPEX)'),
  ('sub-tal-189', 'sec-tal-106', 'Technical'),
  ('sub-tal-190', 'sec-tal-107', 'Technical'),
  ('sub-tal-191', 'sec-tal-108', 'Wet Process'),
  ('sub-tal-192', 'sec-tal-108', 'Washing'),
  ('sub-tal-193', 'sec-tal-108', 'Sample'),
  ('sub-tal-194', 'sec-tal-108', 'Production'),
  ('sub-tal-195', 'sec-tal-108', 'Dry Process'),
  ('sub-tal-196', 'sec-tal-109', 'Wet Process'),
  ('sub-tal-197', 'sec-tal-110', 'R & D'),
  ('sub-tal-198', 'sec-tal-111', 'Dry Process')
ON CONFLICT (id) DO UPDATE SET
  section_id = EXCLUDED.section_id,
  name = EXCLUDED.name;
