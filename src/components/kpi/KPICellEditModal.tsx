import React, { useState } from 'react';
import { KPI, KPIMonthlyEntry, KPIScoreStatus } from '../../types';
import { formatUnitValue, calculateEffectiveTarget } from '../../services/calculations';
import { X, Check, AlertCircle, Info, Calculator } from 'lucide-react';

interface KPICellEditModalProps {
  kpi: KPI;
  monthNumber: number;
  monthName: string;
  year: number;
  entry?: KPIMonthlyEntry;
  canEdit: boolean;
  onSave: (updatedEntry: Omit<KPIMonthlyEntry, 'id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
}

export const KPICellEditModal: React.FC<KPICellEditModalProps> = ({
  kpi,
  monthNumber,
  monthName,
  year,
  entry,
  canEdit,
  onSave,
  onClose,
}) => {
  const [achievementValue, setAchievementValue] = useState<string>(
    entry?.achievement_value !== null && entry?.achievement_value !== undefined
      ? entry.achievement_value.toString()
      : ''
  );
  const [status, setStatus] = useState<KPIScoreStatus>(entry?.status || 'Pending');
  const [remarks, setRemarks] = useState<string>(entry?.remarks || '');
  const [targetOverride, setTargetOverride] = useState<string>(
    entry?.monthly_target_override !== null && entry?.monthly_target_override !== undefined
      ? entry.monthly_target_override.toString()
      : ''
  );
  const [eligibleInput, setEligibleInput] = useState<string>(
    entry?.eligible_input !== null && entry?.eligible_input !== undefined
      ? entry.eligible_input.toString()
      : ''
  );
  const [error, setError] = useState<string | null>(null);

  // Compute live preview of effective target & performance
  const parsedOverride = targetOverride.trim() ? parseFloat(targetOverride) : null;
  const parsedEligible = eligibleInput.trim() ? parseFloat(eligibleInput) : null;
  const parsedAchievement = achievementValue.trim() ? parseFloat(achievementValue) : null;

  const effectiveTarget = (() => {
    const baseTarget = parsedOverride !== null ? parsedOverride : kpi.target_value;
    if (kpi.target_policy === 'workload_adjusted' && parsedEligible !== null) {
      return Math.min(baseTarget, parsedEligible);
    }
    return baseTarget;
  })();

  const previewPerformance = (() => {
    if (status === 'Pending' || status === 'No Input' || status === 'N/A') {
      return null;
    }
    if (parsedAchievement === 0) {
      return 0;
    }
    if (parsedAchievement === null || isNaN(parsedAchievement)) {
      return null;
    }
    if (effectiveTarget === 0) {
      return 100;
    }
    return Math.round((parsedAchievement / effectiveTarget) * 1000) / 10;
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (status === 'Completed' || status === 'Delayed') {
      if (achievementValue.trim() === '' || isNaN(Number(achievementValue))) {
        setError('Please enter a valid numeric achievement value for completed entries.');
        return;
      }
    }

    onSave({
      kpi_id: kpi.id,
      year,
      month: monthNumber,
      achievement_value: achievementValue.trim() ? Number(achievementValue) : null,
      achievement_unit: kpi.target_unit,
      status,
      remarks: remarks.trim(),
      monthly_target_override: parsedOverride,
      eligible_input: parsedEligible,
      effective_target: effectiveTarget,
      performance: previewPerformance,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-xs text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                {kpi.kpi_code}
              </span>
              <span className="text-xs font-semibold text-neutral-800">
                {monthName} {year} Achievement
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-1 line-clamp-1">{kpi.smart_kpi_text}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Reference Targets Grid */}
          <div className="grid grid-cols-2 gap-2 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/80">
            <div>
              <span className="text-[10px] text-neutral-500 block">Baseline (Reference)</span>
              <span className="font-mono text-neutral-800 font-medium">
                {formatUnitValue(kpi.baseline_value, kpi.baseline_unit)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block">Annual Target</span>
              <span className="font-mono font-bold text-emerald-800">
                {formatUnitValue(kpi.target_value, kpi.target_unit)}
              </span>
            </div>
          </div>

          {/* Status Selection (#56) */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
              Reporting Status
            </label>
            <select
              value={status}
              disabled={!canEdit}
              onChange={(e) => {
                const s = e.target.value as KPIScoreStatus;
                setStatus(s);
                if (s === 'Pending' || s === 'No Input' || s === 'N/A') {
                  setAchievementValue('');
                }
              }}
              className="w-full px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 disabled:bg-neutral-100"
            >
              <option value="Completed">Completed (Data Reported)</option>
              <option value="Delayed">Delayed (Reported with Variance / Delay)</option>
              <option value="Pending">Pending (Not reported yet — Excluded from scoring)</option>
              <option value="No Input">No Input (External dependency — Excluded / N/A)</option>
              <option value="N/A">N/A (Not Applicable)</option>
            </select>
          </div>

          {/* Achievement Value Input (#28, #30) */}
          {status !== 'Pending' && status !== 'No Input' && status !== 'N/A' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-neutral-700">
                  Achievement Value ({kpi.target_unit})
                </label>
                <span className="text-[10px] text-neutral-500">
                  Unit: {kpi.target_unit.replace('_', ' ')}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  disabled={!canEdit}
                  value={achievementValue}
                  onChange={(e) => setAchievementValue(e.target.value)}
                  placeholder={`e.g. ${kpi.target_value}`}
                  className="w-full px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-xs font-mono text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 disabled:bg-neutral-100"
                />
              </div>

              {/* Zero vs No Input Rule #37 Notice */}
              {achievementValue === '0' && (
                <p className="text-[10px] text-amber-700 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" />
                  <span>Rule: Reported zero against eligible work scores 0% (never N/A).</span>
                </p>
              )}
            </div>
          )}

          {/* Workload Adjusted policy fields (#38) */}
          {kpi.target_policy === 'workload_adjusted' && (
            <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 space-y-2">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-900">
                <Calculator className="w-3.5 h-3.5 text-amber-700" />
                <span>Workload Adjusted Target Policy</span>
              </div>
              <p className="text-[10px] text-amber-700 leading-tight">
                Effective Target = MIN(Monthly Target, Eligible Input). Used with management approval.
              </p>
              <div>
                <label className="block text-[10px] font-medium text-amber-800 mb-0.5">
                  Eligible Input / Workload Available
                </label>
                <input
                  type="number"
                  step="any"
                  disabled={!canEdit}
                  value={eligibleInput}
                  onChange={(e) => setEligibleInput(e.target.value)}
                  placeholder="e.g. 85"
                  className="w-full px-2 py-1 rounded border border-amber-300 bg-white text-xs font-mono text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* Live Calculation Preview (#33) */}
          <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-neutral-500 block">Effective Target</span>
              <span className="font-mono font-medium text-neutral-800">
                {formatUnitValue(effectiveTarget, kpi.target_unit)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-neutral-500 block">Calculated Performance</span>
              <span className="font-mono font-bold text-sm text-emerald-800">
                {previewPerformance !== null ? `${previewPerformance}%` : 'Excluded (N/A / Pending)'}
              </span>
            </div>
          </div>

          {/* Remarks (#30, #37) */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
              Remarks & Root Cause Analysis (RCA)
            </label>
            <textarea
              rows={2}
              disabled={!canEdit}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide comments, delay reasons, or operational notes..."
              className="w-full px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 disabled:bg-neutral-100 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors font-medium text-xs"
            >
              Cancel
            </button>
            {canEdit && (
              <button
                type="submit"
                className="px-4 py-1.5 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Achievement</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
