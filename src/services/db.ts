import { Department, Section, Subsection, KPI, KPIMonthlyEntry, AuditLog } from '../types';
import { supabase } from './supabase';

const STORAGE_KEYS = {
  DEPARTMENTS: 'bitopi_kpi_departments_v4',
  SECTIONS: 'bitopi_kpi_sections_v4',
  SUBSECTIONS: 'bitopi_kpi_subsections_v4',
  KPIS: 'bitopi_kpi_kpis_v4',
  MONTHLY_ENTRIES: 'bitopi_kpi_monthly_entries_v4',
  AUDIT_LOGS: 'bitopi_kpi_audit_logs_v4',
};

// Generate random code in format XXX-XXX-XXX
export function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const chunk = () => Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${chunk()}-${chunk()}-${chunk()}`;
}

// Generate Department ID like IE-7F29
export function generateDepartmentId(shortCode: string): string {
  const hex = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  const code = (shortCode || 'DEP').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  return `${code}-${hex}`;
}

// Generate KPI code like KPI-001
export function generateNextKPICode(existingKpis: KPI[]): string {
  const numbers = existingKpis
    .map((k) => {
      const match = k.kpi_code.match(/KPI-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));

  const max = numbers.length > 0 ? Math.max(...numbers) : 0;
  const next = max + 1;
  return `KPI-${next.toString().padStart(3, '0')}`;
}

// Seed initial 21 departments from Section 12
const INITIAL_DEPARTMENTS: Omit<Department, 'created_at' | 'updated_at'>[] = [
  { id: 'dept-ie', name: 'Industrial Engineering', short_code: 'IE', department_id: 'IE-7F29', access_code: 'X8K-29P-Q7M', status: 'active' },
  { id: 'dept-hr', name: 'HR & Admin', short_code: 'HR', department_id: 'HR-2K81', access_code: 'M4P-82W-R1B', status: 'active' },
  { id: 'dept-cad', name: 'CAD & Sample', short_code: 'CAD', department_id: 'CAD-3M19', access_code: 'Q9T-44L-Z2N', status: 'active' },
  { id: 'dept-com', name: 'Commercial', short_code: 'COM', department_id: 'COM-5P82', access_code: 'V3R-91K-C8H', status: 'active' },
  { id: 'dept-eng', name: 'Engineering & Services', short_code: 'ENG', department_id: 'ENG-6W41', access_code: 'L7D-25X-J4P', status: 'active' },
  { id: 'dept-it', name: 'ERP & IT', short_code: 'IT', department_id: 'IT-8K12', access_code: 'F2W-68Y-K9T', status: 'active' },
  { id: 'dept-fin', name: 'Finance & Accounts', short_code: 'FIN', department_id: 'FIN-9P22', access_code: 'T5N-73D-W8K', status: 'active' },
  { id: 'dept-gen', name: 'General', short_code: 'GEN', department_id: 'GEN-1A44', access_code: 'H8C-19M-P6L', status: 'active' },
  { id: 'dept-hrc', name: 'HR, Admin & Compliance', short_code: 'HRC', department_id: 'HRC-4B77', access_code: 'Z6K-32V-N5X', status: 'active' },
  { id: 'dept-mis', name: 'MIS & Internal Audit', short_code: 'MIS', department_id: 'MIS-7C90', access_code: 'R1Y-84P-G3D', status: 'active' },
  { id: 'dept-prod', name: 'Production', short_code: 'PROD', department_id: 'PROD-2D33', access_code: 'E9M-57T-K2W', status: 'active' },
  { id: 'dept-ppc', name: 'Production Planning & Control', short_code: 'PPC', department_id: 'PPC-5E66', access_code: 'C3X-71R-J8M', status: 'active' },
  { id: 'dept-qa', name: 'QA, Audit & Technical', short_code: 'QA', department_id: 'QA-8F11', access_code: 'B7T-94K-L1P', status: 'active' },
  { id: 'dept-stw', name: 'Store & Warehouse', short_code: 'STW', department_id: 'STW-3G55', access_code: 'W4N-62D-P9H', status: 'active' },
  { id: 'dept-tech', name: 'Technical', short_code: 'TECH', department_id: 'TECH-6H88', access_code: 'Y8L-35V-M4C', status: 'active' },
  { id: 'dept-wash', name: 'Washing', short_code: 'WASH', department_id: 'WASH-9J22', access_code: 'K2R-81W-T7F', status: 'active' },
  { id: 'dept-dpd', name: 'Design & Product Development', short_code: 'DPD', department_id: 'DPD-1K44', access_code: 'P6D-49X-C3K', status: 'active' },
  { id: 'dept-esg', name: 'ESG', short_code: 'ESG', department_id: 'ESG-4L77', access_code: 'G1T-73M-R8B', status: 'active' },
  { id: 'dept-mm', name: 'Marketing & Merchandising', short_code: 'MM', department_id: 'MM-7N00', access_code: 'N5K-26P-W2Y', status: 'active' },
  { id: 'dept-scm', name: 'Supply Chain', short_code: 'SCM', department_id: 'SCM-2P33', access_code: 'D9W-58L-J4T', status: 'active' },
  { id: 'dept-ie2', name: 'IE Special Projects', short_code: 'IES', department_id: 'IES-9R66', access_code: 'X3M-89K-Q1V', status: 'active' },
];

const INITIAL_SECTIONS: Omit<Section, 'created_at'>[] = [
  // IE
  { id: 'sec-ie-1', department_id: 'dept-ie', name: 'Line Optimization & Work Study' },
  { id: 'sec-ie-2', department_id: 'dept-ie', name: 'Method Engineering & Layout' },
  { id: 'sec-ie-3', department_id: 'dept-ie', name: 'Cost Reduction & SMV Analysis' },
  // Production
  { id: 'sec-prod-1', department_id: 'dept-prod', name: 'Sewing Assembly Lines' },
  { id: 'sec-prod-2', department_id: 'dept-prod', name: 'Automated Cutting Division' },
  // QA
  { id: 'sec-qa-1', department_id: 'dept-qa', name: 'In-Line Process Audits' },
  { id: 'sec-qa-2', department_id: 'dept-qa', name: 'Final Inspection & AQL' },
  // Finance
  { id: 'sec-fin-1', department_id: 'dept-fin', name: 'Cost Accounting & SMV Rates' },
  { id: 'sec-fin-2', department_id: 'dept-fin', name: 'Working Capital & Audits' },
  // HR
  { id: 'sec-hr-1', department_id: 'dept-hr', name: 'Skill Training & Operator Onboarding' },
  { id: 'sec-hr-2', department_id: 'dept-hr', name: 'Attendance & Employee Retention' },
];

const INITIAL_SUBSECTIONS: Omit<Subsection, 'created_at'>[] = [
  { id: 'sub-ie-1a', section_id: 'sec-ie-1', name: 'High-Speed Sewing Floors' },
  { id: 'sub-ie-1b', section_id: 'sec-ie-1', name: 'Finishing & Packing Flow' },
  { id: 'sub-ie-2a', section_id: 'sec-ie-2', name: 'SMV Benchmarking Lab' },
  { id: 'sub-prod-1a', section_id: 'sec-prod-1', name: 'Unit 1 Modular Lines' },
  { id: 'sub-qa-1a', section_id: 'sec-qa-1', name: 'Traffic Light Quality Cell' },
];

const INITIAL_KPIS: Omit<KPI, 'created_at' | 'updated_at'>[] = [];

const INITIAL_MONTHLY_ENTRIES: Omit<KPIMonthlyEntry, 'created_at' | 'updated_at'>[] = [];

class DatabaseService {
  private listeners: Set<() => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private isRealtimeSubscribed = false;
  private isInitialized = false;

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Database listener error:', err);
      }
    });
  }

  broadcastUpdate() {
    this.notifyListeners();
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: 'DB_SYNC', timestamp: Date.now() });
      } catch {
        // ignore
      }
    }
  }

  async syncFromSupabase(): Promise<void> {
    if (!supabase) return;
    try {
      const [kpisRes, entriesRes, deptsRes, sectionsRes, subsRes] = await Promise.all([
        supabase.from('kpis').select('*'),
        supabase.from('kpi_monthly_entries').select('*'),
        supabase.from('departments').select('*'),
        supabase.from('sections').select('*'),
        supabase.from('subsections').select('*'),
      ]);

      let changed = false;

      // Note: Must unconditionally update if data is returned (even empty array [])
      if (kpisRes.data !== null && Array.isArray(kpisRes.data)) {
        const prev = localStorage.getItem(STORAGE_KEYS.KPIS);
        const next = JSON.stringify(kpisRes.data);
        if (prev !== next) {
          localStorage.setItem(STORAGE_KEYS.KPIS, next);
          changed = true;
        }
      }

      if (entriesRes.data !== null && Array.isArray(entriesRes.data)) {
        const prev = localStorage.getItem(STORAGE_KEYS.MONTHLY_ENTRIES);
        const next = JSON.stringify(entriesRes.data);
        if (prev !== next) {
          localStorage.setItem(STORAGE_KEYS.MONTHLY_ENTRIES, next);
          changed = true;
        }
      }

      if (deptsRes.data && deptsRes.data.length > 0) {
        const prev = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
        const next = JSON.stringify(deptsRes.data);
        if (prev !== next) {
          localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, next);
          changed = true;
        }
      }

      if (sectionsRes.data && sectionsRes.data.length > 0) {
        const prev = localStorage.getItem(STORAGE_KEYS.SECTIONS);
        const next = JSON.stringify(sectionsRes.data);
        if (prev !== next) {
          localStorage.setItem(STORAGE_KEYS.SECTIONS, next);
          changed = true;
        }
      }

      if (subsRes.data && subsRes.data.length > 0) {
        const prev = localStorage.getItem(STORAGE_KEYS.SUBSECTIONS);
        const next = JSON.stringify(subsRes.data);
        if (prev !== next) {
          localStorage.setItem(STORAGE_KEYS.SUBSECTIONS, next);
          changed = true;
        }
      }

      if (changed) {
        this.notifyListeners();
      }
    } catch (err) {
      console.error('Supabase sync error:', err);
    }
  }

  private initStorage() {
    if (typeof window === 'undefined') return;

    // Purge legacy storage keys from previous versions
    [
      'bitopi_kpi_departments_v1', 'bitopi_kpi_departments_v2', 'bitopi_kpi_departments_v3',
      'bitopi_kpi_sections_v1', 'bitopi_kpi_sections_v2', 'bitopi_kpi_sections_v3',
      'bitopi_kpi_subsections_v1', 'bitopi_kpi_subsections_v2', 'bitopi_kpi_subsections_v3',
      'bitopi_kpi_kpis_v1', 'bitopi_kpi_kpis_v2', 'bitopi_kpi_kpis_v3',
      'bitopi_kpi_monthly_entries_v1', 'bitopi_kpi_monthly_entries_v2', 'bitopi_kpi_monthly_entries_v3',
    ].forEach((k) => localStorage.removeItem(k));

    if (!localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) {
      const now = new Date().toISOString();
      const departments: Department[] = INITIAL_DEPARTMENTS.map((d) => ({
        ...d,
        created_at: now,
        updated_at: now,
      }));
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
    }

    if (!localStorage.getItem(STORAGE_KEYS.SECTIONS)) {
      const now = new Date().toISOString();
      const sections: Section[] = INITIAL_SECTIONS.map((s) => ({
        ...s,
        created_at: now,
      }));
      localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(sections));
    }

    if (!localStorage.getItem(STORAGE_KEYS.SUBSECTIONS)) {
      const now = new Date().toISOString();
      const subsections: Subsection[] = INITIAL_SUBSECTIONS.map((sub) => ({
        ...sub,
        created_at: now,
      }));
      localStorage.setItem(STORAGE_KEYS.SUBSECTIONS, JSON.stringify(subsections));
    }

    // Always ensure KPIs and Monthly entries start fresh without any sample records
    if (!localStorage.getItem(STORAGE_KEYS.KPIS)) {
      localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify([]));
    } else {
      // If any sample KPI exists in stored data, purge them
      try {
        const storedKpis: KPI[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.KPIS) || '[]');
        const cleanKpis = storedKpis.filter((k) => !k.id.startsWith('kpi-ie-'));
        if (cleanKpis.length !== storedKpis.length) {
          localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(cleanKpis));
        }
      } catch {
        localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify([]));
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.MONTHLY_ENTRIES)) {
      localStorage.setItem(STORAGE_KEYS.MONTHLY_ENTRIES, JSON.stringify([]));
    } else {
      try {
        const storedEntries: KPIMonthlyEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MONTHLY_ENTRIES) || '[]');
        const cleanEntries = storedEntries.filter((e) => !e.kpi_id.startsWith('kpi-ie-'));
        if (cleanEntries.length !== storedEntries.length) {
          localStorage.setItem(STORAGE_KEYS.MONTHLY_ENTRIES, JSON.stringify(cleanEntries));
        }
      } catch {
        localStorage.setItem(STORAGE_KEYS.MONTHLY_ENTRIES, JSON.stringify([]));
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      const initialLogs: AuditLog[] = [
        {
          id: 'log-seed-1',
          user_role: 'admin',
          user_identifier: 'system_init',
          action: 'create_department',
          entity_type: 'department',
          entity_id: 'dept-ie',
          description: 'Provisioned 21 standard departments ready for department KPI entry',
          created_at: new Date().toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialLogs));
    }

    if (!this.isInitialized) {
      this.isInitialized = true;

      // BroadcastChannel for instant cross-tab sync in same browser
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          this.broadcastChannel = new BroadcastChannel('bitopi_kpi_sync_channel');
          this.broadcastChannel.onmessage = (event) => {
            if (event.data?.type === 'DB_SYNC') {
              this.notifyListeners();
            }
          };
        } catch {
          // ignore
        }
      }

      // Storage event listener fallback for cross-tab sync
      if (typeof window !== 'undefined') {
        window.addEventListener('storage', (e) => {
          if (e.key && e.key.startsWith('bitopi_kpi_')) {
            this.notifyListeners();
          }
        });
      }

      // Supabase Realtime channel subscription for instant multi-user sync
      if (supabase && !this.isRealtimeSubscribed) {
        try {
          this.isRealtimeSubscribed = true;
          supabase
            .channel('kpi_realtime_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kpis' }, () => {
              this.syncFromSupabase();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kpi_monthly_entries' }, () => {
              this.syncFromSupabase();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, () => {
              this.syncFromSupabase();
            })
            .subscribe();
        } catch {
          // ignore
        }
      }

      // Initial async sync from Supabase
      this.syncFromSupabase();
    }
  }

  constructor() {
    this.initStorage();
  }

  // --- DEPARTMENTS ---
  getDepartments(): Department[] {
    this.initStorage();
    const data = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    return data ? JSON.parse(data) : [];
  }

  getDepartmentById(id: string): Department | undefined {
    return this.getDepartments().find((d) => d.id === id || d.department_id === id);
  }

  createDepartment(name: string, shortCode: string): Department {
    const departments = this.getDepartments();
    const cleanCode = (shortCode || 'DEP').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);

    // Auto-generate unique ID & access code (Section 10)
    let deptId = generateDepartmentId(cleanCode);
    while (departments.some((d) => d.department_id === deptId)) {
      deptId = generateDepartmentId(cleanCode);
    }

    const accessCode = generateAccessCode();
    const now = new Date().toISOString();

    const newDept: Department = {
      id: `dept-${Date.now()}`,
      name: name.trim(),
      short_code: cleanCode,
      department_id: deptId,
      access_code: accessCode,
      status: 'active',
      created_at: now,
      updated_at: now,
    };

    departments.push(newDept);
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));

    this.addAuditLog('admin', 'admin', 'create_department', 'department', newDept.id, `Created department ${newDept.name} (${newDept.department_id})`);

    return newDept;
  }

  updateDepartment(id: string, updates: Partial<Department>): Department | null {
    const departments = this.getDepartments();
    const index = departments.findIndex((d) => d.id === id);
    if (index === -1) return null;

    departments[index] = {
      ...departments[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
    this.addAuditLog('admin', 'admin', 'edit_department', 'department', id, `Updated department ${departments[index].name}`);
    return departments[index];
  }

  regenerateAccessCode(deptId: string): string | null {
    const departments = this.getDepartments();
    const index = departments.findIndex((d) => d.id === deptId || d.department_id === deptId);
    if (index === -1) return null;

    const newCode = generateAccessCode();
    departments[index].access_code = newCode;
    departments[index].updated_at = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
    this.addAuditLog('admin', 'admin', 'regenerate_code', 'department', departments[index].id, `Regenerated access code for ${departments[index].name}`);
    return newCode;
  }

  toggleDepartmentStatus(deptId: string): Department | null {
    const dept = this.getDepartmentById(deptId);
    if (!dept) return null;
    const nextStatus = dept.status === 'active' ? 'disabled' : 'active';
    return this.updateDepartment(dept.id, { status: nextStatus });
  }

  // --- SECTIONS & SUBSECTIONS ---
  getSections(deptId?: string): Section[] {
    this.initStorage();
    const data = localStorage.getItem(STORAGE_KEYS.SECTIONS);
    const sections: Section[] = data ? JSON.parse(data) : [];
    if (deptId && deptId !== 'all') {
      return sections.filter((s) => s.department_id === deptId);
    }
    return sections;
  }

  addSection(departmentId: string, name: string): Section {
    const sections = this.getSections();
    const newSection: Section = {
      id: `sec-${Date.now()}`,
      department_id: departmentId,
      name: name.trim(),
      created_at: new Date().toISOString(),
    };
    sections.push(newSection);
    localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(sections));
    return newSection;
  }

  getSubsections(sectionId?: string): Subsection[] {
    this.initStorage();
    const data = localStorage.getItem(STORAGE_KEYS.SUBSECTIONS);
    const subs: Subsection[] = data ? JSON.parse(data) : [];
    if (sectionId && sectionId !== 'all') {
      return subs.filter((s) => s.section_id === sectionId);
    }
    return subs;
  }

  addSubsection(sectionId: string, name: string): Subsection {
    const subs = this.getSubsections();
    const newSub: Subsection = {
      id: `sub-${Date.now()}`,
      section_id: sectionId,
      name: name.trim(),
      created_at: new Date().toISOString(),
    };
    subs.push(newSub);
    localStorage.setItem(STORAGE_KEYS.SUBSECTIONS, JSON.stringify(subs));
    return newSub;
  }

  // --- KPIS ---
  getKPIs(filter?: {
    departmentId?: string;
    sectionId?: string;
    subsectionId?: string;
    perspective?: string;
    search?: string;
  }): KPI[] {
    this.initStorage();
    const data = localStorage.getItem(STORAGE_KEYS.KPIS);
    let list: KPI[] = data ? JSON.parse(data) : [];

    if (filter) {
      if (filter.departmentId && filter.departmentId !== 'all') {
        list = list.filter((k) => k.department_id === filter.departmentId);
      }
      if (filter.sectionId && filter.sectionId !== 'all') {
        list = list.filter((k) => k.section_id === filter.sectionId);
      }
      if (filter.subsectionId && filter.subsectionId !== 'all') {
        list = list.filter((k) => k.subsection_id === filter.subsectionId);
      }
      if (filter.perspective && filter.perspective !== 'all') {
        list = list.filter((k) => k.perspective === filter.perspective);
      }
      if (filter.search && filter.search.trim()) {
        const q = filter.search.toLowerCase().trim();
        list = list.filter(
          (k) =>
            k.kpi_code.toLowerCase().includes(q) ||
            k.kra.toLowerCase().includes(q) ||
            k.major_objective.toLowerCase().includes(q) ||
            k.smart_kpi_text.toLowerCase().includes(q) ||
            k.datasource.toLowerCase().includes(q) ||
            k.responsible_concern.some((r) => r.toLowerCase().includes(q))
        );
      }
    }

    return list;
  }

  getKPIById(id: string): KPI | undefined {
    return this.getKPIs().find((k) => k.id === id);
  }

  /**
   * Get already allocated weight for a department, excluding a specific KPI if editing
   */
  getDepartmentAllocatedWeight(departmentId: string, excludeKpiId?: string): number {
    const kpis = this.getKPIs({ departmentId });
    return kpis
      .filter((k) => !excludeKpiId || k.id !== excludeKpiId)
      .reduce((sum, k) => sum + (k.weight || 0), 0);
  }

  createKPI(
    kpiData: Omit<KPI, 'id' | 'kpi_code' | 'created_at' | 'updated_at'>,
    actor?: { role: 'admin' | 'department'; identifier: string }
  ): KPI {
    const kpis = this.getKPIs();
    const currentDeptAllocated = this.getDepartmentAllocatedWeight(kpiData.department_id);

    // Validate weight allocation rule #24
    if (currentDeptAllocated + kpiData.weight > 100.01) {
      throw new Error(
        `Weight exceeds remaining allocation. Remaining: ${Math.round((100 - currentDeptAllocated) * 10) / 10}%, Entered: ${kpiData.weight}%`
      );
    }

    const nextCode = generateNextKPICode(kpis);
    const now = new Date().toISOString();

    const newKpi: KPI = {
      ...kpiData,
      id: `kpi-${Date.now()}`,
      kpi_code: nextCode,
      created_at: now,
      updated_at: now,
    };

    kpis.push(newKpi);
    localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(kpis));

    // Pre-seed empty monthly entries for the current year (1..12) as Pending
    const currentYear = new Date().getFullYear();
    for (let m = 1; m <= 12; m++) {
      this.upsertMonthlyEntry({
        kpi_id: newKpi.id,
        year: currentYear,
        month: m,
        achievement_value: null,
        achievement_unit: newKpi.target_unit,
        status: 'Pending',
        remarks: '',
      });
    }

    this.addAuditLog(
      actor?.role || 'admin',
      actor?.identifier || 'system',
      'create_kpi',
      'kpi',
      newKpi.id,
      `Created KPI ${newKpi.kpi_code}: ${newKpi.smart_kpi_text}`
    );

    this.broadcastUpdate();

    if (supabase) {
      Promise.resolve(supabase.from('kpis').insert(newKpi)).catch(() => {});
    }

    return newKpi;
  }

  updateKPI(
    id: string,
    updates: Partial<KPI>,
    actor?: { role: 'admin' | 'department'; identifier: string }
  ): KPI | null {
    const kpis = this.getKPIs();
    const index = kpis.findIndex((k) => k.id === id);
    if (index === -1) return null;

    const currentKpi = kpis[index];
    const deptId = updates.department_id || currentKpi.department_id;
    const newWeight = updates.weight !== undefined ? updates.weight : currentKpi.weight;

    const allocatedOthers = this.getDepartmentAllocatedWeight(deptId, id);
    if (allocatedOthers + newWeight > 100.01) {
      throw new Error(
        `Weight exceeds remaining allocation. Remaining: ${Math.round((100 - allocatedOthers) * 10) / 10}%, Entered: ${newWeight}%`
      );
    }

    kpis[index] = {
      ...currentKpi,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(kpis));
    this.addAuditLog(
      actor?.role || 'admin',
      actor?.identifier || 'system',
      'edit_kpi',
      'kpi',
      id,
      `Updated KPI ${currentKpi.kpi_code}`
    );

    this.broadcastUpdate();

    if (supabase) {
      Promise.resolve(supabase.from('kpis').update(kpis[index]).eq('id', id)).catch(() => {});
    }

    return kpis[index];
  }

  duplicateKPI(
    id: string,
    actor?: { role: 'admin' | 'department'; identifier: string }
  ): KPI | null {
    const original = this.getKPIById(id);
    if (!original) return null;

    const allocated = this.getDepartmentAllocatedWeight(original.department_id);
    const remaining = Math.max(0, 100 - allocated);
    const newWeight = Math.min(original.weight, remaining);

    const { id: _, kpi_code: __, created_at: ___, updated_at: ____, ...rest } = original;

    return this.createKPI(
      {
        ...rest,
        smart_kpi_text: `${original.smart_kpi_text} (Copy)`,
        weight: newWeight,
      },
      actor
    );
  }

  async deleteKPI(
    id: string,
    actor?: { role: 'admin' | 'department'; identifier: string }
  ): Promise<boolean> {
    const kpis = this.getKPIs();
    const kpi = kpis.find((k) => k.id === id);
    if (!kpi) return false;

    // Filter out KPI locally immediately
    const updatedKpis = kpis.filter((k) => k.id !== id);
    localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(updatedKpis));

    // Cascade delete monthly entries locally (#79)
    const entries = this.getAllMonthlyEntries().filter((e) => e.kpi_id !== id);
    localStorage.setItem(STORAGE_KEYS.MONTHLY_ENTRIES, JSON.stringify(entries));

    this.addAuditLog(
      actor?.role || 'admin',
      actor?.identifier || 'system',
      'delete_kpi',
      'kpi',
      id,
      `Deleted KPI ${kpi.kpi_code}`
    );

    // Immediately broadcast so local and other tabs update instantly
    this.broadcastUpdate();

    if (supabase) {
      try {
        await supabase.from('kpi_monthly_entries').delete().eq('kpi_id', id);
        await supabase.from('kpis').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase delete error:', err);
      }
    }

    return true;
  }

  async clearAllKPIs() {
    localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.MONTHLY_ENTRIES, JSON.stringify([]));
    this.broadcastUpdate();
    if (supabase) {
      try {
        await supabase.from('kpi_monthly_entries').delete().neq('id', 'placeholder');
        await supabase.from('kpis').delete().neq('id', 'placeholder');
      } catch (err) {
        console.error('Supabase clear error:', err);
      }
    }
  }

  // --- MONTHLY ENTRIES ---
  getAllMonthlyEntries(): KPIMonthlyEntry[] {
    this.initStorage();
    const data = localStorage.getItem(STORAGE_KEYS.MONTHLY_ENTRIES);
    return data ? JSON.parse(data) : [];
  }

  getMonthlyEntriesForKPIs(kpiIds: string[], year: number): KPIMonthlyEntry[] {
    const all = this.getAllMonthlyEntries();
    return all.filter((e) => kpiIds.includes(e.kpi_id) && e.year === year);
  }

  upsertMonthlyEntry(
    entry: Omit<KPIMonthlyEntry, 'id' | 'created_at' | 'updated_at'> & { id?: string }
  ): KPIMonthlyEntry {
    const entries = this.getAllMonthlyEntries();
    const now = new Date().toISOString();

    if (supabase) {
      Promise.resolve(supabase.from('kpi_monthly_entries').upsert(entry)).catch(() => {});
    }

    // Check unique constraint: UNIQUE(kpi_id, year, month) (#29)
    const existingIndex = entries.findIndex(
      (e) => e.kpi_id === entry.kpi_id && e.year === entry.year && e.month === entry.month
    );

    if (existingIndex >= 0) {
      entries[existingIndex] = {
        ...entries[existingIndex],
        ...entry,
        updated_at: now,
      };
      localStorage.setItem(STORAGE_KEYS.MONTHLY_ENTRIES, JSON.stringify(entries));
      this.broadcastUpdate();
      return entries[existingIndex];
    } else {
      const newEntry: KPIMonthlyEntry = {
        ...entry,
        id: entry.id || `entry-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        created_at: now,
        updated_at: now,
      };
      entries.push(newEntry);
      localStorage.setItem(STORAGE_KEYS.MONTHLY_ENTRIES, JSON.stringify(entries));
      this.broadcastUpdate();
      return newEntry;
    }
  }

  // --- AUDIT LOGS ---
  getAuditLogs(): AuditLog[] {
    this.initStorage();
    const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return data ? JSON.parse(data) : [];
  }

  addAuditLog(
    user_role: 'admin' | 'department',
    user_identifier: string,
    action: AuditLog['action'],
    entity_type: AuditLog['entity_type'],
    entity_id: string,
    description: string
  ) {
    const logs = this.getAuditLogs();
    logs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_role,
      user_identifier,
      action,
      entity_type,
      entity_id,
      description,
      created_at: new Date().toISOString(),
    });
    // Keep last 200 logs
    if (logs.length > 200) logs.pop();
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }

  // Reset to initial seed data
  resetToSeedData() {
    localStorage.removeItem(STORAGE_KEYS.DEPARTMENTS);
    localStorage.removeItem(STORAGE_KEYS.SECTIONS);
    localStorage.removeItem(STORAGE_KEYS.SUBSECTIONS);
    localStorage.removeItem(STORAGE_KEYS.KPIS);
    localStorage.removeItem(STORAGE_KEYS.MONTHLY_ENTRIES);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    this.initStorage();
  }
}

export const db = new DatabaseService();
