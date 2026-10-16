import React, { useState } from 'react';
import { KPI, KPIMonthlyEntry, UserSession, Department } from '../../types';
import { formatUnitValue } from '../../services/calculations';
import { KPIMonthCell } from './KPIMonthCell';
import { KPIExpandPanel } from './KPIExpandPanel';
import {
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
  Eye,
  Calendar,
} from 'lucide-react';

interface KPIRowProps {
  kpi: KPI;
  monthlyEntries: KPIMonthlyEntry[];
  selectedYear: number;
  focusedMonth: number | 'all';
  showAllMonths: boolean;
  session: UserSession;
  departments?: Department[];
  onEditKPI: (kpi: KPI) => void;
  onDuplicateKPI: (kpi: KPI) => void;
  onDeleteKPI: (kpi: KPI) => void;
  onOpenMonthlyCell: (kpi: KPI, month: number, monthName: string, entry?: KPIMonthlyEntry) => void;
  onOpenDetails?: (kpi: KPI) => void;
<<<<<<< HEAD
  leftOffsets?: {
    dept: number;
    kra: number;
    mo: number;
    kpi: number;
  };
=======
>>>>>>> 7ad21e9e5364190a0bafcdbe5ade16a66209227d
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

<<<<<<< HEAD
// Distinctive Department Color Palettes for clear visual grouping & identification across 100+ departments
const DEPT_COLORS: Record<string, { bg: string; text: string; border: string; pillBg: string; borderLeft: string }> = {
  // Production
  PROD: { bg: 'bg-amber-50/70', text: 'text-amber-950', border: 'border-amber-200', pillBg: 'bg-amber-600 text-white', borderLeft: 'border-l-4 border-l-amber-500' },
  // HR & Admin
  HRA:  { bg: 'bg-emerald-50/70', text: 'text-emerald-950', border: 'border-emerald-200', pillBg: 'bg-emerald-700 text-white', borderLeft: 'border-l-4 border-l-emerald-600' },
  // Industrial Engineering / IE
  IE:   { bg: 'bg-sky-50/70', text: 'text-sky-950', border: 'border-sky-200', pillBg: 'bg-sky-700 text-white', borderLeft: 'border-l-4 border-l-sky-500' },
  IE2:  { bg: 'bg-sky-50/70', text: 'text-sky-950', border: 'border-sky-200', pillBg: 'bg-sky-700 text-white', borderLeft: 'border-l-4 border-l-sky-500' },
  // Quality Assurance
  QA:   { bg: 'bg-indigo-50/70', text: 'text-indigo-950', border: 'border-indigo-200', pillBg: 'bg-indigo-700 text-white', borderLeft: 'border-l-4 border-l-indigo-600' },
  // Finance & Accounts
  FIN:  { bg: 'bg-teal-50/70', text: 'text-teal-950', border: 'border-teal-200', pillBg: 'bg-teal-700 text-white', borderLeft: 'border-l-4 border-l-teal-600' },
  // Planning (PPC)
  PPC:  { bg: 'bg-violet-50/70', text: 'text-violet-950', border: 'border-violet-200', pillBg: 'bg-violet-700 text-white', borderLeft: 'border-l-4 border-l-violet-600' },
  // Commercial
  COM:  { bg: 'bg-cyan-50/70', text: 'text-cyan-950', border: 'border-cyan-200', pillBg: 'bg-cyan-700 text-white', borderLeft: 'border-l-4 border-l-cyan-600' },
  // Marketing & Merchandising
  MM:   { bg: 'bg-rose-50/70', text: 'text-rose-950', border: 'border-rose-200', pillBg: 'bg-rose-700 text-white', borderLeft: 'border-l-4 border-l-rose-500' },
  // Washing
  WASH: { bg: 'bg-blue-50/70', text: 'text-blue-950', border: 'border-blue-200', pillBg: 'bg-blue-700 text-white', borderLeft: 'border-l-4 border-l-blue-600' },
  // CAD & Sample
  CAD:  { bg: 'bg-fuchsia-50/70', text: 'text-fuchsia-950', border: 'border-fuchsia-200', pillBg: 'bg-fuchsia-700 text-white', borderLeft: 'border-l-4 border-l-fuchsia-500' },
  // Engineering & Services
  ENG:  { bg: 'bg-orange-50/70', text: 'text-orange-950', border: 'border-orange-200', pillBg: 'bg-orange-700 text-white', borderLeft: 'border-l-4 border-l-orange-500' },
  // ERP & IT
  IT:   { bg: 'bg-purple-50/70', text: 'text-purple-950', border: 'border-purple-200', pillBg: 'bg-purple-700 text-white', borderLeft: 'border-l-4 border-l-purple-600' },
  // Store & Warehouse
  STW:  { bg: 'bg-yellow-50/70', text: 'text-yellow-950', border: 'border-yellow-200', pillBg: 'bg-yellow-700 text-white', borderLeft: 'border-l-4 border-l-yellow-600' },
  // Supply Chain
  SCM:  { bg: 'bg-emerald-50/70', text: 'text-emerald-950', border: 'border-emerald-200', pillBg: 'bg-emerald-800 text-white', borderLeft: 'border-l-4 border-l-emerald-600' },
  // ESG
  ESG:  { bg: 'bg-green-50/70', text: 'text-green-950', border: 'border-green-200', pillBg: 'bg-green-700 text-white', borderLeft: 'border-l-4 border-l-green-600' },
  // Design & Product Development
  DPD:  { bg: 'bg-pink-50/70', text: 'text-pink-950', border: 'border-pink-200', pillBg: 'bg-pink-700 text-white', borderLeft: 'border-l-4 border-l-pink-500' },
  // MIS & Internal Audit
  MIS:  { bg: 'bg-slate-50/70', text: 'text-slate-950', border: 'border-slate-200', pillBg: 'bg-slate-700 text-white', borderLeft: 'border-l-4 border-l-slate-600' },
  // Technical
  TECH: { bg: 'bg-zinc-50/70', text: 'text-zinc-950', border: 'border-zinc-200', pillBg: 'bg-zinc-700 text-white', borderLeft: 'border-l-4 border-l-zinc-600' },
  // General
  GEN:  { bg: 'bg-stone-50/70', text: 'text-stone-950', border: 'border-stone-200', pillBg: 'bg-stone-700 text-white', borderLeft: 'border-l-4 border-l-stone-600' },
};

function getDeptVisuals(deptCode?: string) {
  if (!deptCode) {
    return { bg: 'bg-neutral-50/50', text: 'text-neutral-900', border: 'border-neutral-200', pillBg: 'bg-neutral-800 text-white', borderLeft: 'border-l-4 border-l-neutral-400' };
  }
  const cleanCode = deptCode.includes('-') ? deptCode.split('-').pop() || deptCode : deptCode;
  const match = DEPT_COLORS[cleanCode.toUpperCase()];
  if (match) return match;

  let hash = 0;
  for (let i = 0; i < deptCode.length; i++) hash = (hash << 5) - hash + deptCode.charCodeAt(i);
  const palettes = Object.values(DEPT_COLORS);
  return palettes[Math.abs(hash) % palettes.length];
}

=======
>>>>>>> 7ad21e9e5364190a0bafcdbe5ade16a66209227d
export const KPIRow: React.FC<KPIRowProps> = ({
  kpi,
  monthlyEntries,
  selectedYear,
  focusedMonth,
  showAllMonths,
  session,
  departments,
  onEditKPI,
  onDuplicateKPI,
  onDeleteKPI,
  onOpenMonthlyCell,
  onOpenDetails,
<<<<<<< HEAD
  leftOffsets = { dept: 0, kra: 140, mo: 260, kpi: 410 },
=======
>>>>>>> 7ad21e9e5364190a0bafcdbe5ade16a66209227d
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = session.role === 'admin';
  const matchesScope =
    isAdmin ||
    (session.role === 'unit' && session.unitId === kpi.unit_id) ||
    (session.role === 'department' && session.departmentId === kpi.department_id) ||
    (session.role === 'section' &&
      session.departmentId === kpi.department_id &&
      (!kpi.section_id || kpi.section_id === session.sectionId)) ||
    (session.role === 'subsection' &&
      session.departmentId === kpi.department_id &&
      (!kpi.subsection_id || kpi.subsection_id === session.subsectionId));

  // Monthly Entry: Sub-section users (entry point) & Admin can edit monthly scores;
  // Department & Section heads have view-only monitoring privileges.
  const canEditMonthly = isAdmin || (session.role === 'subsection' && matchesScope);

  // KPI Definition (Edit/Delete/Duplicate): Admin only (as requested: "ar admin can change and add kpi")
  const canManageKPI = isAdmin;

  const currentDept = departments?.find((d) => d.id === kpi.department_id);
<<<<<<< HEAD
  const deptVisuals = getDeptVisuals(currentDept?.short_code || currentDept?.id);
=======
>>>>>>> 7ad21e9e5364190a0bafcdbe5ade16a66209227d

  // Map month 1..12 to monthly entry
  const getEntryForMonth = (m: number) => {
    return monthlyEntries.find((e) => e.kpi_id === kpi.id && e.month === m);
  };

  const activeFocusMonth = typeof focusedMonth === 'number' ? focusedMonth : 1;

  return (
    <>
<<<<<<< HEAD
      <tr className={`transition-colors border-b border-neutral-200/80 text-xs text-neutral-800 group ${deptVisuals.bg} hover:brightness-95`}>
        
        {/* Sticky Column 1: Department (Replaced raw ID as requested) */}
        <td
          style={{ left: `${leftOffsets.dept}px` }}
          className={`sticky z-20 bg-white/95 group-hover:bg-neutral-50/95 py-2 px-2.5 whitespace-nowrap border-r border-neutral-200 truncate ${deptVisuals.borderLeft}`}
        >
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0.5 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors cursor-pointer"
=======
      <tr className="hover:bg-neutral-50/80 transition-colors border-b border-neutral-200/80 text-xs text-neutral-800 group">
        {/* Sticky Column 1: Expand + ID + Department Badge */}
        <td className="sticky left-0 z-20 bg-white group-hover:bg-neutral-50/90 py-2 px-2.5 whitespace-nowrap border-r border-neutral-200">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0.5 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
>>>>>>> 7ad21e9e5364190a0bafcdbe5ade16a66209227d
              title={isExpanded ? 'Collapse row details' : 'Expand row details'}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-600" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
<<<<<<< HEAD
            {/* Prominent Colored Department Tag */}
            <span
              className={`px-2 py-0.5 rounded-md font-bold text-[10.5px] uppercase tracking-wide truncate max-w-[110px] shadow-2xs ${deptVisuals.pillBg}`}
              title={`Department: ${currentDept?.name || 'N/A'}`}
            >
              {currentDept ? currentDept.short_code || currentDept.name.replace(/\s*\([^)]*\)/g, '').trim() : 'DEP'}
            </span>
            {kpi.aligned_org_goal_level === 'unit' ? (
              <span
                className="px-1 py-0.5 rounded text-[8.5px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                title="Unit Level"
=======
            <span className="font-mono font-semibold text-neutral-900 text-[11px] tracking-tight">
              {kpi.kpi_code}
            </span>
            {currentDept && (
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200 tracking-wider"
                title={`Department: ${currentDept.name.replace(/\s*\([^)]*\)/g, '').trim()}`}
              >
                {currentDept.short_code}
              </span>
            )}
            {kpi.aligned_org_goal_level === 'unit' ? (
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 tracking-tight"
                title={`Unit Level: ${kpi.aligned_org_goal_label || 'Unit'}`}
>>>>>>> 7ad21e9e5364190a0bafcdbe5ade16a66209227d
              >
                Unit
              </span>
            ) : kpi.aligned_org_goal_level === 'subsection' || kpi.subsection_id ? (
              <span
<<<<<<< HEAD
                className="px-1 py-0.5 rounded text-[8.5px] font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                title="Sub-section Level"
=======
                className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 tracking-tight"
                title={`Sub-section: ${kpi.aligned_org_goal_label || 'Sub-section'}`}
>>>>>>> 7ad21e9e5364190a0bafcdbe5ade16a66209227d
              >
                Sub
              </span>
            ) : kpi.aligned_org_goal_level === 'section' || kpi.section_id ? (
              <span
<<<<<<< HEAD
                className="px-1 py-0.5 rounded text-[8.5px] font-semibold bg-sky-50 text-sky-800 border border-sky-200"
                title="Section Level"
              >
                Sec
              </span>
            ) : null}
=======
                className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 tracking-tight"
                title={`Section: ${kpi.aligned_org_goal_label || 'Section'}`}
              >
                Sec
              </span>
            ) : (
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200 tracking-tight"
                title="Department Level"
              >
                Dept
              </span>
            )}
>>>>>>> 7ad21e9e5364190a0bafcdbe5ade16a66209227d
          </div>
        </td>

        {/* Sticky Column 2: KRA */}
<<<<<<< HEAD
        <td
          style={{ left: `${leftOffsets.kra}px` }}
          className="sticky z-20 bg-white/95 group-hover:bg-neutral-50/95 py-2 px-3 whitespace-nowrap border-r border-neutral-200 font-medium text-neutral-900 truncate"
          title={kpi.kra}
        >
=======
        <td className="sticky left-[78px] z-20 bg-white group-hover:bg-neutral-50/90 py-2 px-3 whitespace-nowrap border-r border-neutral-200 font-medium text-neutral-900 min-w-[110px] max-w-[140px] truncate" title={kpi.kra}>
>>>>>>> 7ad21e9e5364190a0bafcdbe5ade16a66209227d
          {kpi.kra}
        </td>

        {/* Sticky Column 3: Major Objective (MO) */}
<<<<<<< HEAD
        <td
          style={{ left: `${leftOffsets.mo}px` }}
          className="sticky z-20 bg-white/95 group-hover:bg-neutral-50/95 py-2 px-3 whitespace-nowrap border-r border-neutral-200 text-neutral-700 truncate"
          title={kpi.major_objective}
        >
=======
        <td className="sticky left-[198px] z-20 bg-white group-hover:bg-neutral-50/90 py-2 px-3 whitespace-nowrap border-r border-neutral-200 text-neutral-700 min-w-[140px] max-w-[180px] truncate" title={kpi.major_objective}>
>>>>>>> 7ad21e9e5364190a0bafcdbe5ade16a66209227d
          {kpi.major_objective}
        </td>

        {/* Sticky Column 4: KPI (Plain statement) with shadow delimiter */}
<<<<<<< HEAD
        <td
          style={{ left: `${leftOffsets.kpi}px` }}
          className="sticky z-20 bg-white/95 group-hover:bg-neutral-50/95 py-2 px-3 whitespace-nowrap border-r-2 border-neutral-300 text-neutral-900 font-medium truncate shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]"
          title={kpi.smart_kpi_text}
        >
=======
        <td className="sticky left-[348px] z-20 bg-white group-hover:bg-neutral-50/90 py-2 px-3 whitespace-nowrap border-r-2 border-neutral-300 text-neutral-900 font-medium min-w-[180px] max-w-[240px] truncate shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]" title={kpi.smart_kpi_text}>
>>>>>>> 7ad21e9e5364190a0bafcdbe5ade16a66209227d
          <span
            onClick={() => onOpenDetails && onOpenDetails(kpi)}
            className="cursor-pointer hover:text-emerald-800 hover:underline transition-colors"
            title="Click to view KPI details card"
          >
            {kpi.smart_kpi_text}
          </span>
        </td>

<<<<<<< HEAD
        {/* Column: Aligned With ORG./SBU(Factory)/Dept./Sec Goal No./Sub sec goal no. */}
        <td className="py-2 px-2.5 whitespace-nowrap border-r border-neutral-200 text-center text-xs min-w-[130px] max-w-[160px]">
          {kpi.aligned_goal_no ? (
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded-full font-mono font-bold text-xs bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-2xs"
              title={`Aligned Goal No: ${kpi.aligned_goal_no}`}
            >
              {kpi.aligned_goal_no}
            </span>
          ) : (
            <span className="text-neutral-300 text-[11px] font-mono">—</span>
          )}
        </td>



=======
        {/* Column 5: Perspective */}
        <td className="py-2 px-2.5 whitespace-nowrap border-r border-neutral-200 text-neutral-600 text-[11px] min-w-[95px]">
          {kpi.perspective}
        </td>

>>>>>>> 7ad21e9e5364190a0bafcdbe5ade16a66209227d
        {/* Column 6: Responsible concern */}
        <td className="py-2 px-2.5 whitespace-nowrap border-r border-neutral-200 text-neutral-700 min-w-[120px] max-w-[150px] truncate" title={kpi.responsible_concern.join(', ')}>
          <div className="flex items-center gap-1 overflow-hidden">
            {kpi.responsible_concern.slice(0, 2).map((person, idx) => (
              <span
                key={idx}
                className="bg-neutral-100 px-1.5 py-0.5 rounded text-[10px] text-neutral-700 font-medium whitespace-nowrap"
              >
                {person}
              </span>
            ))}
            {kpi.responsible_concern.length > 2 && (
              <span className="text-[10px] text-neutral-400">
                +{kpi.responsible_concern.length - 2}
              </span>
            )}
          </div>
        </td>

        {/* Column 7: Weight */}
        <td className="py-2 px-2.5 whitespace-nowrap border-r border-neutral-200 text-right font-mono font-semibold text-neutral-900 tabular-nums min-w-[65px]">
          {kpi.weight}%
        </td>

        {/* Column 8: Datasource */}
        <td className="py-2 px-2.5 whitespace-nowrap border-r border-neutral-200 text-neutral-600 text-[11px] min-w-[110px] max-w-[140px] truncate" title={kpi.datasource}>
          {kpi.datasource}
        </td>

        {/* Column 9: Base */}
        <td className="py-2 px-2.5 whitespace-nowrap border-r border-neutral-200 text-right font-mono text-neutral-600 tabular-nums min-w-[70px]">
          {formatUnitValue(kpi.baseline_value, kpi.baseline_unit)}
        </td>

        {/* Column 10: Target */}
        <td className="py-2 px-2.5 whitespace-nowrap border-r border-neutral-200 text-right font-mono font-semibold text-emerald-900 tabular-nums min-w-[75px]">
          {formatUnitValue(kpi.target_value, kpi.target_unit)}
        </td>

        {/* Columns 11..22: Monthly Columns (Jan to Dec) */}
        {showAllMonths ? (
          MONTH_NAMES.map((mName, idx) => {
            const monthNum = idx + 1;
            const entry = getEntryForMonth(monthNum);
            return (
              <td
                key={monthNum}
                className={`p-0 border-r border-neutral-200 min-w-[70px] ${
                  monthNum === focusedMonth ? 'bg-emerald-50/30' : ''
                }`}
              >
                <KPIMonthCell
                  kpi={kpi}
                  entry={entry}
                  monthNumber={monthNum}
                  monthName={mName}
                  isFocused={monthNum === focusedMonth}
                  canEdit={canEditMonthly}
                  onEdit={() => onOpenMonthlyCell(kpi, monthNum, mName, entry)}
                />
              </td>
            );
          })
        ) : (
          <td className="p-0 border-r border-neutral-200 min-w-[100px] bg-emerald-50/20">
            <KPIMonthCell
              kpi={kpi}
              entry={getEntryForMonth(activeFocusMonth)}
              monthNumber={activeFocusMonth}
              monthName={MONTH_NAMES[activeFocusMonth - 1]}
              isFocused={true}
              canEdit={canEditMonthly}
              onEdit={() =>
                onOpenMonthlyCell(
                  kpi,
                  activeFocusMonth,
                  MONTH_NAMES[activeFocusMonth - 1],
                  getEntryForMonth(activeFocusMonth)
                )
              }
            />
          </td>
        )}

        {/* Action Column (#48: Direct Edit, Delete and More menu) */}
        <td className="py-2 px-2 whitespace-nowrap text-right sticky right-0 bg-white group-hover:bg-neutral-50/90 z-10 border-l border-neutral-200 min-w-[110px]">
          <div className="flex items-center justify-end gap-1">
            {canManageKPI ? (
              <>
                <button
                  onClick={() => onEditKPI(kpi)}
                  className="p-1.5 rounded-md text-neutral-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                  title="Edit KPI Definition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onDeleteKPI(kpi)}
                  className="p-1.5 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete KPI"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                onClick={() =>
                  onOpenMonthlyCell(
                    kpi,
                    activeFocusMonth,
                    MONTH_NAMES[activeFocusMonth - 1],
                    getEntryForMonth(activeFocusMonth)
                  )
                }
                className="p-1.5 rounded-md text-neutral-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                title="Enter Monthly Data"
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="relative inline-block text-left">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
                title="More Actions"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-36 bg-white rounded-md border border-neutral-200 shadow-md z-40 py-1 text-xs">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        if (onOpenDetails) {
                          onOpenDetails(kpi);
                        } else {
                          setIsExpanded(!isExpanded);
                        }
                      }}
                      className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-emerald-50 text-emerald-950 font-medium"
                    >
                      <Eye className="w-3 h-3 text-emerald-700" />
                      <span>View KPI Details Card</span>
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenMonthlyCell(
                          kpi,
                          activeFocusMonth,
                          MONTH_NAMES[activeFocusMonth - 1],
                          getEntryForMonth(activeFocusMonth)
                        );
                      }}
                      className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-neutral-50 text-neutral-700"
                    >
                      <Calendar className="w-3 h-3 text-neutral-500" />
                      <span>Monthly Input</span>
                    </button>

                    {canManageKPI && (
                      <>
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            onEditKPI(kpi);
                          }}
                          className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-neutral-50 text-neutral-700"
                        >
                          <Edit2 className="w-3 h-3 text-neutral-500" />
                          <span>Edit KPI</span>
                        </button>

                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            onDuplicateKPI(kpi);
                          }}
                          className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-neutral-50 text-neutral-700"
                        >
                          <Copy className="w-3 h-3 text-neutral-500" />
                          <span>Duplicate KPI</span>
                        </button>

                        <div className="border-t border-neutral-100 my-0.5" />

                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            onDeleteKPI(kpi);
                          }}
                          className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete KPI</span>
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </td>
      </tr>

      {/* Expanded Row Panel */}
      {isExpanded && (
        <tr>
<<<<<<< HEAD
          <td colSpan={showAllMonths ? 22 : 11} className="p-0">
=======
          <td colSpan={showAllMonths ? 23 : 12} className="p-0">
>>>>>>> 7ad21e9e5364190a0bafcdbe5ade16a66209227d
            <KPIExpandPanel
              kpi={kpi}
              monthlyEntries={monthlyEntries}
              selectedYear={selectedYear}
              isAdmin={isAdmin}
              onEditKPI={onEditKPI}
              onDeleteKPI={onDeleteKPI}
              onDuplicateKPI={onDuplicateKPI}
            />
          </td>
        </tr>
      )}
    </>
  );
};
