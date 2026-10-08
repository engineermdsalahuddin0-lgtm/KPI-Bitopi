import React, { useState } from 'react';
import { Department, UserSession } from '../../types';
import { db } from '../../services/db';
import { loginAsAdmin, loginAsDepartment } from '../../services/auth';
import { BitopiLogo } from '../brand/BitopiLogo';
import { Shield, KeyRound, AlertCircle, ArrowRight, Building2, CheckCircle2 } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'department'>('admin');

  // Admin form
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Department form (#8)
  const departments = db.getDepartments();
  const [selectedDeptId, setSelectedDeptId] = useState(departments[0]?.id || 'dept-ie');
  const [deptCodeInput, setDeptCodeInput] = useState('');
  const [accessCodeInput, setAccessCodeInput] = useState('');

  const [error, setError] = useState<string | null>(null);

  // Quick fill helper for department testing
  const handleQuickFillDept = (deptId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    if (dept) {
      setSelectedDeptId(dept.id);
      setDeptCodeInput(dept.department_id);
      setAccessCodeInput(dept.access_code);
      setError(null);
    }
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

  const handleDepartmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = loginAsDepartment(selectedDeptId, deptCodeInput, accessCodeInput);
    if (res.success && res.session) {
      onLoginSuccess(res.session);
    } else {
      setError(res.error || 'Invalid department credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Lockup with Official Bitopi Icon */}
        <div className="text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-white p-2.5 shadow-xs border border-neutral-200/80 flex items-center justify-center">
            <BitopiLogo size={44} showText={false} variant="icon" />
          </div>
          <h1 className="mt-3 text-lg font-bold tracking-tight text-neutral-900 uppercase">
            Bitopi Group
          </h1>
          <p className="text-xs text-neutral-600 mt-0.5">
            Industry KPI Management System
          </p>
        </div>

        {/* Card */}
        <div className="mt-6 bg-white py-6 px-6 sm:px-8 shadow-sm rounded-xl border border-neutral-200">
          {/* Tab Selector: Admin Login vs Department Login */}
          <div className="flex border-b border-neutral-200 mb-5">
            <button
              onClick={() => {
                setActiveTab('admin');
                setError(null);
              }}
              className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'border-emerald-800 text-emerald-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Login</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('department');
                setError(null);
                // Prepopulate with first dept for convenient review
                if (!deptCodeInput) {
                  handleQuickFillDept(selectedDeptId);
                }
              }}
              className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'department'
                  ? 'border-emerald-800 text-emerald-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Department Login</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* ADMIN LOGIN FORM (#7) */}
          {activeTab === 'admin' ? (
            <form onSubmit={handleAdminSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="Enter admin email"
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Sign In as Admin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            /* DEPARTMENT LOGIN FORM (#8) */
            <form onSubmit={handleDepartmentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Department
                </label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => {
                    setSelectedDeptId(e.target.value);
                    handleQuickFillDept(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.short_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Department ID
                </label>
                <input
                  type="text"
                  required
                  value={deptCodeInput}
                  onChange={(e) => setDeptCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. IE-7F29"
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 bg-white text-xs font-mono uppercase text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Access Code
                </label>
                <input
                  type="text"
                  required
                  value={accessCodeInput}
                  onChange={(e) => setAccessCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. X8K-29P-Q7M"
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 bg-white text-xs font-mono uppercase text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Enter Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Quick test credentials autofill buttons */}
              <div className="pt-2 border-t border-neutral-100">
                <span className="text-[11px] text-neutral-600 block mb-1.5">
                  Quick Demo Autofill:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickFillDept('dept-ie')}
                    className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded text-[11px] font-medium"
                  >
                    Industrial Engineering
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFillDept('dept-prod')}
                    className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded text-[11px] font-medium"
                  >
                    Production
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFillDept('dept-qa')}
                    className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded text-[11px] font-medium"
                  >
                    QA & Audit
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
