import React, { useState } from 'react';
import { db } from '../../services/db';
import {
  FileJson,
  Upload,
  Download,
  Copy,
  Check,
  AlertCircle,
  X,
  FileCode,
  Sparkles,
} from 'lucide-react';

interface HierarchyJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

const SAMPLE_BITOPI_JSON = {
  units: [
    {
      name: 'Bitopi Apparels Ltd. - Unit 1',
      code: 'BAL-U1',
      location: 'Mirpur, Dhaka',
      departments: [
        {
          name: 'Industrial Engineering',
          short_code: 'IE',
          sections: [
            {
              name: 'Line Optimization & Work Study',
              subsections: [
                { name: 'High-Speed Sewing Floors' },
                { name: 'Finishing & Packing Flow' }
              ]
            },
            {
              name: 'Method Engineering & Layout',
              subsections: [
                { name: 'SMV Benchmarking Lab' }
              ]
            }
          ],
          kpis: [
            {
              kra: 'Productivity Optimization',
              major_objective: 'Increase Line Output Efficiency',
              smart_kpi_text: 'Achieve line efficiency of 68% in sewing lines across Q1 2026',
              perspective: 'Process',
              aligned_org_goal_level: 'department',
              weight: 25,
              baseline_value: 58,
              baseline_unit: 'percentage',
              target_value: 68,
              target_unit: 'percentage',
              responsible_concern: ['IE Incharge', 'Line Supervisor'],
              datasource: 'G-Pro Realtime Tracking'
            }
          ]
        },
        {
          name: 'HR & Admin',
          short_code: 'HR',
          sections: [
            {
              name: 'Skill Training & Operator Onboarding',
              subsections: [
                { name: 'Operator Training Center' }
              ]
            },
            {
              name: 'Attendance & Employee Retention',
              subsections: [
                { name: 'Floor Engagement Cell' }
              ]
            }
          ],
          kpis: [
            {
              kra: 'Labor Retention',
              major_objective: 'Reduce Sewing Line Absenteeism',
              smart_kpi_text: 'Maintain monthly unexcused absenteeism rate below 3.5%',
              perspective: 'Learning & Development',
              aligned_org_goal_level: 'department',
              weight: 20,
              baseline_value: 5.2,
              baseline_unit: 'percentage',
              target_value: 3.5,
              target_unit: 'percentage',
              responsible_concern: ['HR Executive', 'Welfare Officer'],
              datasource: 'Biometric Attendance ERP'
            }
          ]
        }
      ]
    },
    {
      name: 'Misami Garments Ltd.',
      code: 'MGL',
      location: 'Comilla EPZ',
      departments: [
        {
          name: 'Production',
          short_code: 'PROD',
          sections: [
            {
              name: 'Cutting Division',
              subsections: [
                { name: 'Auto Spreader & CAM Table' }
              ]
            }
          ],
          kpis: [
            {
              kra: 'Fabric Utilization',
              major_objective: 'Minimize End Loss & Remnants',
              smart_kpi_text: 'Maintain fabric utilization above 87.5% across marker layouts',
              perspective: 'Process',
              aligned_org_goal_level: 'section',
              weight: 30,
              baseline_value: 84.0,
              baseline_unit: 'percentage',
              target_value: 87.5,
              target_unit: 'percentage',
              responsible_concern: ['Cutting Master', 'CAD Pattern Maker'],
              datasource: 'Marker Utilization Software'
            }
          ]
        }
      ]
    }
  ]
};

export const HierarchyJsonModal: React.FC<HierarchyJsonModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'schema'>('import');
  const [jsonText, setJsonText] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleLoadSample = () => {
    setJsonText(JSON.stringify(SAMPLE_BITOPI_JSON, null, 2));
    setStatusMessage(null);
  };

  const handleExportCurrent = () => {
    const exported = db.exportHierarchyAndKPIs();
    const str = JSON.stringify(exported, null, 2);
    setJsonText(str);
    setActiveTab('import');
    setStatusMessage({
      type: 'success',
      text: 'Current hierarchy and KPIs loaded into editor. You can copy or save as JSON.',
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const textToDownload = jsonText || JSON.stringify(SAMPLE_BITOPI_JSON, null, 2);
    const blob = new Blob([textToDownload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bitopi_hierarchy_kpis_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    setStatusMessage(null);
    if (!jsonText.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter or paste your JSON payload.' });
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      const res = db.importHierarchyAndKPIs(parsed);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Import successful! Added/updated: ${res.counts.units} Units, ${res.counts.departments} Departments, ${res.counts.sections} Sections, ${res.counts.subsections} Subsections, ${res.counts.kpis} KPIs.`,
        });
        onImportSuccess();
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Invalid JSON syntax: ${err?.message || 'Check commas and quotes'}`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-neutral-300 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-800 text-white flex items-center justify-center shadow-xs">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Company Hierarchy & KPI JSON Formatter
              </h2>
              <p className="text-xs text-neutral-600">
                Import or configure Unit → Department → Section → Sub-section structure and KPIs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-6 border-b border-neutral-200 bg-white">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('import')}
              className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'import'
                  ? 'border-emerald-800 text-emerald-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Import / Edit JSON
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'schema'
                  ? 'border-emerald-800 text-emerald-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Bitopi Hierarchy Specification
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
              title="Fill editor with sample Unit, Department, Section & Subsection data"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Sample Template
            </button>
            <button
              onClick={handleExportCurrent}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded border border-neutral-300 transition-colors"
              title="Export existing database records"
            >
              <Download className="w-3.5 h-3.5" />
              Export Current DB
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {statusMessage && (
            <div
              className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-red-50 text-red-900 border border-red-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {activeTab === 'import' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-600">
                <span className="font-semibold">Paste your company JSON below:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    disabled={!jsonText}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors disabled:opacity-40"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder={`{\n  "units": [\n    {\n      "name": "Bitopi Apparels Ltd. - Unit 1",\n      "code": "BAL-U1",\n      "departments": [\n        {\n          "name": "Industrial Engineering",\n          "short_code": "IE",\n          "sections": [...],\n          "kpis": [...]\n        }\n      ]\n    }\n  ]\n}`}
                rows={16}
                className="w-full font-mono text-xs p-3.5 rounded-lg border border-neutral-300 bg-neutral-900 text-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-700 scrollbar-thin"
              />
              <p className="text-[11px] text-neutral-500">
                Supports hierarchical JSON with Units, Departments, Sections, Sub-sections, and KPI definitions.
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-xs text-neutral-800">
              <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200">
                <h4 className="font-bold text-emerald-950 mb-1">
                  Bitopi Organizational Hierarchy Structure:
                </h4>
                <p className="text-emerald-900">
                  <span className="font-mono font-bold">UNIT</span> →{' '}
                  <span className="font-mono font-bold">DEPARTMENT</span> →{' '}
                  <span className="font-mono font-bold">SECTION</span> →{' '}
                  <span className="font-mono font-bold">SUBSECTION</span> →{' '}
                  <span className="font-mono font-bold">KPIS</span>
                </p>
              </div>

              <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                <h5 className="font-bold text-neutral-900 mb-2">JSON Format Specification:</h5>
                <pre className="p-3 bg-neutral-900 text-neutral-100 rounded text-[11px] font-mono overflow-x-auto leading-relaxed">
{`{
  "units": [
    {
      "name": "Unit Name (e.g. Bitopi Apparels Ltd. - Unit 1)",
      "code": "BAL-U1",
      "location": "Mirpur, Dhaka",
      "departments": [
        {
          "name": "Industrial Engineering",
          "short_code": "IE",
          "sections": [
            {
              "name": "Line Optimization & Work Study",
              "subsections": [
                { "name": "High-Speed Sewing Floors" }
              ]
            }
          ],
          "kpis": [
            {
              "kra": "Productivity",
              "major_objective": "Efficiency",
              "smart_kpi_text": "Achieve 68% efficiency",
              "perspective": "Process",
              "weight": 25,
              "baseline_value": 60,
              "target_value": 68
            }
          ]
        }
      ]
    }
  ]
}`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-neutral-200 bg-neutral-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            Close
          </button>

          {activeTab === 'import' && (
            <button
              onClick={handleImport}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Apply & Import to Database
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
