import React from 'react';
import { KPI, KPIMonthlyEntry, Department } from '../../types';
import { formatUnitValue } from '../../services/calculations';
import {
  X,
  Target,
  Sparkles,
  Layers,
  Database,
  Users,
  Calendar,
  Building2,
  Scale,
  Award,
  CheckCircle2,
  FileText,
  Clock,
  Compass,
} from 'lucide-react';

interface KPIDetailsModalProps {
  kpi: KPI | null;
  isOpen: boolean;
  onClose: () => void;
  monthlyEntries?: KPIMonthlyEntry[];
  selectedYear?: number;
  departments?: Department[];
  onEdit?: (kpi: KPI) => void;
  onOpenMonthly?: (kpi: KPI) => void;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const KPIDetailsModal: React.FC<KPIDetailsModalProps> = ({
  kpi,
  isOpen,
  onClose,
  monthlyEntries = [],
  selectedYear = new Date().getFullYear(),
  departments = [],
  onEdit,
  onOpenMonthly,
}) => {
  if (!isOpen || !kpi) return null;

  const currentDept = departments.find((d) => d.id === kpi.department_id);
  const kpiEntries = monthlyEntries.filter((e) => e.kpi_id === kpi.id);

  // Calculate year-to-date average or latest score
  const scoredEntries = kpiEntries.filter(
    (e) => typeof e.performance === 'number' && !isNaN(e.performance)
  );
  const avgScore =
    scoredEntries.length > 0
      ? (
          scoredEntries.reduce((acc, cur) => acc + (cur.performance || 0), 0) /
          scoredEntries.length
        ).toFixed(1)
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header Banner */}
        <div className="px-6 py-4 border-b border-neutral-200 bg-linear-to-r from-neutral-50 via-emerald-50/40 to-neutral-50 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-mono font-bold text-sm shadow-sm shrink-0">
              {kpi.kpi_code}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
                  {kpi.kpi_code}
                </span>
                {currentDept && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300">
                    🏢 {currentDept.name} ({currentDept.short_code})
                  </span>
                )}
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 uppercase tracking-wider">
                  Level: {kpi.aligned_org_goal_level || 'department'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Weight: {kpi.weight}%
                </span>
              </div>
              <h2 className="text-base font-bold text-neutral-900 tracking-tight leading-snug">
                {kpi.smart_kpi_text}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-neutral-700">
          {/* Card 1: KRA (Key Result Area) Highlight Card */}
          <div className="bg-linear-to-r from-emerald-50 via-teal-50/50 to-emerald-50/30 rounded-xl p-4 border border-emerald-200/90 shadow-2xs">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs uppercase tracking-wider mb-1.5">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>Key Result Area (KRA)</span>
            </div>
            <div className="text-base font-bold text-emerald-950 bg-white/90 px-3.5 py-2 rounded-lg border border-emerald-300/80 shadow-2xs">
              {kpi.kra || 'General Result Area'}
            </div>
            <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-emerald-900/90 gap-1">
              <div>
                <span className="font-semibold">Major Objective (MO):</span> {kpi.major_objective}
              </div>
              <div>
                <span className="font-semibold">Aligned Goal:</span> {kpi.aligned_org_goal_label || 'Department Goal'}
<<<<<<< HEAD
                {kpi.aligned_goal_no && (
                  <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white shadow-2xs">
                    Goal #{kpi.aligned_goal_no}
                  </span>
                )}
=======
>>>>>>> 7ad21e9e5364190a0bafcdbe5ade16a66209227d
              </div>
            </div>
          </div>

          {/* Grid of Details Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 2: Targets & Policy */}
            <div className="bg-neutral-50/70 rounded-xl p-4 border border-neutral-200 space-y-3">
              <div className="flex items-center gap-2 text-neutral-900 font-bold text-xs uppercase tracking-wider">
                <Target className="w-4 h-4 text-emerald-700" />
                <span>Target & Baseline</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
                  <span className="text-[10px] text-neutral-500 block">Baseline Value</span>
                  <span className="font-mono font-semibold text-neutral-800 text-sm">
                    {formatUnitValue(kpi.baseline_value, kpi.baseline_unit)}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-neutral-500 block">Annual Target</span>
                  <span className="font-mono font-bold text-emerald-900 text-sm">
                    {formatUnitValue(kpi.target_value, kpi.target_unit)}
                  </span>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-neutral-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-neutral-500 font-medium">Perspective:</span>
                  <span className="font-semibold text-neutral-800">{kpi.perspective}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-neutral-500 font-medium">Target Policy:</span>
                  <span className="font-semibold text-neutral-800 capitalize">
                    {kpi.target_policy === 'workload_adjusted' ? 'Workload Adjusted' : 'Fixed'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-neutral-500 font-medium">Assigned Weight:</span>
                  <span className="font-mono font-bold text-emerald-800">{kpi.weight}%</span>
                </div>
              </div>
            </div>

            {/* Card 3: Ownership & Governance */}
            <div className="bg-neutral-50/70 rounded-xl p-4 border border-neutral-200 space-y-3">
              <div className="flex items-center gap-2 text-neutral-900 font-bold text-xs uppercase tracking-wider">
                <Users className="w-4 h-4 text-emerald-700" />
                <span>Ownership & Concern</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 block mb-1.5 font-medium">
                  Responsible Concern (Designations):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {kpi.responsible_concern.map((role: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-white border border-neutral-300 px-2.5 py-1 rounded-md text-neutral-800 font-semibold shadow-2xs"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
                <span className="text-[10px] text-neutral-500 block font-medium">
                  Datasource (তথ্যসূত্র):
                </span>
                <div className="flex items-center gap-1.5 mt-1 text-neutral-900 font-medium">
                  <Database className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>{kpi.datasource ? kpi.datasource : <span className="text-neutral-400 italic">No specific datasource defined</span>}</span>
                </div>
              </div>
            </div>

            {/* Card 4: SMART Breakdown */}
            <div className="bg-neutral-50/70 rounded-xl p-4 border border-neutral-200 space-y-3">
              <div className="flex items-center gap-2 text-neutral-900 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>SMART Formulation</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-neutral-200 space-y-2 text-[11px]">
                <div>
                  <span className="font-semibold text-neutral-800 block">S (Specific):</span>
                  <span className="text-neutral-600">{kpi.specific_s || kpi.smart_kpi_text}</span>
                </div>
                {kpi.measure_m && (
                  <div>
                    <span className="font-semibold text-neutral-800 block">M (Measurable):</span>
                    <span className="text-neutral-600">{kpi.measure_m}</span>
                  </div>
                )}
                {kpi.time_t && (
                  <div>
                    <span className="font-semibold text-neutral-800 block">T (Time-bound):</span>
                    <span className="text-neutral-600">{kpi.time_t}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 5: Operational Requirements */}
          {kpi.requirements && (
            <div className="bg-white rounded-xl p-4 border border-neutral-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-neutral-900 text-xs uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-neutral-500" />
                <span>Operational Requirements & Line Execution</span>
              </div>
              <p className="text-neutral-700 leading-relaxed text-xs bg-neutral-50/70 p-3 rounded-lg border border-neutral-200/80">
                {kpi.requirements}
              </p>
            </div>
          )}

          {/* Card 6: Monthly Performance Matrix Preview */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-neutral-900 text-xs uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>Monthly Tracking ({selectedYear})</span>
              </div>
              {avgScore && (
                <div className="text-[11px] font-semibold text-neutral-600">
                  YTD Avg Score: <span className="font-bold text-emerald-800 font-mono text-xs">{avgScore}%</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5 text-center">
              {MONTH_NAMES.map((mName, idx) => {
                const monthNum = idx + 1;
                const entry = kpiEntries.find((e) => e.month === monthNum);
                const hasScore = typeof entry?.performance === 'number';
                return (
                  <div
                    key={monthNum}
                    className={`p-1.5 rounded-lg border text-center transition-all ${
                      hasScore
                        ? entry!.performance! >= 90
                          ? 'bg-emerald-50 border-emerald-300'
                          : entry!.performance! >= 70
                          ? 'bg-amber-50 border-amber-300'
                          : 'bg-rose-50 border-rose-300'
                        : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-neutral-600 block">{mName}</span>
                    <span
                      className={`text-xs font-mono font-bold block mt-0.5 ${
                        hasScore
                          ? entry!.performance! >= 90
                            ? 'text-emerald-800'
                            : entry!.performance! >= 70
                            ? 'text-amber-800'
                            : 'text-rose-800'
                          : 'text-neutral-400'
                      }`}
                    >
                      {hasScore ? `${entry!.performance}%` : '—'}
                    </span>
                    <span className="text-[9px] text-neutral-500 block truncate">
                      {typeof entry?.achievement_value === 'number'
                        ? formatUnitValue(entry.achievement_value, kpi.target_unit)
                        : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between gap-3">
          <div className="text-[11px] text-neutral-500">
            KPI ID: <span className="font-mono text-neutral-700">{kpi.id}</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenMonthly && (
              <button
                onClick={() => {
                  onClose();
                  onOpenMonthly(kpi);
                }}
                className="px-3.5 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 font-semibold text-xs transition-colors shadow-2xs"
              >
                Monthly Data Input
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(kpi);
                }}
                className="px-4 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-colors shadow-2xs"
              >
                Edit KPI Definition
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-medium text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
