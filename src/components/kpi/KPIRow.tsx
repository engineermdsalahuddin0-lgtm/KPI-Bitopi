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
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

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
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = session.role === 'admin';
  const matchesScope =
    isAdmin ||
    (session.role === 'department' && session.departmentId === kpi.department_id) ||
    (session.role === 'section' &&
      session.departmentId === kpi.department_id &&
      (!kpi.section_id || kpi.section_id === session.sectionId)) ||
    (session.role === 'subsection' &&
      session.departmentId === kpi.department_id &&
      (!kpi.subsection_id || kpi.subsection_id === session.subsectionId));

  const canEditMonthly = matchesScope;
  const canManageKPI = matchesScope;

  const currentDept = departments?.find((d) => d.id === kpi.department_id);

  // Map month 1..12 to monthly entry
  const getEntryForMonth = (m: number) => {
    return monthlyEntries.find((e) => e.kpi_id === kpi.id && e.month === m);
  };

  const activeFocusMonth = typeof focusedMonth === 'number' ? focusedMonth : 1;

  return (
    <>
      <tr className="hover:bg-neutral-50/80 transition-colors border-b border-neutral-200/80 text-xs text-neutral-800 group">
        {/* Sticky Column 1: Expand + ID + Department Badge */}
        <td className="sticky left-0 z-20 bg-white group-hover:bg-neutral-50/90 py-2 px-2.5 whitespace-nowrap border-r border-neutral-200">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0.5 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
              title={isExpanded ? 'Collapse row details' : 'Expand row details'}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-600" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            <span className="font-mono font-semibold text-neutral-900 text-[11px] tracking-tight">
              {kpi.kpi_code}
            </span>
            {currentDept && (
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200 tracking-wider"
                title={`Department: ${currentDept.name} (${currentDept.short_code})`}
              >
                {currentDept.short_code}
              </span>
            )}
          </div>
        </td>

        {/* Sticky Column 2: KRA */}
        <td className="sticky left-[78px] z-20 bg-white group-hover:bg-neutral-50/90 py-2 px-3 whitespace-nowrap border-r border-neutral-200 font-medium text-neutral-900 min-w-[110px] max-w-[140px] truncate" title={kpi.kra}>
          {kpi.kra}
        </td>

        {/* Sticky Column 3: Major Objective (MO) */}
        <td className="sticky left-[198px] z-20 bg-white group-hover:bg-neutral-50/90 py-2 px-3 whitespace-nowrap border-r border-neutral-200 text-neutral-700 min-w-[140px] max-w-[180px] truncate" title={kpi.major_objective}>
          {kpi.major_objective}
        </td>

        {/* Sticky Column 4: KPI (Plain statement) with shadow delimiter */}
        <td className="sticky left-[348px] z-20 bg-white group-hover:bg-neutral-50/90 py-2 px-3 whitespace-nowrap border-r-2 border-neutral-300 text-neutral-900 font-medium min-w-[180px] max-w-[240px] truncate shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]" title={kpi.smart_kpi_text}>
          {kpi.smart_kpi_text}
        </td>

        {/* Column 5: Perspective */}
        <td className="py-2 px-2.5 whitespace-nowrap border-r border-neutral-200 text-neutral-600 text-[11px] min-w-[95px]">
          {kpi.perspective}
        </td>

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
                    focusedMonth,
                    MONTH_NAMES[focusedMonth - 1],
                    getEntryForMonth(focusedMonth)
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
                        setIsExpanded(!isExpanded);
                      }}
                      className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-neutral-50 text-neutral-700"
                    >
                      <Eye className="w-3 h-3 text-neutral-500" />
                      <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenMonthlyCell(
                          kpi,
                          focusedMonth,
                          MONTH_NAMES[focusedMonth - 1],
                          getEntryForMonth(focusedMonth)
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
          <td colSpan={showAllMonths ? 23 : 12} className="p-0">
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
