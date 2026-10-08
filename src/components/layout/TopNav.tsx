import React, { useState } from 'react';
import { UserSession } from '../../types';
import { BitopiLogo } from '../brand/BitopiLogo';
import {
  Layers,
  BarChart3,
  Building2,
  FileSpreadsheet,
  LogOut,
  ChevronDown,
  Shield,
  KeyRound,
} from 'lucide-react';

interface TopNavProps {
  currentTab: 'dashboard' | 'reports' | 'departments';
  onSelectTab: (tab: 'dashboard' | 'reports' | 'departments') => void;
  session: UserSession;
  onLogout: () => void;
  onSwitchRole: (targetRole: 'admin' | 'department') => void;
  onResetSeedData: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onSelectTab,
  session,
  onLogout,
  onSwitchRole,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Zone 1: Official Brand Icon & Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <BitopiLogo size={32} showText={false} variant="icon" />
              <div className="flex flex-col">
                <span className="font-bold text-neutral-900 tracking-tight text-sm uppercase leading-none">
                  Bitopi Group
                </span>
                <span className="text-[11px] text-neutral-600 font-normal leading-tight mt-0.5">
                  Industry KPI System
                </span>
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Section 6: KPI Dashboard, Reports, Departments) */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-semibold shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>KPI Dashboard</span>
            </button>

            <button
              onClick={() => onSelectTab('reports')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                currentTab === 'reports'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-semibold shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Reports</span>
            </button>

            {session.role === 'admin' ? (
              <button
                onClick={() => onSelectTab('departments')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  currentTab === 'departments'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-semibold shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Departments</span>
              </button>
            ) : (
              <span
                title="Only Administrator can manage department configurations"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-500 cursor-not-allowed select-none"
              >
                <Building2 className="w-3.5 h-3.5 opacity-60" />
                <span>Departments (Admin only)</span>
              </span>
            )}
          </nav>

          {/* Zone 3: Account & Session Switcher */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 py-1 px-2.5 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-colors text-left"
            >
              <div className="w-6 h-6 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700">
                {session.role === 'admin' ? (
                  <Shield className="w-3.5 h-3.5 text-emerald-700" />
                ) : (
                  <Building2 className="w-3.5 h-3.5 text-neutral-600" />
                )}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-neutral-900 leading-tight">
                  {session.role === 'admin' ? 'Administrator' : session.departmentName || 'Department'}
                </div>
                <div className="text-[10px] text-neutral-600 leading-tight">
                  {session.role === 'admin' ? 'Full Control' : `${session.departmentCode || 'DEP'} Scope`}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-neutral-600 ml-1" />
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-lg border border-neutral-200 shadow-lg z-40 py-1 text-xs">
                  <div className="px-3 py-2 border-b border-neutral-100">
                    <p className="text-[11px] text-neutral-600">Signed in as</p>
                    <p className="font-semibold text-neutral-900 truncate">
                      {session.role === 'admin'
                        ? session.email || 'emdadul.karim@bitopibd.com'
                        : `${session.departmentName} (${session.departmentCode})`}
                    </p>
                  </div>

                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                      Role / Scope
                    </div>

                    {session.role === 'department' ? (
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onSwitchRole('admin');
                        }}
                        className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-neutral-50 text-neutral-700"
                      >
                        <Shield className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Switch to Admin Login</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onSwitchRole('department');
                        }}
                        className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-neutral-50 text-neutral-700"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Switch to Department Login</span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-neutral-100 pt-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 flex items-center gap-2 text-rose-600 hover:bg-rose-50 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
