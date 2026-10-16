import * as XLSX from 'xlsx';
import { KPI, KPIMonthlyEntry, Department, Unit } from '../types';
import { formatUnitValue } from './calculations';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface ExportOptions {
  kpis: KPI[];
  monthlyEntries: KPIMonthlyEntry[];
  departments: Department[];
  units: Unit[];
  selectedYear: number;
  filename?: string;
}

/**
 * Exports KPI data to an Excel (.xlsx) workbook strictly matching the official Bitopi layout:
 * - Row 1 & 2: Merged Blue Headers ("Month" spanning Jan - Dec, "Department" spanning 2 rows, etc.)
 * - Grouped by Department with vertical merge across all department rows
 * - Columns:
 *   1. Department (Merged vertically for all KPIs under the same department)
 *   2. KRA
 *   3. MO (Major Objective)
 *   4. Aligned With ORG./SBU(Factory)/Dept./Sec Goal No.
 *   5. Baseline
 *   6. KPI
 *   7. Responsible Concern
 *   8. Weightage
 *   9. Data Source
 *   10. Measurable Parameter / Target
 *   11-22. January .. December (12 months)
 */
export function exportKPIsToExcel({
  kpis,
  monthlyEntries,
  departments,
  units,
  selectedYear,
  filename,
}: ExportOptions) {
  if (!kpis || kpis.length === 0) {
    alert('No KPI records available to export.');
    return;
  }

  // Group KPIs by Department
  const deptMap = new Map<string, { dept: Department; kpis: KPI[] }>();
  const unassignedKpis: KPI[] = [];

  kpis.forEach((kpi) => {
    const dept = departments.find((d) => d.id === kpi.department_id);
    if (dept) {
      if (!deptMap.has(dept.id)) {
        deptMap.set(dept.id, { dept, kpis: [] });
      }
      deptMap.get(dept.id)!.kpis.push(kpi);
    } else {
      unassignedKpis.push(kpi);
    }
  });

  // Prepare 2D array of data for XLSX
  const rows: any[][] = [];

  // Row 0 (Header Row 1)
  const headerRow1 = [
    'Department',
    'KRA',
    'MO',
    'Aligned With ORG./SBU(Factory)/Dept./Sec Goal No.',
    'Baseline',
    'KPI',
    'Responsible Concern',
    'Weightage',
    'Data Source',
    'Measurable Parameter / Target',
    'Month', // Spans col 10 to 21
    '', '', '', '', '', '', '', '', '', '', '',
  ];
  rows.push(headerRow1);

  // Row 1 (Header Row 2)
  const headerRow2 = [
    '', // Department
    '', // KRA
    '', // MO
    '', // Aligned
    '', // Baseline
    '', // KPI
    '', // Responsible
    '', // Weightage
    '', // Data Source
    '', // Measurable
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  rows.push(headerRow2);

  // Array of merge ranges: { s: { r, c }, e: { r, c } }
  const merges: XLSX.Range[] = [
    // Header merges: Top row spans down to Row 1 for cols 0 to 9
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // Department
    { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // KRA
    { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } }, // MO
    { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } }, // Aligned
    { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } }, // Baseline
    { s: { r: 0, c: 5 }, e: { r: 1, c: 5 } }, // KPI
    { s: { r: 0, c: 6 }, e: { r: 1, c: 6 } }, // Responsible Concern
    { s: { r: 0, c: 7 }, e: { r: 1, c: 7 } }, // Weightage
    { s: { r: 0, c: 8 }, e: { r: 1, c: 8 } }, // Data Source
    { s: { r: 0, c: 9 }, e: { r: 1, c: 9 } }, // Measurable Parameter / Target
    // Month spans horizontally across all 12 months (col 10 to 21) in Row 0
    { s: { r: 0, c: 10 }, e: { r: 0, c: 21 } },
  ];

  let currentRowIdx = 2; // Data begins at row index 2

  // Populate data department by department
  const processKpis = (deptLabel: string, deptKpis: KPI[]) => {
    if (deptKpis.length === 0) return;

    const startRow = currentRowIdx;
    deptKpis.forEach((kpi, kpiIdx) => {
      // Find monthly entries for this KPI
      const kpiEntries = monthlyEntries.filter((e) => e.kpi_id === kpi.id);

      // Extract month values
      const monthValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
        const entry = kpiEntries.find((e) => e.month === m);
        if (!entry) return '0.0%';
        if (entry.status === 'No Input' || entry.status === 'N/A') return 'N/A';
        if (entry.status === 'Pending') return 'Pending';
        if (entry.achievement_value !== null && entry.achievement_value !== undefined) {
          return formatUnitValue(entry.achievement_value, entry.achievement_unit || kpi.target_unit);
        }
        return '0.0%';
      });

      const row = [
        deptLabel, // Column 0: Department name
        kpi.kra || '',
        kpi.major_objective || '',
        kpi.aligned_goal_no ? kpi.aligned_goal_no : (kpi.aligned_org_goal_label || ''),
        formatUnitValue(kpi.baseline_value, kpi.baseline_unit),
        kpi.smart_kpi_text || '',
        Array.isArray(kpi.responsible_concern) ? kpi.responsible_concern.join(', ') : '',
        kpi.weight ? `${kpi.weight}%` : '10.0%',
        kpi.datasource || 'HRIS',
        formatUnitValue(kpi.target_value, kpi.target_unit),
        ...monthValues,
      ];

      rows.push(row);
      currentRowIdx++;
    });

    // If there is more than 1 KPI for this department, vertically merge the Department column
    if (deptKpis.length > 1) {
      // Merge Department
      merges.push({
        s: { r: startRow, c: 0 },
        e: { r: currentRowIdx - 1, c: 0 },
      });
    }
  };

  // Process all grouped departments
  deptMap.forEach(({ dept, kpis: deptKpis }) => {
    const cleanDeptName = dept.short_code || dept.name.replace(/\s*\([^)]*\)/g, '').trim();
    processKpis(cleanDeptName, deptKpis);
  });

  // Process unassigned KPIs if any
  if (unassignedKpis.length > 0) {
    processKpis('General / Unassigned', unassignedKpis);
  }

  // Create sheet
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Assign merges
  worksheet['!merges'] = merges;

  // Set column widths for optimal display
  worksheet['!cols'] = [
    { wch: 18 }, // Department
    { wch: 28 }, // KRA
    { wch: 32 }, // MO
    { wch: 24 }, // Aligned Goal
    { wch: 18 }, // Baseline
    { wch: 38 }, // KPI
    { wch: 22 }, // Responsible Concern
    { wch: 14 }, // Weightage
    { wch: 18 }, // Data Source
    { wch: 22 }, // Measurable Parameter
    { wch: 12 }, // Jan
    { wch: 12 }, // Feb
    { wch: 12 }, // Mar
    { wch: 12 }, // Apr
    { wch: 12 }, // May
    { wch: 12 }, // Jun
    { wch: 12 }, // Jul
    { wch: 12 }, // Aug
    { wch: 12 }, // Sep
    { wch: 12 }, // Oct
    { wch: 12 }, // Nov
    { wch: 12 }, // Dec
  ];

  // Set row heights
  worksheet['!rows'] = [
    { hpt: 26 }, // Header 1
    { hpt: 22 }, // Header 2
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'KPI Matrix');

  // Trigger Excel file download
  const defaultFilename = `Bitopi_KPI_Matrix_${selectedYear}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename || defaultFilename);
}
