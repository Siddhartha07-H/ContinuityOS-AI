import React from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  ListTodo,
  TrendingUp,
  BrainCircuit,
  FileCheck2,
  ArrowUpRight,
  Upload,
  Bot,
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export function DashboardOverview({
  stats,
  documents,
  onSelectTab,
  onSelectDocument,
  onUploadClick,
}) {
  const completeness = stats?.average_completeness_score ?? 76;
  const totalDocs = stats?.total_documents ?? documents?.length ?? 3;
  const gapsCount = stats?.total_gaps_detected ?? 4;
  const criticalRisks = stats?.critical_risks_count ?? 3;
  const pendingTasks = stats?.pending_tasks_count ?? 6;
  const riskLevel = stats?.knowledge_risk_score ?? 'Moderate';

  return (
    <div className="space-y-6">
      {/* Top Banner / Transition Health Alert */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950/70 via-slate-900/80 to-slate-900 border border-blue-500/30 p-6 sm:p-7 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Continuity Health Engine • Active Handover Audit</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Knowledge Continuity Readiness: {completeness}%
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {totalDocs} transition documents analyzed. {gapsCount} documentation gaps identified (such as missing backup owners and unwritten secret rotation runbooks) requiring sign-off before handover completion.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onSelectTab('gaps')}
              className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all flex items-center gap-2"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Inspect {gapsCount} Knowledge Gaps</span>
            </button>
            <button
              onClick={() => onSelectTab('reports')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Generate Handover PDF</span>
            </button>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Ingested Docs</span>
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{totalDocs}</div>
          <div className="text-[11px] text-slate-400">PDF, DOCX, & TXT parsed</div>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Handover Score</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mb-1">{completeness}%</div>
          <div className="text-[11px] text-slate-400">Institutional retention rating</div>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Knowledge Gaps</span>
            <div className="w-8 h-8 rounded-lg bg-amber-600/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 mb-1">{gapsCount}</div>
          <div className="text-[11px] text-slate-400">Items marked "Not Found"</div>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Critical Risks</span>
            <div className="w-8 h-8 rounded-lg bg-red-600/10 text-red-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-400 mb-1">{criticalRisks}</div>
          <div className="text-[11px] text-slate-400">SPOFs & operational hazards</div>
        </div>

        {/* Card 5 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Pending Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-400 flex items-center justify-center">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-400 mb-1">{pendingTasks}</div>
          <div className="text-[11px] text-slate-400">Tracked transition deliverables</div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={onUploadClick}
          className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/40 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">Upload Document</div>
            <div className="text-[11px] text-slate-400">PDF, Word DOCX, or TXT</div>
          </div>
        </button>

        <button
          onClick={() => onSelectTab('analysis')}
          className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white group-hover:text-indigo-400 transition-colors">Handover Intelligence</div>
            <div className="text-[11px] text-slate-400">View 6 structured sections</div>
          </div>
        </button>

        <button
          onClick={() => onSelectTab('assistant')}
          className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/40 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-colors">Handover AI Assistant</div>
            <div className="text-[11px] text-slate-400">Ask questions with citations</div>
          </div>
        </button>

        <button
          onClick={() => onSelectTab('reports')}
          className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/40 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">Export PDF Report</div>
            <div className="text-[11px] text-slate-400">Download executive handover PDF</div>
          </div>
        </button>
      </div>

      {/* Main Grid: Recent Documents & Transition Readiness Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Ingested Documents List */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white">Ingested Transition Documents</h3>
              <p className="text-xs text-slate-400">Documents parsed with PyMuPDF, python-docx, and analyzed by Gemini AI</p>
            </div>
            <button
              onClick={() => onSelectTab('documents')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {documents && documents.length > 0 ? (
              documents.slice(0, 4).map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    onSelectDocument?.(doc);
                    onSelectTab('analysis');
                  }}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-800/80 hover:border-blue-500/40 hover:bg-slate-800/70 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        doc.file_type === 'pdf'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : doc.file_type === 'docx'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {doc.file_type?.toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                        {doc.filename}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{doc.word_count?.toLocaleString()} words</span>
                        <span>•</span>
                        <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Analyzed
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                No documents uploaded yet. Upload a PDF, DOCX, or TXT file to begin.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Handover Compliance & SPOF Watch */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Single Point of Failure Radar</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold">
                {riskLevel} Risk
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-slate-300">
                <div className="font-semibold text-red-300 mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>Missing Backup Owner</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Core cluster maintenance has no designated secondary engineer identified in transition notes.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-slate-300">
                <div className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Unwritten Runbook</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  PCI-DSS HSM key rotation and Kafka partition rebalancing lack documented SOPs.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-slate-300">
                <div className="font-semibold text-blue-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Staging Validation Test</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Aurora PostgreSQL failover drill scheduled for Sprint 24.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectTab('gaps')}
            className="w-full mt-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-2"
          >
            <span>Review All Identified Gaps</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

