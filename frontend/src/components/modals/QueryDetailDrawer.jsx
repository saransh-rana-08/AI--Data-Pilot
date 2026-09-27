import React from 'react';
import { X, Copy, Check, Terminal, Clock, Database, ArrowUpRight, AlertCircle } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { useDatabase } from '../../context/DatabaseContext';

export default function QueryDetailDrawer({ query, onClose }) {
  const { navigate, addToast } = useDatabase();
  const [copied, setCopied] = React.useState(false);

  if (!query) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(query.sql);
    setCopied(true);
    addToast('Copied to Clipboard', 'SQL statement copied', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInWorkspace = () => {
    navigate('query', { prompt: query.prompt, runImmediately: true });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl h-full bg-dark-900 border-l border-dark-700 shadow-elevated flex flex-col animate-in slide-in-from-right duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700/80 bg-dark-850/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-dark-100">Query Details</h3>
              <p className="text-xs text-dark-400">Inspecting historical execution log</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-dark-400 hover:text-dark-200 rounded-lg hover:bg-dark-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Natural Language Prompt */}
          <div>
            <label className="text-xs font-semibold text-dark-400 uppercase tracking-wider block mb-1.5">
              Natural Language Prompt
            </label>
            <div className="p-3.5 rounded-xl bg-dark-850 border border-dark-700/80 text-sm font-medium text-dark-100">
              "{query.prompt}"
            </div>
          </div>

          {/* Metrics summary grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-dark-850 border border-dark-700/80">
              <span className="text-[11px] text-dark-400 block mb-1">Status</span>
              <StatusBadge status={query.status} />
            </div>

            <div className="p-3 rounded-xl bg-dark-850 border border-dark-700/80">
              <span className="text-[11px] text-dark-400 block mb-1">Execution Time</span>
              <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-dark-200">
                <Clock className="w-3.5 h-3.5 text-dark-400" />
                {query.executionTime || '112 ms'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-dark-850 border border-dark-700/80">
              <span className="text-[11px] text-dark-400 block mb-1">Rows Affected</span>
              <span className="text-xs font-mono font-medium text-dark-200">
                {query.rowCount ?? (query.rows ? query.rows.length : 0)} rows
              </span>
            </div>
          </div>

          {/* Error Message if Failed */}
          {query.status === 'Failed' && query.errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4" />
                Execution Error
              </div>
              <p className="text-xs text-rose-300/90 leading-relaxed font-mono">
                {query.errorMessage}
              </p>
            </div>
          )}

          {/* Generated SQL */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-dark-400 uppercase tracking-wider">
                Generated SQL
              </label>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-dark-400 hover:text-dark-200 transition-colors font-mono"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-4 rounded-xl bg-dark-950 border border-dark-800 font-mono text-xs text-dark-200 overflow-x-auto leading-relaxed whitespace-pre selection:bg-indigo-500/30">
              {query.sql}
            </div>
          </div>

          {/* Target Database details */}
          <div className="p-3.5 rounded-xl bg-dark-850/60 border border-dark-700/60 flex items-center justify-between text-xs text-dark-300">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-dark-400" />
              <span>Target: <strong className="font-mono text-dark-100">college_db</strong> (MySQL 8.0)</span>
            </div>
            <span className="text-dark-400 text-[11px]">{query.timestamp || 'Recent'}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-dark-700/80 bg-dark-850/50 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-dark-800 hover:bg-dark-750 text-xs font-medium text-dark-300 hover:text-white transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleOpenInWorkspace}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-all shadow-sm active:scale-[0.98]"
          >
            <span>Open in Query Workspace</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
