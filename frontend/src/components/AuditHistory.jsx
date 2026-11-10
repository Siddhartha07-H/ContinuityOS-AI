import React, { useState, useEffect } from 'react';
import {
  History,
  FileText,
  BrainCircuit,
  FileCheck2,
  Lock,
  Clock,
  RefreshCw,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { LoadingSpinner, EmptyState } from './Toast';

export function AuditHistory({ showToast }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.audit.list();
      setLogs(data);
    } catch (err) {
      showToast?.('error', 'Audit Load Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionBadge = (action) => {
    if (action.includes('UPLOAD') || action.includes('SEEDED')) {
      return {
        icon: FileText,
        bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        label: 'Document Ingestion',
      };
    }
    if (action.includes('ANALYZE')) {
      return {
        icon: BrainCircuit,
        bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
        label: 'AI Structured Analysis',
      };
    }
    if (action.includes('REPORT')) {
      return {
        icon: FileCheck2,
        bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        label: 'Report & PDF Export',
      };
    }
    return {
      icon: Lock,
      bg: 'bg-slate-500/10 border-slate-500/20 text-slate-300',
      label: 'Security & Auth',
    };
  };

  const filteredLogs = logs.filter((log) => {
    if (filterAction === 'all') return true;
    if (filterAction === 'document') return log.entity_type === 'document';
    if (filterAction === 'analysis') return log.entity_type === 'analysis';
    if (filterAction === 'report') return log.entity_type === 'report';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Traceability & Compliance</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Handover Audit Trail & Document History
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mt-1">
            Complete immutable log of all uploaded handover assets, AI analysis runs, and exported sign-off packages.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/60 border border-slate-800 rounded-xl w-fit">
        {['all', 'document', 'analysis', 'report'].map((f) => (
          <button
            key={f}
            onClick={() => setFilterAction(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              filterAction === f
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {f === 'all' ? 'All Activities' : `${f}s`}
          </button>
        ))}
      </div>

      {/* Log Feed */}
      {isLoading ? (
        <LoadingSpinner text="Loading compliance audit records..." />
      ) : filteredLogs.length > 0 ? (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const badge = getActionBadge(log.action);
            const Icon = badge.icon;
            return (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${badge.bg}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white">{badge.label}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-slate-300">{log.details}</p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between text-[11px] text-slate-500 font-mono shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <span className="text-slate-400">{log.user_email}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-600" />
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={History}
          title="No audit entries match filter"
          description="Activities such as uploading transition files or generating reports will be logged here."
        />
      )}
    </div>
  );
}

