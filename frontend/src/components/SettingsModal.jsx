import React, { useState, useEffect } from 'react';
import { X, Key, Cpu, Database, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export function SettingsModal({ isOpen, onClose, onRefreshData, showToast }) {
  const [apiKey, setApiKey] = useState('');
  const [systemStatus, setSystemStatus] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    try {
      const res = await api.system.getStatus();
      setSystemStatus(res);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await api.system.updateApiKey(apiKey);
      setMessage({ type: 'success', text: 'Gemini API key configured! Live Google Gemini AI is now active.' });
      showToast?.('success', 'Gemini AI Connected', 'API key configured and tested.');
      setApiKey('');
      await loadStatus();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update key' });
      showToast?.('error', 'Configuration Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReSeed = async () => {
    if (!confirm('This will refresh the sample handover documents and initial analyses. Proceed?')) return;
    setIsSeeding(true);
    try {
      await api.system.seed();
      showToast?.('success', 'Data Restored', 'Sample documents & reports refreshed.');
      onRefreshData?.();
      await loadStatus();
    } catch (err) {
      showToast?.('error', 'Seed Error', err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">System & AI Settings</h2>
            <p className="text-xs text-slate-400">Configure Google Gemini API and manage workspace state</p>
          </div>
        </div>

        {/* Live Status Card */}
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 mb-6 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-blue-400" /> AI Engine Status
            </span>
            {systemStatus?.gemini_connected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Google Gemini Active ({systemStatus?.gemini_model})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-400 font-semibold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" /> Heuristic Engine Active (No Key Required)
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/40">
            <span className="text-slate-400 flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-indigo-400" /> Database & Storage
            </span>
            <span className="text-slate-300 font-mono text-[11px]">
              {systemStatus?.documents_count ?? 3} Documents • SQLite Indexed
            </span>
          </div>
        </div>

        {/* Google Gemini API Key Input */}
        <form onSubmit={handleSaveApiKey} className="mb-6 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-400" /> Google Gemini API Key
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              ContinuityOS works out-of-the-box with our built-in heuristic transition analyzer. You can also paste your Gemini API key to activate Google Gemini 1.5 Flash live.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={isSaving || !apiKey.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-500/20 disabled:opacity-40 transition-colors"
              >
                {isSaving ? 'Connecting...' : 'Connect Key'}
              </button>
            </div>
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-950/70 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-950/70 border border-red-500/30 text-red-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message.text}</span>
            </div>
          )}
        </form>

        {/* Workspace Management */}
        <div className="pt-4 border-t border-slate-800">
          <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" /> Demo Sample Data
          </label>
          <p className="text-[11px] text-slate-400 mb-3">
            Reset or restore the realistic enterprise handover documents (Cloud Migration .docx, Payment Gateway .pdf, DevOps Transition .txt) and pre-calculated knowledge gap records.
          </p>
          <button
            type="button"
            onClick={handleReSeed}
            disabled={isSeeding}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'Restoring Sample Data...' : 'Restore Sample Handover Suite'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

