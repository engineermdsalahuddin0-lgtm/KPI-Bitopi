import React, { useState, useEffect } from 'react';
import { Unit, Department, Section, Subsection, UserSession } from '../../types';
import { db } from '../../services/db';
import {
  loginAsAdmin,
  loginAsDepartment,
  loginAsSection,
  loginAsSubsection,
} from '../../services/auth';
import { BitopiLogo } from '../brand/BitopiLogo';
import {
  Shield,
  KeyRound,
  AlertCircle,
  ArrowRight,
  Building2,
  Layers,
  GitFork,
  Sparkles,
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'department' | 'section' | 'subsection'>('department');

  // Admin form
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Hierarchy Data
  const [units, setUnits] = useState<Unit[]>(() => db.getUnits());

  // Department / Section / Subsection Form
  const [deptUnitId, setDeptUnitId] = useState<string>(() => db.getUnits()[0]?.id || 'unit-bgl');
  const availableDepts = db.getDepartments(deptUnitId);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(() => {
    const d = db.getDepartments(db.getUnits()[0]?.id || 'unit-bgl');
    return d[0]?.id || '';
  });
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedSubId, setSelectedSubId] = useState<string>('');
  const [deptCodeInput, setDeptCodeInput] = useState('');
  const [accessCodeInput, setAccessCodeInput] = useState('');

  const [error, setError] = useState<string | null>(null);

  // Subscribe to reactive database changes
  useEffect(() => {
    const unsub = db.subscribe(() => {
      setUnits(db.getUnits());
    });
    return unsub;
  }, []);

  const cleanLabel = (text?: string): string => {
    if (!text) return '';
    return text.replace(/\s*\([^)]*\)/g, '').trim();
  };

  // Available sections for current selected dept
  const currentSections: Section[] = selectedDeptId ? db.getSections(selectedDeptId) : [];
  // Available subsections for current selected section
  const currentSubsections: Subsection[] = selectedSectionId ? db.getSubsections(selectedSectionId) : [];

  // When changing dept unit, pick first department and load credentials
  const handleDeptUnitChange = (uId: string) => {
    setDeptUnitId(uId);
    const depts = db.getDepartments(uId);
    if (depts.length > 0) {
      handleDepartmentChange(depts[0].id);
    } else {
      setSelectedDeptId('');
      setSelectedSectionId('');
      setSelectedSubId('');
      setDeptCodeInput('');
      setAccessCodeInput('');
    }
  };

  const handleDepartmentChange = (deptId: string) => {
    setSelectedDeptId(deptId);
    const secs = db.getSections(deptId);
    const firstSec = secs[0]?.id || '';
    setSelectedSectionId(firstSec);
    if (firstSec) {
      const subs = db.getSubsections(firstSec);
      setSelectedSubId(subs[0]?.id || '');
    } else {
      setSelectedSubId('');
    }

    const dept = db.getDepartmentById(deptId) || db.getDepartments().find((d) => d.id === deptId);
    if (dept) {
      setDeptCodeInput(dept.department_id);
      setAccessCodeInput(dept.access_code);
    }
  };

  // Auto-init department credentials if empty
  useEffect(() => {
    if (availableDepts.length > 0 && !selectedDeptId) {
      handleDepartmentChange(availableDepts[0].id);
    }
  }, [availableDepts, selectedDeptId]);

  const handleSectionChange = (secId: string) => {
    setSelectedSectionId(secId);
    const subs = db.getSubsections(secId);
    setSelectedSubId(subs[0]?.id || '');
  };

  // Quick fill helper for department testing
  const handleQuickFillDept = (deptId: string) => {
    handleDepartmentChange(deptId);
    setError(null);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = loginAsAdmin(adminEmail, adminPassword);
    if (res.success) {
      onLoginSuccess({
        role: 'admin',
        email: adminEmail,
      });
    } else {
      setError(res.error || 'Authentication failed');
    }
  };

  const handleNodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (activeTab === 'department') {
      const res = loginAsDepartment(selectedDeptId, deptCodeInput, accessCodeInput);
      if (res.success && res.session) {
        onLoginSuccess(res.session);
      } else {
        setError(res.error || 'Invalid department credentials.');
      }
    } else if (activeTab === 'section') {
      if (!selectedSectionId) {
        setError('Please select a Section first.');
        return;
      }
      const res = loginAsSection(selectedDeptId, selectedSectionId, deptCodeInput, accessCodeInput);
      if (res.success && res.session) {
        onLoginSuccess(res.session);
      } else {
        setError(res.error || 'Invalid section credentials.');
      }
    } else if (activeTab === 'subsection') {
      if (!selectedSectionId || !selectedSubId) {
        setError('Please select a Section & Sub-section first.');
        return;
      }
      const res = loginAsSubsection(selectedDeptId, selectedSectionId, selectedSubId, deptCodeInput, accessCodeInput);
      if (res.success && res.session) {
        onLoginSuccess(res.session);
      } else {
        setError(res.error || 'Invalid sub-section credentials.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Brand Lockup with Official Bitopi Icon */}
        <div className="text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-white p-2.5 shadow-xs border border-neutral-200/80 flex items-center justify-center">
            <BitopiLogo size={44} showText={false} variant="icon" />
          </div>
          <h1 className="mt-3 text-lg font-bold tracking-tight text-neutral-900 uppercase">
            Bitopi Group
          </h1>
          <p className="text-xs text-neutral-600 mt-0.5">
            KPI tracker
          </p>
        </div>

        {/* Card */}
        <div className="mt-6 bg-white py-6 px-6 sm:px-8 shadow-sm rounded-xl border border-neutral-200">
          {/* Tab Selector: Admin vs Dept Head vs Section vs Sub-section */}
          <div className="grid grid-cols-4 border-b border-neutral-200 mb-5 text-[11px]">
            <button
              onClick={() => {
                setActiveTab('admin');
                setError(null);
              }}
              className={`py-2 text-center font-semibold border-b-2 transition-colors flex flex-col items-center justify-center gap-1 ${
                activeTab === 'admin'
                  ? 'border-emerald-800 text-emerald-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('department');
                setError(null);
                if (!deptCodeInput) handleQuickFillDept(selectedDeptId);
              }}
              className={`py-2 text-center font-semibold border-b-2 transition-colors flex flex-col items-center justify-center gap-1 ${
                activeTab === 'department'
                  ? 'border-emerald-800 text-emerald-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Dept Head</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('section');
                setError(null);
                if (!deptCodeInput) handleQuickFillDept(selectedDeptId);
              }}
              className={`py-2 text-center font-semibold border-b-2 transition-colors flex flex-col items-center justify-center gap-1 ${
                activeTab === 'section'
                  ? 'border-emerald-800 text-emerald-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Section</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('subsection');
                setError(null);
                if (!deptCodeInput) handleQuickFillDept(selectedDeptId);
              }}
              className={`py-2 text-center font-semibold border-b-2 transition-colors flex flex-col items-center justify-center gap-1 ${
                activeTab === 'subsection'
                  ? 'border-emerald-800 text-emerald-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Sub-section</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. ADMIN LOGIN FORM (Strictly No autofill) */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminSubmit} autoComplete="off" className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Master Administrator Email
                </label>
                <input
                  type="email"
                  name="bitopi_admin_login_email_no_autofill"
                  id="bitopi_admin_login_email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="Enter administrator email"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Master Password
                </label>
                <input
                  type="password"
                  name="bitopi_admin_login_password_no_autofill"
                  id="bitopi_admin_login_password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 text-xs"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <span>Enter Admin Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* 2. DEPARTMENT / SECTION / SUBSECTION LOGIN FORM */}
          {(activeTab === 'department' || activeTab === 'section' || activeTab === 'subsection') && (
            <form onSubmit={handleNodeSubmit} className="space-y-4 text-xs">
              {/* Unit Selector */}
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  1. Business Unit
                </label>
                <select
                  value={deptUnitId}
                  onChange={(e) => handleDeptUnitChange(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 text-xs bg-white"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {cleanLabel(u.name)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Selector */}
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  2. Department
                </label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 text-xs bg-white font-medium"
                >
                  {availableDepts.length === 0 ? (
                    <option value="">No departments found for this unit</option>
                  ) : (
                    availableDepts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {cleanLabel(d.name)}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Section Selector */}
              {(activeTab === 'section' || activeTab === 'subsection') && (
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    3. Section
                  </label>
                  {currentSections.length > 0 ? (
                    <select
                      value={selectedSectionId}
                      onChange={(e) => handleSectionChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 text-xs bg-white"
                    >
                      {currentSections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2 bg-neutral-50 rounded border border-neutral-200 text-neutral-500 text-[11px]">
                      No sections configured for this department yet.
                    </div>
                  )}
                </div>
              )}

              {/* Sub-section Selector */}
              {activeTab === 'subsection' && (
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    4. Sub-section
                  </label>
                  {currentSubsections.length > 0 ? (
                    <select
                      value={selectedSubId}
                      onChange={(e) => setSelectedSubId(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 text-xs bg-white"
                    >
                      {currentSubsections.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2 bg-neutral-50 rounded border border-neutral-200 text-neutral-500 text-[11px]">
                      No sub-sections configured for this section yet.
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Dept ID
                  </label>
                  <input
                    type="text"
                    value={deptCodeInput}
                    onChange={(e) => setDeptCodeInput(e.target.value)}
                    placeholder="BGL-IE-54A"
                    className="w-full px-3 py-1.5 rounded-md border border-neutral-300 font-mono focus:outline-hidden focus:ring-1 focus:ring-emerald-700 text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Access Code
                  </label>
                  <input
                    type="text"
                    value={accessCodeInput}
                    onChange={(e) => setAccessCodeInput(e.target.value)}
                    placeholder="IE-52K-37P"
                    className="w-full px-3 py-1.5 rounded-md border border-neutral-300 font-mono focus:outline-hidden focus:ring-1 focus:ring-emerald-700 text-xs uppercase"
                  />
                </div>
              </div>

              {/* Quick fill button */}
              <button
                type="button"
                onClick={() => handleQuickFillDept(selectedDeptId)}
                className="w-full py-1.5 px-3 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>Auto-Fill Credentials for Selected Node</span>
              </button>

              <button
                type="submit"
                className="w-full py-2 px-4 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <span>
                  Enter as {activeTab === 'department' ? 'Dept Head' : activeTab === 'section' ? 'Section Incharge' : 'Sub-section Lead'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-neutral-200/80 text-center">
            <p className="text-[11px] text-neutral-500">
              Direct node mapping: Unit → Department → Section → Sub-section.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
