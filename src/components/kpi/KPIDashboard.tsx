import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
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
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Layers,
  Building2,
  TableProperties,
  RefreshCw,
} from 'lucide-react';

interface KPIDashboardProps {
  session: UserSession;
  onNavigateToDepartments?: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const KPIDashboard: React.FC<KPIDashboardProps> = ({ session }) => {
  const isAdmin = session.role === 'admin';

  // Filters State (#14, #43, #44)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(
    isAdmin ? 'all' : session.departmentId || 'dept-ie'
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

  // Data State
  const [departments, setDepartments] = useState<Department[]>([]);
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

  // Load Departments
  const refreshDepartments = useCallback(() => {
    const list = db.getDepartments();
    setDepartments(list);
  }, []);

  // Load KPIs and Monthly Entries dynamically with active filter parameters
  const refreshKPIsAndEntries = useCallback(() => {
    const fetchedKpis = db.getKPIs({
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
    selectedDepartmentId,
    selectedSectionId,
    selectedSubsectionId,
    selectedLevel,
    selectedPerspective,
    searchQuery,
    selectedYear,
  ]);

  // Synchronous filter change handlers to prevent stale hierarchy query bugs
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

  // Re-run filter query whenever ANY filter state changes
  useEffect(() => {
    refreshKPIsAndEntries();
  }, [refreshKPIsAndEntries]);

  // Manual Sync trigger
  const handleManualSync = async () => {
    setIsSyncing(true);
    await db.syncFromSupabase();
    refreshDepartments();
    refreshKPIsAndEntries();
    setTimeout(() => setIsSyncing(false), 400);
  };

  // Sync on Mount & Listeners
  useEffect(() => {
    refreshDepartments();
    refreshKPIsAndEntries();

    db.syncFromSupabase().then(() => {
      refreshDepartments();
      refreshKPIsAndEntries();
    });

    const unsubscribe = db.subscribe(() => {
      refreshDepartments();
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
  }, [refreshDepartments, refreshKPIsAndEntries]);

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
          : session.role === 'subsection'
          ? session.subsectionName || session.departmentCode || 'subsection'
          : session.role === 'section'
          ? session.sectionName || session.departmentCode || 'section'
          : session.departmentCode || 'department',
    };
    // Ensure department/section/subsection user always saves within their scope
    let dataToSave = !isAdmin && session.departmentId
      ? { ...kpiData, department_id: session.departmentId }
      : kpiData;

    if (session.role === 'section' && session.sectionId) {
      dataToSave = { ...dataToSave, section_id: session.sectionId };
    } else if (session.role === 'subsection') {
      if (session.sectionId) dataToSave = { ...dataToSave, section_id: session.sectionId };
      if (session.subsectionId) dataToSave = { ...dataToSave, subsection_id: session.subsectionId };
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
          {/* Left: Department Scope & Hierarchy Selectors */}
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {isAdmin ? (
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                <select
                  value={selectedDepartmentId}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-xs font-semibold text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 min-w-[210px]"
                >
                  <option value="all">🏢 All Departments (সকল ডিপার্টমেন্ট)</option>
                  <optgroup label="Individual Departments">
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.short_code})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-emerald-50/80 border border-emerald-200 text-xs font-semibold text-emerald-950">
                <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Department: {session.departmentName || currentDepartment?.name}</span>
                <span className="text-[10px] text-emerald-700 font-mono">({session.departmentCode})</span>
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
                  onChange={(e) => setSelectedSubsectionId(e.target.value)}
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

            {/* Level Filter */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
              title="Filter by organizational hierarchy level"
            >
              <option value="all">All Levels (সকল লেভেল)</option>
              <option value="department">🏢 Dept Level</option>
              <option value="section">📂 Section Level</option>
              <option value="subsection">📄 Sub-sec Level</option>
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
        departments={departments}
        onEditKPI={handleOpenEditWizard}
        onDuplicateKPI={handleDuplicateKPI}
        onDeleteKPI={handleDeleteKPI}
        onOpenMonthlyCell={handleOpenMonthlyCell}
        onAddKPI={handleOpenAddWizard}
      />

      {/* KPI 5-Step Creation / Edit Wizard Modal (#20) */}
      {wizardOpen && (
        <KPIWizard
          initialDepartmentId={
            isAdmin
              ? (selectedDepartmentId === 'all' ? departments[0]?.id || 'dept-ie' : selectedDepartmentId)
              : (session.departmentId || selectedDepartmentId)
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
          departments={departments}
          editingKPI={editingKPI}
          lockDepartment={!isAdmin}
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
    </div>
  );
};
