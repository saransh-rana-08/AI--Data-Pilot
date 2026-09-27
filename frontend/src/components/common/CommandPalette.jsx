import React, { useState, useEffect } from 'react';
import { Search, Database, Terminal, History, Home, Settings, CornerDownLeft, Sparkles, X } from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

export default function CommandPalette() {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    navigate,
    setIsConnectionModalOpen,
    tables,
    historyList
  } = useDatabase();

  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setSearch('');
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const quickNav = [
    { label: 'Dashboard', icon: Home, action: () => { navigate('dashboard'); setIsCommandPaletteOpen(false); } },
    { label: 'Query Workspace', icon: Terminal, action: () => { navigate('query'); setIsCommandPaletteOpen(false); } },
    { label: 'Database Explorer', icon: Database, action: () => { navigate('database'); setIsCommandPaletteOpen(false); } },
    { label: 'Query History', icon: History, action: () => { navigate('history'); setIsCommandPaletteOpen(false); } },
    { label: 'Settings & Connections', icon: Settings, action: () => { navigate('settings'); setIsCommandPaletteOpen(false); } },
  ];

  const filteredTables = tables.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
  const filteredQueries = historyList.filter(q => q.prompt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-dark-900 border border-dark-700 rounded-xl shadow-elevated overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-700/80 bg-dark-850/50">
          <Search className="w-4 h-4 text-dark-400 shrink-0" />
          <input
            type="text"
            placeholder="Type a command, search tables, or run query..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-dark-100 placeholder-dark-400 outline-none"
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="p-1 text-dark-400 hover:text-dark-200 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results / Commands */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-4">
          {/* Natural Language Prompt Query Action */}
          {search.trim().length > 2 && (
            <div>
              <div className="text-[11px] font-medium tracking-wider uppercase text-dark-400 px-2 py-1">
                Ask QueryAI
              </div>
              <button
                onClick={() => {
                  navigate('query', { prompt: search, runImmediately: true });
                  setIsCommandPaletteOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-xs truncate">Ask: "{search}"</span>
                </div>
                <span className="flex items-center gap-1 text-[11px] text-indigo-400/80 shrink-0 font-mono">
                  <span>Generate</span>
                  <CornerDownLeft className="w-3 h-3" />
                </span>
              </button>
            </div>
          )}

          {/* Navigation items */}
          <div>
            <div className="text-[11px] font-medium tracking-wider uppercase text-dark-400 px-2 py-1">
              Navigation
            </div>
            <div className="space-y-0.5">
              {quickNav.map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-dark-800 text-dark-200 hover:text-dark-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className="w-4 h-4 text-dark-400" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                  <span className="text-[10px] text-dark-400 font-mono">Jump</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tables match */}
          {filteredTables.length > 0 && (
            <div>
              <div className="text-[11px] font-medium tracking-wider uppercase text-dark-400 px-2 py-1">
                Tables in Schema ({filteredTables.length})
              </div>
              <div className="space-y-0.5">
                {filteredTables.slice(0, 4).map(table => (
                  <button
                    key={table.name}
                    onClick={() => {
                      navigate('database');
                      setIsCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-dark-800 text-dark-200 hover:text-dark-100 transition-colors text-left font-mono"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <Database className="w-3.5 h-3.5 text-dark-400" />
                      <span>{table.name}</span>
                    </div>
                    <span className="text-[10px] text-dark-400 font-sans">{table.columnsCount} columns</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Queries */}
          {filteredQueries.length > 0 && (
            <div>
              <div className="text-[11px] font-medium tracking-wider uppercase text-dark-400 px-2 py-1">
                Recent Queries
              </div>
              <div className="space-y-0.5">
                {filteredQueries.slice(0, 3).map(q => (
                  <button
                    key={q.id}
                    onClick={() => {
                      navigate('query', { prompt: q.prompt, runImmediately: true });
                      setIsCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-dark-800 text-dark-200 hover:text-dark-100 transition-colors text-left text-xs truncate"
                  >
                    <span className="truncate">{q.prompt}</span>
                    <span className="text-[10px] text-dark-400 shrink-0 ml-2 font-mono">{q.executionTime}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-dark-700/80 bg-dark-950/60 flex items-center justify-between text-[11px] text-dark-400 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-dark-400">QueryAI v1.0</span>
        </div>
      </div>
    </div>
  );
}
