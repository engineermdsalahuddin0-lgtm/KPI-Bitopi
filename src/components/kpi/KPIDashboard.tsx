import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Unit,
  Department,
  Section,
  Subsection,
  KPI,
  KPIMonthlyEntry,
  UserSession,
  OrgGoalLevel,
} from '../../types';
import { db } from '../../services/db';
import { calculateDepartmentSummary } from '../../services/calculations';
import { PerformanceSummary } from './PerformanceSummary';
import { KPITable } from './KPITable';
import { KPIWizard } from './KPIWizard';
import { KPICellEditModal } from './KPICellEditModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { HierarchyJsonModal } from './HierarchyJsonModal';
import { UnitManagementModal } from '../departments/UnitManagementModal';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Layers,
  Building2,
  TableProperties,
  RefreshCw,
  FileJson,
  Factory,
} from 'lucide-react';

interface KPIDashboardProps {
  session: UserSession;
  onNavigateToDepartments?: () => void;
  onNavigateToUnits?: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const cleanLabel = (text?: string): string => (text ? text.replace(/\s*\([^)]*\)/g, '').trim() : '');

export const KPIDashboard: React.FC<KPIDashboardProps> = ({ session, onNavigateToUnits }) => {
  const isAdmin = session.role === 'admin';

  // Filters State (#14, #43, #44)
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    isAdmin ? 'all' : session.unitId || 'all'
  );
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(
    isAdmin || session.role === 'unit' ? 'all' : session.departmentId || 'all'
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    session.role === 'section' || session.role === 'subsection' ? session.sectionId || 'all' : 'all'
  );
  const [selectedSubsectionId, setSelectedSubsectionId] = useState<string>(
    session.role === 'subsection' ? session.subsectionId || 'all' : 'all'
  );
  const [selectedLevel, setSelectedLevel] = useState<OrgGoalLevel | 'all'>('all');
  const [selectedPerspective, setSelectedPerspective] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAllMonths, setShowAllMonths] = useState<boolean>(true); // Default to full 12-month table (#16, #47)
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [jsonModalOpen, setJsonModalOpen] = useState<boolean>(false);
  const [unitModalOpen, setUnitModalOpen] = useState<boolean>(false);

  // Data State - initialize eagerly from db
  const [units, setUnits] = useState<Unit[]>(() => db.getUnits());
  const [departments, setDepartments] = useState<Department[]>(() =>
    db.getDepartments(
      (isAdmin ? 'all' : session.unitId || 'all') !== 'all'
        ? (isAdmin ? 'all' : session.unitId || 'all')
        : undefined
    )
  );
  const [sections, setSections] = useState<Section[]>([]);
  const [subsections, setSubsections] = useState<Subsection[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [monthlyEntries, setMonthlyEntries] = useState<KPIMonthlyEntry[]>([]);

  // Modals State
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPI | null>(null);
  const [deleteTargetKPI, setDeleteTargetKPI] = useState<KPI | null>(null);

  // Cell Edit Modal State
  const [cellEditState, setCellEditState] = useState<{
    open: boolean;
    kpi?: KPI;
    month?: number;
    monthName?: string;
    entry?: KPIMonthlyEntry;
  }>({ open: false });

  // Load Units and Departments
  const refreshUnitsAndDepartments = useCallback(() => {
    setUnits(db.getUnits());
    const list = db.getDepartments(selectedUnitId !== 'all' ? selectedUnitId : undefined);
    setDepartments(list);
  }, [selectedUnitId]);

  // Load KPIs and Monthly Entries dynamically with active filter parameters
  const refreshKPIsAndEntries = useCallback(() => {
    const fetchedKpis = db.getKPIs({
      unitId: selectedUnitId,
      departmentId: selectedDepartmentId,
      sectionId: selectedSectionId,
      subsectionId: selectedSubsectionId,
      level: selectedLevel,
      perspective: selectedPerspective,
      search: searchQuery,
    });
    setKpis(fetchedKpis);

    const kpiIds = fetchedKpis.map((k) => k.id);
    const entries = db.getMonthlyEntriesForKPIs(kpiIds, selectedYear);
    setMonthlyEntries(entries);
  }, [
    selectedUnitId,
    selectedDepartmentId,
    selectedSectionId,
    selectedSubsectionId,
    selectedLevel,
    selectedPerspective,
    searchQuery,
    selectedYear,
  ]);

  // Dedicated reactive effect: Load departments whenever selectedUnitId changes
  useEffect(() => {
    const depts = db.getDepartments(selectedUnitId !== 'all' ? selectedUnitId : undefined);
    setDepartments(depts);
  }, [selectedUnitId]);

  // Synchronous filter change handlers to prevent stale hierarchy query bugs
  const handleUnitChange = (newUnitId: string) => {
    setSelectedUnitId(newUnitId);
    setSelectedDepartmentId('all');
    setSelectedSectionId('all');
    setSelectedSubsectionId('all');
    const depts = db.getDepartments(newUnitId !== 'all' ? newUnitId : undefined);
    setDepartments(depts);
    setSections([]);
    setSubsections([]);
  };

  const handleDepartmentChange = (newDeptId: string) => {
    setSelectedDepartmentId(newDeptId);
    if (session.role !== 'section' && session.role !== 'subsection') {
      setSelectedSectionId('all');
      setSelectedSubsectionId('all');
      if (newDeptId !== 'all') {
        const secs = db.getSections(newDeptId);
        setSections(secs);
      } else {
        setSections([]);
      }
      setSubsections([]);
    }
  };

  const handleSectionChange = (newSecId: string) => {
    setSelectedSectionId(newSecId);
    if (session.role !== 'subsection') {
      setSelectedSubsectionId('all');
      if (newSecId !== 'all') {
        const subs = db.getSubsections(newSecId);
        setSubsections(subs);
      } else {
        setSubsections([]);
      }
    }
  };

  const handleSubsectionChange = (newSubId: string) => {
    setSelectedSubsectionId(newSubId);
  };

  // Re-run filter query whenever ANY filter state changes
  useEffect(() => {
    refreshKPIsAndEntries();
  }, [refreshKPIsAndEntries]);

  // Manual Sync trigger
  const handleManualSync = async () => {
    setIsSyncing(true);
    await db.syncFromSupabase();
    refreshUnitsAndDepartments();
    refreshKPIsAndEntries();
    setTimeout(() => setIsSyncing(false), 400);
  };

  // Sync on Mount & Listeners
  useEffect(() => {
    refreshUnitsAndDepartments();
    refreshKPIsAndEntries();

    db.syncFromSupabase().then(() => {
      refreshUnitsAndDepartments();
      refreshKPIsAndEntries();
    });

    const unsubscribe = db.subscribe(() => {
      refreshUnitsAndDepartments();
      refreshKPIsAndEntries();
    });

    const handleFocus = () => {
      db.syncFromSupabase().then(() => {
        refreshKPIsAndEntries();
      });
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshUnitsAndDepartments, refreshKPIsAndEntries]);

  // Update target department, section, and subsection based on session
  useEffect(() => {
    if (!isAdmin && session.departmentId) {
      setSelectedDepartmentId(session.departmentId);
      const secs = db.getSections(session.departmentId);
      setSections(secs);
      if (session.role === 'section' && session.sectionId) {
        setSelectedSectionId(session.sectionId);
        setSubsections(db.getSubsections(session.sectionId));
      } else if (session.role === 'subsection') {
        if (session.sectionId) {
          setSelectedSectionId(session.sectionId);
          setSubsections(db.getSubsections(session.sectionId));
        }
        if (session.subsectionId) setSelectedSubsectionId(session.subsectionId);
      }
    }
  }, [isAdmin, session]);

  // Load Sections for the selected department
  useEffect(() => {
    if (selectedDepartmentId !== 'all') {
      const secs = db.getSections(selectedDepartmentId);
      setSections(secs);
    } else {
      setSections([]);
    }
  }, [selectedDepartmentId]);

  // Load Subsections for the selected section
  useEffect(() => {
    if (selectedSectionId !== 'all') {
      const subs = db.getSubsections(selectedSectionId);
      setSubsections(subs);
    } else {
      setSubsections([]);
    }
  }, [selectedSectionId]);

  // Selected Department Object
  const currentDepartment = departments.find((d) => d.id === selectedDepartmentId);

  // Compute Department Summary Metrics (#15, #34, #35)
  const summaryMetrics = useMemo(() => {
    return calculateDepartmentSummary(kpis, monthlyEntries, selectedYear, selectedMonth);
  }, [kpis, monthlyEntries, selectedYear, selectedMonth]);

  // Handlers
  const handleOpenAddWizard = () => {
    setEditingKPI(null);
    setWizardOpen(true);
  };

  const handleOpenEditWizard = (kpi: KPI) => {
    setEditingKPI(kpi);
    setWizardOpen(true);
  };

  const handleSaveKPI = (kpiData: Omit<KPI, 'id' | 'kpi_code' | 'created_at' | 'updated_at'>) => {
    const actor = {
      role: session.role,
      identifier:
        session.role === 'admin'
          ? session.email || 'admin'
          : session.role === 'unit'
          ? session.unitName || session.unitCode || 'unit'
          : session.role === 'subsection'
          ? session.subsectionName || session.departmentCode || 'subsection'
          : session.role === 'section'
          ? session.sectionName || session.departmentCode || 'section'
          : session.departmentCode || 'department',
    };

    let dataToSave = { ...kpiData };
    if (session.role === 'unit' && session.unitId) {
      dataToSave.unit_id = session.unitId;
    } else if (session.role === 'department') {
      if (session.unitId) dataToSave.unit_id = session.unitId;
      if (session.departmentId) dataToSave.department_id = session.departmentId;
    } else if (session.role === 'section') {
      if (session.unitId) dataToSave.unit_id = session.unitId;
      if (session.departmentId) dataToSave.department_id = session.departmentId;
      if (session.sectionId) dataToSave.section_id = session.sectionId;
    } else if (session.role === 'subsection') {
      if (session.unitId) dataToSave.unit_id = session.unitId;
      if (session.departmentId) dataToSave.department_id = session.departmentId;
      if (session.sectionId) dataToSave.section_id = session.sectionId;
      if (session.subsectionId) dataToSave.subsection_id = session.subsectionId;
    }

    // Auto-resolve unit_id from department_id if missing
    if (dataToSave.department_id && !dataToSave.unit_id) {
      const d = db.getDepartmentById(dataToSave.department_id);
      if (d?.unit_id) dataToSave.unit_id = d.unit_id;
    }
    if (!dataToSave.unit_id && session.unitId) {
      dataToSave.unit_id = session.unitId;
    }
    if (!dataToSave.unit_id) {
      dataToSave.unit_id = 'unit-bgl';
    }

    if (editingKPI) {
      db.updateKPI(editingKPI.id, dataToSave, actor);
    } else {
      db.createKPI(dataToSave, actor);
    }
    setWizardOpen(false);
    setEditingKPI(null);
    refreshKPIsAndEntries();
  };

  const handleDuplicateKPI = (kpi: KPI) => {
    try {
      const actor = {
        role: session.role,
        identifier:
          session.role === 'admin'
            ? session.email || 'admin'
            : session.role === 'subsection'
            ? session.subsectionName || session.departmentCode || 'subsection'
            : session.role === 'section'
            ? session.sectionName || session.departmentCode || 'section'
            : session.departmentCode || 'department',
      };
      db.duplicateKPI(kpi.id, actor);
      refreshKPIsAndEntries();
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate KPI');
    }
  };

  const handleDeleteKPI = (kpi: KPI) => {
    setDeleteTargetKPI(kpi);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetKPI) {
      const actor = {
        role: session.role,
        identifier:
          session.role === 'admin'
            ? session.email || 'admin'
            : session.role === 'subsection'
            ? session.subsectionName || session.departmentCode || 'subsection'
            : session.role === 'section'
            ? session.sectionName || session.departmentCode || 'section'
            : session.departmentCode || 'department',
      };
      await db.deleteKPI(deleteTargetKPI.id, actor);
      setDeleteTargetKPI(null);
      refreshKPIsAndEntries();
    }
  };

  const handleOpenMonthlyCell = (
    kpi: KPI,
    month: number,
    monthName: string,
    entry?: KPIMonthlyEntry
  ) => {
    setCellEditState({
      open: true,
      kpi,
      month,
      monthName,
      entry,
    });
  };

  const handleSaveMonthlyEntry = (
    updatedEntry: Omit<KPIMonthlyEntry, 'id' | 'created_at' | 'updated_at'>
  ) => {
    db.upsertMonthlyEntry(updatedEntry);
    setCellEditState({ open: false });
    refreshKPIsAndEntries();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      {/* Admin Fast View Mode Banner (Requirement 2 & 3) */}
      {isAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 px-3 py-1.5 bg-neutral-100/80 rounded-md border border-neutral-200 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-neutral-700">
            <Layers className="w-3.5 h-3.5 text-emerald-700" />
            <span className="font-semibold text-neutral-900">Admin View Presets:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                handleDepartmentChange('all');
                setSelectedLevel('all');
                setSelectedMonth('all');
                setShowAllMonths(true);
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                selectedDepartmentId === 'all' && selectedMonth === 'all' && showAllMonths
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              🏢 All Departments · All Months
            </button>
            <button
              onClick={() => {
                handleDepartmentChange('all');
                setSelectedLevel('all');
                setSelectedMonth(3);
                setShowAllMonths(true);
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                selectedDepartmentId === 'all' && selectedMonth === 3 && showAllMonths
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              🏢 All Departments · March 2026
            </button>
            <button
              onClick={() => {
                if (departments.length > 0) {
                  handleDepartmentChange(departments[0].id);
                  setSelectedLevel('all');
                  setSelectedMonth('all');
                  setShowAllMonths(true);
                }
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                selectedDepartmentId !== 'all'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              🏢 Single Dept View
            </button>
          </div>
        </div>
      )}

      {/* 1. FILTERS BAR (#14, #43, #44) */}
      <div className="bg-white border border-neutral-200/90 rounded-lg p-3 sm:p-3.5 mb-3 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Left: Unit, Department Scope & Hierarchy Selectors */}
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Unit Filter (Top Organizational Scope) */}
            {isAdmin && (
              <div className="flex items-center gap-1.5">
                <Factory className="w-3.5 h-3.5 text-neutral-500" />
                <select
                  value={selectedUnitId}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-xs font-semibold text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 max-w-[190px] truncate"
                  title="Filter by Business Unit"
                >
                  <option value="all">🏭 All Units</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {cleanLabel(u.name)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => (onNavigateToUnits ? onNavigateToUnits() : setUnitModalOpen(true))}
                  className="px-2 py-1.5 rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                  title="Manage Business Units (Add / Edit / Delete)"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Units</span>
                </button>
              </div>
            )}

            {isAdmin ? (
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                <select
                  value={selectedDepartmentId}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-xs font-semibold text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 min-w-[210px]"
                >
                  <option value="all">
                    {selectedUnitId === 'all'
                      ? '🏢 All Departments'
                      : `🏢 All ${cleanLabel(units.find((u) => u.id === selectedUnitId)?.name || 'Unit')} Departments (${departments.length})`}
                  </option>
                  <optgroup label={selectedUnitId === 'all' ? 'All Departments' : `${cleanLabel(units.find((u) => u.id === selectedUnitId)?.name || 'Unit')} Departments`}>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {cleanLabel(dept.name)}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            ) : session.role === 'unit' ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-50/80 border border-emerald-200 text-xs font-semibold text-emerald-950">
                  <Factory className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Unit: {cleanLabel(session.unitName)}</span>
                </div>
                <select
                  value={selectedDepartmentId}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-xs font-semibold text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                >
                  <option value="all">🏢 All Unit Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {cleanLabel(dept.name)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {session.unitName && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-neutral-100 border border-neutral-300 text-xs font-semibold text-neutral-800">
                    <Factory className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Unit: {cleanLabel(session.unitName)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-emerald-50/80 border border-emerald-200 text-xs font-semibold text-emerald-950">
                  <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Department: {cleanLabel(session.departmentName || currentDepartment?.name)}</span>
                </div>
              </div>
            )}

            {/* Section Filter */}
            {session.role === 'section' || session.role === 'subsection' ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-neutral-100 border border-neutral-300 text-xs font-medium text-neutral-800">
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                <span>Section: {session.sectionName || sections.find(s => s.id === session.sectionId)?.name || 'Current'}</span>
              </div>
            ) : (
              sections.length > 0 && (
                <select
                  value={selectedSectionId}
                  onChange={(e) => handleSectionChange(e.target.value)}
                  className="px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 max-w-[170px] truncate"
                >
                  <option value="all">All Sections (সকল সেকশন)</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )
            )}

            {/* Subsection Filter */}
            {session.role === 'subsection' ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-neutral-100 border border-neutral-300 text-xs font-medium text-neutral-800">
                <span>Sub: {session.subsectionName || subsections.find(sub => sub.id === session.subsectionId)?.name || 'Current'}</span>
              </div>
            ) : (
              subsections.length > 0 && (
                <select
                  value={selectedSubsectionId}
                  onChange={(e) => handleSubsectionChange(e.target.value)}
                  className="px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 max-w-[170px] truncate"
                >
                  <option value="all">All Sub-sections (সকল সাব-সেকশন)</option>
                  {subsections.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              )
            )}

            {/* Level Filter (All 4 Node Tiers) */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
              title="Filter by organizational hierarchy level"
            >
              <option value="all">All Levels (সকল লেভেল)</option>
              <option value="unit">🏭 Unit Level (ইউনিট হেড)</option>
              <option value="department">🏢 Dept Level (ডিপার্টমেন্ট হেড)</option>
              <option value="section">📂 Section Level (সেকশন ইনচার্জ)</option>
              <option value="subsection">📄 Sub-sec Level (সাব-সেকশন লিড)</option>
            </select>

            {/* Perspective Filter */}
            <select
              value={selectedPerspective}
              onChange={(e) => setSelectedPerspective(e.target.value)}
              className="px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
            >
              <option value="all">All Perspectives</option>
              <option value="Process">Process</option>
              <option value="Account">Account</option>
              <option value="Learning & Development">Learning & Dev</option>
              <option value="Customer">Customer</option>
            </select>
          </div>

          {/* Right: Year, Month, Search & Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Year selector (#76) */}
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="px-2 py-1.5 rounded-md border border-neutral-300 bg-white text-xs font-mono font-medium text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
              >
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value={2028}>2028</option>
              </select>
            </div>

            {/* Month selector (#14, #77) - Supports All Months */}
            <select
              value={selectedMonth}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'all') {
                  setSelectedMonth('all');
                  setShowAllMonths(true);
                } else {
                  setSelectedMonth(parseInt(val, 10));
                }
              }}
              className="px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-xs font-medium text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
            >
              <option value="all">📅 All Months (সকল মাস)</option>
              <optgroup label="Single Month">
                {MONTH_NAMES.map((m, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </optgroup>
            </select>

            {/* Search Input (#43) */}
            <div className="relative min-w-[150px] max-w-[190px]">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search KPI..."
                className="w-full pl-8 pr-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            {/* Table View Mode Toggle (#47) */}
            <button
              onClick={() => setShowAllMonths(!showAllMonths)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                showAllMonths
                  ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 font-semibold'
                  : 'border-neutral-300 hover:bg-neutral-50 text-neutral-700'
              }`}
              title={showAllMonths ? 'Focus on single month column' : 'Expand all 12 monthly columns'}
            >
              <TableProperties className="w-3.5 h-3.5 text-emerald-700" />
              <span>
                {showAllMonths
                  ? '12 Months'
                  : typeof selectedMonth === 'number'
                  ? `${MONTH_NAMES[selectedMonth - 1].slice(0, 3)} Only`
                  : 'Jan Only'}
              </span>
            </button>

            {/* Realtime Sync Button */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md border border-neutral-300 hover:bg-neutral-50 text-neutral-700 transition-colors"
              title="Refresh and sync data with database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : 'text-neutral-500'}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>

            {/* Company Hierarchy & KPI JSON Importer Modal Button */}
            {isAdmin && (
              <button
                onClick={() => setJsonModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-900 transition-colors shadow-2xs"
                title="Import or format Unit, Department, Section & Subsection hierarchy via JSON"
              >
                <FileJson className="w-3.5 h-3.5 text-emerald-700" />
                <span>Company JSON</span>
              </button>
            )}

            {/* Add KPI Action: Accessible to Admin and Department User */}
            <button
              onClick={handleOpenAddWizard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-colors hover:-translate-y-px active:translate-y-0"
              title={isAdmin ? 'Add KPI for selected department' : 'Add KPI for your department'}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAdmin ? 'Add KPI' : 'Add Department KPI'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE HIERARCHY NODE SCOPE INDICATOR */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 mb-3 bg-white border border-neutral-200/90 rounded-lg text-xs shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap text-neutral-600">
          <span className="font-semibold text-neutral-800 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-emerald-700" />
            Active Filter Scope:
          </span>
          <span className="px-2 py-0.5 rounded bg-neutral-100 font-medium text-neutral-800 border border-neutral-200">
            {selectedUnitId === 'all' ? '🏭 All Units' : units.find((u) => u.id === selectedUnitId)?.name || selectedUnitId}
          </span>
          <span>→</span>
          <span className="px-2 py-0.5 rounded bg-neutral-100 font-medium text-neutral-800 border border-neutral-200">
            {selectedDepartmentId === 'all' ? '🏢 All Departments' : currentDepartment?.name || selectedDepartmentId}
          </span>
          {selectedSectionId !== 'all' && (
            <>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-900 border border-sky-200 font-medium">
                📂 {sections.find((s) => s.id === selectedSectionId)?.name || selectedSectionId}
              </span>
            </>
          )}
          {selectedSubsectionId !== 'all' && (
            <>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                📄 {subsections.find((sub) => sub.id === selectedSubsectionId)?.name || selectedSubsectionId}
              </span>
            </>
          )}
          {selectedLevel !== 'all' && (
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 uppercase">
              {selectedLevel} Level
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-neutral-500">
            Showing <strong className="text-neutral-900">{kpis.length}</strong> matching KPIs
          </span>
          <span className="text-neutral-300">|</span>
          <span className="text-[11px] text-neutral-500">
            Total Weight: <strong className="text-emerald-800 font-mono">{kpis.reduce((acc, k) => acc + (k.weight || 0), 0)}%</strong>
          </span>
        </div>
      </div>

      {/* 2. COMPACT KPI SUMMARY (#15, #81) */}
      <PerformanceSummary
        metrics={summaryMetrics}
        selectedMonthName={selectedMonth === 'all' ? 'All Months (Full Year)' : MONTH_NAMES[selectedMonth - 1]}
        selectedYear={selectedYear}
        departmentName={selectedDepartmentId === 'all' ? 'All Departments (সকল ডিপার্টমেন্ট)' : currentDepartment?.name}
      />

      {/* 3. FULL KPI BOARD (The Core Product Experience) (#16, #17, #18, #81, #84) */}
      <KPITable
        kpis={kpis}
        monthlyEntries={monthlyEntries}
        selectedYear={selectedYear}
        focusedMonth={selectedMonth}
        showAllMonths={showAllMonths}
        session={session}
        departments={db.getDepartments()}
        onEditKPI={handleOpenEditWizard}
        onDuplicateKPI={handleDuplicateKPI}
        onDeleteKPI={handleDeleteKPI}
        onOpenMonthlyCell={handleOpenMonthlyCell}
        onAddKPI={handleOpenAddWizard}
      />

      {/* KPI 5-Step Creation / Edit Wizard Modal (#20) */}
      {wizardOpen && (
        <KPIWizard
          initialUnitId={
            selectedUnitId !== 'all' ? selectedUnitId : (session.unitId || undefined)
          }
          initialDepartmentId={
            selectedDepartmentId !== 'all' ? selectedDepartmentId : (session.departmentId || undefined)
          }
          initialSectionId={
            session.role === 'section' || session.role === 'subsection'
              ? session.sectionId
              : selectedSectionId !== 'all'
              ? selectedSectionId
              : undefined
          }
          initialSubsectionId={
            session.role === 'subsection'
              ? session.subsectionId
              : selectedSubsectionId !== 'all'
              ? selectedSubsectionId
              : undefined
          }
          session={session}
          departments={db.getDepartments()}
          editingKPI={editingKPI}
          lockDepartment={!isAdmin && session.role !== 'unit'}
          onSave={handleSaveKPI}
          onClose={() => setWizardOpen(false)}
        />
      )}

      {/* Monthly Cell Edit Modal (#30) */}
      {cellEditState.open && cellEditState.kpi && cellEditState.month && cellEditState.monthName && (
        <KPICellEditModal
          kpi={cellEditState.kpi}
          monthNumber={cellEditState.month}
          monthName={cellEditState.monthName}
          year={selectedYear}
          entry={cellEditState.entry}
          canEdit={isAdmin || session.departmentId === cellEditState.kpi.department_id}
          onSave={handleSaveMonthlyEntry}
          onClose={() => setCellEditState({ open: false })}
        />
      )}

      {/* Delete Confirmation Modal (#49, #79) */}
      {deleteTargetKPI && (
        <DeleteConfirmModal
          kpi={deleteTargetKPI}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTargetKPI(null)}
        />
      )}

      {/* Company JSON Import / Export Modal */}
      <HierarchyJsonModal
        isOpen={jsonModalOpen}
        onClose={() => setJsonModalOpen(false)}
        onImportSuccess={() => {
          refreshUnitsAndDepartments();
          refreshKPIsAndEntries();
        }}
      />

      {/* Admin Business Unit Management Modal */}
      {isAdmin && (
        <UnitManagementModal
          isOpen={unitModalOpen}
          onClose={() => setUnitModalOpen(false)}
          onUnitsChanged={() => {
            refreshUnitsAndDepartments();
            refreshKPIsAndEntries();
          }}
        />
      )}
    </div>
  );
};
