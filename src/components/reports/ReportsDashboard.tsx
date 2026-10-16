import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { calculateDepartmentSummary } from '../../services/calculations';
import { BarChart3, Download, Calendar, Layers, ShieldCheck } from 'lucide-react';

interface ReportsDashboardProps {
  onSelectDepartment: (deptId: string) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({
  onSelectDepartment,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(3);

  const departments = db.getDepartments();

  // Calculate summary for each department
  const departmentReports = useMemo(() => {
    return departments.map((dept) => {
      const kpis = db.getKPIs({ departmentId: dept.id });
      const kpiIds = kpis.map((k) => k.id);
      const entries = db.getMonthlyEntriesForKPIs(kpiIds, selectedYear);
      const summary = calculateDepartmentSummary(kpis, entries, selectedYear, selectedMonth);

      return {
        department: dept,
        summary,
        kpiCount: kpis.length,
      };
    }).sort((a, b) => b.summary.overallPerformance - a.summary.overallPerformance);
  }, [departments, selectedYear, selectedMonth]);

  // Overall Group Aggregate
  const aggregateMetrics = useMemo(() => {
    const totalKPIs = departmentReports.reduce((acc, r) => acc + r.kpiCount, 0);
    const activeKPIs = departmentReports.filter((r) => r.kpiCount > 0);
    const avgPerf =
      activeKPIs.length > 0
        ? Math.round(
            (activeKPIs.reduce((acc, r) => acc + r.summary.overallPerformance, 0) /
              activeKPIs.length) *
              10
          ) / 10
        : 0;
    const avgCoverage =
      activeKPIs.length > 0
        ? Math.round(
            (activeKPIs.reduce((acc, r) => acc + r.summary.coverage, 0) / activeKPIs.length) * 10
          ) / 10
        : 0;

    return { totalKPIs, avgPerf, avgCoverage, totalDepartments: departments.length };
  }, [departmentReports, departments]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Department',
      'Code',
      'Department ID',
      'Total KPIs',
      'Overall Performance (%)',
      'Coverage (%)',
      'Assigned Weight (%)',
      'Scored Weight (%)',
      'Completed Entries',
      'Pending Entries',
      'N/A Entries',
    ];

    const rows = departmentReports.map((r) => [
      `"${r.department.name}"`,
      r.department.short_code,
      r.department.department_id,
      r.kpiCount,
      r.summary.overallPerformance,
      r.summary.coverage,
      r.summary.assignedWeight,
      r.summary.scoredWeight,
      r.summary.completedEntriesCount,
      r.summary.pendingEntriesCount,
      r.summary.noInputEntriesCount,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Bitopi_KPI_Report_${selectedYear}_${MONTH_NAMES[selectedMonth - 1]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      {/* Top Header Card */}
      <div className="bg-white border border-neutral-200/90 rounded-lg p-4 mb-4 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-800" />
            <span>Executive Performance Reports</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Cross-department performance rankings, weight coverage analysis, and reporting compliance.
          </p>
        </div>

        {/* Month, Year & Export controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-2 py-1.5 rounded border border-neutral-300 bg-white text-xs font-mono"
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-xs"
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-neutral-300 hover:bg-neutral-50 text-neutral-800 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Aggregate Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white p-3.5 rounded-lg border border-neutral-200 shadow-2xs">
          <span className="text-[11px] text-neutral-500 font-medium block">Active Departments</span>
          <span className="text-xl font-bold font-mono text-neutral-900 mt-1 block">
            {aggregateMetrics.totalDepartments}
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-neutral-200 shadow-2xs">
          <span className="text-[11px] text-neutral-500 font-medium block">Total Group KPIs</span>
          <span className="text-xl font-bold font-mono text-neutral-900 mt-1 block">
            {aggregateMetrics.totalKPIs}
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-neutral-200 shadow-2xs">
          <span className="text-[11px] text-neutral-500 font-medium block">Average Performance</span>
          <span className="text-xl font-bold font-mono text-emerald-800 mt-1 block">
            {aggregateMetrics.avgPerf}%
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-neutral-200 shadow-2xs">
          <span className="text-[11px] text-neutral-500 font-medium block">Average Weight Coverage</span>
          <span className="text-xl font-bold font-mono text-neutral-900 mt-1 block">
            {aggregateMetrics.avgCoverage}%
          </span>
        </div>
      </div>

      {/* Cross-Department Comparative Table */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/60">
          <h2 className="text-xs font-bold text-neutral-900">
            Department Performance Ranking — {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </h2>
          <span className="text-[11px] text-neutral-500">
            Sorted by Weighted Performance Score
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 font-semibold text-neutral-600 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4 w-12 text-center">Rank</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-3">Dept ID</th>
                <th className="py-2.5 px-3 text-right">KPIs</th>
                <th className="py-2.5 px-3 text-right">Performance</th>
                <th className="py-2.5 px-3 text-right">Coverage</th>
                <th className="py-2.5 px-3 text-right">Assigned Weight</th>
                <th className="py-2.5 px-3 text-right">Scored Weight</th>
                <th className="py-2.5 px-4 text-center">Reporting Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/70">
              {departmentReports.map((item, idx) => {
                return (
                  <tr
                    key={item.department.id}
                    className="hover:bg-neutral-50/70 transition-colors text-neutral-800"
                  >
                    <td className="py-2.5 px-4 text-center font-mono font-semibold text-neutral-500">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-neutral-900">
                      {item.department.name}
                      <span className="text-[10px] text-neutral-400 font-normal ml-1 font-mono">
                        ({item.department.short_code})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-neutral-600">
                      {item.department.department_id}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-neutral-700">
                      {item.kpiCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 tabular-nums">
                      {item.kpiCount > 0 && item.summary.overallPerformance > 0
                        ? `${item.summary.overallPerformance}%`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-800">
                      {item.summary.coverage}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-neutral-600 tabular-nums">
                      {item.summary.assignedWeight}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-neutral-600 tabular-nums">
                      {item.summary.scoredWeight}%
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {item.kpiCount === 0 ? (
                        <span className="text-neutral-400 text-[11px]">No KPIs configured</span>
                      ) : item.summary.coverage >= 90 ? (
                        <span className="text-emerald-800 font-medium text-[11px]">✓ Full Coverage</span>
                      ) : item.summary.coverage > 0 ? (
                        <span className="text-amber-800 font-medium text-[11px]">Partial ({item.summary.coverage}%)</span>
                      ) : (
                        <span className="text-neutral-500 text-[11px]">Pending Input</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => onSelectDepartment(item.department.id)}
                        className="text-xs text-emerald-800 hover:text-emerald-950 font-medium underline-offset-2 hover:underline"
                      >
                        Open KPI Board →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
