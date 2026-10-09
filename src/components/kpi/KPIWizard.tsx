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
  const units = db.getUnits();

  // Role permissions
  const isUnitUser = session?.role === 'unit';
  const isDeptUser = session?.role === 'department';
  const isSectionUser = session?.role === 'section';
  const isSubsectionUser = session?.role === 'subsection';

  // 1. Goal Level / Node Point
  const defaultLevel: OrgGoalLevel = editingKPI?.aligned_org_goal_level ||
    (isSubsectionUser
      ? 'subsection'
      : isSectionUser
      ? 'section'
      : isDeptUser
      ? 'department'
      : isUnitUser
      ? 'unit'
      : 'department');

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

  // Update sections whenever departmentId changes
  useEffect(() => {
    if (departmentId) {
      const s = db.getSections(departmentId);
      setSections(s);
      // Validate sectionId
      if (sectionId && !s.some((sec) => sec.id === sectionId)) {
        if (!isSectionUser && !isSubsectionUser) {
          setSectionId(s[0]?.id || '');
        }
      } else if (!sectionId && s.length > 0 && (orgGoalLevel === 'section' || orgGoalLevel === 'subsection')) {
        setSectionId(s[0].id);
      }
    } else {
      setSections([]);
    }
  }, [departmentId, orgGoalLevel, isSectionUser, isSubsectionUser]);

  // Update subsections whenever sectionId changes
  useEffect(() => {
    if (sectionId) {
      const subs = db.getSubsections(sectionId);
      setSubsections(subs);
      if (subsectionId && !subs.some((sub) => sub.id === subsectionId)) {
        if (!isSubsectionUser) {
          setSubsectionId(subs[0]?.id || '');
        }
      } else if (!subsectionId && subs.length > 0 && orgGoalLevel === 'subsection') {
        setSubsectionId(subs[0].id);
      }
    } else {
      setSubsections([]);
    }
  }, [sectionId, orgGoalLevel, isSubsectionUser]);

  // Step 1: Objective
  const [kra, setKra] = useState<string>(editingKPI?.kra || '');
  const [majorObjective, setMajorObjective] = useState<string>(editingKPI?.major_objective || '');

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
      ? editingKPI.responsible_concern.filter((r) => r.toLowerCase() !== 'rahim' && r.toLowerCase() !== 'karim')
      : [ROLE_SUGGESTIONS[defaultLevel][0]]
  );
  const [newConcernInput, setNewConcernInput] = useState<string>('');
  const [datasource, setDatasource] = useState<string>(editingKPI?.datasource || 'Official ERP / Operations Report');
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

  const [error, setError] = useState<string | null>(null);

  // Calculate current node details
  const selectedUnitObj = units.find((u) => u.id === unitId);
  const selectedDeptObj = unitDepartments.find((d) => d.id === departmentId);
  const selectedSecObj = sections.find((s) => s.id === sectionId);
  const selectedSubObj = subsections.find((sub) => sub.id === subsectionId);

  // Target Node Info
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
      ? selectedUnitObj?.name || 'Unit'
      : orgGoalLevel === 'department'
      ? selectedDeptObj?.name || 'Department'
      : orgGoalLevel === 'section'
      ? selectedSecObj?.name || 'Section'
      : selectedSubObj?.name || 'Sub-section';

  // Weight calculations for Step 4
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
      if (!datasource.trim()) {
        setError('Datasource is required.');
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
      department_id: finalDeptId,
      section_id: orgGoalLevel === 'section' || orgGoalLevel === 'subsection' ? sectionId : undefined,
      subsection_id: orgGoalLevel === 'subsection' ? subsectionId : undefined,
      kra: kra.trim(),
      major_objective: majorObjective.trim(),
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
                    disabled={isDeptUser || isSectionUser || isSubsectionUser}
                    onClick={() => setOrgGoalLevel('unit')}
                    className={`py-2 px-2 text-center rounded-lg border font-medium text-xs flex flex-col items-center justify-center gap-1 transition-colors ${
                      orgGoalLevel === 'unit'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs font-semibold'
                        : isDeptUser || isSectionUser || isSubsectionUser
                        ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-60'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <Factory className="w-3.5 h-3.5" />
                    <span>Unit Head</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSectionUser || isSubsectionUser}
                    onClick={() => setOrgGoalLevel('department')}
                    className={`py-2 px-2 text-center rounded-lg border font-medium text-xs flex flex-col items-center justify-center gap-1 transition-colors ${
                      orgGoalLevel === 'department'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs font-semibold'
                        : isSectionUser || isSubsectionUser
                        ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-60'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Dept Head</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubsectionUser}
                    onClick={() => setOrgGoalLevel('section')}
                    className={`py-2 px-2 text-center rounded-lg border font-medium text-xs flex flex-col items-center justify-center gap-1 transition-colors ${
                      orgGoalLevel === 'section'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs font-semibold'
                        : isSubsectionUser
                        ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-60'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Section Incharge</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrgGoalLevel('subsection')}
                    className={`py-2 px-2 text-center rounded-lg border font-medium text-xs flex flex-col items-center justify-center gap-1 transition-colors ${
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

                {/* 2. Department Selector (shown for Dept, Section, Subsection) */}
                {orgGoalLevel !== 'unit' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      2. Department
                    </label>
                    {isDeptUser || isSectionUser || isSubsectionUser ? (
                      <div className="flex items-center justify-between p-2 rounded-md bg-white border border-neutral-200 text-neutral-800">
                        <span className="font-semibold">{cleanLabel(selectedDeptObj?.name || session?.departmentName || 'Current Department')}</span>
                      </div>
                    ) : (
                      <select
                        value={departmentId}
                        onChange={(e) => handleDepartmentSelectChange(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 font-medium"
                      >
                        {unitDepartments.length === 0 ? (
                          <option value="">No departments found for this unit</option>
                        ) : (
                          unitDepartments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {cleanLabel(dept.name)}
                            </option>
                          ))
                        )}
                      </select>
                    )}
                  </div>
                )}

                {/* 3. Section Selector (shown for Section & Subsection) */}
                {(orgGoalLevel === 'section' || orgGoalLevel === 'subsection') && (
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      3. Section (সেকশন)
                    </label>
                    {isSectionUser || isSubsectionUser ? (
                      <div className="flex items-center justify-between p-2 rounded-md bg-white border border-neutral-200 text-neutral-800">
                        <span className="font-semibold">{selectedSecObj?.name || session?.sectionName || 'Current Section'}</span>
                        <Lock className="w-3 h-3 text-neutral-400" />
                      </div>
                    ) : (
                      <select
                        value={sectionId}
                        onChange={(e) => setSectionId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                      >
                        <option value="">Select Section...</option>
                        {sections.map((sec) => (
                          <option key={sec.id} value={sec.id}>
                            {sec.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* 4. Subsection Selector (shown for Subsection) */}
                {orgGoalLevel === 'subsection' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      4. Sub-section (সাব-সেকশন)
                    </label>
                    {isSubsectionUser ? (
                      <div className="flex items-center justify-between p-2 rounded-md bg-white border border-neutral-200 text-neutral-800">
                        <span className="font-semibold">{selectedSubObj?.name || session?.subsectionName || 'Current Sub-section'}</span>
                        <Lock className="w-3 h-3 text-neutral-400" />
                      </div>
                    ) : (
                      <select
                        value={subsectionId}
                        onChange={(e) => setSubsectionId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                      >
                        <option value="">Select Sub-section...</option>
                        {subsections.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Live Node Banner */}
                <div className="mt-2 p-2 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">📍 Anchored Node:</span>
                    <span>{targetNodeLabel}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200/80 text-emerald-950 uppercase tracking-wider">
                    {orgGoalLevel} level
                  </span>
                </div>
              </div>

              {/* KRA (Key Result Area) */}
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  KRA (Key Result Area)
                </label>
                <input
                  type="text"
                  value={kra}
                  onChange={(e) => setKra(e.target.value)}
                  placeholder="e.g. Line Efficiency, Sewing Quality, SMV Compliance, Cost Reduction"
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                />
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  Rule: Exactly one KRA per field.
                </p>
              </div>

              {/* Major Objective (MO) */}
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Major Objective (MO)
                </label>
                <input
                  type="text"
                  value={majorObjective}
                  onChange={(e) => setMajorObjective(e.target.value)}
                  placeholder="e.g. Increase sewing floor line efficiency to 72% for Q1 2026"
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                />
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  Rule: Exactly one Major Objective per field.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: KPI DEFINITION (SMART BUILDER) */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-800">Statement Construction</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setKpiMode('direct')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      kpiMode === 'direct'
                        ? 'bg-neutral-800 text-white font-semibold'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    Direct Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setKpiMode('smart')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                      kpiMode === 'smart'
                        ? 'bg-emerald-800 text-white font-semibold'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    SMART Builder
                  </button>
                </div>
              </div>

              {kpiMode === 'smart' && (
                <div className="bg-neutral-50 p-3.5 rounded-lg border border-neutral-200 space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Specific (S) — What specific result?
                    </label>
                    <input
                      type="text"
                      value={specificS}
                      onChange={(e) => setSpecificS(e.target.value)}
                      placeholder="e.g. Reduce line stoppage due to needle breakages"
                      className="w-full px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Measurable (M) — How measured?
                    </label>
                    <input
                      type="text"
                      value={measureM}
                      onChange={(e) => setMeasureM(e.target.value)}
                      placeholder="e.g. less than 1.2% total hours lost"
                      className="w-full px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-[11px] font-medium text-neutral-700">
                      <input
                        type="checkbox"
                        checked={achievableA}
                        onChange={(e) => setAchievableA(e.target.checked)}
                        className="rounded border-neutral-300 text-emerald-700"
                      />
                      <span>Achievable (A)</span>
                    </label>
                    <label className="flex items-center gap-2 text-[11px] font-medium text-neutral-700">
                      <input
                        type="checkbox"
                        checked={relevantR}
                        onChange={(e) => setRelevantR(e.target.checked)}
                        className="rounded border-neutral-300 text-emerald-700"
                      />
                      <span>Relevant (R)</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Time-bound (T) — Target timeline
                    </label>
                    <input
                      type="text"
                      value={timeT}
                      onChange={(e) => setTimeT(e.target.value)}
                      placeholder="e.g. by end of March 2026"
                      className="w-full px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateSMARTStatement}
                    className="w-full py-1.5 px-3 rounded bg-emerald-800 text-white font-semibold text-xs hover:bg-emerald-900 transition-colors"
                  >
                    Synthesize Plain Statement
                  </button>
                </div>
              )}

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Plain KPI Statement
                </label>
                <textarea
                  rows={3}
                  value={smartKpiText}
                  onChange={(e) => setSmartKpiText(e.target.value)}
                  placeholder="Enter the complete single-statement KPI description..."
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                />
              </div>
            </div>
          )}

          {/* STEP 3: OWNERSHIP (NODE GOVERNANCE, NO PERSONAL USER DATA) */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Responsible Role / Concern Designation
                </label>
                <p className="text-[11px] text-neutral-500 mb-2">
                  Mapped to organizational designations at this node point (No personal user data).
                </p>

                {/* Selected Designation Tags */}
                <div className="flex flex-wrap gap-1.5 mb-2.5 min-h-[30px] p-2 bg-neutral-50 rounded-md border border-neutral-200">
                  {responsibleConcern.map((person) => (
                    <span
                      key={person}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-950 border border-emerald-300/80"
                    >
                      {person}
                      <button
                        type="button"
                        onClick={() => handleRemoveConcern(person)}
                        className="text-emerald-700 hover:text-rose-700 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Quick Suggestion Chips */}
                <div className="mb-3">
                  <span className="text-[10px] font-semibold text-neutral-500 block mb-1">
                    Quick Node Designations:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLE_SUGGESTIONS[orgGoalLevel].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleAddConcern(sug)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                          responsibleConcern.includes(sug)
                            ? 'bg-neutral-200 text-neutral-500 border-neutral-300 cursor-not-allowed'
                            : 'bg-white text-neutral-700 border-neutral-300 hover:bg-emerald-50 hover:border-emerald-300'
                        }`}
                        disabled={responsibleConcern.includes(sug)}
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Designation Input */}
                <div className="flex items-center gap-2">
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
                    placeholder="Or type custom designation (e.g. Line Balancing Officer)..."
                    className="flex-1 px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddConcern()}
                    className="px-3 py-1.5 rounded-md bg-neutral-800 text-white font-semibold text-xs hover:bg-neutral-900"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Datasource (তথ্যসূত্র)
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
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-neutral-800 text-xs">
                    Node Weight Budget Allocation ({targetNodeLabel})
                  </span>
                  <span className="font-mono text-xs font-bold text-neutral-900">
                    100% Total
                  </span>
                </div>

                {/* Allocation Stats */}
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
                    <span className="text-[10px] text-neutral-500 block">Remaining</span>
                    <span className={`font-mono font-bold ${remainingWeight > 0 ? 'text-emerald-700' : 'text-neutral-500'}`}>
                      {remainingWeight}%
                    </span>
                  </div>
                </div>

                {/* Visual Bar */}
                <div className="w-full h-3 bg-neutral-200 rounded-full mt-3 overflow-hidden flex">
                  <div
                    style={{ width: `${Math.min(alreadyUsedWeight, 100)}%` }}
                    className="bg-neutral-600 h-full"
                    title={`Already allocated: ${alreadyUsedWeight}%`}
                  />
                  <div
                    style={{ width: `${Math.min(weight, Math.max(0, 100 - alreadyUsedWeight))}%` }}
                    className={`h-full ${weight > remainingWeight ? 'bg-rose-500' : 'bg-emerald-600'}`}
                    title={`This KPI: ${weight}%`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  KPI Weight (%)
                </label>
                <div className="relative max-w-xs">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs font-mono text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              </div>

              {/* Exact Validation Warnings */}
              {weight > remainingWeight && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>⚠ Weight exceeds remaining allocation for this node.</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-rose-200 font-mono text-[11px]">
                    <div>Remaining: {remainingWeight}%</div>
                    <div>Entered: {weight}%</div>
                    <div>Max allowed: {remainingWeight}%</div>
                  </div>
                </div>
              )}

              {alreadyUsedWeight + weight === 100 && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>✓ Weight allocation complete (100%)</span>
                </div>
              )}

              {alreadyUsedWeight + weight < 100 && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>
                    Current node weight is {alreadyUsedWeight + weight}%, remaining budget: {100 - (alreadyUsedWeight + weight)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: MEASUREMENT & TARGET */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Perspective
                </label>
                <select
                  value={perspective}
                  onChange={(e) => setPerspective(e.target.value as PerspectiveType)}
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                >
                  <option value="Process">Process</option>
                  <option value="Account">Account</option>
                  <option value="Learning & Development">Learning & Development</option>
                  <option value="Customer">Customer</option>
                </select>
              </div>

              {/* Baseline */}
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-neutral-800">
                    Baseline (Reference Benchmark)
                  </label>
                  <span className="text-[10px] text-neutral-500">
                    Reference only
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-neutral-600 mb-0.5">Unit</label>
                    <select
                      value={baselineUnit}
                      onChange={(e) => setBaselineUnit(e.target.value as UnitType)}
                      className="w-full px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-xs"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="number">Number</option>
                      <option value="unit">Unit</option>
                      <option value="day">Day</option>
                      <option value="currency_bdt">Currency (BDT ৳)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-600 mb-0.5">Value</label>
                    <input
                      type="number"
                      step="any"
                      value={baselineValue}
                      onChange={(e) => setBaselineValue(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Target */}
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-neutral-800">
                    Target (Benchmark Goal)
                  </label>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    Denominator for monthly performance
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-neutral-600 mb-0.5">Unit</label>
                    <select
                      value={targetUnit}
                      onChange={(e) => setTargetUnit(e.target.value as UnitType)}
                      className="w-full px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-xs"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="number">Number</option>
                      <option value="unit">Unit</option>
                      <option value="day">Day</option>
                      <option value="currency_bdt">Currency (BDT ৳)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-600 mb-0.5">Value</label>
                    <input
                      type="number"
                      step="any"
                      value={targetValue}
                      onChange={(e) => setTargetValue(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-xs font-bold text-neutral-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={handlePrevious}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
              currentStep === 1
                ? 'opacity-40 cursor-not-allowed border-neutral-200 text-neutral-400 bg-white'
                : 'border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-100'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-neutral-600 hover:bg-neutral-200/60 transition-colors"
            >
              Cancel
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold bg-emerald-800 text-white hover:bg-emerald-900 transition-colors shadow-2xs"
              >
                Next Step
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold bg-emerald-800 text-white hover:bg-emerald-900 transition-colors shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                {editingKPI ? 'Save Changes' : 'Create Node KPI'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
