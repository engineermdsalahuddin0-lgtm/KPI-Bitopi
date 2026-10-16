import React, { useState } from 'react';
import { UserSession } from '../../types';
import { loginAsAdmin } from '../../services/auth';
import { BitopiLogo } from '../brand/BitopiLogo';
import { Shield, AlertCircle, ArrowRight, Lock, Sparkles } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

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
      setError(res.error || 'Authentication failed. Please check your admin credentials.');
    }
  };

  const handleQuickFillAdmin = () => {
    setAdminEmail('emdadul.karim@bitopibd.com');
    setAdminPassword('emdadul.karim@bitopibd.com');
    setError(null);
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
            KPI tracker · Administrator Portal
          </p>
        </div>

        {/* Card */}
        <div className="mt-6 bg-white py-6 px-6 sm:px-8 shadow-sm rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-neutral-200 text-xs">
            <div className="flex items-center gap-2 font-bold text-neutral-900">
              <Shield className="w-4 h-4 text-emerald-700" />
              <span>Admin Authentication</span>
            </div>
            <span className="text-[10.5px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Master Access
            </span>
          </div>

          {error && (
            <div className="mb-4 p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* ADMIN LOGIN FORM */}
          <form onSubmit={handleAdminSubmit} autoComplete="off" className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Master Administrator Email
              </label>
              <input
                type="email"
                name="bitopi_admin_login_email"
                id="bitopi_admin_login_email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Enter administrator email"
                autoComplete="off"
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
                name="bitopi_admin_login_password"
                id="bitopi_admin_login_password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter administrator password"
                autoComplete="new-password"
                className="w-full px-3 py-2 rounded-md border border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 text-xs"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <span>Enter Admin Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* One-Click Quick Fill for testing convenience */}
          <div className="mt-4 pt-3.5 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-[11px] text-neutral-500">
              Authorized admin test credentials:
            </span>
            <button
              type="button"
              onClick={handleQuickFillAdmin}
              className="text-[11px] text-emerald-800 hover:text-emerald-950 font-semibold underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-emerald-700" />
              <span>Fill Admin Demo</span>
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-neutral-500 mt-4">
          Bitopi Enterprise KPI Monitoring & Tracking System
        </p>
      </div>
    </div>
  );
};
