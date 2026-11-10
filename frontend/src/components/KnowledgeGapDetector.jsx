import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Filter,
  FileText,
  Key,
  BookOpen,
  Users,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import { LoadingSpinner, EmptyState } from './Toast';

export function KnowledgeGapDetector({ showToast }) {
  const [gapsData, setGapsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [impactFilter, setImpactFilter] = useState('all'); // 'all' | 'Critical' | 'High' | 'Medium'
  const [copiedId, setCopiedId] = useState(null);
  const [resolvedIds, setResolvedIds] = useState(new Set());

  useEffect(() => {
    loadGaps();
  }, []);

  const loadGaps = async () => {
    setIsLoading(true);
    try {
      const res = await api.gaps.getSummary();
      setGapsData(res);
    } catch (err) {
      showToast?.('error', 'Gaps Load Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPrompt = (gap) => {
    const promptText = `Hi! As part of our ContinuityOS offboarding handover review for ${gap.document_name}, we identified an open documentation gap regarding '${gap.gap_category}'.\n\nMissing Item: ${gap.description}\nAction Required: ${gap.recommended_action}\n\nCould you please document or share this before your departure? Thank you!`;
    navigator.clipboard.writeText(promptText);
    setCopiedId(gap.id);
    showToast?.('success', 'Question Copied to Clipboard', 'Ready to paste into Slack or Email.');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleToggleResolve = (id) => {
    const next = new Set(resolvedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
      showToast?.('info', 'Gap Marked Resolved', 'Item noted as addressed in transition checklist.');
    }
    setResolvedIds(next);
  };

  const filteredGaps = (gapsData?.gaps || []).filter((gap) => {
    if (impactFilter === 'all') return true;
    return gap.impact_level === impactFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-red-950/40 via-slate-900/60 to-slate-900 border border-red-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Institutional Knowledge Risk Radar</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Knowledge Gap & Single Point of Failure (SPOF) Detection
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              ContinuityOS AI automatically flags unwritten procedures, credentials marked "Not Found in Documents", absent backup owners, and missing vendor contacts so they can be captured before final offboarding.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-center min-w-[90px]">
              <div className="text-xl font-black text-red-400">
                {gapsData?.critical_count ?? 2}
              </div>
              <div className="text-[10px] text-red-300 uppercase font-semibold">Critical SPOFs</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-500/40 text-center min-w-[90px]">
              <div className="text-xl font-black text-amber-400">
                {gapsData?.high_count ?? 3}
              </div>
              <div className="text-[10px] text-amber-300 uppercase font-semibold">High Priority</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/60 border border-slate-800 rounded-xl w-fit">
        {['all', 'Critical', 'High', 'Medium'].map((lvl) => (
          <button
            key={lvl}
            onClick={() => setImpactFilter(lvl)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              impactFilter === lvl
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {lvl === 'all' ? 'All Gaps' : `${lvl} Impact`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner text="Scanning documents for institutional knowledge blindspots..." />
      ) : filteredGaps.length > 0 ? (
        <div className="space-y-4">
          {filteredGaps.map((gap) => {
            const isResolved = resolvedIds.has(gap.id);
            return (
              <div
                key={gap.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isResolved
                    ? 'bg-slate-900/30 border-slate-800 opacity-60'
                    : gap.impact_level === 'Critical'
                    ? 'bg-red-950/15 border-red-500/30 hover:border-red-500/50'
                    : gap.impact_level === 'High'
                    ? 'bg-amber-950/15 border-amber-500/30 hover:border-amber-500/50'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          gap.impact_level === 'Critical'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : gap.impact_level === 'High'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {gap.impact_level} Impact
                      </span>
                      <span className="text-xs font-bold text-white">
                        {gap.gap_category}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                        <FileText className="w-3 h-3" />
                        <span>Source: {gap.document_name}</span>
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {gap.description}
                    </p>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
                      <span className="text-blue-400 font-semibold block mb-0.5">
                        Mandatory Handover Action:
                      </span>
                      <span className="text-slate-300">{gap.recommended_action}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyPrompt(gap)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 text-xs font-medium transition-all"
                      title="Copy offboarding question template"
                    >
                      {copiedId === gap.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied Question!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Offboarding Inquiry</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleToggleResolve(gap.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        isResolved
                          ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                          : 'border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isResolved ? 'Resolved' : 'Mark Addressed'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={CheckCircle2}
          title="No unresolved knowledge gaps found"
          description="All transition documents currently meet baseline institutional retention criteria."
        />
      )}
    </div>
  );
}

