import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ListTodo,
  Users,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Cpu,
  Layers,
  ChevronDown,
  Clock,
  Briefcase,
  AlertOctagon,
} from 'lucide-react';
import { api } from '../services/api';
import { LoadingSpinner, EmptyState } from './Toast';

export function HandoverAnalysis({
  documents,
  activeDocument,
  onSelectDocument,
  showToast,
}) {
  const [selectedDocId, setSelectedDocId] = useState(activeDocument?.id || documents?.[0]?.id || null);
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [activeSection, setActiveSection] = useState('all'); // 'all' | 'overview' | 'decisions' | 'tasks' | 'responsibilities' | 'risks' | 'next_steps'

  useEffect(() => {
    if (activeDocument) {
      setSelectedDocId(activeDocument.id);
    } else if (documents && documents.length > 0 && !selectedDocId) {
      setSelectedDocId(documents[0].id);
    }
  }, [activeDocument, documents]);

  useEffect(() => {
    if (selectedDocId) {
      loadAnalysis(selectedDocId);
    }
  }, [selectedDocId]);

  const loadAnalysis = async (docId) => {
    setIsLoading(true);
    try {
      const data = await api.analysis.getByDocument(docId);
      setAnalysis(data);
    } catch (err) {
      showToast?.('error', 'Analysis Load Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReanalyze = async () => {
    if (!selectedDocId) return;
    setIsReanalyzing(true);
    try {
      const data = await api.analysis.analyze(selectedDocId);
      setAnalysis(data);
      showToast?.('success', 'Analysis Refreshed', `Updated structured handover analysis via ${data.ai_provider}.`);
    } catch (err) {
      showToast?.('error', 'Reanalysis Failed', err.message);
    } finally {
      setIsReanalyzing(false);
    }
  };

  const currentDoc = documents?.find((d) => d.id === selectedDocId);

  const sectionsList = [
    { id: 'all', label: 'All 6 Pillars' },
    { id: 'overview', label: '1. Project Overview' },
    { id: 'decisions', label: '2. Important Decisions' },
    { id: 'tasks', label: '3. Pending Tasks' },
    { id: 'responsibilities', label: '4. Responsibilities' },
    { id: 'risks', label: '5. Risks & Challenges' },
    { id: 'next_steps', label: '6. Recommended Next Steps' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Selector & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Select Handover Source Document
            </label>
            <div className="relative">
              <select
                value={selectedDocId || ''}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedDocId(id);
                  const doc = documents.find((d) => d.id === id);
                  onSelectDocument?.(doc);
                }}
                className="w-full sm:w-80 px-3 py-1.5 pr-8 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
              >
                {documents && documents.length > 0 ? (
                  documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.filename} ({doc.file_type.toUpperCase()})
                    </option>
                  ))
                ) : (
                  <option value="">No documents available</option>
                )}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Status badges & Re-run action */}
        <div className="flex items-center gap-3">
          {analysis && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                Score: {analysis.completeness_score}%
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono">
                {analysis.ai_provider === 'gemini' ? '✨ Gemini AI' : '⚙️ Heuristic'}
              </span>
            </div>
          )}

          <button
            onClick={handleReanalyze}
            disabled={isReanalyzing || !selectedDocId}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-500/20 disabled:opacity-40 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
            <span>{isReanalyzing ? 'Analyzing...' : 'Re-Analyze with AI'}</span>
          </button>
        </div>
      </div>

      {/* Section Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {sectionsList.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeSection === sec.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner text="Generating structured 6-pillar handover intelligence..." />
      ) : analysis ? (
        <div className="space-y-6">
          {/* Engine Origin Callout */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
              analysis.ai_provider === 'gemini'
                ? 'bg-purple-950/30 border-purple-500/40 text-purple-200'
                : 'bg-blue-950/30 border-blue-500/40 text-blue-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">
                {analysis.ai_provider === 'gemini' ? '✨' : '⚙️'}
              </span>
              <div>
                <strong className="font-semibold">
                  {analysis.ai_provider === 'gemini'
                    ? 'Google Gemini 1.5 Flash Model'
                    : 'Deterministic Heuristic Fallback Engine'}
                </strong>
                <span className="text-slate-400 block text-[11px]">
                  {analysis.ai_provider === 'gemini'
                    ? 'Live generative reasoning applied to extracted document tokens with zero-hallucination guardrails.'
                    : 'Local semantic transition analyzer active (Active when GEMINI_API_KEY is not configured).'}
                </span>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase shrink-0 ${
                analysis.ai_provider === 'gemini'
                  ? 'bg-purple-900/60 text-purple-300 border border-purple-500/30'
                  : 'bg-blue-900/60 text-blue-300 border border-blue-500/30'
              }`}
            >
              {analysis.ai_provider === 'gemini' ? 'Live Gemini AI' : 'Heuristic Mode'}
            </span>
          </div>

          {/* 1. PROJECT OVERVIEW */}
          {(activeSection === 'all' || activeSection === 'overview') && (
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Project & Role Overview
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                {analysis.project_overview?.summary || 'Not Found in Documents'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Domain:</span>
                  <span className="text-white font-medium">
                    {analysis.project_overview?.domain || 'Not Found in Documents'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Current Status:</span>
                  <span className="text-emerald-400 font-medium">
                    {analysis.project_overview?.current_status || 'Active Transition'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Key Technologies:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.project_overview?.key_technologies?.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 font-mono text-[11px]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. IMPORTANT DECISIONS */}
          {(activeSection === 'all' || activeSection === 'decisions') && (
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Important Architectural & Operational Decisions
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.important_decisions?.length > 0 ? (
                  analysis.important_decisions.map((dec, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-850 bg-slate-900/70 border border-slate-800 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h4 className="text-xs font-bold text-white">{dec.title}</h4>
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-semibold">
                            {dec.status || 'Approved'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mb-2">
                          <strong className="text-slate-400 font-medium">Decision: </strong>
                          {dec.decision}
                        </p>
                        <p className="text-xs text-slate-400 mb-2">
                          <strong className="text-slate-500 font-medium">Rationale: </strong>
                          {dec.rationale}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
                        Context: {dec.date_or_context || 'Not Found in Documents'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500">Not Found in Documents</div>
                )}
              </div>
            </div>
          )}

          {/* 3. PENDING TASKS */}
          {(activeSection === 'all' || activeSection === 'tasks') && (
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-400 font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Pending Tasks & Handover Deliverables
                </h3>
              </div>

              <div className="space-y-3">
                {analysis.pending_tasks?.length > 0 ? (
                  analysis.pending_tasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              task.priority === 'High'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : task.priority === 'Medium'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {task.priority || 'Medium'}
                          </span>
                          <h4 className="text-xs font-bold text-white">{task.title}</h4>
                        </div>
                        <p className="text-xs text-slate-400">{task.description}</p>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] shrink-0">
                        <div>
                          <span className="text-slate-500 block">Owner:</span>
                          <span className={task.owner === 'Not Found in Documents' ? 'text-red-400 font-medium' : 'text-slate-200'}>
                            {task.owner}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Timeline:</span>
                          <span className="text-slate-300 font-mono">{task.due_or_timeline}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500">Not Found in Documents</div>
                )}
              </div>
            </div>
          )}

          {/* 4. RESPONSIBILITIES */}
          {(activeSection === 'all' || activeSection === 'responsibilities') && (
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Roles & Responsibilities Matrix
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.responsibilities?.length > 0 ? (
                  analysis.responsibilities.map((resp, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white">{resp.role_or_area}</h4>
                        <span className="text-[11px] text-blue-400 font-medium">Primary: {resp.primary_owner}</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px]">
                        <span className="text-slate-400">Designated Backup: </span>
                        <span className={resp.backup_person === 'Not Found in Documents' ? 'text-red-400 font-semibold' : 'text-emerald-400'}>
                          {resp.backup_person}
                        </span>
                        {resp.backup_person === 'Not Found in Documents' && (
                          <span className="block text-[10px] text-red-500/90 mt-0.5">
                            ⚠️ Critical Handover SPOF: Assign backup prior to departure
                          </span>
                        )}
                      </div>

                      {resp.key_duties?.length > 0 && (
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                            Key Operational Duties:
                          </span>
                          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                            {resp.key_duties.map((duty, dIdx) => (
                              <li key={dIdx}>{duty}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                        Dependencies: {resp.dependencies || 'None'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500">Not Found in Documents</div>
                )}
              </div>
            </div>
          )}

          {/* 5. RISKS AND CHALLENGES */}
          {(activeSection === 'all' || activeSection === 'risks') && (
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-lg bg-red-500/10 text-red-400 font-bold text-xs flex items-center justify-center">
                  5
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Critical Risks & Challenges
                </h3>
              </div>

              <div className="space-y-3">
                {analysis.risks_and_challenges?.length > 0 ? (
                  analysis.risks_and_challenges.map((risk, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                          <h4 className="text-xs font-bold text-white">{risk.risk_title}</h4>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            risk.severity === 'Critical'
                              ? 'bg-red-950 text-red-400 border border-red-500/40'
                              : risk.severity === 'High'
                              ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                              : 'bg-blue-950 text-blue-400 border border-blue-500/40'
                          }`}
                        >
                          {risk.severity} Severity
                        </span>
                      </div>

                      <div className="text-xs text-slate-300">
                        <strong className="text-slate-400 font-medium">Impact: </strong>
                        {risk.impact}
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
                        <strong className="text-emerald-400 font-medium">Mitigation Plan: </strong>
                        {risk.mitigation_plan}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500">Not Found in Documents</div>
                )}
              </div>
            </div>
          )}

          {/* 6. RECOMMENDED NEXT STEPS */}
          {(activeSection === 'all' || activeSection === 'next_steps') && (
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 font-bold text-xs flex items-center justify-center">
                  6
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Recommended Next Steps for Successor
                </h3>
              </div>

              <div className="space-y-3">
                {analysis.recommended_next_steps?.length > 0 ? (
                  analysis.recommended_next_steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-4"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                        {step.step_number || idx + 1}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-white">{step.title}</h4>
                          <span className="text-[11px] text-slate-400 font-mono">Owner: {step.owner}</span>
                        </div>
                        <p className="text-xs text-slate-300">
                          <strong className="text-blue-400 font-medium">Immediate Action: </strong>
                          {step.immediate_action}
                        </p>
                        <p className="text-xs text-slate-400">
                          <strong className="text-emerald-400 font-medium">Expected Outcome: </strong>
                          {step.expected_outcome}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500">Not Found in Documents</div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={BrainCircuit}
          title="No analysis available for this document"
          description="Click the button below to generate full structured handover intelligence using Google Gemini AI."
          actionText="Analyze Document"
          onAction={handleReanalyze}
        />
      )}
    </div>
  );
}

