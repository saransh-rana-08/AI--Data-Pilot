import React from 'react';
import { Database, Settings2, Table2, Layers, HardDrive } from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

export default function DatabaseStatusCard() {
  const { dbConfig, setIsConnectionModalOpen, navigate } = useDatabase();

  return (
    <div className="rounded-2xl bg-dark-900 border border-dark-700/80 p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
          <Database className="w-5 h-5" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-dark-400">
              Connected Database
            </span>
            {dbConfig.connected ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                Disconnected
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-base font-semibold text-dark-100 font-mono">
              {dbConfig.connected ? dbConfig.name : 'None'}
            </h2>
            <span className="text-xs text-dark-400">•</span>
            <span className="text-xs text-dark-300 font-medium">
              {dbConfig.type} {dbConfig.version || '8.0'}
            </span>
            <span className="text-xs text-dark-400">•</span>
            <span className="text-xs text-dark-400">
              {dbConfig.connected ? `${dbConfig.totalTables} tables detected` : 'No schema loaded'}
            </span>
            <span className="text-xs text-dark-400">•</span>
            <span className="text-xs text-dark-400">
              Connected {dbConfig.connectedAt || 'just now'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 pt-2 md:pt-0">
        <button
          onClick={() => navigate('database')}
          className="px-3 py-2 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700 text-xs font-medium text-dark-300 hover:text-dark-100 transition-colors"
        >
          Explore Schema
        </button>

        <button
          onClick={() => setIsConnectionModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-750 border border-dark-700 text-xs font-medium text-dark-200 hover:text-white transition-all active:scale-[0.98]"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Manage Connection</span>
        </button>
      </div>
    </div>
  );
}
