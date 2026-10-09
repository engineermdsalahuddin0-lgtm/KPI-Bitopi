import {
  Unit,
  Department,
  Section,
  Subsection,
  KPI,
  KPIMonthlyEntry,
  AuditLog,
  UserRole,
  OrgGoalLevel,
} from '../types';
import { supabase } from './supabase';
import {
  INITIAL_UNITS,
  INITIAL_DEPARTMENTS,
  INITIAL_SECTIONS,
  INITIAL_SUBSECTIONS,
} from './seedData';

const STORAGE_KEYS = {
  UNITS: 'bitopi_kpi_units_v9',
  DEPARTMENTS: 'bitopi_kpi_departments_v9',
  SECTIONS: 'bitopi_kpi_sections_v9',
  SUBSECTIONS: 'bitopi_kpi_subsections_v9',
  KPIS: 'bitopi_kpi_kpis_v9',
  MONTHLY_ENTRIES: 'bitopi_kpi_monthly_entries_v9',
  AUDIT_LOGS: 'bitopi_kpi_audit_logs_v9',
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

const INITIAL_KPIS: Omit<KPI, 'created_at' | 'updated_at'>[] = [];

const INITIAL_MONTHLY_ENTRIES: Omit<KPIMonthlyEntry, 'created_at' | 'updated_at'>[] = [];

class DatabaseService {
  private listeners: Set<() => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private isRealtimeSubscribed = false;
  private isInitialized = false;
  private unsupportedKpiColumns = new Set<string>();

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
      const [unitsRes, kpisRes, entriesRes, deptsRes, sectionsRes, subsRes] = await Promise.all([
        supabase.from('units').select('*'),
        supabase.from('kpis').select('*'),
        supabase.from('kpi_monthly_entries').select('*'),
        supabase.from('departments').select('*'),
        supabase.from('sections').select('*'),
        supabase.from('subsections').select('*'),
      ]);

      let changed = false;

      // Auto-seed Supabase if tables are empty
      if (!unitsRes.data || unitsRes.data.length === 0) {
        await supabase.from('units').upsert(INITIAL_UNITS);
      }
      if (!deptsRes.data || deptsRes.data.length === 0) {
        await supabase.from('departments').upsert(INITIAL_DEPARTMENTS);
      }
      if (!sectionsRes.data || sectionsRes.data.length === 0) {
        await supabase.from('sections').upsert(INITIAL_SECTIONS);
      }
      if (!subsRes.data || subsRes.data.length === 0) {
        await supabase.from('subsections').upsert(INITIAL_SUBSECTIONS);
      }

      if (unitsRes.data !== null && Array.isArray(unitsRes.data) && unitsRes.data.length > 0) {
        const prev = localStorage.getItem(STORAGE_KEYS.UNITS);
        const supabaseUnits = unitsRes.data as Unit[];
        const currentStored: Unit[] = prev ? JSON.parse(prev) : [];
        const map = new Map<string, Unit>();
        (INITIAL_UNITS as Unit[]).forEach((u) => map.set(u.id, u as Unit));
        currentStored.forEach((u) => map.set(u.id, u));
        supabaseUnits.forEach((u) => map.set(u.id, { ...map.get(u.id), ...u }));
        const mergedUnits = Array.from(map.values());
        const next = JSON.stringify(mergedUnits);
        if (prev !== next) {
          localStorage.setItem(STORAGE_KEYS.UNITS, next);
          changed = true;
        }
      }

      if (deptsRes.data !== null && Array.isArray(deptsRes.data) && deptsRes.data.length > 0) {
        const prev = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
        const supabaseDepts = deptsRes.data as Department[];
        const currentStored: Department[] = prev ? JSON.parse(prev) : [];
        const mergedDepts = this.sanitizeAndDeduplicateDepartments([...currentStored, ...supabaseDepts]);
        const next = JSON.stringify(mergedDepts);
        if (prev !== next) {
          localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, next);
          changed = true;
        }
      }

      if (sectionsRes.data !== null && Array.isArray(sectionsRes.data) && sectionsRes.data.length > 0) {
        const prev = localStorage.getItem(STORAGE_KEYS.SECTIONS);
        const next = JSON.stringify(sectionsRes.data);
        if (prev !== next) {
          localStorage.setItem(STORAGE_KEYS.SECTIONS, next);
          changed = true;
        }
      }

      if (subsRes.data !== null && Array.isArray(subsRes.data) && subsRes.data.length > 0) {
        const prev = localStorage.getItem(STORAGE_KEYS.SUBSECTIONS);
        const next = JSON.stringify(subsRes.data);
        if (prev !== next) {
          localStorage.setItem(STORAGE_KEYS.SUBSECTIONS, next);
          changed = true;
        }
      }

      // KPIs: Never wipe local KPIs with empty array! Merge and push missing to Supabase
      const localKpisRaw = localStorage.getItem(STORAGE_KEYS.KPIS);
      const localKpis: KPI[] = localKpisRaw ? JSON.parse(localKpisRaw) : [];

      if (kpisRes.data !== null && Array.isArray(kpisRes.data)) {
        const supabaseKpis = kpisRes.data as KPI[];
        if (supabaseKpis.length > 0) {
          const kpiMap = new Map<string, KPI>();
          localKpis.forEach((k) => kpiMap.set(k.id, k));
          supabaseKpis.forEach((k) => kpiMap.set(k.id, k));
          const merged = Array.from(kpiMap.values());
          const next = JSON.stringify(merged);
          if (localKpisRaw !== next) {
            localStorage.setItem(STORAGE_KEYS.KPIS, next);
            changed = true;
          }
          // Push any local KPIs that Supabase doesn't have yet
          for (const lk of localKpis) {
            if (!supabaseKpis.some((sk) => sk.id === lk.id)) {
              this.syncKPIToSupabase(lk);
            }
          }
        } else if (localKpis.length > 0) {
          // Supabase has 0 KPIs but localStorage has user-created KPIs: push them up!
          for (const lk of localKpis) {
            this.syncKPIToSupabase(lk);
          }
        }
      }

      // Monthly Entries: Merge without data loss
      const localEntriesRaw = localStorage.getItem(STORAGE_KEYS.MONTHLY_ENTRIES);
      const localEntries: KPIMonthlyEntry[] = localEntriesRaw ? JSON.parse(localEntriesRaw) : [];

      if (entriesRes.data !== null && Array.isArray(entriesRes.data)) {
        const supabaseEntries = entriesRes.data as KPIMonthlyEntry[];
        if (supabaseEntries.length > 0) {
          const entryMap = new Map<string, KPIMonthlyEntry>();
          localEntries.forEach((e) => entryMap.set(`${e.kpi_id}-${e.year}-${e.month}`, e));
          supabaseEntries.forEach((e) => entryMap.set(`${e.kpi_id}-${e.year}-${e.month}`, e));
          const merged = Array.from(entryMap.values());
          const next = JSON.stringify(merged);
          if (localEntriesRaw !== next) {
            localStorage.setItem(STORAGE_KEYS.MONTHLY_ENTRIES, next);
            changed = true;
          }
        } else if (localEntries.length > 0) {
          await supabase.from('kpi_monthly_entries').upsert(localEntries);
        }
      }

      if (changed) {
        this.notifyListeners();
      }
    } catch (err) {
      console.error('Supabase sync error:', err);
    }
  }

  /**
   * Resilient sync of a KPI, ensuring its parent unit & department exist in Supabase
   */
  async syncKPIToSupabase(kpi: KPI): Promise<void> {
    if (!supabase) return;
    try {
      // 1. Ensure parent unit exists in Supabase
      if (kpi.unit_id) {
        const u = this.getUnitById(kpi.unit_id);
        if (u) {
          await supabase.from('units').upsert({
            id: u.id,
            name: u.name,
            code: u.code,
            location: u.location || null,
            access_code: u.access_code || null,
            status: u.status,
            created_at: u.created_at,
            updated_at: u.updated_at || u.created_at,
          });
        }
      }

      // 2. Ensure parent department exists in Supabase
      if (kpi.department_id) {
        const d = this.getDepartmentById(kpi.department_id);
        if (d) {
          await supabase.from('departments').upsert({
            id: d.id,
            unit_id: d.unit_id || null,
            name: d.name,
            short_code: d.short_code,
            department_id: d.department_id,
            access_code: d.access_code,
            status: d.status,
            created_at: d.created_at,
            updated_at: d.updated_at || d.created_at,
          });
        }
      }

      // 3. Ensure parent section exists in Supabase if present
      if (kpi.section_id) {
        const s = this.getSectionById(kpi.section_id);
        if (s) {
          await supabase.from('sections').upsert({
            id: s.id,
            department_id: s.department_id,
            name: s.name,
            created_at: s.created_at,
            updated_at: s.updated_at || s.created_at,
          });
        }
      }

      // 4. Ensure parent subsection exists in Supabase if present
      if (kpi.subsection_id) {
        const sub = this.getSubsectionById(kpi.subsection_id);
        if (sub) {
          await supabase.from('subsections').upsert({
            id: sub.id,
            section_id: sub.section_id,
            name: sub.name,
            created_at: sub.created_at,
            updated_at: sub.updated_at || sub.created_at,
          });
        }
      }

      // 5. Clean and prepare KPI payload matching table schema
      const kpiPayload: Record<string, any> = {
        id: kpi.id,
        kpi_code: kpi.kpi_code,
        department_id: kpi.department_id || null,
        section_id: kpi.section_id || null,
        subsection_id: kpi.subsection_id || null,
        kra: kpi.kra,
        major_objective: kpi.major_objective,
        aligned_org_goal_level: kpi.aligned_org_goal_level,
        aligned_org_goal_id: kpi.aligned_org_goal_id,
        aligned_org_goal_label: kpi.aligned_org_goal_label || null,
        smart_kpi_text: kpi.smart_kpi_text,
        specific_s: kpi.specific_s || null,
        measure_m: kpi.measure_m || null,
        achievable_a: kpi.achievable_a ?? true,
        relevant_r: kpi.relevant_r ?? true,
        time_t: kpi.time_t || null,
        perspective: kpi.perspective,
        responsible_concern: kpi.responsible_concern || [],
        requirements: kpi.requirements || '',
        datasource: kpi.datasource || '',
        weight: Number(kpi.weight),
        baseline_value: Number(kpi.baseline_value),
        baseline_unit: kpi.baseline_unit,
        target_value: Number(kpi.target_value),
        target_unit: kpi.target_unit,
        target_policy: kpi.target_policy || 'fixed',
        created_at: kpi.created_at,
        updated_at: kpi.updated_at,
      };

      if (kpi.unit_id && !this.unsupportedKpiColumns.has('unit_id')) {
        kpiPayload.unit_id = kpi.unit_id;
      }

      // Strip any previously detected unsupported columns
      for (const col of this.unsupportedKpiColumns) {
        delete kpiPayload[col];
      }

      let res = await supabase.from('kpis').upsert(kpiPayload);

      // Dynamically recover from PGRST204 (column missing from schema cache, e.g. 'unit_id')
      while (res.error && res.error.code === 'PGRST204') {
        const match = res.error.message?.match(/Could not find the '([^']+)' column/);
        if (match && match[1] && match[1] in kpiPayload) {
          const missingCol = match[1];
          console.warn(`Supabase 'kpis' table schema missing '${missingCol}', omitting column and retrying...`);
          this.unsupportedKpiColumns.add(missingCol);
          delete kpiPayload[missingCol];
          res = await supabase.from('kpis').upsert(kpiPayload);
        } else {
          break;
        }
      }

      if (res.error) {
        console.error('Supabase upsert KPI error:', res.error);
        return; // Halt: Do not attempt monthly entries if the KPI was not saved
      }

      // 6. Upsert pre-seeded monthly entries for this KPI (only when parent KPI successfully exists)
      const entries = this.getAllMonthlyEntries().filter((e) => e.kpi_id === kpi.id);
      if (entries.length > 0) {
        let entriesRes = await supabase.from('kpi_monthly_entries').upsert(entries);
        if (entriesRes.error && entriesRes.error.code === 'PGRST204') {
          const match = entriesRes.error.message?.match(/Could not find the '([^']+)' column/);
          if (match && match[1]) {
            const sanitized = entries.map((e) => {
              const copy = { ...e };
              delete (copy as any)[match[1]];
              return copy;
            });
            entriesRes = await supabase.from('kpi_monthly_entries').upsert(sanitized);
          }
        }
        if (entriesRes.error) {
          console.error('Supabase upsert entries error:', entriesRes.error);
        }
      }
    } catch (err) {
      console.error('Supabase syncKPIToSupabase caught exception:', err);
    }
  }

  private initStorage() {
    if (typeof window === 'undefined') return;

    // Purge legacy storage keys from previous versions
    [
      'bitopi_kpi_departments_v1', 'bitopi_kpi_departments_v2', 'bitopi_kpi_departments_v3', 'bitopi_kpi_departments_v4', 'bitopi_kpi_departments_v5', 'bitopi_kpi_departments_v6', 'bitopi_kpi_departments_v7',
      'bitopi_kpi_sections_v1', 'bitopi_kpi_sections_v2', 'bitopi_kpi_sections_v3', 'bitopi_kpi_sections_v4', 'bitopi_kpi_sections_v5', 'bitopi_kpi_sections_v6', 'bitopi_kpi_sections_v7',
      'bitopi_kpi_subsections_v1', 'bitopi_kpi_subsections_v2', 'bitopi_kpi_subsections_v3', 'bitopi_kpi_subsections_v4', 'bitopi_kpi_subsections_v5', 'bitopi_kpi_subsections_v6', 'bitopi_kpi_subsections_v7',
      'bitopi_kpi_units_v1', 'bitopi_kpi_units_v2', 'bitopi_kpi_units_v3', 'bitopi_kpi_units_v4', 'bitopi_kpi_units_v5', 'bitopi_kpi_units_v6', 'bitopi_kpi_units_v7',
    ].forEach((k) => localStorage.removeItem(k));

    // Migrate previous user KPIs and monthly entries to prevent data loss
    if (!localStorage.getItem(STORAGE_KEYS.KPIS)) {
      const prevKpis = localStorage.getItem('bitopi_kpi_kpis_v8') || localStorage.getItem('bitopi_kpi_kpis_v7') || localStorage.getItem('bitopi_kpi_kpis_v6');
      if (prevKpis) {
        try {
          const parsed = JSON.parse(prevKpis);
          if (Array.isArray(parsed)) {
            localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(parsed));
          }
        } catch {}
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.MONTHLY_ENTRIES)) {
      const prevEntries = localStorage.getItem('bitopi_kpi_monthly_entries_v8') || localStorage.getItem('bitopi_kpi_monthly_entries_v7') || localStorage.getItem('bitopi_kpi_monthly_entries_v6');
      if (prevEntries) {
        try {
          const parsed = JSON.parse(prevEntries);
          if (Array.isArray(parsed)) {
            localStorage.setItem(STORAGE_KEYS.MONTHLY_ENTRIES, JSON.stringify(parsed));
          }
        } catch {}
      }
    }

    const now = new Date().toISOString();

    // 1. Units - guarantee all initial units plus any custom units
    const storedUnitsRaw = localStorage.getItem(STORAGE_KEYS.UNITS);
    let storedUnits: Unit[] = [];
    try {
      storedUnits = storedUnitsRaw ? JSON.parse(storedUnitsRaw) : [];
    } catch {
      storedUnits = [];
    }
    const unitMap = new Map<string, Unit>();
    (INITIAL_UNITS as Unit[]).forEach((u) => {
      unitMap.set(u.id, { ...u, created_at: now, updated_at: now });
    });
    storedUnits.forEach((u) => {
      unitMap.set(u.id, u);
    });
    const finalUnits = Array.from(unitMap.values());
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(finalUnits));

    // 2. Departments: Guarantee official hierarchy and eliminate legacy test duplicates
    const storedDeptsRaw = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    let storedDepts: Department[] = [];
    try {
      storedDepts = storedDeptsRaw ? JSON.parse(storedDeptsRaw) : [];
    } catch {
      storedDepts = [];
    }

    const validDepts = this.sanitizeAndDeduplicateDepartments(
      storedDepts.length > 0 ? storedDepts : (INITIAL_DEPARTMENTS as Department[])
    );
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(validDepts));

    // 3. Sections
    const storedSectionsRaw = localStorage.getItem(STORAGE_KEYS.SECTIONS);
    let storedSections: Section[] = [];
    try {
      storedSections = storedSectionsRaw ? JSON.parse(storedSectionsRaw) : [];
    } catch {
      storedSections = [];
    }
    if (storedSections.length < INITIAL_SECTIONS.length || storedSections.some((s) => !s.department_id)) {
      const now = new Date().toISOString();
      const sections: Section[] = INITIAL_SECTIONS.map((s) => ({
        ...s,
        created_at: now,
      }));
      localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(sections));
    }

    // 4. Subsections
    const storedSubsRaw = localStorage.getItem(STORAGE_KEYS.SUBSECTIONS);
    let storedSubs: Subsection[] = [];
    try {
      storedSubs = storedSubsRaw ? JSON.parse(storedSubsRaw) : [];
    } catch {
      storedSubs = [];
    }
    if (storedSubs.length < INITIAL_SUBSECTIONS.length || storedSubs.some((sub) => !sub.section_id)) {
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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sections' }, () => {
              this.syncFromSupabase();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'subsections' }, () => {
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

  // --- UNITS ---
  getUnits(): Unit[] {
    this.initStorage();
    const data = localStorage.getItem(STORAGE_KEYS.UNITS);
    return data ? JSON.parse(data) : [];
  }

  getUnitById(id: string): Unit | undefined {
    return this.getUnits().find((u) => u.id === id || u.code === id);
  }

  createUnit(
    name: string,
    code: string,
    location?: string,
    access_code?: string,
    status: 'active' | 'disabled' = 'active'
  ): Unit {
    const units = this.getUnits();
    const cleanCode = (code || 'UNT').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 10);
    const cleanName = (name || '').replace(/\s*\([^)]*\)/g, '').trim();
    const now = new Date().toISOString();
    const newUnit: Unit = {
      id: `unit-${Date.now()}`,
      name: cleanName,
      code: cleanCode,
      location: location?.trim() || '',
      access_code: access_code?.trim() || `${cleanCode}-991-A1B`,
      status: status || 'active',
      created_at: now,
      updated_at: now,
    };
    units.push(newUnit);
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
    this.broadcastUpdate();
    if (supabase) {
      Promise.resolve(supabase.from('units').upsert(newUnit)).catch(() => {});
    }
    return newUnit;
  }

  deleteUnit(unitId: string): { success: boolean; error?: string } {
    const units = this.getUnits();
    const index = units.findIndex((u) => u.id === unitId || u.code === unitId);
    if (index === -1) {
      return { success: false, error: 'Business Unit not found.' };
    }
    const unitToDelete = units[index];

    // Remove unit
    units.splice(index, 1);
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));

    // Also notify/delete from Supabase
    if (supabase) {
      Promise.resolve(supabase.from('units').delete().eq('id', unitToDelete.id)).catch(() => {});
    }

    this.addAuditLog(
      'admin',
      'admin',
      'create_department' as any,
      'department',
      unitToDelete.id,
      `Deleted Business Unit: ${unitToDelete.name} (${unitToDelete.code})`
    );

    this.broadcastUpdate();
    return { success: true };
  }

  updateUnit(unitId: string, updates: Partial<Unit>): Unit | null {
    const units = this.getUnits();
    const index = units.findIndex((u) => u.id === unitId || u.code === unitId);
    if (index === -1) return null;
    const now = new Date().toISOString();
    const cleanName = updates.name ? updates.name.replace(/\s*\([^)]*\)/g, '').trim() : units[index].name;
    const updated = {
      ...units[index],
      ...updates,
      name: cleanName,
      updated_at: now,
    };
    units[index] = updated;
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
    this.broadcastUpdate();
    if (supabase) {
      Promise.resolve(supabase.from('units').upsert(updated)).catch(() => {});
    }
    return updated;
  }

  private sanitizeAndDeduplicateDepartments(depts: Department[]): Department[] {
    const officialDepts = INITIAL_DEPARTMENTS as Department[];
    const officialIdSet = new Set(officialDepts.map((d) => d.id));
    const officialCodeSet = new Set(officialDepts.map((d) => d.department_id));

    // Map official departments:
    // 1) Unit-normalized + normalized name (e.g. "tal::esg")
    // 2) Department name only (e.g. "esg", "supply chain")
    const officialByUnitAndName = new Map<string, Department>();
    const officialByNameOnly = new Map<string, Department>();

    officialDepts.forEach((d) => {
      const normUnit = (d.unit_id || '').toLowerCase().replace(/^unit-/, '');
      const normName = d.name.trim().toLowerCase();
      officialByUnitAndName.set(`${normUnit}::${normName}`, d);
      if (!officialByNameOnly.has(normName)) {
        officialByNameOnly.set(normName, d);
      }
    });

    const validDepts: Department[] = [];
    const obsoleteDeptIdsToDelete: string[] = [];
    const obsoleteDeptCodesToDelete: string[] = [];

    // Also load KPIs and Sections to migrate any records pointing to obsolete duplicates
    const storedKpisRaw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.KPIS) : null;
    let storedKpis: KPI[] = [];
    try {
      storedKpis = storedKpisRaw ? JSON.parse(storedKpisRaw) : [];
    } catch {
      storedKpis = [];
    }
    let kpisModified = false;

    const storedSectionsRaw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.SECTIONS) : null;
    let storedSections: Section[] = [];
    try {
      storedSections = storedSectionsRaw ? JSON.parse(storedSectionsRaw) : [];
    } catch {
      storedSections = [];
    }
    let sectionsModified = false;

    const seenDeptKey = new Set<string>();

    // 1. Seed all official departments first
    officialDepts.forEach((od) => {
      const normUnit = (od.unit_id || '').toLowerCase().replace(/^unit-/, '');
      const normName = od.name.trim().toLowerCase();
      const key = `${normUnit}::${normName}`;
      seenDeptKey.add(key);
      validDepts.push(od);
    });

    // 2. Evaluate candidate departments
    depts.forEach((d) => {
      if (!d || !d.name) return;

      // Already in official seeds
      if (officialIdSet.has(d.id) || officialCodeSet.has(d.department_id)) {
        return;
      }

      const normUnit = (d.unit_id || '').toLowerCase().replace(/^unit-/, '');
      const normName = d.name.trim().toLowerCase();

      // Check match with unit
      let match = normUnit ? officialByUnitAndName.get(`${normUnit}::${normName}`) : null;
      if (!match) {
        match = officialByNameOnly.get(normName);
      }
      if (!match && d.short_code) {
        const cleanShort = d.short_code.toUpperCase().replace(/^TAL-|^TFL-|^CDL-|^BGL-/, '');
        match = officialDepts.find((od) => od.short_code.replace(/^[^-]+-/, '') === cleanShort);
      }

      // Check if code has the legacy format without unit prefix (e.g. ESG-4L77, SCM-8K92)
      const isLegacyCodePattern = /^[A-Z]{2,4}-[A-Z0-9]{3,5}$/i.test(d.department_id);

      if (match || isLegacyCodePattern) {
        const targetOfficial = match || officialDepts[0];
        obsoleteDeptIdsToDelete.push(d.id);
        if (d.department_id) obsoleteDeptCodesToDelete.push(d.department_id);

        // Migrate KPIs that referenced this duplicate
        storedKpis.forEach((k) => {
          if (k.department_id === d.id || k.department_id === d.department_id) {
            k.department_id = targetOfficial.id;
            k.unit_id = targetOfficial.unit_id || k.unit_id;
            kpisModified = true;
          }
        });

        // Migrate Sections that referenced this duplicate
        storedSections.forEach((s) => {
          if (s.department_id === d.id || s.department_id === d.department_id) {
            s.department_id = targetOfficial.id;
            sectionsModified = true;
          }
        });
      } else {
        // Genuine custom department added by admin
        const key = `${normUnit}::${normName}`;
        if (!seenDeptKey.has(key)) {
          seenDeptKey.add(key);
          validDepts.push(d);
        }
      }
    });

    if (kpisModified && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(storedKpis));
    }
    if (sectionsModified && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(storedSections));
    }

    // Clean obsolete duplicates from Supabase in background
    if (supabase && (obsoleteDeptIdsToDelete.length > 0 || obsoleteDeptCodesToDelete.length > 0)) {
      const client = supabase;
      obsoleteDeptIdsToDelete.forEach((id) => {
        Promise.resolve(client.from('departments').delete().eq('id', id)).catch(() => {});
      });
      obsoleteDeptCodesToDelete.forEach((code) => {
        Promise.resolve(client.from('departments').delete().eq('department_id', code)).catch(() => {});
      });
    }

    return validDepts;
  }

  // --- DEPARTMENTS ---
  getDepartments(unitId?: string): Department[] {
    this.initStorage();
    const data = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    let list: Department[] = data ? JSON.parse(data) : [];

    // Safety fallback
    if (!list || list.length === 0) {
      list = INITIAL_DEPARTMENTS as Department[];
    }

    list = this.sanitizeAndDeduplicateDepartments(list);

    if (unitId && unitId !== 'all') {
      const cleanUnitId = unitId.toLowerCase().trim();
      const targetUnit = this.getUnitById(unitId);
      const targetCode = targetUnit?.code?.toLowerCase()?.trim();
      const normalize = (id: string) => id.toLowerCase().trim().replace(/^unit-/, '');
      const normClean = normalize(cleanUnitId);

      const isMatch = (dUnitId?: string) => {
        if (!dUnitId) return false;
        const normD = normalize(dUnitId);
        return (
          dUnitId.toLowerCase().trim() === cleanUnitId ||
          normD === normClean ||
          (targetCode ? normD === targetCode || dUnitId.toLowerCase().trim() === targetCode : false) ||
          (targetUnit ? dUnitId === targetUnit.id || normD === normalize(targetUnit.id) : false)
        );
      };

      let filtered = list.filter((d) => isMatch(d.unit_id));

      if (filtered.length === 0) {
        // Robust fallback: if nothing matched in storage, filter from INITIAL_DEPARTMENTS directly
        filtered = (INITIAL_DEPARTMENTS as Department[]).filter((d) => isMatch(d.unit_id));
      }

      return filtered;
    }
    return list;
  }

  getDepartmentById(id: string): Department | undefined {
    return this.getDepartments().find((d) => d.id === id || d.department_id === id);
  }

  createDepartment(name: string, shortCode: string, unitId?: string): Department {
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
      unit_id: unitId || 'unit-bgl',
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

  async deleteDepartment(id: string): Promise<{ success: boolean; error?: string }> {
    const departments = this.getDepartments();
    const dept = departments.find((d) => d.id === id || d.department_id === id);
    if (!dept) {
      return { success: false, error: 'Department not found' };
    }

    // Check if any KPIs exist under this department
    const kpis = this.getKPIs().filter((k) => k.department_id === dept.id);
    if (kpis.length > 0) {
      return {
        success: false,
        error: `Cannot delete department "${dept.name}" because it has ${kpis.length} KPI(s) linked to it. Delete or reassign KPIs first.`,
      };
    }

    // Filter out locally
    const updated = departments.filter((d) => d.id !== dept.id);
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(updated));

    // Also remove any sections associated only with this department
    const sections = this.getSections();
    const remainingSections = sections.filter((s) => s.department_id !== dept.id);
    localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(remainingSections));

    this.addAuditLog('admin', 'admin', 'delete_department', 'department', dept.id, `Deleted department ${dept.name} (${dept.department_id})`);
    this.broadcastUpdate();

    // Sync deletion to Supabase
    if (supabase) {
      try {
        await supabase.from('departments').delete().eq('id', dept.id);
        if (dept.department_id) {
          await supabase.from('departments').delete().eq('department_id', dept.department_id);
        }
      } catch (err) {
        console.error('Failed to delete department from Supabase:', err);
      }
    }

    return { success: true };
  }

  // --- SECTIONS & SUBSECTIONS ---
  getSections(deptId?: string): Section[] {
    this.initStorage();
    const data = localStorage.getItem(STORAGE_KEYS.SECTIONS);
    let sections: Section[] = data ? JSON.parse(data) : [];
    if (!sections || sections.length === 0) {
      sections = INITIAL_SECTIONS as Section[];
    }
    if (deptId && deptId !== 'all') {
      const filtered = sections.filter((s) => s.department_id === deptId);
      if (filtered.length === 0) {
        return (INITIAL_SECTIONS as Section[]).filter((s) => s.department_id === deptId);
      }
      return filtered;
    }
    return sections;
  }

  getSectionById(id: string): Section | undefined {
    return this.getSections().find((s) => s.id === id);
  }

  addSection(departmentId: string, name: string): Section {
    const sections = this.getSections();
    const now = new Date().toISOString();
    const newSection: Section = {
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      department_id: departmentId,
      name: name.trim(),
      created_at: now,
      updated_at: now,
    };
    sections.push(newSection);
    localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(sections));
    this.broadcastUpdate();

    if (supabase) {
      Promise.resolve(
        supabase.from('sections').insert({
          id: newSection.id,
          department_id: newSection.department_id,
          name: newSection.name,
          created_at: newSection.created_at,
          updated_at: newSection.updated_at,
        })
      ).catch((err) => console.error('Supabase insert section error:', err));
    }

    return newSection;
  }

  updateSection(id: string, name: string): Section | null {
    const sections = this.getSections();
    const index = sections.findIndex((s) => s.id === id);
    if (index === -1) return null;

    const now = new Date().toISOString();
    sections[index] = {
      ...sections[index],
      name: name.trim(),
      updated_at: now,
    };
    localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(sections));
    this.broadcastUpdate();

    if (supabase) {
      Promise.resolve(
        supabase.from('sections').update({ name: name.trim(), updated_at: now }).eq('id', id)
      ).catch((err) => console.error('Supabase update section error:', err));
    }

    return sections[index];
  }

  async deleteSection(id: string): Promise<boolean> {
    const sections = this.getSections();
    const filteredSections = sections.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(filteredSections));

    // Cascade delete subsections under this section locally
    const subs = this.getSubsections();
    const filteredSubs = subs.filter((sub) => sub.section_id !== id);
    localStorage.setItem(STORAGE_KEYS.SUBSECTIONS, JSON.stringify(filteredSubs));

    // Unlink any KPIs assigned to this section
    const kpis = this.getKPIs();
    let kpiChanged = false;
    const updatedKpis = kpis.map((k) => {
      if (k.section_id === id) {
        kpiChanged = true;
        return {
          ...k,
          section_id: undefined,
          subsection_id: undefined,
          aligned_org_goal_level: (k.aligned_org_goal_level === 'section' || k.aligned_org_goal_level === 'subsection' ? 'department' : k.aligned_org_goal_level) as any,
          aligned_org_goal_id: k.department_id,
          updated_at: new Date().toISOString(),
        };
      }
      return k;
    });
    if (kpiChanged) {
      localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(updatedKpis));
    }

    this.broadcastUpdate();

    if (supabase) {
      try {
        await supabase.from('subsections').delete().eq('section_id', id);
        await supabase.from('sections').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase delete section error:', err);
      }
    }

    return true;
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

  getSubsectionById(id: string): Subsection | undefined {
    return this.getSubsections().find((s) => s.id === id);
  }

  addSubsection(sectionId: string, name: string): Subsection {
    const subs = this.getSubsections();
    const now = new Date().toISOString();
    const newSub: Subsection = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      section_id: sectionId,
      name: name.trim(),
      created_at: now,
      updated_at: now,
    };
    subs.push(newSub);
    localStorage.setItem(STORAGE_KEYS.SUBSECTIONS, JSON.stringify(subs));
    this.broadcastUpdate();

    if (supabase) {
      Promise.resolve(
        supabase.from('subsections').insert({
          id: newSub.id,
          section_id: newSub.section_id,
          name: newSub.name,
          created_at: newSub.created_at,
          updated_at: newSub.updated_at,
        })
      ).catch((err) => console.error('Supabase insert subsection error:', err));
    }

    return newSub;
  }

  updateSubsection(id: string, name: string): Subsection | null {
    const subs = this.getSubsections();
    const index = subs.findIndex((s) => s.id === id);
    if (index === -1) return null;

    const now = new Date().toISOString();
    subs[index] = {
      ...subs[index],
      name: name.trim(),
      updated_at: now,
    };
    localStorage.setItem(STORAGE_KEYS.SUBSECTIONS, JSON.stringify(subs));
    this.broadcastUpdate();

    if (supabase) {
      Promise.resolve(
        supabase.from('subsections').update({ name: name.trim(), updated_at: now }).eq('id', id)
      ).catch((err) => console.error('Supabase update subsection error:', err));
    }

    return subs[index];
  }

  async deleteSubsection(id: string): Promise<boolean> {
    const subs = this.getSubsections();
    const filteredSubs = subs.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SUBSECTIONS, JSON.stringify(filteredSubs));

    // Unlink any KPIs assigned to this subsection
    const kpis = this.getKPIs();
    let kpiChanged = false;
    const updatedKpis = kpis.map((k) => {
      if (k.subsection_id === id) {
        kpiChanged = true;
        return {
          ...k,
          subsection_id: undefined,
          aligned_org_goal_level: (k.aligned_org_goal_level === 'subsection' ? 'section' : k.aligned_org_goal_level) as any,
          aligned_org_goal_id: k.section_id || k.department_id,
          updated_at: new Date().toISOString(),
        };
      }
      return k;
    });
    if (kpiChanged) {
      localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(updatedKpis));
    }

    this.broadcastUpdate();

    if (supabase) {
      try {
        await supabase.from('subsections').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase delete subsection error:', err);
      }
    }

    return true;
  }

  // --- KPIS ---
  getKPIs(filter?: {
    unitId?: string;
    departmentId?: string;
    sectionId?: string;
    subsectionId?: string;
    perspective?: string;
    level?: OrgGoalLevel | 'all';
    search?: string;
  }): KPI[] {
    this.initStorage();
    const data = localStorage.getItem(STORAGE_KEYS.KPIS);
    let list: KPI[] = data ? JSON.parse(data) : [];

    if (filter) {
      // 1. Unit Filter:
      if (filter.unitId && filter.unitId !== 'all') {
        const deptsInUnit = this.getDepartments(filter.unitId).map((d) => d.id);
        list = list.filter(
          (k) =>
            k.unit_id === filter.unitId ||
            (k.department_id && deptsInUnit.includes(k.department_id))
        );
      }

      // 2. Department Filter: STRICT MATCH
      if (filter.departmentId && filter.departmentId !== 'all') {
        list = list.filter((k) => k.department_id === filter.departmentId);
      }

      // 3. Section Filter: STRICT MATCH
      if (filter.sectionId && filter.sectionId !== 'all') {
        list = list.filter((k) => k.section_id === filter.sectionId);
      }

      // 4. Subsection Filter: STRICT MATCH
      if (filter.subsectionId && filter.subsectionId !== 'all') {
        list = list.filter((k) => k.subsection_id === filter.subsectionId);
      }

      // 5. Goal Level Filter:
      if (filter.level && filter.level !== 'all') {
        list = list.filter((k) => k.aligned_org_goal_level === filter.level);
      }

      // 6. Perspective Filter:
      if (filter.perspective && filter.perspective !== 'all') {
        list = list.filter((k) => k.perspective === filter.perspective);
      }

      // 7. Search Filter:
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
   * Get already allocated weight for any node in the hierarchy
   */
  getNodeAllocatedWeight(
    node: {
      level: OrgGoalLevel;
      unitId?: string;
      departmentId?: string;
      sectionId?: string;
      subsectionId?: string;
    },
    excludeKpiId?: string
  ): number {
    let kpis: KPI[] = [];
    if (node.level === 'unit' && node.unitId) {
      kpis = this.getKPIs({ unitId: node.unitId, level: 'unit' });
    } else if (node.level === 'department' && node.departmentId) {
      kpis = this.getKPIs({ departmentId: node.departmentId, level: 'department' });
    } else if (node.level === 'section' && node.sectionId) {
      kpis = this.getKPIs({ sectionId: node.sectionId, level: 'section' });
    } else if (node.level === 'subsection' && node.subsectionId) {
      kpis = this.getKPIs({ subsectionId: node.subsectionId, level: 'subsection' });
    } else if (node.departmentId) {
      kpis = this.getKPIs({ departmentId: node.departmentId });
    }

    return kpis
      .filter((k) => !excludeKpiId || k.id !== excludeKpiId)
      .reduce((sum, k) => sum + (k.weight || 0), 0);
  }

  /**
   * Legacy helpers for backward compatibility
   */
  getUnitAllocatedWeight(unitId: string, excludeKpiId?: string): number {
    return this.getNodeAllocatedWeight({ level: 'unit', unitId }, excludeKpiId);
  }

  getDepartmentAllocatedWeight(departmentId?: string, excludeKpiId?: string): number {
    if (!departmentId) return 0;
    return this.getNodeAllocatedWeight({ level: 'department', departmentId }, excludeKpiId);
  }

  createKPI(
    kpiData: Omit<KPI, 'id' | 'kpi_code' | 'created_at' | 'updated_at'>,
    actor?: { role: UserRole; identifier: string }
  ): KPI {
    const kpis = this.getKPIs();
    const currentAllocated = this.getNodeAllocatedWeight({
      level: kpiData.aligned_org_goal_level,
      unitId: kpiData.unit_id,
      departmentId: kpiData.department_id,
      sectionId: kpiData.section_id,
      subsectionId: kpiData.subsection_id,
    });

    // Validate weight allocation rule #24 (Max 100% per node)
    if (currentAllocated + kpiData.weight > 100.01) {
      throw new Error(
        `Weight exceeds remaining allocation for this node. Remaining: ${Math.max(0, Math.round((100 - currentAllocated) * 10) / 10)}%, Entered: ${kpiData.weight}%`
      );
    }

    const nextCode = generateNextKPICode(kpis);
    const now = new Date().toISOString();

    // Ensure unit_id is always resolved and stored for the KPI
    let resolvedUnitId = kpiData.unit_id;
    if (!resolvedUnitId && kpiData.department_id) {
      const dept = this.getDepartmentById(kpiData.department_id);
      if (dept?.unit_id) {
        resolvedUnitId = dept.unit_id;
      }
    }
    if (!resolvedUnitId) {
      resolvedUnitId = 'unit-bgl';
    }

    const newKpi: KPI = {
      ...kpiData,
      unit_id: resolvedUnitId,
      target_policy: kpiData.target_policy || 'fixed',
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
      this.syncKPIToSupabase(newKpi).catch((err) =>
        console.error('Failed to sync new KPI to Supabase:', err)
      );
    }

    return newKpi;
  }

  updateKPI(
    id: string,
    updates: Partial<KPI>,
    actor?: { role: UserRole; identifier: string }
  ): KPI | null {
    const kpis = this.getKPIs();
    const index = kpis.findIndex((k) => k.id === id);
    if (index === -1) return null;

    const currentKpi = kpis[index];
    const newWeight = updates.weight !== undefined ? updates.weight : currentKpi.weight;

    let finalUpdates = { ...updates };
    if (finalUpdates.department_id && !finalUpdates.unit_id) {
      const dept = this.getDepartmentById(finalUpdates.department_id);
      if (dept?.unit_id) {
        finalUpdates.unit_id = dept.unit_id;
      }
    }

    const allocatedOthers = this.getNodeAllocatedWeight(
      {
        level: (finalUpdates.aligned_org_goal_level || currentKpi.aligned_org_goal_level) as OrgGoalLevel,
        unitId: finalUpdates.unit_id || currentKpi.unit_id,
        departmentId: finalUpdates.department_id || currentKpi.department_id,
        sectionId: finalUpdates.section_id || currentKpi.section_id,
        subsectionId: finalUpdates.subsection_id || currentKpi.subsection_id,
      },
      id
    );

    if (allocatedOthers + newWeight > 100.01) {
      throw new Error(
        `Weight exceeds remaining allocation for this node. Remaining: ${Math.max(0, Math.round((100 - allocatedOthers) * 10) / 10)}%, Entered: ${newWeight}%`
      );
    }

    kpis[index] = {
      ...currentKpi,
      ...finalUpdates,
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
      this.syncKPIToSupabase(kpis[index]).catch((err) =>
        console.error('Failed to update KPI in Supabase:', err)
      );
    }

    return kpis[index];
  }

  duplicateKPI(
    id: string,
    actor?: { role: UserRole; identifier: string }
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
    actor?: { role: UserRole; identifier: string }
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

    // Check unique constraint: UNIQUE(kpi_id, year, month) (#29)
    const existingIndex = entries.findIndex(
      (e) => e.kpi_id === entry.kpi_id && e.year === entry.year && e.month === entry.month
    );

    let savedEntry: KPIMonthlyEntry;

    if (existingIndex >= 0) {
      entries[existingIndex] = {
        ...entries[existingIndex],
        ...entry,
        updated_at: now,
      };
      savedEntry = entries[existingIndex];
      localStorage.setItem(STORAGE_KEYS.MONTHLY_ENTRIES, JSON.stringify(entries));
      this.broadcastUpdate();
    } else {
      const newEntry: KPIMonthlyEntry = {
        ...entry,
        id: entry.id || `entry-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        created_at: now,
        updated_at: now,
      };
      entries.push(newEntry);
      savedEntry = newEntry;
      localStorage.setItem(STORAGE_KEYS.MONTHLY_ENTRIES, JSON.stringify(entries));
      this.broadcastUpdate();
    }

    if (supabase) {
      Promise.resolve(supabase.from('kpi_monthly_entries').upsert(savedEntry)).catch((err) =>
        console.error('Supabase upsert entry error:', err)
      );
    }

    return savedEntry;
  }

  // --- AUDIT LOGS ---
  getAuditLogs(): AuditLog[] {
    this.initStorage();
    const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return data ? JSON.parse(data) : [];
  }

  addAuditLog(
    user_role: UserRole,
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
    localStorage.removeItem(STORAGE_KEYS.UNITS);
    localStorage.removeItem(STORAGE_KEYS.DEPARTMENTS);
    localStorage.removeItem(STORAGE_KEYS.SECTIONS);
    localStorage.removeItem(STORAGE_KEYS.SUBSECTIONS);
    localStorage.removeItem(STORAGE_KEYS.KPIS);
    localStorage.removeItem(STORAGE_KEYS.MONTHLY_ENTRIES);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    this.initStorage();
  }

  // --- HIERARCHY & KPI JSON IMPORT / EXPORT (#User Request) ---
  exportHierarchyAndKPIs(): any {
    return {
      version: '1.0',
      exported_at: new Date().toISOString(),
      units: this.getUnits(),
      departments: this.getDepartments(),
      sections: this.initStorage(), // loads storage
      all_sections: JSON.parse(localStorage.getItem(STORAGE_KEYS.SECTIONS) || '[]'),
      all_subsections: JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBSECTIONS) || '[]'),
      kpis: this.getKPIs(),
    };
  }

  importHierarchyAndKPIs(data: any): {
    success: boolean;
    message: string;
    counts: { units: number; departments: number; sections: number; subsections: number; kpis: number };
  } {
    try {
      this.initStorage();
      let importedUnits = 0;
      let importedDepts = 0;
      let importedSections = 0;
      let importedSubsections = 0;
      let importedKPIs = 0;

      const currentUnits = this.getUnits();
      const currentDepts = this.getDepartments();
      const currentSections: Section[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SECTIONS) || '[]');
      const currentSubsections: Subsection[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBSECTIONS) || '[]');
      const currentKPIs = this.getKPIs();

      // Case 1: Nested structure (Units -> Departments -> Sections -> Subsections -> KPIs)
      if (Array.isArray(data?.units) || Array.isArray(data)) {
        const unitsArray = Array.isArray(data?.units) ? data.units : Array.isArray(data) ? data : [];
        for (const u of unitsArray) {
          if (!u.name) continue;
          let unitObj = currentUnits.find((existing) => existing.code === u.code || existing.id === u.id);
          if (!unitObj) {
            unitObj = {
              id: u.id || `unit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              name: u.name,
              code: (u.code || u.name.substring(0, 4)).toUpperCase(),
              location: u.location || '',
              status: u.status || 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            currentUnits.push(unitObj);
            importedUnits++;
          }

          if (Array.isArray(u.departments)) {
            for (const d of u.departments) {
              if (!d.name) continue;
              let deptObj = currentDepts.find((existing) => existing.short_code === d.short_code || existing.id === d.id);
              if (!deptObj) {
                const cleanCode = (d.short_code || d.name.substring(0, 3)).toUpperCase();
                deptObj = {
                  id: d.id || `dept-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                  unit_id: unitObj.id,
                  name: d.name,
                  short_code: cleanCode,
                  department_id: d.department_id || generateDepartmentId(cleanCode),
                  access_code: d.access_code || generateAccessCode(),
                  status: d.status || 'active',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                currentDepts.push(deptObj);
                importedDepts++;
              } else if (!deptObj.unit_id) {
                deptObj.unit_id = unitObj.id;
              }

              if (Array.isArray(d.sections)) {
                for (const s of d.sections) {
                  if (!s.name) continue;
                  let secObj = currentSections.find((existing) => existing.name === s.name && existing.department_id === deptObj.id);
                  if (!secObj) {
                    secObj = {
                      id: s.id || `sec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                      department_id: deptObj.id,
                      name: s.name,
                      created_at: new Date().toISOString(),
                    };
                    currentSections.push(secObj);
                    importedSections++;
                  }

                  if (Array.isArray(s.subsections)) {
                    for (const sub of s.subsections) {
                      if (!sub.name) continue;
                      let subObj = currentSubsections.find((existing) => existing.name === sub.name && existing.section_id === secObj.id);
                      if (!subObj) {
                        subObj = {
                          id: sub.id || `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                          section_id: secObj.id,
                          name: sub.name,
                          created_at: new Date().toISOString(),
                        };
                        currentSubsections.push(subObj);
                        importedSubsections++;
                      }
                    }
                  }
                }
              }

              if (Array.isArray(d.kpis)) {
                for (const k of d.kpis) {
                  if (!k.kra && !k.smart_kpi_text) continue;
                  currentKPIs.push({
                    id: k.id || `kpi-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    kpi_code: k.kpi_code || generateNextKPICode(currentKPIs),
                    unit_id: unitObj.id,
                    department_id: deptObj.id,
                    section_id: k.section_id,
                    subsection_id: k.subsection_id,
                    kra: k.kra || 'Key Result Area',
                    major_objective: k.major_objective || 'Major Objective',
                    aligned_org_goal_level: k.aligned_org_goal_level || 'department',
                    aligned_org_goal_id: k.aligned_org_goal_id || deptObj.id,
                    aligned_org_goal_label: k.aligned_org_goal_label || deptObj.name,
                    smart_kpi_text: k.smart_kpi_text || k.name || 'KPI statement',
                    perspective: k.perspective || 'Process',
                    responsible_concern: Array.isArray(k.responsible_concern) ? k.responsible_concern : ['Concern'],
                    requirements: k.requirements || '',
                    datasource: k.datasource || 'Report',
                    weight: Number(k.weight || 10),
                    baseline_value: Number(k.baseline_value || 0),
                    baseline_unit: k.baseline_unit || 'percentage',
                    target_value: Number(k.target_value || 100),
                    target_unit: k.target_unit || 'percentage',
                    target_policy: k.target_policy || 'fixed',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  });
                  importedKPIs++;
                }
              }
            }
          }
        }
      }

      // Save updated data
      localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(currentUnits));
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(currentDepts));
      localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(currentSections));
      localStorage.setItem(STORAGE_KEYS.SUBSECTIONS, JSON.stringify(currentSubsections));
      localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(currentKPIs));

      this.broadcastUpdate();

      // Sync to Supabase in background
      if (supabase) {
        Promise.all([
          supabase.from('units').upsert(currentUnits),
          supabase.from('departments').upsert(currentDepts),
          supabase.from('sections').upsert(currentSections),
          supabase.from('subsections').upsert(currentSubsections),
        ])
          .then(async () => {
            for (const k of currentKPIs) {
              await this.syncKPIToSupabase(k);
            }
          })
          .catch(() => {});
      }

      return {
        success: true,
        message: `Successfully imported hierarchy and KPIs!`,
        counts: {
          units: importedUnits,
          departments: importedDepts,
          sections: importedSections,
          subsections: importedSubsections,
          kpis: importedKPIs,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to parse hierarchy JSON',
        counts: { units: 0, departments: 0, sections: 0, subsections: 0, kpis: 0 },
      };
    }
  }
}

export const db = new DatabaseService();
