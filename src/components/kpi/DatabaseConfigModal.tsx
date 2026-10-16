import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Server,
  Code2,
  Copy,
  Check,
} from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
} from '../../services/supabase';

interface DatabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const DatabaseConfigModal: React.FC<DatabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [url, setUrl] = useState<string>('');
  const [anonKey, setAnonKey] = useState<string>('');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const config = getStoredSupabaseConfig();
      setUrl(config.url || '');
      setAnonKey(config.anonKey || '');
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: 'Both Supabase Project URL and Anon Key are required.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection(url.trim(), anonKey.trim());
    setIsTesting(false);

    if (res.connected) {
      saveSupabaseConfig(url.trim(), anonKey.trim());
      setTestResult({
        success: true,
        message:
          res.error ||
          'Connection successful! Live cloud sync is now enabled with your Supabase database.',
      });
      onConfigSaved();
    } else {
      setTestResult({
        success: false,
        message: res.error || 'Failed to connect. Please check your URL and Key.',
      });
    }
  };

  const handleClear = () => {
    saveSupabaseConfig('', '');
    setUrl('');
    setAnonKey('');
    setTestResult({
      success: true,
      message: 'Supabase credentials cleared. App is now using local storage mode.',
    });
    onConfigSaved();
  };

  const copyDdl = () => {
    const ddl = `-- PostgreSQL Schema for Bitopi KPI System
CREATE TABLE IF NOT EXISTS units (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    location TEXT,
    access_code TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    unit_id TEXT,
    division TEXT DEFAULT 'Non-Corporate',
    name TEXT NOT NULL,
    short_code TEXT,
    department_id TEXT UNIQUE,
    access_code TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sections (
    id TEXT PRIMARY KEY,
    department_id TEXT,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subsections (
    id TEXT PRIMARY KEY,
    section_id TEXT,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpis (
    id TEXT PRIMARY KEY,
    kpi_code TEXT NOT NULL,
    unit_id TEXT,
    division TEXT DEFAULT 'Non-Corporate',
    department_id TEXT,
    section_id TEXT,
    subsection_id TEXT,
    kra TEXT NOT NULL,
    major_objective TEXT NOT NULL,
    aligned_org_goal_level TEXT DEFAULT 'department',
    aligned_org_goal_id TEXT,
    aligned_org_goal_label TEXT,
    aligned_goal_no INTEGER,
    smart_kpi_text TEXT NOT NULL,
    specific_s TEXT,
    measure_m TEXT,
    achievable_a BOOLEAN DEFAULT TRUE,
    relevant_r BOOLEAN DEFAULT TRUE,
    time_t TEXT,
    perspective TEXT DEFAULT 'Process',
    responsible_concern TEXT[] DEFAULT '{}',
    requirements TEXT,
    datasource TEXT,
    weight NUMERIC DEFAULT 10,
    baseline_value NUMERIC DEFAULT 0,
    baseline_unit TEXT DEFAULT 'percentage',
    target_value NUMERIC DEFAULT 100,
    target_unit TEXT DEFAULT 'percentage',
    target_policy TEXT DEFAULT 'fixed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpi_monthly_entries (
    id TEXT PRIMARY KEY,
    kpi_id TEXT REFERENCES kpis(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    achievement_value NUMERIC,
    achievement_unit TEXT DEFAULT 'percentage',
    status TEXT DEFAULT 'Pending',
    remarks TEXT,
    monthly_target_override NUMERIC,
    eligible_input NUMERIC,
    effective_target NUMERIC,
    performance NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_kpi_year_month UNIQUE (kpi_id, year, month)
);

-- Disable Row Level Security for full read/write or enable open public policies:
ALTER TABLE units DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE subsections DISABLE ROW LEVEL SECURITY;
ALTER TABLE kpis DISABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_monthly_entries DISABLE ROW LEVEL SECURITY;
`;
    navigator.clipboard.writeText(ddl);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Database Connection & Supabase Setup
              </h3>
              <p className="text-[11px] text-neutral-500">
                Connect your cloud Supabase database for real-time GET & POST
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Explanation Banner */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 leading-relaxed">
            <strong className="font-semibold block mb-1">
              ⚠️ কেন ডেটাবেজে Data GET / POST হচ্ছিল না?
            </strong>
            <p className="text-[11.5px] text-amber-800">
              আপনার অ্যাপ্লিকেশনে ক্লাউড Supabase-এর Project URL ও Anon Key
              ইনপুট দেওয়া ছিল না, অথবা ডেটাবেজের টেবিলগুলোতে Row Level Security
              (RLS) সক্রিয় ছিল যা ক্লায়েন্ট থেকে ইনসার্ট বা পোস্ট আটকে দিচ্ছিল।
              নিচের ফর্মের মাধ্যমে আপনার ক্রেডেনশিয়াল দিন এবং SQL Editor-এ
              টেবিলগুলো তৈরি করে নিন।
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div>
              <label className="block font-semibold text-neutral-800 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white font-mono text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
              />
              <span className="text-[10.5px] text-neutral-400 mt-1 block">
                Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL
              </span>
            </div>

            <div>
              <label className="block font-semibold text-neutral-800 mb-1">
                Supabase Anon (Public) Key
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white font-mono text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
              />
              <span className="text-[10.5px] text-neutral-400 mt-1 block">
                Supabase Dashboard &gt; Project Settings &gt; API &gt; Project API keys (anon public)
              </span>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg flex items-start gap-2.5 text-xs ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-700 mt-0.5" />
                )}
                <div>{testResult.message}</div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                Clear Credentials
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-neutral-300 hover:bg-neutral-50 text-neutral-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTesting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying &amp; Connecting...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Test &amp; Save Connection</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* SQL Editor Copy Box */}
          <div className="pt-3 border-t border-neutral-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-emerald-700" />
                SQL Query for Supabase SQL Editor (RLS Disabled for POST)
              </span>
              <button
                type="button"
                onClick={copyDdl}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-neutral-500 mb-2">
              Supabase-এ নতুন টেবিলে পোস্ট করতে চাইলে RLS নিষ্ক্রিয় থাকতে হয়
              বা পলিসি থাকতে হয়। উপরের &quot;Copy SQL&quot; বাটনে ক্লিক করে কোডটি
              কপি করুন এবং Supabase SQL Editor-এ রান করে নিন।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
