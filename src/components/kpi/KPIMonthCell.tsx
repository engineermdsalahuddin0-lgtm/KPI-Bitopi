import React from 'react';
import { KPI, KPIMonthlyEntry } from '../../types';
import { calculateEntryPerformance, formatUnitValue } from '../../services/calculations';

interface KPIMonthCellProps {
  kpi: KPI;
  entry?: KPIMonthlyEntry;
  monthNumber: number;
  monthName: string;
  isFocused?: boolean;
  canEdit: boolean;
  onEdit: () => void;
}

export const KPIMonthCell: React.FC<KPIMonthCellProps> = ({
  kpi,
  entry,
  monthName,
  isFocused = false,
  canEdit,
  onEdit,
}) => {
  const result = calculateEntryPerformance(kpi, entry);

  // Status visual cues with high legibility & anti-slop restraint
  let statusText = '—';
  let badgeStyle = 'text-neutral-600 hover:text-neutral-700';

  if (!entry || entry.status === 'Pending') {
    statusText = 'Pending';
    badgeStyle = 'text-neutral-600';
  } else if (entry.status === 'No Input' || entry.status === 'N/A') {
    statusText = 'N/A';
    badgeStyle = 'text-neutral-600 italic';
  } else if (result.performance !== null) {
    statusText = formatUnitValue(entry.achievement_value, kpi.target_unit);

    if (result.performance >= 100) {
      badgeStyle = 'text-emerald-800 font-semibold';
    } else if (result.performance >= 85) {
      badgeStyle = 'text-neutral-900 font-medium';
    } else if (entry.status === 'Delayed') {
      badgeStyle = 'text-amber-800 font-medium';
    } else {
      badgeStyle = 'text-rose-800 font-medium';
    }
  }

  return (
    <button
      onClick={onEdit}
      title={`${monthName}: ${statusText} (Click to ${canEdit ? 'edit achievement' : 'view details'})`}
      className={`w-full h-full min-h-[38px] px-2 py-1.5 flex flex-col justify-center items-end text-right transition-colors group relative ${
        isFocused ? 'bg-emerald-50/50' : 'hover:bg-neutral-100/70'
      } ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-center gap-1 font-mono text-xs tabular-nums leading-tight">
        <span className={badgeStyle}>{statusText}</span>
      </div>

      {result.isScored && result.performance !== null && (
        <span className="text-[10px] text-neutral-600 font-mono tabular-nums leading-none mt-0.5">
          {result.performance}%
        </span>
      )}
    </button>
  );
};
