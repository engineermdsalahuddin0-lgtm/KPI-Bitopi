import React, { useState, useEffect } from 'react';
import {
  Unit,
  Department,
  Section,
  Subsection,
  KPI,
  PerspectiveType,
  UnitType,
  TargetPolicyType,
  OrgGoalLevel,
  UserSession,
  DivisionType,
} from '../../types';
import { db } from '../../services/db';
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Building2,
  Lock,
  Factory,
  Layers,
  GitFork,
  Sparkles,
} from 'lucide-react';

interface KPIWizardProps {
  initialUnitId?: string;
  initialDepartmentId?: string;
  initialSectionId?: string;
  initialSubsectionId?: string;
  session?: UserSession;
  departments: Department[];
  editingKPI?: KPI | null;
  onSave: (kpiData: Omit<KPI, 'id' | 'kpi_code' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
  lockDepartment?: boolean;
}

const cleanLabel = (text?: string): string => {
  if (!text) return '';
  return text.replace(/\s*\([^)]*\)/g, '').trim();
};

// Recommended role/designation titles based on node level (NO personal user data)
const ROLE_SUGGESTIONS: Record<OrgGoalLevel, string[]> = {
  unit: ['Unit Head', 'General Manager', 'Operations Director', 'Factory Manager', 'COO'],
  department: ['Department Head', 'IE Incharge', 'HR & Admin Manager', 'Production Manager', 'Commercial Head', 'ERP Lead'],
  section: ['Section Incharge', 'Line Supervisor', 'Work Study Officer', 'QA Auditor', 'Maintenance Incharge'],
  subsection: ['Sub-section Lead', 'Floor Coordinator', 'Sample Specialist', 'Technical Officer', 'Operator Trainer'],
};

export const KPIWizard: React.FC<KPIWizardProps> = ({
  initialUnitId,
  initialDepartmentId,
  initialSectionId,
  initialSubsectionId,
  session,
  departments: allDepts,
  editingKPI,
  onSave,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const isAdmin = session?.role === 'admin';

  // Security Check: If a non-admin attempts to edit an existing KPI, close and alert
  useEffect(() => {
    if (editingKPI && !isAdmin) {
      alert("KPI Definitions can only be edited by administrators. Department and Section heads have view-only access.");
      onClose();
    }
  }, [editingKPI, isAdmin, onClose]);

  const units = db.getUnits();

  // Role permissions
  const isUnitUser = session?.role === 'unit';
  const isDeptUser = session?.role === 'department';
  const isSectionUser = session?.role === 'section';
  const isSubsectionUser = session?.role === 'subsection';

  // 1. Goal Level / Node Point
  const defaultLevel: OrgGoalLevel = editingKPI?.aligned_org_goal_level ||
    (isAdmin
      ? 'subsection'
      : isSubsectionUser
      ? 'subsection'
      : isSectionUser
      ? 'section'
      : isDeptUser
      ? 'department'
      : 'unit');

  const [orgGoalLevel, setOrgGoalLevel] = useState<OrgGoalLevel>(defaultLevel);

  // 2. Unit Selection
  const initialUnit = editingKPI?.unit_id || session?.unitId || initialUnitId || units[0]?.id || '';
  const [unitId, setUnitId] = useState<string>(initialUnit);

  // Available departments for selected unit (always direct from db service)
  const unitDepartments = db.getDepartments(unitId || undefined);

  // 3. Department Selection
  const initialDept =
    editingKPI?.department_id ||
    session?.departmentId ||
    initialDepartmentId ||
    (unitDepartments.length > 0 ? unitDepartments[0].id : '');
  const [division, setDivision] = useState<DivisionType>(() => {
    if (editingKPI?.division) return editingKPI.division;
    if (editingKPI?.department_id) {
      const d = db.getDepartmentById(editingKPI.department_id);
      if (d?.division) return d.division;
    }
    return 'Corporate';
  });
  const [departmentId, setDepartmentId] = useState<string>(initialDept);

  // Available sections for selected department
  const [sections, setSections] = useState<Section[]>(() =>
    initialDept ? db.getSections(initialDept) : []
  );
  const [sectionId, setSectionId] = useState<string>(
    editingKPI?.section_id || (isSubsectionUser || isSectionUser ? session?.sectionId || '' : initialSectionId || '')
  );

  // Available subsections for selected section
  const [subsections, setSubsections] = useState<Subsection[]>(() =>
    sectionId ? db.getSubsections(sectionId) : []
  );
  const [subsectionId, setSubsectionId] = useState<string>(
    editingKPI?.subsection_id || (isSubsectionUser ? session?.subsectionId || '' : initialSubsectionId || '')
  );

  // Unit change cascade handler
  const handleUnitSelectChange = (newUnitId: string) => {
    setUnitId(newUnitId);
    const depts = db.getDepartments(newUnitId);
    if (depts.length > 0) {
      const firstDeptId = depts[0].id;
      setDepartmentId(firstDeptId);
      const secs = db.getSections(firstDeptId);
      setSections(secs);
      const firstSecId = secs[0]?.id || '';
      setSectionId(firstSecId);
      if (firstSecId) {
        const subs = db.getSubsections(firstSecId);
        setSubsections(subs);
        setSubsectionId(subs[0]?.id || '');
      } else {
        setSubsections([]);
        setSubsectionId('');
      }
    } else {
      setDepartmentId('');
      setSections([]);
      setSectionId('');
      setSubsections([]);
      setSubsectionId('');
    }
  };

  // Department change cascade handler
  const handleDepartmentSelectChange = (newDeptId: string) => {
    setDepartmentId(newDeptId);
    const d = db.getDepartmentById(newDeptId);
    if (d?.division) {
      setDivision(d.division);
    }
    const secs = db.getSections(newDeptId);
    setSections(secs);
    const firstSecId = secs[0]?.id || '';
    setSectionId(firstSecId);
    if (firstSecId) {
      const subs = db.getSubsections(firstSecId);
      setSubsections(subs);
      setSubsectionId(subs[0]?.id || '');
    } else {
      setSubsections([]);
      setSubsectionId('');
    }
  };

  // Section change cascade handler
  const handleSectionSelectChange = (newSecId: string) => {
    setSectionId(newSecId);
    const subs = db.getSubsections(newSecId);
    setSubsections(subs);
    setSubsectionId(subs[0]?.id || '');
  };

  // Update sections whenever departmentId changes
  useEffect(() => {
    if (departmentId) {
      const secs = db.getSections(departmentId);
      setSections(secs);
      if (secs.length > 0 && !sectionId) {
        setSectionId(secs[0].id);
        const subs = db.getSubsections(secs[0].id);
        setSubsections(subs);
        if (subs.length > 0 && !subsectionId) {
          setSubsectionId(subs[0].id);
        }
      }
    } else {
      setSections([]);
      setSubsections([]);
    }
  }, [departmentId]);

  // Update subsections whenever sectionId changes
  useEffect(() => {
    if (sectionId) {
      const subs = db.getSubsections(sectionId);
      setSubsections(subs);
      if (subs.length > 0 && !subsectionId) {
        setSubsectionId(subs[0].id);
      }
    } else {
      setSubsections([]);
    }
  }, [sectionId]);

  // Step 1: KRA, Major Objective, Aligned Goal
  const [kra, setKra] = useState<string>(editingKPI?.kra || '');
  const [majorObjective, setMajorObjective] = useState<string>(editingKPI?.major_objective || '');
  const [alignedGoalNo, setAlignedGoalNo] = useState<string>(
    editingKPI?.aligned_goal_no ? String(editingKPI.aligned_goal_no) : ''
  );

  // Step 2: KPI Definition
  const [kpiMode, setKpiMode] = useState<'direct' | 'smart'>('direct');
  const [smartKpiText, setSmartKpiText] = useState<string>(editingKPI?.smart_kpi_text || '');
  const [specificS, setSpecificS] = useState<string>(editingKPI?.specific_s || '');
  const [measureM, setMeasureM] = useState<string>(editingKPI?.measure_m || '');
  const [achievableA, setAchievableA] = useState<boolean>(editingKPI?.achievable_a ?? true);
  const [relevantR, setRelevantR] = useState<boolean>(editingKPI?.relevant_r ?? true);
  const [timeT, setTimeT] = useState<string>(editingKPI?.time_t || '');

  // Step 3: Ownership (Organizational Roles / Concerns, NO personal user names)
  const [responsibleConcern, setResponsibleConcern] = useState<string[]>(
    editingKPI?.responsible_concern && editingKPI.responsible_concern.length > 0
      ? editingKPI.responsible_concern.filter((r) => r && r !== 'Unassigned')
      : []
  );
  const [newConcernInput, setNewConcernInput] = useState<string>('');
  const [datasource, setDatasource] = useState<string>(editingKPI?.datasource || '');
  const [requirements, setRequirements] = useState<string>(editingKPI?.requirements || '');

  // Step 4: Weight
  const [weight, setWeight] = useState<number>(editingKPI?.weight || 20);

  // Step 5: Measurement
  const [perspective, setPerspective] = useState<PerspectiveType>(
    editingKPI?.perspective || 'Process'
  );
  const [baselineValue, setBaselineValue] = useState<number>(editingKPI?.baseline_value ?? 75);
  const [baselineUnit, setBaselineUnit] = useState<UnitType>(editingKPI?.baseline_unit || 'percentage');
  const [targetValue, setTargetValue] = useState<number>(editingKPI?.target_value ?? 85);
  const [targetUnit, setTargetUnit] = useState<UnitType>(editingKPI?.target_unit || 'percentage');
  const [targetPolicy, setTargetPolicy] = useState<TargetPolicyType>(
    editingKPI?.target_policy || 'fixed'
  );

  // Wizard state
  const [error, setError] = useState<string | null>(null);

  // Selected object labels for confirmation
  const selectedUnitObj = units.find((u) => u.id === unitId);
  const selectedDeptObj = unitDepartments.find((d) => d.id === departmentId);
  const selectedSecObj = sections.find((s) => s.id === sectionId);
  const selectedSubObj = subsections.find((sub) => sub.id === subsectionId);

  // Calculate target node ID and human-readable label
  const targetNodeId =
    orgGoalLevel === 'unit'
      ? unitId
      : orgGoalLevel === 'department'
      ? departmentId
      : orgGoalLevel === 'section'
      ? sectionId
      : subsectionId;

  const targetNodeLabel =
    orgGoalLevel === 'unit'
      ? `Unit: ${cleanLabel(selectedUnitObj?.name || 'Unit')}`
      : orgGoalLevel === 'department'
      ? `Dept: ${cleanLabel(selectedDeptObj?.name || 'Department')}`
      : orgGoalLevel === 'section'
      ? `Section: ${selectedSecObj?.name || 'Section'}`
      : `Sub-section: ${selectedSubObj?.name || 'Sub-section'}`;

  // Node Weight Calculation (Rule #24: Max 100% per node)
  const alreadyUsedWeight = db.getNodeAllocatedWeight(
    {
      level: orgGoalLevel,
      unitId,
      departmentId: orgGoalLevel !== 'unit' ? departmentId : undefined,
      sectionId: orgGoalLevel === 'section' || orgGoalLevel === 'subsection' ? sectionId : undefined,
      subsectionId: orgGoalLevel === 'subsection' ? subsectionId : undefined,
    },
    editingKPI?.id
  );

  const remainingWeight = Math.max(0, Math.round((100 - alreadyUsedWeight) * 10) / 10);
  const isWeightValid = weight > 0 && weight <= remainingWeight;

  // SMART generator helper
  const handleGenerateSMARTStatement = () => {
    if (!specificS) {
      setError('Please fill in Specific (S) first.');
      return;
    }
    const generated = `${specificS}${measureM ? `, measured by ${measureM}` : ''}${
      timeT ? ` by ${timeT}` : ''
    }.`;
    setSmartKpiText(generated);
  };

  // Add concern chip
  const handleAddConcern = (name?: string) => {
    const val = (name || newConcernInput).trim();
    if (val && !responsibleConcern.includes(val)) {
      setResponsibleConcern([...responsibleConcern, val]);
      if (!name) setNewConcernInput('');
    }
  };

  const handleRemoveConcern = (person: string) => {
    setResponsibleConcern(responsibleConcern.filter((p) => p !== person));
  };

  // Step Validation
  const validateStep = (step: number): boolean => {
    setError(null);
    if (step === 1) {
      if (orgGoalLevel === 'unit' && !unitId) {
        setError('Please select a Business Unit.');
        return false;
      }
      if (orgGoalLevel !== 'unit' && !departmentId) {
        setError('Please select a Target Department.');
        return false;
      }
      if ((orgGoalLevel === 'section' || orgGoalLevel === 'subsection') && !sectionId) {
        setError('Please select a Section.');
        return false;
      }
      if (orgGoalLevel === 'subsection' && !subsectionId) {
        setError('Please select a Sub-section.');
        return false;
      }
      if (!kra.trim()) {
        setError('KRA is required (one KRA per field).');
        return false;
      }
      if (!majorObjective.trim()) {
        setError('Major Objective (MO) is required.');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!smartKpiText.trim()) {
        setError('KPI Statement is required. Type directly or use SMART generator.');
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (responsibleConcern.length === 0) {
        setError('At least one Responsible Role / Concern Designation is required.');
        return false;
      }
      return true;
    }
    if (step === 4) {
      if (weight <= 0) {
        setError('KPI weight must be greater than 0%.');
        return false;
      }
      if (weight > remainingWeight) {
        setError(
          `Weight exceeds remaining allocation. Remaining: ${remainingWeight}%, Entered: ${weight}%, Maximum allowed: ${remainingWeight}%`
        );
        return false;
      }
      return true;
    }
    if (step === 5) {
      if (isNaN(baselineValue) || isNaN(targetValue)) {
        setError('Baseline and Target numeric values are required.');
        return false;
      }
      if (baselineUnit === 'percentage' && (baselineValue < 0 || baselineValue > 100)) {
        setError('Baseline percentage must be between 0% and 100%.');
        return false;
      }
      if (targetUnit === 'percentage' && (targetValue < 0 || targetValue > 100)) {
        setError('Target percentage must be between 0% and 100%.');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handlePrevious = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(5)) return;

    // Robust resolution of unit_id and department_id
    let finalUnitId = unitId;
    const finalDeptId = orgGoalLevel !== 'unit' ? (departmentId || session?.departmentId) : undefined;
    if (!finalUnitId && finalDeptId) {
      const dObj = db.getDepartmentById(finalDeptId);
      if (dObj?.unit_id) finalUnitId = dObj.unit_id;
    }
    if (!finalUnitId && session?.unitId) {
      finalUnitId = session.unitId;
    }
    if (!finalUnitId) {
      finalUnitId = 'unit-bgl';
    }

    onSave({
      unit_id: finalUnitId,
      division: division,
      department_id: finalDeptId,
      section_id: orgGoalLevel === 'section' || orgGoalLevel === 'subsection' ? sectionId : undefined,
      subsection_id: orgGoalLevel === 'subsection' ? subsectionId : undefined,
      kra: kra.trim(),
      major_objective: majorObjective.trim(),
      aligned_goal_no: alignedGoalNo ? parseInt(alignedGoalNo, 10) : undefined,
      aligned_org_goal_level: orgGoalLevel,
      aligned_org_goal_id: targetNodeId,
      aligned_org_goal_label: targetNodeLabel,
      smart_kpi_text: smartKpiText.trim(),
      specific_s: specificS.trim(),
      measure_m: measureM.trim(),
      achievable_a: achievableA,
      relevant_r: relevantR,
      time_t: timeT.trim(),
      perspective,
      responsible_concern: responsibleConcern,
      requirements: requirements.trim(),
      datasource: datasource.trim(),
      weight: Number(weight),
      baseline_value: Number(baselineValue),
      baseline_unit: baselineUnit,
      target_value: Number(targetValue),
      target_unit: targetUnit,
      target_policy: 'fixed',
    });
  };

  const stepsList = [
    { num: 1, title: 'Node & Objective' },
    { num: 2, title: 'KPI Statement' },
    { num: 3, title: 'Ownership' },
    { num: 4, title: 'Weight' },
    { num: 5, title: 'Target' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Wizard Header */}
        <div className="px-6 py-3.5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">
              {editingKPI ? `Edit KPI: ${editingKPI.kpi_code}` : 'KPI Entry — Company Node Mapping'}
            </h2>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Unit → Department → Section → Sub-section organizational hierarchy alignment
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 5-Step Progress Bar */}
        <div className="px-6 py-2.5 border-b border-neutral-200 bg-white">
          <div className="flex items-center justify-between">
            {stepsList.map((st, idx) => (
              <React.Fragment key={st.num}>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold font-mono ${
                      currentStep === st.num
                        ? 'bg-emerald-800 text-white'
                        : currentStep > st.num
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {currentStep > st.num ? '✓' : `0${st.num}`}
                  </div>
                  <span
                    className={`text-[11px] font-medium hidden sm:inline ${
                      currentStep === st.num
                        ? 'text-neutral-900 font-semibold'
                        : 'text-neutral-500'
                    }`}
                  >
                    {st.title}
                  </span>
                </div>
                {idx < stepsList.length - 1 && (
                  <div className="flex-1 h-0.5 bg-neutral-200 mx-2" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Wizard Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="mb-4 p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: NODE ALIGNMENT & OBJECTIVE */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Node Level Selector: Unit | Dept | Section | Sub-section */}
              <div>
                <label className="block font-semibold text-neutral-800 mb-1.5">
                  KPI Entry Level (Node Point)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrgGoalLevel('unit')}
                    className={`py-2 px-2 text-center rounded-lg border font-medium text-xs flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                      orgGoalLevel === 'unit'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs font-semibold'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <Factory className="w-3.5 h-3.5" />
                    <span>Unit Head</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrgGoalLevel('department')}
                    className={`py-2 px-2 text-center rounded-lg border font-medium text-xs flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                      orgGoalLevel === 'department'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs font-semibold'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Dept Head</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrgGoalLevel('section')}
                    className={`py-2 px-2 text-center rounded-lg border font-medium text-xs flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                      orgGoalLevel === 'section'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs font-semibold'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Section Incharge</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrgGoalLevel('subsection')}
                    className={`py-2 px-2 text-center rounded-lg border font-medium text-xs flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                      orgGoalLevel === 'subsection'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs font-semibold'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <GitFork className="w-3.5 h-3.5" />
                    <span>Sub-section Lead</span>
                  </button>
                </div>
              </div>

              {/* Hierarchy Cascade Container */}
              <div className="bg-neutral-50/80 p-3.5 rounded-lg border border-neutral-200 space-y-3">
                {/* 1. Unit Selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    1. Business Unit
                  </label>
                  {isUnitUser || isDeptUser || isSectionUser || isSubsectionUser ? (
                    <div className="flex items-center justify-between p-2 rounded-md bg-white border border-neutral-200 text-neutral-800">
                      <span className="font-semibold">{cleanLabel(selectedUnitObj?.name || session?.unitName || 'Current Unit')}</span>
                    </div>
                  ) : (
                    <select
                      value={unitId}
                      onChange={(e) => handleUnitSelectChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 font-medium"
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {cleanLabel(u.name)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 2. Department Selector */}
                {orgGoalLevel !== 'unit' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      2. Department
                    </label>
                    {isDeptUser || isSectionUser || isSubsectionUser ? (
                      <div className="flex items-center justify-between p-2 rounded-md bg-white border border-neutral-200 text-neutral-800">
                        <span className="font-semibold">{cleanLabel(selectedDeptObj?.name || session?.departmentName || 'Department')}</span>
                      </div>
                    ) : (
                      <select
                        value={departmentId}
                        onChange={(e) => handleDepartmentSelectChange(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 font-medium"
                      >
                        {unitDepartments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {cleanLabel(d.name)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* 3. Section Selector */}
                {(orgGoalLevel === 'section' || orgGoalLevel === 'subsection') && (
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      3. Section
                    </label>
                    {isSectionUser || isSubsectionUser ? (
                      <div className="flex items-center justify-between p-2 rounded-md bg-white border border-neutral-200 text-neutral-800">
                        <span className="font-semibold">{selectedSecObj?.name || session?.sectionName || 'Section'}</span>
                      </div>
                    ) : (
                      <select
                        value={sectionId}
                        onChange={(e) => handleSectionSelectChange(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 font-medium"
                      >
                        {sections.length === 0 ? (
                          <option value="">No sections defined</option>
                        ) : (
                          sections.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))
                        )}
                      </select>
                    )}
                  </div>
                )}

                {/* 4. Sub-section Selector */}
                {orgGoalLevel === 'subsection' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      4. Sub-section
                    </label>
                    {isSubsectionUser ? (
                      <div className="flex items-center justify-between p-2 rounded-md bg-white border border-neutral-200 text-neutral-800">
                        <span className="font-semibold">{selectedSubObj?.name || session?.subsectionName || 'Sub-section'}</span>
                      </div>
                    ) : (
                      <select
                        value={subsectionId}
                        onChange={(e) => setSubsectionId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 font-medium"
                      >
                        {subsections.length === 0 ? (
                          <option value="">No sub-sections defined</option>
                        ) : (
                          subsections.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name}
                            </option>
                          ))
                        )}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* KRA Input (1 KRA per field) */}
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Key Result Area (KRA) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={kra}
                  onChange={(e) => setKra(e.target.value)}
                  placeholder="e.g. Productivity Improvement, Line Efficiency, Quality Assurance"
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 font-medium"
                />
              </div>

              {/* Major Objective (MO) */}
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Major Objective (MO) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={majorObjective}
                  onChange={(e) => setMajorObjective(e.target.value)}
                  placeholder="e.g. Enhance operational sewing efficiency by 8% through balancing bottleneck operations"
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              {/* Aligned Goal No Dropdown (1 to 15) */}
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Aligned Goal No.
                </label>
                <select
                  value={alignedGoalNo}
                  onChange={(e) => setAlignedGoalNo(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs font-mono font-medium text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                >
                  <option value="">Select Goal No (None)</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: KPI STATEMENT */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Mode Toggle: Direct Entry vs SMART Generator */}
              <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
                <button
                  type="button"
                  onClick={() => setKpiMode('direct')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    kpiMode === 'direct'
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200/70'
                  }`}
                >
                  Direct KPI Input
                </button>
                <button
                  type="button"
                  onClick={() => setKpiMode('smart')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    kpiMode === 'smart'
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200/70'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>SMART Generator</span>
                </button>
              </div>

              {/* Direct Entry Field */}
              {kpiMode === 'direct' ? (
                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">
                    KPI Statement (নির্ভুল ও স্পষ্ট পরিমাপযোগ্য নির্দেশক) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={smartKpiText}
                    onChange={(e) => setSmartKpiText(e.target.value)}
                    placeholder="e.g. Achieve average sewing line efficiency of 75% across all production lines"
                    className="w-full px-3 py-2 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 font-medium"
                  />
                </div>
              ) : (
                /* SMART Generator Fields */
                <div className="space-y-3 bg-neutral-50/70 p-3.5 rounded-lg border border-neutral-200">
                  <div>
                    <label className="block font-semibold text-neutral-800 mb-1">
                      Specific (S) — নির্দিষ্ট লক্ষ্য
                    </label>
                    <input
                      type="text"
                      value={specificS}
                      onChange={(e) => setSpecificS(e.target.value)}
                      placeholder="e.g. Reduce cutting end-bit wastage"
                      className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-800 mb-1">
                      Measurable (M) — পরিমাপক
                    </label>
                    <input
                      type="text"
                      value={measureM}
                      onChange={(e) => setMeasureM(e.target.value)}
                      placeholder="e.g. by 1.5% compared to fabric consumption norm"
                      className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-800 mb-1">
                      Time-bound (T) — নির্দিষ্ট সময়সীমা
                    </label>
                    <input
                      type="text"
                      value={timeT}
                      onChange={(e) => setTimeT(e.target.value)}
                      placeholder="e.g. monthly review"
                      className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateSMARTStatement}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate & Apply Statement</span>
                  </button>

                  {smartKpiText && (
                    <div className="mt-2 p-2.5 bg-white rounded border border-emerald-300 text-emerald-950 font-medium">
                      {smartKpiText}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: OWNERSHIP & ROLES */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-neutral-800 mb-1.5">
                  Responsible Role / Concern Designation <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-neutral-500 mb-2">
                  Select organizational roles or add custom designation responsible for this KPI:
                </p>

                {/* Suggestions chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {ROLE_SUGGESTIONS[orgGoalLevel]?.map((roleName) => {
                    const isSelected = responsibleConcern.includes(roleName);
                    return (
                      <button
                        key={roleName}
                        type="button"
                        onClick={() =>
                          isSelected ? handleRemoveConcern(roleName) : handleAddConcern(roleName)
                        }
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800'
                            : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {roleName}
                      </button>
                    );
                  })}
                </div>

                {/* Custom input */}
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={newConcernInput}
                    onChange={(e) => setNewConcernInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddConcern();
                      }
                    }}
                    placeholder="Or type custom designation (e.g. Senior Work Study Officer)..."
                    className="flex-1 px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddConcern()}
                    className="px-3.5 py-1.5 rounded-md bg-neutral-800 text-white font-semibold text-xs hover:bg-neutral-900 transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {/* Selected chips */}
                {responsibleConcern.length > 0 && (
                  <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200">
                    <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">
                      Selected Concerns:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {responsibleConcern.map((concern) => (
                        <span
                          key={concern}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-emerald-300 text-emerald-950 font-semibold text-[11px] shadow-2xs"
                        >
                          <span>{concern}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveConcern(concern)}
                            className="text-neutral-400 hover:text-rose-600 transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Datasource */}
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Datasource (তথ্যসূত্র) <span className="text-[10px] text-neutral-400 font-normal">(Optional / ঐচ্ছিক)</span>
                </label>
                <input
                  type="text"
                  value={datasource}
                  onChange={(e) => setDatasource(e.target.value)}
                  placeholder="e.g. ERP Monthly Export, G-Pro Line Report, Biometric Log, Quality Inspection Log"
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                />
              </div>


            </div>
          )}

          {/* STEP 4: WEIGHT ALLOCATION */}
          {currentStep === 4 && (() => {
            const currentTotal = Math.min(100, Math.round((alreadyUsedWeight + (Number(weight) || 0)) * 10) / 10);
            const isExceeded = (alreadyUsedWeight + (Number(weight) || 0)) > 100.01;
            const thisKpiPct = Math.min(100 - alreadyUsedWeight, Math.max(0, Number(weight) || 0));
            const freePct = Math.max(0, Math.round((100 - alreadyUsedWeight - thisKpiPct) * 10) / 10);

            return (
              <div className="space-y-4">
                <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-neutral-800 text-xs">
                      Node Weight Budget Allocation ({targetNodeLabel})
                    </span>
                    <span className="font-mono text-xs font-bold text-neutral-900">
                      100% Total Limit
                    </span>
                  </div>

                  {/* Visual Progress Bar (Already Used + This KPI + Available) */}
                  <div className="space-y-1.5 my-3">
                    <div className="flex items-center justify-between text-[11px] font-medium">
                      <span className="text-neutral-600">Total Allocated: <strong className={currentTotal > 100 ? 'text-rose-600' : 'text-emerald-800'}>{currentTotal}%</strong> / 100%</span>
                      <span className="text-neutral-500">Free Remaining: <strong className="text-neutral-700">{freePct}%</strong></span>
                    </div>
                    <div className="w-full h-3.5 bg-neutral-200 rounded-full overflow-hidden flex shadow-inner">
                      {/* Already Used segment */}
                      <div
                        style={{ width: `${Math.min(100, alreadyUsedWeight)}%` }}
                        className="bg-neutral-400 transition-all duration-300"
                        title={`Already used by other KPIs: ${alreadyUsedWeight}%`}
                      />
                      {/* This KPI segment */}
                      <div
                        style={{ width: `${Math.min(100 - alreadyUsedWeight, thisKpiPct)}%` }}
                        className={`transition-all duration-300 ${
                          isExceeded ? 'bg-rose-500' : 'bg-emerald-600'
                        }`}
                        title={`This KPI: ${weight}%`}
                      />
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-neutral-500 mt-1">
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-neutral-400" />
                        <span>Already Used ({alreadyUsedWeight}%)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${isExceeded ? 'bg-rose-500' : 'bg-emerald-600'}`} />
                        <span>This KPI ({weight}%)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-neutral-200 border border-neutral-300" />
                        <span>Available ({freePct}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Allocation Stats Cards */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-neutral-200/80 text-center">
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Total Node Budget</span>
                      <span className="font-mono font-bold text-neutral-900">100%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Already Used</span>
                      <span className="font-mono font-bold text-neutral-800">{alreadyUsedWeight}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Remaining for Node</span>
                      <span
                        className={`font-mono font-bold ${
                          remainingWeight > 0 ? 'text-emerald-800' : 'text-rose-700'
                        }`}
                      >
                        {remainingWeight}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block font-semibold text-neutral-800 mb-1">
                      Weight for this KPI (%) <span className="text-rose-500">* (১০০% এর বেশি দেওয়া যাবে না)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={remainingWeight}
                        step={1}
                        value={weight === 0 ? '' : weight}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : Number(e.target.value);
                          if (val > remainingWeight) {
                            // Enforce strict limit: do not let user exceed 100% total
                            setWeight(remainingWeight);
                            setError(`Weight cannot exceed remaining allocation (${remainingWeight}%). Maximum limit enforced.`);
                          } else if (val < 0) {
                            setWeight(0);
                          } else {
                            setWeight(val);
                            setError(null);
                          }
                        }}
                        className={`w-32 px-3 py-1.5 rounded-md border font-mono font-bold text-xs focus:outline-hidden focus:ring-1 ${
                          isExceeded
                            ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-500'
                            : 'border-neutral-300 bg-white text-neutral-900 focus:ring-emerald-700'
                        }`}
                      />
                      <span className="text-neutral-500 text-xs font-semibold">%</span>
                    </div>
                    <span className="text-[10.5px] text-neutral-400 mt-1 block">
                      সর্বোচ্চ অনুমোদিত ওয়েট: <strong>{remainingWeight}%</strong> (কোনোভাবেই ১০০% এর বেশি ইনপুট দেওয়া যাবে না)
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* STEP 5: MEASUREMENT & TARGET */}
          {currentStep === 5 && (
            <div className="space-y-4">
              {/* Baseline */}
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-neutral-800">
                    Baseline (Reference Benchmark)
                  </label>
                  <span className="text-[10px] text-neutral-500">
                    Reference only {baselineUnit === 'percentage' && '(0% - 100%)'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] text-neutral-500 mb-1">
                      Baseline Value {baselineUnit === 'percentage' ? '(0 - 100%)' : ''}
                    </label>
                    <input
                      type="number"
                      min={baselineUnit === 'percentage' ? 0 : undefined}
                      max={baselineUnit === 'percentage' ? 100 : undefined}
                      step={baselineUnit === 'percentage' ? 0.1 : 'any'}
                      value={isNaN(baselineValue) ? '' : baselineValue}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                        if (baselineUnit === 'percentage') {
                          if (val > 100) {
                            setBaselineValue(100);
                            setError('Baseline percentage cannot exceed 100%.');
                          } else if (val < 0) {
                            setBaselineValue(0);
                          } else {
                            setBaselineValue(val);
                            setError(null);
                          }
                        } else {
                          setBaselineValue(val);
                        }
                      }}
                      className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs font-mono text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] text-neutral-500 mb-1">
                      Unit of Measure
                    </label>
                    <select
                      value={baselineUnit}
                      onChange={(e) => {
                        const newUnit = e.target.value as UnitType;
                        setBaselineUnit(newUnit);
                        if (newUnit === 'percentage') {
                          if (baselineValue > 100) setBaselineValue(100);
                          if (baselineValue < 0) setBaselineValue(0);
                        }
                      }}
                      className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                    >
                      <option value="percentage">Percentage (%) [0-100%]</option>
                      <option value="number">Number (#)</option>
                      <option value="currency">Currency (৳ / $)</option>
                      <option value="ratio">Ratio (:)</option>
                      <option value="time">Hours / Days</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Target */}
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-neutral-800">
                    Annual Target Value <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-neutral-500 font-medium">
                    100% Achievement Point {targetUnit === 'percentage' && '(0% - 100%)'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] text-neutral-500 mb-1">
                      Target Value {targetUnit === 'percentage' ? '(0 - 100%)' : ''} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={targetUnit === 'percentage' ? 0 : undefined}
                      max={targetUnit === 'percentage' ? 100 : undefined}
                      step={targetUnit === 'percentage' ? 0.1 : 'any'}
                      value={isNaN(targetValue) ? '' : targetValue}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                        if (targetUnit === 'percentage') {
                          if (val > 100) {
                            setTargetValue(100);
                            setError('Target percentage cannot exceed 100%.');
                          } else if (val < 0) {
                            setTargetValue(0);
                          } else {
                            setTargetValue(val);
                            setError(null);
                          }
                        } else {
                          setTargetValue(val);
                        }
                      }}
                      className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs font-mono font-bold text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] text-neutral-500 mb-1">
                      Unit of Measure
                    </label>
                    <select
                      value={targetUnit}
                      onChange={(e) => {
                        const newUnit = e.target.value as UnitType;
                        setTargetUnit(newUnit);
                        if (newUnit === 'percentage') {
                          if (targetValue > 100) setTargetValue(100);
                          if (targetValue < 0) setTargetValue(0);
                        }
                      }}
                      className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                    >
                      <option value="percentage">Percentage (%) [0-100%]</option>
                      <option value="number">Number (#)</option>
                      <option value="currency">Currency (৳ / $)</option>
                      <option value="ratio">Ratio (:)</option>
                      <option value="time">Hours / Days</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50/70 flex items-center justify-between">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={handlePrevious}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
              currentStep === 1
                ? 'opacity-40 cursor-not-allowed border-neutral-200 text-neutral-400'
                : 'border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 cursor-pointer'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-md border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-semibold rounded-md bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-colors cursor-pointer"
              >
                <span>Next Step</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-semibold rounded-md bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingKPI ? 'Update KPI' : 'Create & Save KPI'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
