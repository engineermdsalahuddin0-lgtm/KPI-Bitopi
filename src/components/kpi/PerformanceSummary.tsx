import React from 'react';
import { DepartmentSummaryMetrics } from '../../types';
import { HelpCircle } from 'lucide-react';

interface PerformanceSummaryProps {
  metrics: DepartmentSummaryMetrics;
  selectedMonthName: string;
  selectedYear: number;
  departmentName?: string;
}

export const PerformanceSummary: React.FC<PerformanceSummaryProps> = ({
  metrics,
  selectedMonthName,
  selectedYear,
  departmentName,
}) => {
  return (
    <div className="bg-white border border-neutral-200/90 rounded-lg p-3 sm:p-4 mb-4 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Left: Summary Title & Subtitle */}
        <div className="min-w-44">
          <div className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
            Performance Summary
          </div>
          <div className="text-xs text-neutral-600 mt-0.5 font-medium">
            {departmentName ? `${departmentName} · ` : ''}
            <span className="text-neutral-900 font-semibold">{selectedMonthName} {selectedYear}</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1.5">
            <span>{metrics.totalKPIs} KPIs</span>
            <span>·</span>
            <span className="text-emerald-700 font-medium">{metrics.completedEntriesCount} scored</span>
            {metrics.pendingEntriesCount > 0 && (
              <>
                <span>·</span>
                <span className="text-amber-700 font-medium">{metrics.pendingEntriesCount} pending</span>
              </>
            )}
            {metrics.noInputEntriesCount > 0 && (
              <>
                <span>·</span>
                <span className="text-neutral-600">{metrics.noInputEntriesCount} N/A</span>
              </>
            )}
          </div>
        </div>

        {/* Right: 4 Compact Metrics Cards (#15, #34, #35) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 flex-1 lg:max-w-3xl">
          {/* Card 1: Overall Performance */}
          <div className="bg-neutral-50/70 border border-neutral-200/70 rounded-md px-3 py-2 flex flex-col justify-center">
            <div className="text-[10px] font-medium text-neutral-500 flex items-center justify-between">
              <span>Overall Performance</span>
              <span className="text-[10px] text-neutral-400">weighted</span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-mono tracking-tight text-neutral-900 tabular-nums">
                {metrics.overallPerformance > 0 ? `${metrics.overallPerformance}%` : '—'}
              </span>
            </div>
          </div>

          {/* Card 2: Coverage */}
          <div className="bg-neutral-50/70 border border-neutral-200/70 rounded-md px-3 py-2 flex flex-col justify-center">
            <div className="text-[10px] font-medium text-neutral-500 flex items-center gap-1">
              <span>Coverage</span>
              <span
                title="Coverage = Scored Weight / Assigned Department Weight. Performance reflects only KPI weight with valid scored data."
                className="cursor-help text-neutral-400 hover:text-neutral-600"
              >
                <HelpCircle className="w-2.5 h-2.5" />
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className={`text-xl font-bold font-mono tracking-tight tabular-nums ${
                  metrics.coverage >= 90
                    ? 'text-emerald-700'
                    : metrics.coverage >= 70
                    ? 'text-amber-700'
                    : 'text-neutral-800'
                }`}
              >
                {metrics.coverage}%
              </span>
            </div>
          </div>

          {/* Card 3: Assigned Weight */}
          <div className="bg-neutral-50/70 border border-neutral-200/70 rounded-md px-3 py-2 flex flex-col justify-center">
            <div className="text-[10px] font-medium text-neutral-500 flex items-center justify-between">
              <span>Assigned Weight</span>
              <span className="text-[10px] text-neutral-400">
                {departmentName && !departmentName.includes('All') ? 'dept total' : 'total'}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-mono tracking-tight text-neutral-900 tabular-nums">
                {metrics.assignedWeight}%
              </span>
              {departmentName && !departmentName.includes('All') ? (
                metrics.assignedWeight === 100 ? (
                  <span className="text-[10px] text-emerald-700 font-medium">✓ 100%</span>
                ) : (
                  <span className="text-[10px] text-amber-600 font-medium">
                    {Math.max(0, 100 - metrics.assignedWeight)}% unallocated
                  </span>
                )
              ) : (
                <span className="text-[10px] text-emerald-700 font-medium">across depts</span>
              )}
            </div>
          </div>

          {/* Card 4: Scored Weight */}
          <div className="bg-neutral-50/70 border border-neutral-200/70 rounded-md px-3 py-2 flex flex-col justify-center">
            <div className="text-[10px] font-medium text-neutral-500 flex items-center justify-between">
              <span>Scored Weight</span>
              <span className="text-[10px] text-neutral-400">active</span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-mono tracking-tight text-neutral-900 tabular-nums">
                {metrics.scoredWeight}%
              </span>
              <span className="text-[10px] text-neutral-400 tabular-nums">/ {metrics.assignedWeight}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
