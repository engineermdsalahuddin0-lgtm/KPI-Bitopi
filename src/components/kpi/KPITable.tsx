import React from 'react';
import { KPI, KPIMonthlyEntry, UserSession, Department } from '../../types';
import { KPIRow } from './KPIRow';
import { Plus, Inbox } from 'lucide-react';

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
  onOpenMonthlyCell: (kpi: KPI, month: number, monthName: string, entry?: KPIMonthlyEntry) => void;
  onAddKPI: () => void;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

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
  onAddKPI,
}) => {
  const isAdmin = session.role === 'admin';
  const totalWeight = kpis.reduce((acc, k) => acc + (k.weight || 0), 0);
  const uniqueDepts = new Set(kpis.map((k) => k.department_id));
  const isMultiDept = uniqueDepts.size > 1;

  if (kpis.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400 mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-900">No KPIs found</h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
          {isAdmin
            ? 'This department or filter selection does not have any KPIs configured yet. Click below to add the first KPI.'
            : 'Your department does not have any active KPIs configured yet. Click below to add your department\'s first KPI.'}
        </p>
        <button
          onClick={onAddKPI}
          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-colors hover:-translate-y-px active:translate-y-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAdmin ? 'Add KPI' : 'Add Department KPI'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200/90 shadow-2xs overflow-hidden flex flex-col">
      {/* Horizontally scrollable container with sticky header and columns */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse text-left min-w-[1250px]">
          {/* Sticky Table Header (#16, #17) */}
          <thead className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-semibold text-neutral-600 uppercase tracking-wider sticky top-0 z-30 select-none">
            <tr>
              {/* Sticky Col 1: ID */}
              <th className="sticky left-0 z-30 bg-neutral-50 py-2.5 px-2.5 border-r border-neutral-200 min-w-[78px]">
                ID
              </th>

              {/* Sticky Col 2: KRA */}
              <th className="sticky left-[78px] z-30 bg-neutral-50 py-2.5 px-3 border-r border-neutral-200 min-w-[120px]">
                KRA
              </th>

              {/* Sticky Col 3: MO */}
              <th className="sticky left-[198px] z-30 bg-neutral-50 py-2.5 px-3 border-r border-neutral-200 min-w-[150px]">
                MO
              </th>

              {/* Sticky Col 4: KPI */}
              <th className="sticky left-[348px] z-30 bg-neutral-50 py-2.5 px-3 border-r-2 border-neutral-300 min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                KPI
              </th>

              {/* Column 5: Perspective */}
              <th className="py-2.5 px-2.5 border-r border-neutral-200 min-w-[100px]">
                Perspective
              </th>

              {/* Column 6: Responsible concern */}
              <th className="py-2.5 px-2.5 border-r border-neutral-200 min-w-[140px]">
                Responsible concern
              </th>

              {/* Column 7: Weight */}
              <th className="py-2.5 px-2.5 border-r border-neutral-200 text-right min-w-[70px]">
                Weight
              </th>

              {/* Column 8: Datasource */}
              <th className="py-2.5 px-2.5 border-r border-neutral-200 min-w-[120px]">
                Datasource
              </th>

              {/* Column 9: Base */}
              <th className="py-2.5 px-2.5 border-r border-neutral-200 text-right min-w-[75px]">
                Base
              </th>

              {/* Column 10: Target */}
              <th className="py-2.5 px-2.5 border-r border-neutral-200 text-right min-w-[80px]">
                Target
              </th>

              {/* Monthly Columns (Jan .. Dec) */}
              {showAllMonths ? (
                MONTH_NAMES.map((mName, idx) => (
                  <th
                    key={mName}
                    className={`py-2.5 px-2 border-r border-neutral-200 text-right min-w-[70px] ${
                      idx + 1 === focusedMonth
                        ? 'bg-emerald-100/60 text-emerald-950 font-bold'
                        : ''
                    }`}
                  >
                    {mName}
                  </th>
                ))
              ) : (
                <th className="py-2.5 px-3 border-r border-neutral-200 text-right min-w-[100px] bg-emerald-100/60 text-emerald-950 font-bold">
                  {typeof focusedMonth === 'number' ? `${MONTH_NAMES[focusedMonth - 1]} (Selected)` : 'Full Year'}
                </th>
              )}

              {/* Actions Header (#48) */}
              <th className="py-2.5 px-3 text-right sticky right-0 bg-neutral-50 z-30 border-l border-neutral-200 min-w-[110px]">
                Actions
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
              />
            ))}
          </tbody>

          {/* Table Footer: Total Weight Allocation check (#24) */}
          <tfoot className="bg-neutral-50/90 border-t-2 border-neutral-200 text-xs text-neutral-700 font-medium">
            <tr>
              <td
                colSpan={6}
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
