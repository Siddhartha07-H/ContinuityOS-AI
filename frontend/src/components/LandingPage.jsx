import React from 'react';
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
  FileCheck2,
  AlertTriangle,
  Bot,
  FileText,
  Lock,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Cpu,
  BarChart3,
} from 'lucide-react';

export function LandingPage({ onEnterApp, onOpenAuth }) {
  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="fixed top-0 inset-x-0 z-40 h-16 bg-[#080B11]/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-[#080B11] rounded-[9px] flex items-center justify-center">
                <Layers className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
              Continuity<span className="text-blue-500">OS</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-medium">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onEnterApp}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Enter Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Ambient Gradient Blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-blue-600/15 via-indigo-600/15 to-cyan-500/15 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-400 text-xs font-medium mb-6 animate-in fade-in duration-500">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Google Gemini AI Powered Handover & Knowledge Continuity</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.15]">
            Never Lose Vital Team Knowledge When Key Employees Leave.
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            ContinuityOS AI ingests unstructured transition documents, code specs, and runbooks (PDF, Word DOCX, TXT), automatically extracting 6-pillar handover intelligence, identifying single points of failure, and generating executive sign-off reports.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={onEnterApp}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-xl shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Launch Live Continuity Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition-all"
            >
              Create Account
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <div className="text-center p-2">
              <div className="text-2xl font-black text-white mb-1">0%</div>
              <div className="text-xs text-slate-400 font-medium">Hallucinations (Strict Grounding)</div>
            </div>
            <div className="text-center p-2">
              <div className="text-2xl font-black text-blue-400 mb-1">3 Formats</div>
              <div className="text-xs text-slate-400 font-medium">Native PDF, DOCX, TXT Parsing</div>
            </div>
            <div className="text-center p-2">
              <div className="text-2xl font-black text-indigo-400 mb-1">6 Pillars</div>
              <div className="text-xs text-slate-400 font-medium">Structured Handover Sections</div>
            </div>
            <div className="text-center p-2">
              <div className="text-2xl font-black text-cyan-400 mb-1">1-Click PDF</div>
              <div className="text-xs text-slate-400 font-medium">Executive Handover Reports</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Section */}
      <section className="py-20 px-4 sm:px-6 bg-slate-950/40 border-t border-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Engineered for Enterprise Continuity
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto">
              Prevent project delays, security risks from unrotated credentials, and costly blindspots during engineering role changes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-blue-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Multiformat Document Parser</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Extracts complete text and tabular metadata from complex PDFs via PyMuPDF, Word documents (.docx) via python-docx, and plain text notes.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-blue-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">6-Point Handover Intelligence</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generates rigorous structured breakdowns: Project Overview, Important Decisions, Pending Tasks, Responsibilities, Risks & Challenges, and Recommended Next Steps.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-blue-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Knowledge Gap Detector</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Detects missing passwords, lack of secondary backup owners, absent runbooks, and unwritten disaster recovery playbooks with clear "Not Found in Documents" alerts.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-blue-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Grounded AI Assistant</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chat with uploaded transition documents. Answers questions with precise document citations and never hallucinates unverified facts.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-blue-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Executive PDF Handover Reports</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Export professional, formatted PDF reports featuring executive summaries, decision matrices, task priorities, and a mutual sign-off acceptance sheet.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-blue-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Enterprise Security & Audit Trail</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Full immutable audit logging for all document uploads, AI analyses, and report exports. API keys never exposed in frontend code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-900 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">ContinuityOS AI</span>
            <span>• Intelligent Knowledge Continuity & Handover Platform</span>
          </div>
          <div>Built with React, FastAPI, SQLite, and Google Gemini AI</div>
        </div>
      </footer>
    </div>
  );
}

