/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserSession } from './types';
import { getStoredSession, saveSession, clearSession } from './services/auth';
import { db } from './services/db';
import { TopNav } from './components/layout/TopNav';
import { KPIDashboard } from './components/kpi/KPIDashboard';
import { DepartmentManagement } from './components/departments/DepartmentManagement';
import { ReportsDashboard } from './components/reports/ReportsDashboard';
import { LoginView } from './components/auth/LoginView';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'reports' | 'departments'>('dashboard');
  const [key, setKey] = useState<number>(0);

  // Initialize session on mount (#7: Admin lands directly on KPI Dashboard)
  useEffect(() => {
    const s = getStoredSession();
    setSession(s);
  }, []);

  const handleLogout = () => {
    clearSession();
    setSession(null);
  };

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    saveSession(newSession);
    setCurrentTab('dashboard');
  };

  const handleSwitchRole = (targetRole: 'admin' | 'department') => {
    // Prevent unauthenticated switching: require legitimate login
    clearSession();
    setSession(null);
  };

  const handleResetSeedData = () => {
    if (window.confirm('Reset all KPI and department records back to original Bitopi demo seed data?')) {
      db.resetToSeedData();
      setKey((prev) => prev + 1);
    }
  };

  // If not logged in, show Login View
  if (!session) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div key={key} className="min-h-screen bg-neutral-100/70 text-neutral-900 flex flex-col font-sans">
      {/* Top Navigation Bar (#6: NO left sidebar, Topbar only) */}
      <TopNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        session={session}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        onResetSeedData={handleResetSeedData}
      />

      {/* Main View Port */}
      <main className="flex-1 pb-12">
        {currentTab === 'dashboard' && (
          <KPIDashboard
            session={session}
            onNavigateToDepartments={() => setCurrentTab('departments')}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsDashboard
            onSelectDepartment={(deptId) => {
              setCurrentTab('dashboard');
            }}
          />
        )}

        {currentTab === 'departments' && session.role === 'admin' && (
          <DepartmentManagement
            onSelectDepartmentForKPI={(deptId) => {
              setCurrentTab('dashboard');
            }}
          />
        )}
      </main>

      {/* Footer Notice */}
      <footer className="border-t border-neutral-200/80 bg-white py-3 px-4 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-700">BITOPI GROUP</span>
            <span>·</span>
            <span>Industry KPI Management System</span>
          </div>
          <div className="text-[11px] text-neutral-600">
            Internal Governance & Enterprise Performance Tracking
          </div>
        </div>
      </footer>
    </div>
  );
}
