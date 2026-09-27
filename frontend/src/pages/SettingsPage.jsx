import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  Cpu, 
  Shield, 
  Sliders, 
  Check, 
  Unplug, 
  Server,
  User,
  Key
} from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';

export default function SettingsPage() {
  const { dbConfig, setIsConnectionModalOpen, disconnectDatabase, connectDatabase, addToast } = useDatabase();
  const [model, setModel] = useState('sql-analyst-large-v1');
  const [formatKeywordUpper, setFormatKeywordUpper] = useState(true);
  const [autoExecute, setAutoExecute] = useState(true);

  const handleSavePreferences = () => {
    addToast('Settings Saved', 'AI SQL analyst preferences updated', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white flex items-center gap-2.5">
          <Settings className="w-5 h-5 text-indigo-400" />
          <span>Settings & Preferences</span>
        </h1>
        <p className="text-xs sm:text-sm text-dark-400 mt-0.5">
          Manage database connections, AI synthesis parameters, and analyst workspace defaults.
        </p>
      </div>

      {/* Database Connection Settings Section */}
      <div className="rounded-2xl bg-dark-900 border border-dark-700/80 p-6 space-y-4 shadow-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-dark-100">Primary Database Connection</h3>
              <p className="text-xs text-dark-400">Configured host endpoint and credentials</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {dbConfig.connected ? (
              <button
                onClick={disconnectDatabase}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition-colors"
              >
                <Unplug className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            ) : (
              <button
                onClick={() => setIsConnectionModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors"
              >
                Connect Database
              </button>
            )}

            <button
              onClick={() => setIsConnectionModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-750 border border-dark-700 text-xs font-medium text-dark-200 hover:text-white transition-colors"
            >
              Configure
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-dark-850 border border-dark-800">
            <span className="text-dark-500 block mb-0.5">Database Name</span>
            <span className="font-mono text-dark-200 font-medium">{dbConfig.name}</span>
          </div>
          <div className="p-3 rounded-xl bg-dark-850 border border-dark-800">
            <span className="text-dark-500 block mb-0.5">Engine & Host</span>
            <span className="font-mono text-dark-200 font-medium">{dbConfig.type} @ {dbConfig.host}:{dbConfig.port}</span>
          </div>
          <div className="p-3 rounded-xl bg-dark-850 border border-dark-800">
            <span className="text-dark-500 block mb-0.5">Connection State</span>
            <span className={`font-medium ${dbConfig.connected ? 'text-emerald-400' : 'text-rose-400'}`}>
              {dbConfig.connected ? '● Active' : '○ Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* AI Synthesis Model Settings */}
      <div className="rounded-2xl bg-dark-900 border border-dark-700/80 p-6 space-y-5 shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-dark-100">SQL Synthesis Engine</h3>
            <p className="text-xs text-dark-400">Tuned models for semantic SQL generation</p>
          </div>
        </div>

        <div className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-2">
              Model Selection
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'sql-analyst-large-v1', name: 'QueryAI Pro (Default)', desc: 'Optimized for complex joins and subqueries' },
                { id: 'sql-analyst-fast', name: 'QueryAI Fast', desc: 'Sub-50ms synthesis for quick lookups' },
                { id: 'sql-analyst-reasoning', name: 'Deep Reasoning', desc: 'Multi-hop schema inference and CTEs' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setModel(item.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    model === item.id
                      ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-sm'
                      : 'bg-dark-850 border-dark-750 text-dark-400 hover:text-dark-200'
                  }`}
                >
                  <div className="text-xs font-semibold mb-1 text-dark-100">{item.name}</div>
                  <div className="text-[11px] text-dark-400 leading-snug">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-3 rounded-xl bg-dark-850 border border-dark-800 cursor-pointer">
              <div>
                <p className="text-xs font-medium text-dark-100">Format SQL Keywords in UPPERCASE</p>
                <p className="text-[11px] text-dark-400">Standardize generated SQL with SELECT, FROM, WHERE, ORDER BY</p>
              </div>
              <input
                type="checkbox"
                checked={formatKeywordUpper}
                onChange={(e) => setFormatKeywordUpper(e.target.checked)}
                className="w-4 h-4 rounded border-dark-700 text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-dark-850 border border-dark-800 cursor-pointer">
              <div>
                <p className="text-xs font-medium text-dark-100">Auto-execute queries after generation</p>
                <p className="text-[11px] text-dark-400">Immediately fetch result grid upon generating valid SQL</p>
              </div>
              <input
                type="checkbox"
                checked={autoExecute}
                onChange={(e) => setAutoExecute(e.target.checked)}
                className="w-4 h-4 rounded border-dark-700 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>
        </div>

        <div className="pt-3 border-t border-dark-800 flex justify-end">
          <button
            onClick={handleSavePreferences}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-all shadow-sm active:scale-[0.98]"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
