import React from 'react';
import {
  Upload,
  Cpu,
  Sparkles,
  ShieldCheck,
  Search,
  Bell,
  Settings,
  LogIn,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Header({
  currentTab,
  onUploadClick,
  onOpenSettings,
  onOpenAuth,
  systemStatus,
  isSidebarCollapsed,
}) {
  const { user, isAuthenticated } = useAuth();

  const tabTitles = {
    overview: 'Executive Dashboard & Handover Health',
    documents: 'Documents Hub — Ingest & Text Extraction',
    analysis: 'Handover Analysis & Structured Summaries',
    gaps: 'Knowledge Gap & Single Point of Failure Detector',
    assistant: 'Continuity AI Knowledge Assistant',
    reports: 'Handover Reports & Downloadable PDF Generation',
    audit: 'Audit Log & Knowledge Traceability',
  };

  return (
    <header
      className={`fixed top-0 right-0 z-20 h-16 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 transition-all duration-300 flex items-center justify-between px-6 ${
        isSidebarCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Title & Breadcrumb */}
      <div>
        <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          {tabTitles[currentTab] || 'ContinuityOS Platform'}
        </h1>
        <p className="text-[11px] text-slate-400">
          Organizational Knowledge Protection & Transition Intelligence
        </p>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Gemini Engine Status Pill */}
        <button
          onClick={onOpenSettings}
          className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 hover:border-blue-500/50 text-[11px] font-medium transition-colors"
          title="Click to configure Gemini API Key"
        >
          {systemStatus?.gemini_connected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-400 font-semibold">Gemini AI Active</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span className="text-blue-300">Heuristic Engine</span>
            </>
          )}
        </button>

        {/* Quick Upload Button */}
        <button
          onClick={onUploadClick}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Upload Document</span>
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {!isAuthenticated && (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-950/40 text-blue-300 text-xs font-semibold hover:bg-blue-900/40 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}

