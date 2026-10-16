import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Inbox,
  RotateCcw,
} from 'lucide-react';
import { KPI, KPIMonthlyEntry, UserSession, Department } from '../../types';
import { KPIRow } from './KPIRow';

interface KPITableProps {
  kpis: KPI[];
  monthlyEntries: KPIMonthlyEntry[];
  selectedYear: number;
  focusedMonth: number | 'all';
  showAllMonths: boolean;
  session: UserSession;
  departments?: Department[];
  onEditKPI: (kpi: KPI) => void;
  onDuplicateKPI: (kpi: KPI) => void;
  onDeleteKPI: (kpi: KPI) => void;
  onOpenMonthlyCell: (
    kpi: KPI,
    month: number,
    monthName: string,
    entry?: KPIMonthlyEntry
  ) => void;
  onOpenDetails?: (kpi: KPI) => void;
  onAddKPI: () => void;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export interface ColumnWidths {
  dept: number;
  kra: number;
  mo: number;
  kpi: number;
  aligned: number;
  responsible: number;
  weight: number;
  datasource: number;
  base: number;
  target: number;
  month: number;
  actions: number;
}

const DEFAULT_WIDTHS: ColumnWidths = {
  dept: 150,
  kra: 130,
  mo: 160,
  kpi: 220,
  aligned: 140,
  responsible: 140,
  weight: 75,
  datasource: 120,
  base: 80,
  target: 85,
  month: 75,
  actions: 110,
};

const STORAGE_KEY = 'bitopi_kpi_table_col_widths_v2';

export const KPITable: React.FC<KPITableProps> = ({
  kpis,
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
  onAddKPI,
}) => {
  const isAdmin = session.role === 'admin';
  const totalWeight = kpis.reduce((acc, k) => acc + (k.weight || 0), 0);
  const uniqueDepts = new Set(kpis.map((k) => k.department_id).filter(Boolean));
  const isMultiDept = uniqueDepts.size > 1;

  // Column Widths with LocalStorage persistence
  const [colWidths, setColWidths] = useState<ColumnWidths>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...DEFAULT_WIDTHS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_WIDTHS;
  });

  // Calculate sticky left offsets dynamically
  const leftDept = 0;
  const leftKra = colWidths.dept;
  const leftMo = leftKra + colWidths.kra;
  const leftKpi = leftMo + colWidths.mo;

  // Resizing state
  const resizingRef = useRef<{
    colKey: keyof ColumnWidths;
    startX: number;
    startWidth: number;
  } | null>(null);

  const handleMouseDown = (e: React.MouseEvent, colKey: keyof ColumnWidths) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = {
      colKey,
      startX: e.clientX,
      startWidth: colWidths[colKey],
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingRef.current) return;
      const { colKey, startX, startWidth } = resizingRef.current;
      const deltaX = moveEvent.clientX - startX;
      const minWidth = colKey === 'weight' ? 55 : colKey === 'base' || colKey === 'target' || colKey === 'month' ? 60 : 80;
      const newWidth = Math.max(minWidth, Math.min(800, startWidth + deltaX));

      setColWidths((prev) => {
        const next = { ...prev, [colKey]: newWidth };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleResetWidths = () => {
    setColWidths(DEFAULT_WIDTHS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  if (kpis.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400 mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-900">No KPIs found</h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
          {isAdmin
            ? 'This scope does not have any KPIs configured yet. Click below to configure the first KPI.'
            : session.role === 'subsection'
            ? 'Your sub-section does not have any active KPIs configured yet. Click below to add your first KPI.'
            : 'No active KPIs configured for this view. KPIs are entered at the sub-section level or by administrator.'}
        </p>
        {isAdmin && (
          <button
            onClick={onAddKPI}
            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-colors hover:-translate-y-px active:translate-y-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAdmin ? 'Add KPI' : '+ Add Sub-section KPI'}</span>
          </button>
        )}
      </div>
    );
  }

  // Resizer handle component
  const Resizer = ({ colKey }: { colKey: keyof ColumnWidths }) => (
    <div
      onMouseDown={(e) => handleMouseDown(e, colKey)}
      className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-emerald-600/40 active:bg-emerald-700 transition-colors z-40 group flex items-center justify-center"
      title="Click and drag to resize column (এক্সেলের মতো টেনে ছোট/বড় করুন)"
    >
      <div className="w-[1px] h-3.5 bg-neutral-300 group-hover:bg-emerald-700" />
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-neutral-200/90 shadow-2xs overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="px-3 py-1.5 bg-neutral-50/70 border-b border-neutral-200 flex items-center justify-between text-[11px] text-neutral-500">
        <span className="flex items-center gap-1.5 font-medium text-neutral-600">
          ↔️ <span>এক্সেলের মতো কলামের প্রান্তে ধরে টেনে কলাম ছোট-বড় (Resize) করতে পারবেন</span>
        </span>
        <button
          onClick={handleResetWidths}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] text-neutral-600 hover:text-emerald-800 hover:bg-neutral-200/60 transition-colors cursor-pointer"
          title="Reset all column widths to default size"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Column Sizes</span>
        </button>
      </div>

      {/* Horizontally scrollable container with sticky header and columns */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse text-left min-w-[1250px] table-fixed">
          {/* Column definitions matching colWidths */}
          <colgroup>
            <col style={{ width: `${colWidths.dept}px` }} />
            <col style={{ width: `${colWidths.kra}px` }} />
            <col style={{ width: `${colWidths.mo}px` }} />
            <col style={{ width: `${colWidths.kpi}px` }} />
            <col style={{ width: `${colWidths.aligned}px` }} />
            <col style={{ width: `${colWidths.responsible}px` }} />
            <col style={{ width: `${colWidths.weight}px` }} />
            <col style={{ width: `${colWidths.datasource}px` }} />
            <col style={{ width: `${colWidths.base}px` }} />
            <col style={{ width: `${colWidths.target}px` }} />
            {showAllMonths ? (
              MONTH_NAMES.map((m) => (
                <col key={m} style={{ width: `${colWidths.month}px` }} />
              ))
            ) : (
              <col style={{ width: `${Math.max(100, colWidths.month * 1.3)}px` }} />
            )}
            <col style={{ width: `${colWidths.actions}px` }} />
          </colgroup>

          {/* Sticky Table Header */}
          <thead className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-semibold text-neutral-600 uppercase tracking-wider sticky top-0 z-30 select-none">
            <tr>
              {/* Sticky Col 1: Department */}
              <th
                style={{ left: `${leftDept}px`, width: `${colWidths.dept}px` }}
                className="sticky z-30 bg-neutral-50 py-2.5 px-2.5 border-r border-neutral-200 relative group truncate"
              >
                <span>Department</span>
                <Resizer colKey="dept" />
              </th>

              {/* Sticky Col 2: KRA */}
              <th
                style={{ left: `${leftKra}px`, width: `${colWidths.kra}px` }}
                className="sticky z-30 bg-neutral-50 py-2.5 px-3 border-r border-neutral-200 relative group truncate"
              >
                <span>KRA</span>
                <Resizer colKey="kra" />
              </th>

              {/* Sticky Col 3: MO */}
              <th
                style={{ left: `${leftMo}px`, width: `${colWidths.mo}px` }}
                className="sticky z-30 bg-neutral-50 py-2.5 px-3 border-r border-neutral-200 relative group truncate"
              >
                <span>MO</span>
                <Resizer colKey="mo" />
              </th>

              {/* Sticky Col 4: KPI */}
              <th
                style={{ left: `${leftKpi}px`, width: `${colWidths.kpi}px` }}
                className="sticky z-30 bg-neutral-50 py-2.5 px-3 border-r-2 border-neutral-300 relative group truncate shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]"
              >
                <span>KPI</span>
                <Resizer colKey="kpi" />
              </th>

              {/* Column: Aligned Goal No */}
              <th
                style={{ width: `${colWidths.aligned}px` }}
                className="py-2.5 px-2.5 border-r border-neutral-200 text-center relative group"
                title="Aligned With ORG./SBU(Factory)/Dept./Sec Goal No./Sub sec goal no."
              >
                <div className="leading-tight text-[10px] truncate">
                  <span>Aligned Goal No.</span>
                  <span className="block text-[8.5px] font-normal text-neutral-400 lowercase">org/sbu/dept/sec/sub</span>
                </div>
                <Resizer colKey="aligned" />
              </th>

              {/* Column 6: Responsible concern */}
              <th
                style={{ width: `${colWidths.responsible}px` }}
                className="py-2.5 px-2.5 border-r border-neutral-200 relative group truncate"
              >
                <span>Responsible concern</span>
                <Resizer colKey="responsible" />
              </th>

              {/* Column 7: Weight */}
              <th
                style={{ width: `${colWidths.weight}px` }}
                className="py-2.5 px-2.5 border-r border-neutral-200 text-right relative group truncate"
              >
                <span>Weight</span>
                <Resizer colKey="weight" />
              </th>

              {/* Column 8: Datasource */}
              <th
                style={{ width: `${colWidths.datasource}px` }}
                className="py-2.5 px-2.5 border-r border-neutral-200 relative group truncate"
              >
                <span>Datasource</span>
                <Resizer colKey="datasource" />
              </th>

              {/* Column 9: Base */}
              <th
                style={{ width: `${colWidths.base}px` }}
                className="py-2.5 px-2.5 border-r border-neutral-200 text-right relative group truncate"
              >
                <span>Base</span>
                <Resizer colKey="base" />
              </th>

              {/* Column 10: Target */}
              <th
                style={{ width: `${colWidths.target}px` }}
                className="py-2.5 px-2.5 border-r border-neutral-200 text-right relative group truncate"
              >
                <span>Target</span>
                <Resizer colKey="target" />
              </th>

              {/* Monthly Columns (Jan .. Dec) */}
              {showAllMonths ? (
                MONTH_NAMES.map((mName, idx) => (
                  <th
                    key={mName}
                    style={{ width: `${colWidths.month}px` }}
                    className={`py-2.5 px-2 border-r border-neutral-200 text-right relative group truncate ${
                      idx + 1 === focusedMonth
                        ? 'bg-emerald-100/60 text-emerald-950 font-bold'
                        : ''
                    }`}
                  >
                    <span>{mName}</span>
                    {idx === MONTH_NAMES.length - 1 && <Resizer colKey="month" />}
                  </th>
                ))
              ) : (
                <th
                  style={{ width: `${Math.max(100, colWidths.month * 1.3)}px` }}
                  className="py-2.5 px-3 border-r border-neutral-200 text-right relative group truncate bg-emerald-100/60 text-emerald-950 font-bold"
                >
                  <span>{typeof focusedMonth === 'number' ? `${MONTH_NAMES[focusedMonth - 1]} (Selected)` : 'Full Year'}</span>
                  <Resizer colKey="month" />
                </th>
              )}

              {/* Actions Header */}
              <th
                style={{ width: `${colWidths.actions}px` }}
                className="py-2.5 px-3 text-right sticky right-0 bg-neutral-50 z-30 border-l border-neutral-200 relative group truncate"
              >
                <span>Actions</span>
                <Resizer colKey="actions" />
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-neutral-200/70 bg-white">
            {kpis.map((kpi) => (
              <KPIRow
                key={kpi.id}
                kpi={kpi}
                monthlyEntries={monthlyEntries}
                selectedYear={selectedYear}
                focusedMonth={focusedMonth}
                showAllMonths={showAllMonths}
                session={session}
                departments={departments}
                onEditKPI={onEditKPI}
                onDuplicateKPI={onDuplicateKPI}
                onDeleteKPI={onDeleteKPI}
                onOpenMonthlyCell={onOpenMonthlyCell}
                onOpenDetails={onOpenDetails}
                leftOffsets={{
                  dept: leftDept,
                  kra: leftKra,
                  mo: leftMo,
                  kpi: leftKpi,
                }}
              />
            ))}
          </tbody>

          {/* Table Footer: Total Weight Allocation check */}
          <tfoot className="bg-neutral-50/90 border-t-2 border-neutral-200 text-xs text-neutral-700 font-medium">
            <tr>
              <td
                colSpan={6}
                style={{ width: `${leftKpi + colWidths.kpi + colWidths.aligned + colWidths.responsible}px` }}
                className="py-2.5 px-3 sticky left-0 z-20 bg-neutral-50/90 border-r-2 border-neutral-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-800">
                    {isMultiDept
                      ? `Organization Total (${kpis.length} KPIs across ${uniqueDepts.size} Departments)`
                      : `Total Department Weight Allocation (${kpis.length} KPIs)`}
                  </span>
                  {isMultiDept ? (
                    <span className="text-[11px] text-emerald-800 font-semibold">
                      ✓ All Departments overview active ({kpis.length} KPIs)
                    </span>
                  ) : totalWeight === 100 ? (
                    <span className="text-[11px] text-emerald-800 font-semibold">
                      ✓ Weight allocation complete (100%)
                    </span>
                  ) : totalWeight > 100 ? (
                    <span className="text-[11px] text-rose-700 font-semibold">
                      ⚠ Total weight exceeds 100% ({totalWeight}%)
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-700 font-medium">
                      ⚠ Total weight incomplete: {totalWeight}% ({100 - totalWeight}% unassigned)
                    </span>
                  )}
                </div>
              </td>
              <td className="py-2.5 px-2.5 text-right font-mono font-bold text-neutral-900 border-r border-neutral-200 tabular-nums">
                {totalWeight}%
              </td>
              <td colSpan={showAllMonths ? 15 : 4} className="py-2.5 px-3 text-neutral-400 text-[11px]">
                <span>All values evaluated in accordance with Bitopi Group KPI Governance.</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
