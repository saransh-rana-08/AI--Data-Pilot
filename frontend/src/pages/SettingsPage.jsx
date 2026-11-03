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
  const { 
    dbConfig, 
    setIsConnectionModalOpen, 
    disconnectDatabase, 
    addToast,
    aiConfig,
    saveAiConfig
  } = useDatabase();

  const [groqKey, setGroqKey] = useState('');
  const [model, setModel] = useState(aiConfig?.model || 'openai/gpt-oss-120b');
  const [formatKeywordUpper, setFormatKeywordUpper] = useState(true);
  const [autoExecute, setAutoExecute] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (aiConfig?.model) {
      setModel(aiConfig.model);
    }
  }, [aiConfig]);

  const handleSavePreferences = async () => {
    setIsSaving(true);
    if (groqKey.trim() || model !== aiConfig?.model) {
      await saveAiConfig(groqKey.trim() || undefined, model);
      if (groqKey.trim()) setGroqKey('');
    } else {
      addToast('Preferences Saved', 'Workspace defaults updated', 'success');
    }
    setIsSaving(false);
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

      {/* AI Synthesis Model Settings (Groq & LangChain) */}
      <div className="rounded-2xl bg-dark-900 border border-dark-700/80 p-6 space-y-5 shadow-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-dark-100">Groq AI & LangChain Engine</h3>
              <p className="text-xs text-dark-400">Ultra-fast LLM inference for natural language to SQL synthesis</p>
            </div>
          </div>

          <div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              aiConfig?.has_api_key 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${aiConfig?.has_api_key ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              {aiConfig?.has_api_key ? 'Groq Key Active' : 'API Key Required'}
            </span>
          </div>
        </div>

        <div className="space-y-4 pt-1">
          {/* Groq API Key Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-dark-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span>Groq API Key</span>
              </label>
              <a 
                href="https://console.groq.com/keys" 
                target="_blank" 
                rel="noreferrer"
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
              >
                Get a free key at console.groq.com
              </a>
            </div>
            <div className="relative flex items-center">
              <Key className="w-3.5 h-3.5 text-dark-400 absolute left-3 pointer-events-none" />
              <input
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder={aiConfig?.has_api_key ? "•••••••••••••••••••••••••••••••• (Saved in backend)" : "gsk_..."}
                className="w-full pl-9 pr-3 py-2 bg-dark-850 border border-dark-700 rounded-lg text-xs text-dark-100 placeholder-dark-400 outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>
            <p className="text-[11px] text-dark-400 mt-1">
              Your API key is securely stored in your local backend environment and never exposed in browser logs.
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-2">
              LangChain Model Selection
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'openai/gpt-oss-120b', name: 'OpenAI GPT-OSS 120B (Recommended)', desc: 'High intelligence reasoning, best for complex joins, aggregations and CTEs' },
                { id: 'openai/gpt-oss-20b', name: 'OpenAI GPT-OSS 20B', desc: 'Ultra-low latency inference for quick queries' },
                { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B', desc: 'Powerful reasoning and multilingual analysis' },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
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
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
