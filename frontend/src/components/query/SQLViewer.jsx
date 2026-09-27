import React, { useState, useEffect } from 'react';
import { Copy, Check, Play, RotateCcw, CheckCircle2, AlertCircle, Clock, Database, Code2 } from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

export default function SQLViewer() {
  const { activeQuery, reRunSQL, clearQuery, addToast, isGenerating } = useDatabase();
  const [editableSql, setEditableSql] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (activeQuery?.sql) {
      setEditableSql(activeQuery.sql);
      setIsEditing(false);
    }
  }, [activeQuery?.sql]);

  if (isGenerating || !activeQuery) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(editableSql);
    setCopied(true);
    addToast('Copied to Clipboard', 'SQL statement copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = () => {
    reRunSQL(editableSql);
  };

  const lineCount = editableSql.split('\n').length;
  const isSuccess = activeQuery.status === 'Success';

  return (
    <div className="rounded-2xl bg-dark-900 border border-dark-700/90 shadow-subtle overflow-hidden space-y-0">
      {/* Top action bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-800 bg-dark-850/60">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-dark-100 uppercase tracking-wider">
            Generated SQL
          </span>
          <span className="text-[11px] font-mono text-dark-400">
            {lineCount} lines
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-750 border border-dark-700 text-xs font-mono text-dark-300 hover:text-dark-100 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy SQL'}</span>
          </button>

          <button
            onClick={clearQuery}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-750 border border-dark-700 text-xs font-mono text-dark-400 hover:text-dark-200 transition-colors"
            title="Clear current workspace"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <button
            onClick={handleRun}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition-all shadow-sm active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Query</span>
          </button>
        </div>
      </div>

      {/* Monospace Code Editor / Viewer */}
      <div className="relative bg-dark-950 p-4 font-mono text-xs text-dark-100 selection:bg-indigo-500/30 overflow-x-auto flex">
        {/* Line numbers */}
        <div className="select-none text-dark-600 text-right pr-4 border-r border-dark-800 leading-6 shrink-0 font-mono">
          {Array.from({ length: Math.max(lineCount, 1) }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Editable SQL Codearea */}
        <textarea
          value={editableSql}
          onChange={(e) => {
            setEditableSql(e.target.value);
            setIsEditing(true);
          }}
          spellCheck={false}
          rows={Math.max(lineCount, 4)}
          className="w-full pl-4 bg-transparent outline-none border-none text-dark-100 resize-none font-mono text-xs leading-6 selection:bg-indigo-500/30"
        />
      </div>

      {/* Execution status footer bar */}
      <div className="px-4 py-2.5 bg-dark-850/80 border-t border-dark-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-medium">
          {isSuccess ? (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Query executed successfully</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-rose-400">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>Query execution failed</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-dark-400 font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-dark-400" />
            <span>{activeQuery.executionTime || '124 ms'}</span>
          </div>
          <span>•</span>
          <div>
            <span>{activeQuery.rowCount ?? (activeQuery.rows ? activeQuery.rows.length : 0)} rows</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-dark-400" />
            <span>college_db</span>
          </div>
        </div>
      </div>
    </div>
  );
}
