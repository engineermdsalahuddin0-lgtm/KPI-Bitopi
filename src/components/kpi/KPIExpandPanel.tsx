import React from 'react';
import { KPI, KPIMonthlyEntry } from '../../types';
import { formatUnitValue } from '../../services/calculations';
import { CheckCircle2, Clock, FileText, Database, Users, Target, ShieldCheck } from 'lucide-react';

interface KPIExpandPanelProps {
  kpi: KPI;
  monthlyEntries: KPIMonthlyEntry[];
  selectedYear: number;
  isAdmin?: boolean;
  onEditKPI?: (kpi: KPI) => void;
  onDeleteKPI?: (kpi: KPI) => void;
  onDuplicateKPI?: (kpi: KPI) => void;
}

export const KPIExpandPanel: React.FC<KPIExpandPanelProps> = ({
  kpi,
  monthlyEntries,
  selectedYear,
  isAdmin = true,
  onEditKPI,
  onDeleteKPI,
  onDuplicateKPI,
}) => {
  return (
    <div className="bg-neutral-50/80 border-t border-b border-neutral-200 px-4 py-3.5 text-xs text-neutral-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: Objectives & Alignment */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-neutral-900 font-semibold text-[11px] uppercase tracking-wider">
            <Target className="w-3.5 h-3.5 text-emerald-700" />
            <span>Strategic Alignment & Scope</span>
          </div>

          <div>
            <span className="text-[11px] text-neutral-500 font-medium">Aligned with ORG Goal:</span>
            <div className="text-neutral-900 font-medium mt-0.5">
              {kpi.aligned_org_goal_label || 'Department Goal'}
              <span className="text-[10px] text-neutral-500 ml-1.5 uppercase font-mono">
                ({kpi.aligned_org_goal_level})
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-neutral-500 font-medium">Major Objective (MO):</span>
            <div className="text-neutral-900 mt-0.5">{kpi.major_objective}</div>
          </div>

          <div>
            <span className="text-[11px] text-neutral-500 font-medium">Full KPI Statement:</span>
            <div className="text-neutral-900 font-medium mt-0.5 bg-white p-2 rounded border border-neutral-200/80">
              {kpi.smart_kpi_text}
            </div>
          </div>
        </div>

        {/* Column 2: SMART Breakdown & Target Policy */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-neutral-900 font-semibold text-[11px] uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>SMART Formulation & Measurement</span>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded border border-neutral-200/80">
            <div>
              <span className="text-[10px] text-neutral-500 block">Baseline (Reference)</span>
              <span className="font-mono font-medium text-neutral-900">
                {formatUnitValue(kpi.baseline_value, kpi.baseline_unit)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block">Annual Target</span>
              <span className="font-mono font-bold text-emerald-800">
                {formatUnitValue(kpi.target_value, kpi.target_unit)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block">Perspective</span>
              <span className="font-medium text-neutral-900">{kpi.perspective}</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block">Target Policy</span>
              <span className="font-medium text-neutral-900">
                {kpi.target_policy === 'workload_adjusted' ? 'Workload Adjusted' : 'Fixed Target'}
              </span>
            </div>
          </div>

          {kpi.specific_s && (
            <div className="text-[11px] text-neutral-600 space-y-1">
              <div>
                <strong className="text-neutral-800">S (Specific):</strong> {kpi.specific_s}
              </div>
              {kpi.measure_m && (
                <div>
                  <strong className="text-neutral-800">M (Measure):</strong> {kpi.measure_m}
                </div>
              )}
              {kpi.time_t && (
                <div>
                  <strong className="text-neutral-800">T (Time-bound):</strong> {kpi.time_t}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Column 3: Ownership, Datasource & Requirements */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-neutral-900 font-semibold text-[11px] uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ownership & Requirements</span>
          </div>

          <div>
            <span className="text-[11px] text-neutral-500 font-medium">Responsible Concern:</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {kpi.responsible_concern.map((person, idx) => (
                <span
                  key={idx}
                  className="bg-white border border-neutral-300 px-2 py-0.5 rounded text-[11px] text-neutral-800 font-medium"
                >
                  {person}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] text-neutral-500 font-medium">Datasource:</span>
            <div className="text-neutral-900 flex items-center gap-1 mt-0.5">
              <Database className="w-3 h-3 text-neutral-400" />
              <span>{kpi.datasource || 'Department Standard Report'}</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-neutral-500 font-medium">Operational Requirements:</span>
            <p className="text-neutral-700 mt-0.5 bg-white p-2 rounded border border-neutral-200/80 leading-relaxed text-[11px]">
              {kpi.requirements || 'Standard line operation protocols and daily report tracking.'}
            </p>
          </div>
        </div>
      </div>

      {/* Row Action Footer Bar */}
      {isAdmin && (
        <div className="mt-3.5 pt-3 border-t border-neutral-200/80 flex items-center justify-between">
          <div className="text-[11px] text-neutral-500">
            KPI Code: <span className="font-mono font-semibold text-neutral-800">{kpi.kpi_code}</span> · Weight: <span className="font-mono font-semibold text-neutral-800">{kpi.weight}%</span>
          </div>
          <div className="flex items-center gap-2">
            {onDuplicateKPI && (
              <button
                onClick={() => onDuplicateKPI(kpi)}
                className="px-2.5 py-1 text-xs font-medium rounded border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 transition-colors"
              >
                Duplicate KPI
              </button>
            )}
            {onEditKPI && (
              <button
                onClick={() => onEditKPI(kpi)}
                className="px-3 py-1 text-xs font-semibold rounded bg-neutral-900 hover:bg-neutral-800 text-white transition-colors"
              >
                Edit KPI Definition
              </button>
            )}
            {onDeleteKPI && (
              <button
                onClick={() => onDeleteKPI(kpi)}
                className="px-3 py-1 text-xs font-semibold rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
              >
                Delete KPI
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
