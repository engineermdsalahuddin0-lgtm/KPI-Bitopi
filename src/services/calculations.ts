import { KPI, KPIMonthlyEntry, UnitType, DepartmentSummaryMetrics } from '../types';

/**
 * Format any number with its respective unit type
 * Requirement #58:
 * Percentage → 90%
 * Day → 12 days
 * Currency → ৳250,000
 * Number → 125
 * Unit → 125 units
 */
export function formatUnitValue(value: number | null | undefined, unit: UnitType): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  // Format number cleanly with comma separators if large
  const formattedNum = Number.isInteger(value)
    ? value.toLocaleString('en-US')
    : Number(value.toFixed(1)).toLocaleString('en-US');

  switch (unit) {
    case 'percentage':
      return `${formattedNum}%`;
    case 'day':
      return `${formattedNum} ${value === 1 ? 'day' : 'days'}`;
    case 'currency_bdt':
      return `৳${formattedNum}`;
    case 'unit':
      return `${formattedNum} units`;
    case 'number':
    default:
      return `${formattedNum}`;
  }
}

/**
 * Calculate effective target according to Target Policy (#38):
 * - Fixed: uses KPI Target (or Monthly Target Override if set)
 * - Workload Adjusted: MIN(Monthly Target, Eligible Input) (used with management approval)
 */
export function calculateEffectiveTarget(kpi: KPI, entry?: KPIMonthlyEntry | null): number {
  const baseTarget = entry?.monthly_target_override ?? kpi.target_value;

  if (kpi.target_policy === 'workload_adjusted' && entry?.eligible_input !== null && entry?.eligible_input !== undefined) {
    return Math.min(baseTarget, entry.eligible_input);
  }

  return baseTarget;
}

/**
 * Calculate performance for a specific month entry according to rules #33, #36, #37:
 * - Pending: excluded (null)
 * - No Input / N/A: excluded (null)
 * - Achievement 0: scores 0%
 * - Standard: Performance = Achievement / Effective Target
 */
export function calculateEntryPerformance(kpi: KPI, entry?: KPIMonthlyEntry | null): {
  performance: number | null;
  effectiveTarget: number;
  isScored: boolean;
  statusLabel: string;
} {
  const effectiveTarget = calculateEffectiveTarget(kpi, entry);

  if (!entry || entry.status === 'Pending') {
    return {
      performance: null,
      effectiveTarget,
      isScored: false,
      statusLabel: 'Pending',
    };
  }

  if (entry.status === 'No Input' || entry.status === 'N/A') {
    return {
      performance: null,
      effectiveTarget,
      isScored: false,
      statusLabel: 'N/A',
    };
  }

  // If achievement is zero against eligible work -> scores 0% (#37)
  if (entry.achievement_value === 0) {
    return {
      performance: 0,
      effectiveTarget,
      isScored: true,
      statusLabel: '0%',
    };
  }

  if (entry.achievement_value === null || entry.achievement_value === undefined) {
    return {
      performance: null,
      effectiveTarget,
      isScored: false,
      statusLabel: 'Pending',
    };
  }

  if (effectiveTarget === 0) {
    return {
      performance: 100,
      effectiveTarget,
      isScored: true,
      statusLabel: '100%',
    };
  }

  const rawPerf = (entry.achievement_value / effectiveTarget) * 100;
  const roundedPerf = Math.round(rawPerf * 10) / 10;

  return {
    performance: roundedPerf,
    effectiveTarget,
    isScored: true,
    statusLabel: `${roundedPerf}%`,
  };
}

/**
 * Calculate Department Summary Metrics for a specific year and month (or Full Year 'all') (#34, #35):
 * - Assigned Weight: SUM(department KPI weights)
 * - Scored Weight: SUM(weights of KPIs with valid scored entries)
 * - Weighted Performance: SUM(Performance * Weight) / Scored Weight
 * - Coverage: Scored Weight / Assigned Weight
 */
export function calculateDepartmentSummary(
  kpis: KPI[],
  monthlyEntries: KPIMonthlyEntry[],
  selectedYear: number,
  selectedMonth: number | 'all'
): DepartmentSummaryMetrics {
  const assignedWeight = kpis.reduce((acc, k) => acc + (k.weight || 0), 0);

  let totalWeightedScoreSum = 0;
  let scoredWeightSum = 0;
  let completedEntriesCount = 0;
  let pendingEntriesCount = 0;
  let noInputEntriesCount = 0;

  if (selectedMonth === 'all') {
    // Annual aggregate calculation across all 12 months
    for (const kpi of kpis) {
      const yearEntries = monthlyEntries.filter(
        (e) => e.kpi_id === kpi.id && e.year === selectedYear
      );

      let kpiScoresSum = 0;
      let kpiScoredMonthsCount = 0;

      for (let m = 1; m <= 12; m++) {
        const entry = yearEntries.find((e) => e.month === m);
        const perfResult = calculateEntryPerformance(kpi, entry);

        if (perfResult.isScored && perfResult.performance !== null) {
          kpiScoresSum += perfResult.performance;
          kpiScoredMonthsCount++;
          completedEntriesCount++;
        } else if (entry?.status === 'No Input' || entry?.status === 'N/A') {
          noInputEntriesCount++;
        } else {
          pendingEntriesCount++;
        }
      }

      if (kpiScoredMonthsCount > 0) {
        const avgKpiPerformance = kpiScoresSum / kpiScoredMonthsCount;
        scoredWeightSum += kpi.weight;
        totalWeightedScoreSum += avgKpiPerformance * (kpi.weight / 100);
      }
    }
  } else {
    // Specific month calculation
    for (const kpi of kpis) {
      const entry = monthlyEntries.find(
        (e) => e.kpi_id === kpi.id && e.year === selectedYear && e.month === selectedMonth
      );

      const perfResult = calculateEntryPerformance(kpi, entry);

      if (perfResult.isScored && perfResult.performance !== null) {
        scoredWeightSum += kpi.weight;
        // Weighted Score = Performance * (Weight / 100)
        const kpiWeightedContribution = perfResult.performance * (kpi.weight / 100);
        totalWeightedScoreSum += kpiWeightedContribution;
        completedEntriesCount++;
      } else if (entry?.status === 'No Input' || entry?.status === 'N/A') {
        noInputEntriesCount++;
      } else {
        pendingEntriesCount++;
      }
    }
  }

  // Coverage = Scored Weight / Assigned Department Weight (#35)
  const coverage = assignedWeight > 0 ? (scoredWeightSum / assignedWeight) * 100 : 0;

  // Overall Performance reflects scored KPIs weighted average (#34, #35)
  const overallPerformance =
    scoredWeightSum > 0 ? (totalWeightedScoreSum / (scoredWeightSum / 100)) : 0;

  return {
    overallPerformance: Math.round(overallPerformance * 10) / 10,
    coverage: Math.round(coverage * 10) / 10,
    assignedWeight: Math.round(assignedWeight * 10) / 10,
    scoredWeight: Math.round(scoredWeightSum * 10) / 10,
    totalKPIs: kpis.length,
    completedEntriesCount,
    pendingEntriesCount,
    noInputEntriesCount,
  };
}
