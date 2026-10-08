import React, { useState, useEffect } from 'react';
import {
  Department,
  Section,
  Subsection,
  KPI,
  PerspectiveType,
  UnitType,
  TargetPolicyType,
  OrgGoalLevel,
} from '../../types';
import { db } from '../../services/db';
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  HelpCircle,
  Plus,
  Trash2,
  Sparkles,
  Building2,
  Lock,
} from 'lucide-react';

interface KPIWizardProps {
  initialDepartmentId: string;
  departments: Department[];
  editingKPI?: KPI | null;
  onSave: (kpiData: Omit<KPI, 'id' | 'kpi_code' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
  lockDepartment?: boolean;
}

export const KPIWizard: React.FC<KPIWizardProps> = ({
  initialDepartmentId,
  departments,
  editingKPI,
  onSave,
  onClose,
  lockDepartment = false,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [departmentId, setDepartmentId] = useState<string>(
    editingKPI?.department_id || initialDepartmentId || departments[0]?.id || ''
  );
  const [sectionId, setSectionId] = useState<string>(editingKPI?.section_id || '');
  const [subsectionId, setSubsectionId] = useState<string>(editingKPI?.subsection_id || '');

  // Step 1: Objective
  const [kra, setKra] = useState<string>(editingKPI?.kra || '');
  const [majorObjective, setMajorObjective] = useState<string>(editingKPI?.major_objective || '');
  const [orgGoalLevel, setOrgGoalLevel] = useState<OrgGoalLevel>(
    editingKPI?.aligned_org_goal_level || 'department'
  );
  const [orgGoalId, setOrgGoalId] = useState<string>(
    editingKPI?.aligned_org_goal_id || departmentId
  );

  // Step 2: KPI Definition
  const [kpiMode, setKpiMode] = useState<'direct' | 'smart'>('direct');
  const [smartKpiText, setSmartKpiText] = useState<string>(editingKPI?.smart_kpi_text || '');
  const [specificS, setSpecificS] = useState<string>(editingKPI?.specific_s || '');
  const [measureM, setMeasureM] = useState<string>(editingKPI?.measure_m || '');
  const [achievableA, setAchievableA] = useState<boolean>(editingKPI?.achievable_a ?? true);
  const [relevantR, setRelevantR] = useState<boolean>(editingKPI?.relevant_r ?? true);
  const [timeT, setTimeT] = useState<string>(editingKPI?.time_t || '');

  // Step 3: Ownership
  const [responsibleConcern, setResponsibleConcern] = useState<string[]>(
    editingKPI?.responsible_concern || ['Rahim']
  );
  const [newConcernInput, setNewConcernInput] = useState<string>('');
  const [datasource, setDatasource] = useState<string>(editingKPI?.datasource || 'IE Monthly Report');
  const [requirements, setRequirements] = useState<string>(editingKPI?.requirements || '');

  // Step 4: Weight
  const [weight, setWeight] = useState<number>(editingKPI?.weight || 20);

  // Step 5: Measurement
  const [perspective, setPerspective] = useState<PerspectiveType>(
    editingKPI?.perspective || 'Process'
  );
  const [baselineValue, setBaselineValue] = useState<number>(editingKPI?.baseline_value ?? 80);
  const [baselineUnit, setBaselineUnit] = useState<UnitType>(editingKPI?.baseline_unit || 'percentage');
  const [targetValue, setTargetValue] = useState<number>(editingKPI?.target_value ?? 90);
  const [targetUnit, setTargetUnit] = useState<UnitType>(editingKPI?.target_unit || 'percentage');
  const [targetPolicy, setTargetPolicy] = useState<TargetPolicyType>(
    editingKPI?.target_policy || 'fixed'
  );

  // Hierarchy lists
  const [sections, setSections] = useState<Section[]>([]);
  const [subsections, setSubsections] = useState<Subsection[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch sections & subsections when departmentId changes
  useEffect(() => {
    if (departmentId) {
      const s = db.getSections(departmentId);
      setSections(s);
      if (s.length > 0 && !sectionId) {
        // preserve if editing
      }
    }
  }, [departmentId]);

  useEffect(() => {
    if (sectionId) {
      const subs = db.getSubsections(sectionId);
      setSubsections(subs);
    } else {
      setSubsections([]);
    }
  }, [sectionId]);

  // Sync orgGoalId with selection
  useEffect(() => {
    if (orgGoalLevel === 'department') {
      setOrgGoalId(departmentId);
    } else if (orgGoalLevel === 'section') {
      setOrgGoalId(sectionId || sections[0]?.id || departmentId);
    } else if (orgGoalLevel === 'subsection') {
      setOrgGoalId(subsectionId || subsections[0]?.id || departmentId);
    }
  }, [orgGoalLevel, departmentId, sectionId, subsectionId, sections, subsections]);

  // Weight calculations for Step 4
  const alreadyUsedWeight = db.getDepartmentAllocatedWeight(departmentId, editingKPI?.id);
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
  const handleAddConcern = () => {
    if (newConcernInput.trim()) {
      if (!responsibleConcern.includes(newConcernInput.trim())) {
        setResponsibleConcern([...responsibleConcern, newConcernInput.trim()]);
      }
      setNewConcernInput('');
    }
  };

  const handleRemoveConcern = (person: string) => {
    setResponsibleConcern(responsibleConcern.filter((p) => p !== person));
  };

  // Step Validation
  const validateStep = (step: number): boolean => {
    setError(null);
    if (step === 1) {
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
        setError('KPI text is required.');
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (responsibleConcern.length === 0) {
        setError('At least one Responsible Concern is required.');
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

    // Find goal label
    let goalLabel = departments.find((d) => d.id === departmentId)?.name || 'Department';
    if (orgGoalLevel === 'section') {
      const s = sections.find((x) => x.id === orgGoalId);
      if (s) goalLabel = s.name;
    } else if (orgGoalLevel === 'subsection') {
      const sub = subsections.find((x) => x.id === orgGoalId);
      if (sub) goalLabel = sub.name;
    }

    onSave({
      department_id: departmentId,
      section_id: sectionId || undefined,
      subsection_id: subsectionId || undefined,
      kra: kra.trim(),
      major_objective: majorObjective.trim(),
      aligned_org_goal_level: orgGoalLevel,
      aligned_org_goal_id: orgGoalId,
      aligned_org_goal_label: goalLabel,
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
      target_policy: targetPolicy,
    });
  };

  const stepsList = [
    { num: 1, title: 'Objective' },
    { num: 2, title: 'KPI Definition' },
    { num: 3, title: 'Ownership' },
    { num: 4, title: 'Weight' },
    { num: 5, title: 'Measurement' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Wizard Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">
              {editingKPI ? `Edit KPI: ${editingKPI.kpi_code}` : 'Create New KPI'}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Configure organizational alignment, SMART metrics, and weight allocation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 5-Step Progress Bar (#20) */}
        <div className="px-6 py-3 border-b border-neutral-200 bg-white">
          <div className="flex items-center justify-between">
            {stepsList.map((st, idx) => (
              <React.Fragment key={st.num}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold font-mono ${
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
                    className={`text-xs font-medium hidden sm:inline ${
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

          {/* STEP 1: OBJECTIVE (#21) */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Target Department
                </label>
                {lockDepartment ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-800 shrink-0" />
                      <div>
                        <div className="font-semibold text-xs text-neutral-900">
                          {departments.find((d) => d.id === departmentId)?.name || 'Your Department'}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-mono">
                          Code: {departments.find((d) => d.id === departmentId)?.short_code || ''}
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-200/80 text-emerald-950">
                      <Lock className="w-3 h-3" />
                      Your Department
                    </span>
                  </div>
                ) : (
                  <select
                    value={departmentId}
                    onChange={(e) => {
                      setDepartmentId(e.target.value);
                      setSectionId('');
                      setSubsectionId('');
                    }}
                    className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.short_code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  KRA (Key Result Area)
                </label>
                <input
                  type="text"
                  value={kra}
                  onChange={(e) => setKra(e.target.value)}
                  placeholder="Enter one KRA (e.g. Productivity, Quality, Cost Optimization)"
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                />
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  Rule: Exactly one KRA per field. Do not combine multiple areas.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Major Objective (MO)
                </label>
                <input
                  type="text"
                  value={majorObjective}
                  onChange={(e) => setMajorObjective(e.target.value)}
                  placeholder="Enter one MO (e.g. Improve production line efficiency to 90%)"
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                />
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  Rule: Exactly one MO per field.
                </p>
              </div>

              {/* Aligned with ORG Goal (#21) */}
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-neutral-800">
                    Aligned with ORG Goal (Organizational Hierarchy)
                  </label>
                  <span className="text-[10px] text-neutral-500">
                    Dept → Section → Sub-section
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrgGoalLevel('department')}
                    className={`py-1.5 px-2 text-center rounded border font-medium text-xs transition-colors ${
                      orgGoalLevel === 'department'
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                    }`}
                  >
                    Department
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrgGoalLevel('section')}
                    className={`py-1.5 px-2 text-center rounded border font-medium text-xs transition-colors ${
                      orgGoalLevel === 'section'
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                    }`}
                  >
                    Section
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrgGoalLevel('subsection')}
                    className={`py-1.5 px-2 text-center rounded border font-medium text-xs transition-colors ${
                      orgGoalLevel === 'subsection'
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                    }`}
                  >
                    Sub-section
                  </button>
                </div>

                {orgGoalLevel === 'department' && (
                  <div className="text-xs text-neutral-700 bg-white p-2 rounded border border-neutral-200">
                    Aligned with: <strong>{departments.find((d) => d.id === departmentId)?.name}</strong>
                  </div>
                )}

                {orgGoalLevel === 'section' && (
                  <div>
                    <select
                      value={sectionId}
                      onChange={(e) => {
                        setSectionId(e.target.value);
                        setOrgGoalId(e.target.value);
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-xs text-neutral-900"
                    >
                      <option value="">Select Section...</option>
                      {sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {orgGoalLevel === 'subsection' && (
                  <div className="space-y-1.5">
                    <select
                      value={sectionId}
                      onChange={(e) => setSectionId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-xs text-neutral-900"
                    >
                      <option value="">Select Section first...</option>
                      {sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={subsectionId}
                      onChange={(e) => {
                        setSubsectionId(e.target.value);
                        setOrgGoalId(e.target.value);
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-xs text-neutral-900"
                    >
                      <option value="">Select Sub-section...</option>
                      {subsections.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: KPI DEFINITION (#22) */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex border-b border-neutral-200">
                <button
                  type="button"
                  onClick={() => setKpiMode('direct')}
                  className={`py-2 px-4 font-medium text-xs border-b-2 transition-colors ${
                    kpiMode === 'direct'
                      ? 'border-emerald-800 text-emerald-900 font-semibold'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  Direct KPI
                </button>
                <button
                  type="button"
                  onClick={() => setKpiMode('smart')}
                  className={`py-2 px-4 font-medium text-xs border-b-2 transition-colors ${
                    kpiMode === 'smart'
                      ? 'border-emerald-800 text-emerald-900 font-semibold'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  SMART Builder
                </button>
              </div>

              {kpiMode === 'direct' ? (
                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">
                    SMART KPI Statement
                  </label>
                  <textarea
                    rows={3}
                    value={smartKpiText}
                    onChange={(e) => setSmartKpiText(e.target.value)}
                    placeholder="e.g. Improve production line efficiency to 90% by December 2026."
                    className="w-full px-3 py-2 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              ) : (
                <div className="space-y-3 bg-neutral-50 p-3.5 rounded-lg border border-neutral-200">
                  <div>
                    <label className="block font-semibold text-neutral-800 mb-1">
                      Specific (S)
                    </label>
                    <input
                      type="text"
                      value={specificS}
                      onChange={(e) => setSpecificS(e.target.value)}
                      placeholder="What specific outcome will be achieved?"
                      className="w-full px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-800 mb-1">
                      Measure (M)
                    </label>
                    <input
                      type="text"
                      value={measureM}
                      onChange={(e) => setMeasureM(e.target.value)}
                      placeholder="How will success be measured and verified?"
                      className="w-full px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-neutral-800 mb-1">
                        Achievable (A)
                      </label>
                      <select
                        value={achievableA ? 'yes' : 'no'}
                        onChange={(e) => setAchievableA(e.target.value === 'yes')}
                        className="w-full px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-xs"
                      >
                        <option value="yes">Yes (Feasible with available resources)</option>
                        <option value="no">No</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-800 mb-1">
                        Relevant (R)
                      </label>
                      <select
                        value={relevantR ? 'yes' : 'no'}
                        onChange={(e) => setRelevantR(e.target.value === 'yes')}
                        className="w-full px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-xs"
                      >
                        <option value="yes">Yes (Directly aligned with goals)</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-800 mb-1">
                      Time-bound (T)
                    </label>
                    <input
                      type="text"
                      value={timeT}
                      onChange={(e) => setTimeT(e.target.value)}
                      placeholder="Target date or review cadence (e.g. by December 2026)"
                      className="w-full px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateSMARTStatement}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-800 text-white text-xs font-medium hover:bg-emerald-900 transition-colors shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Statement</span>
                  </button>

                  <div>
                    <label className="block font-semibold text-neutral-800 mb-1">
                      Generated KPI Statement
                    </label>
                    <textarea
                      rows={2}
                      value={smartKpiText}
                      onChange={(e) => setSmartKpiText(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: OWNERSHIP (#23) */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Responsible Concern (Persons / Owners)
                </label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-md border border-neutral-300 bg-white min-h-[42px]">
                  {responsibleConcern.map((person) => (
                    <span
                      key={person}
                      className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded text-xs font-medium"
                    >
                      <span>{person}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveConcern(person)}
                        className="text-neutral-400 hover:text-neutral-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1 flex-1 min-w-[120px]">
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
                      placeholder="Type name & press Enter..."
                      className="w-full px-1.5 py-0.5 text-xs border-none focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleAddConcern}
                      className="text-emerald-800 hover:text-emerald-900 p-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Datasource
                </label>
                <input
                  type="text"
                  value={datasource}
                  onChange={(e) => setDatasource(e.target.value)}
                  placeholder="e.g. IE Monthly Report, ERP MES, QA Floor Register"
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Requirements & Prerequisites
                </label>
                <textarea
                  rows={3}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Operational protocols, input availability, equipment preconditions..."
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                />
              </div>
            </div>
          )}

          {/* STEP 4: WEIGHT ALLOCATION (#24) */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-neutral-800 text-xs">
                    Department Weight Budget Allocation
                  </span>
                  <span className="font-mono text-xs font-bold text-neutral-900">
                    100% Total
                  </span>
                </div>

                {/* Allocation Stats */}
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-neutral-200/80 text-center">
                  <div>
                    <span className="text-[10px] text-neutral-500 block">Assigned Weight</span>
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

              {/* Exact Validation Warnings (#24) */}
              {weight > remainingWeight && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>⚠ Weight exceeds remaining allocation.</span>
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
                    ⚠ Department KPI weight is incomplete. Current: {alreadyUsedWeight + weight}%, Remaining: {100 - (alreadyUsedWeight + weight)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: MEASUREMENT (#25, #26, #27, #32, #38) */}
          {currentStep === 5 && (
            <div className="space-y-4">
              {/* Perspective Selection (#32: Process, Account, Learning & Development, Customer) */}
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

              {/* Baseline (#26: Reference value, unit + val) */}
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-neutral-800">
                    Baseline (Reference Benchmark)
                  </label>
                  <span className="text-[10px] text-neutral-500">
                    Reference only — NOT scoring denominator (#26)
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
                      className="w-full px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Target (#27: unit + val) */}
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-neutral-800">
                    Target
                  </label>
                  <span className="text-[10px] text-neutral-500">
                    Unit formats numbers automatically (#27)
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
                      className="w-full px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Target Policy (#38: Fixed vs Workload Adjusted) */}
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Target Policy
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded border border-neutral-200 bg-white cursor-pointer hover:bg-neutral-50">
                    <input
                      type="radio"
                      name="policy"
                      value="fixed"
                      checked={targetPolicy === 'fixed'}
                      onChange={() => setTargetPolicy('fixed')}
                      className="text-emerald-800"
                    />
                    <div>
                      <div className="font-medium text-neutral-900">Fixed Target</div>
                      <div className="text-[10px] text-neutral-500">Standard monthly target</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded border border-neutral-200 bg-white cursor-pointer hover:bg-neutral-50">
                    <input
                      type="radio"
                      name="policy"
                      value="workload_adjusted"
                      checked={targetPolicy === 'workload_adjusted'}
                      onChange={() => setTargetPolicy('workload_adjusted')}
                      className="text-emerald-800"
                    />
                    <div>
                      <div className="font-medium text-neutral-900">Workload Adjusted</div>
                      <div className="text-[10px] text-neutral-500">MIN(Target, Eligible Input)</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="px-6 py-3.5 border-t border-neutral-200 bg-neutral-50/70 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="px-3.5 py-1.5 text-xs font-medium rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-1.5 text-xs font-medium rounded-md bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-colors flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={weight > remainingWeight}
                className="px-4 py-1.5 text-xs font-medium rounded-md bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingKPI ? 'Save Changes' : 'Create KPI'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
