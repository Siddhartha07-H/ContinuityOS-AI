import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Download,
  Plus,
  Eye,
  Calendar,
  User,
  ArrowRight,
  FileText,
  X,
  Sparkles,
  CheckCircle2,
  Printer,
} from 'lucide-react';
import { api } from '../services/api';
import { LoadingSpinner, EmptyState } from './Toast';

export function HandoverReports({ documents, showToast }) {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReportView, setSelectedReportView] = useState(null);

  // Form State
  const [title, setTitle] = useState('Staff Engineering Role Transition & System Handover Package');
  const [targetRole, setTargetRole] = useState('Incoming Principal Lead');
  const [departingEmployee, setDepartingEmployee] = useState('Alex Vance');
  const [successorName, setSuccessorName] = useState('Jordan Reed');
  const [selectedDocIds, setSelectedDocIds] = useState([]);

  useEffect(() => {
    loadReports();
    if (documents) {
      setSelectedDocIds(documents.map((d) => d.id));
    }
  }, [documents]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await api.reports.list();
      setReports(data);
    } catch (err) {
      showToast?.('error', 'Reports Load Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsGenerating(true);
    try {
      const newReport = await api.reports.generate({
        title,
        target_role: targetRole,
        departing_employee: departingEmployee,
        successor_name: successorName,
        document_ids: selectedDocIds,
      });

      showToast?.('success', 'Handover Report Created', 'Executive PDF generated successfully.');
      setShowCreateModal(false);
      await loadReports();
      setSelectedReportView(newReport);
    } catch (err) {
      showToast?.('error', 'Generation Failed', err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Executive Handover Packages</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Handover Reports & Downloadable PDF Generation
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mt-1">
            Synthesize multi-document analyses into an executive handover document with architectural decisions, task matrix, SPOF gap analysis, and mutual sign-off acceptance.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Handover Report</span>
        </button>
      </div>

      {/* Reports Grid */}
      {isLoading ? (
        <LoadingSpinner text="Loading generated handover packages..." />
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(report.created_at).toLocaleDateString()}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                    PDF Ready
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-2">{report.title}</h3>

                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] mb-4">
                  <div>
                    <span className="text-slate-500 block">Departing Member:</span>
                    <span className="text-slate-200 font-medium">{report.departing_employee}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Successor Lead:</span>
                    <span className="text-slate-200 font-medium">{report.successor_name}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-800/80">
                    <span className="text-slate-500 block">Target Role:</span>
                    <span className="text-blue-400 font-medium">{report.target_role}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                  {report.summary}
                </p>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
                <button
                  onClick={() => setSelectedReportView(report)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Package</span>
                </button>

                <a
                  href={api.reports.getPdfUrl(report.id)}
                  download
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileCheck2}
          title="No handover reports generated yet"
          description="Synthesize your uploaded transition documents into an executive PDF report."
          actionText="Generate First Handover Report"
          onAction={() => setShowCreateModal(true)}
        />
      )}

      {/* Create Handover Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 overflow-hidden">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Generate Executive Handover Report</h3>
                <p className="text-xs text-slate-400">Creates a complete PDF document using ReportLab</p>
              </div>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Report Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Platform Engineering Handover Document"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Departing Member
                  </label>
                  <input
                    type="text"
                    required
                    value={departingEmployee}
                    onChange={(e) => setDepartingEmployee(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Successor Lead
                  </label>
                  <input
                    type="text"
                    required
                    value={successorName}
                    onChange={(e) => setSuccessorName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Role / Domain
                </label>
                <input
                  type="text"
                  required
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Document Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Include Handover Documents:
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800">
                  {documents && documents.length > 0 ? (
                    documents.map((doc) => {
                      const isChecked = selectedDocIds.includes(doc.id);
                      return (
                        <label
                          key={doc.id}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-900 cursor-pointer text-xs text-slate-300"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedDocIds(selectedDocIds.filter((id) => id !== doc.id));
                              } else {
                                setSelectedDocIds([...selectedDocIds, doc.id]);
                              }
                            }}
                            className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="truncate">{doc.filename}</span>
                        </label>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-500 p-2">No documents available</div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || selectedDocIds.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-500/25 disabled:opacity-50 transition-all"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Report...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4" />
                      <span>Generate Executive PDF</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Report Preview Modal */}
      {selectedReportView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedReportView.title}</h3>
                  <p className="text-xs text-slate-400">
                    Handover to {selectedReportView.successor_name} • Role: {selectedReportView.target_role}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={api.reports.getPdfUrl(selectedReportView.id)}
                  download
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Document</span>
                </a>

                <button
                  onClick={() => setSelectedReportView(null)}
                  className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Document Paper Simulation */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-950/80 space-y-6 text-xs">
              {/* Executive Summary */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                  1. Executive Handover Summary
                </h4>
                <p className="text-slate-300 leading-relaxed">{selectedReportView.summary}</p>
              </div>

              {/* Key Decisions */}
              {selectedReportView.sections_json?.important_decisions && (
                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">
                    2. Important Architectural Decisions
                  </h4>
                  <div className="space-y-2">
                    {selectedReportView.sections_json.important_decisions.map((dec, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                        <div className="font-semibold text-white mb-1">{dec.title}</div>
                        <p className="text-slate-400">{dec.decision}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks & Deliverables */}
              {selectedReportView.sections_json?.pending_tasks && (
                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">
                    3. Pending Tasks & Deliverables
                  </h4>
                  <div className="space-y-2">
                    {selectedReportView.sections_json.pending_tasks.map((task, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-white">{task.title}</div>
                          <div className="text-[11px] text-slate-400">{task.description}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[10px]">
                          {task.due_or_timeline}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mutual Sign-off Simulation */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  4. Mutual Handover Sign-Off & Acceptance
                </h4>
                <p className="text-slate-400 mb-4">
                  Acknowledged that all items listed in this document have been reviewed and open knowledge gaps identified prior to final offboarding.
                </p>
                <div className="grid grid-cols-2 gap-6 pt-3 border-t border-slate-800 font-mono text-[11px] text-slate-400">
                  <div>
                    <div>Outgoing Member Signature:</div>
                    <div className="font-bold text-white mt-1">
                      {selectedReportView.departing_employee} (Electronically Verified)
                    </div>
                  </div>
                  <div>
                    <div>Successor Acceptance Signature:</div>
                    <div className="font-bold text-white mt-1">
                      {selectedReportView.successor_name} (Pending Verification)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

