import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export function Toast({ toast, onClose }) {
  if (!toast) return null;

  const typeConfig = {
    success: {
      icon: CheckCircle2,
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-950/80',
      text: 'text-emerald-400',
    },
    error: {
      icon: XCircle,
      border: 'border-red-500/40',
      bg: 'bg-red-950/80',
      text: 'text-red-400',
    },
    warning: {
      icon: AlertTriangle,
      border: 'border-amber-500/40',
      bg: 'bg-amber-950/80',
      text: 'text-amber-400',
    },
    info: {
      icon: Info,
      border: 'border-blue-500/40',
      bg: 'bg-blue-950/80',
      text: 'text-blue-400',
    },
  }[toast.type || 'info'];

  const Icon = typeConfig.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl ${typeConfig.bg} ${typeConfig.border}`}
      >
        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${typeConfig.text}`} />
        <div className="flex-1 text-sm text-slate-200">
          {toast.title && <div className="font-semibold text-white mb-0.5">{toast.title}</div>}
          <div>{toast.message}</div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function LoadingSpinner({ text = 'Analyzing documentation...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative w-14 h-14 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
        <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-4 border-cyan-400/20"></div>
        <div className="absolute inset-2 rounded-full border-4 border-cyan-400 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}></div>
      </div>
      <p className="text-sm font-medium text-slate-300 animate-pulse">{text}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, actionText, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md mb-6">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

