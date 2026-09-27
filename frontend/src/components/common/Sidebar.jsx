import React from 'react';
import { 
  LayoutDashboard, 
  Terminal, 
  Database, 
  History, 
  Settings, 
  HelpCircle, 
  X, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { currentView, navigate, dbConfig, setIsConnectionModalOpen } = useDatabase();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'query', label: 'Query', icon: Terminal },
    { id: 'database', label: 'Database', icon: Database, badge: dbConfig.connected ? '12' : null },
    { id: 'history', label: 'History', icon: History },
  ];

  const handleNavClick = (id) => {
    navigate(id);
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-dark-900 border-r border-dark-700 w-64 select-none">
      {/* Top Logo / Brand Header */}
      <div className="h-14 flex items-center justify-between px-5 border-b border-dark-700/80">
        <div 
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-subtle group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-dark-100 tracking-tight flex items-center gap-1.5">
              QueryAI
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 font-normal">v1</span>
            </span>
            <span className="text-[11px] text-dark-400 font-normal">AI SQL Analyst</span>
          </div>
        </div>

        {/* Mobile close button */}
        {mobileOpen && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 text-dark-400 hover:text-dark-200 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Database Context Selector Pill */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => setIsConnectionModalOpen(true)}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700/80 transition-all text-left group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded bg-dark-800 border border-dark-700 flex items-center justify-center shrink-0">
              <Database className="w-3 h-3 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-dark-200 truncate">
                {dbConfig.connected ? dbConfig.name : 'No database'}
              </p>
              <p className="text-[10px] text-dark-400 truncate">
                {dbConfig.connected ? `${dbConfig.type} · ${dbConfig.version || '8.0'}` : 'Click to connect'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-dark-600 group-hover:text-dark-400 transition-colors shrink-0 ml-1" />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-dark-400 px-3 py-1">
          Platform
        </div>
        {navItems.map(item => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-dark-800 text-white font-semibold shadow-subtle border border-dark-700/80'
                  : 'text-dark-400 hover:text-dark-200 hover:bg-dark-850'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-indigo-400' : 'text-dark-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-dark-750 text-dark-400 border border-dark-700">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section: Settings, Help, Profile */}
      <div className="p-3 border-t border-dark-700/80 space-y-1">
        <button
          onClick={() => handleNavClick('settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
            currentView === 'settings'
              ? 'bg-dark-800 text-white font-semibold border border-dark-700/80'
              : 'text-dark-400 hover:text-dark-200 hover:bg-dark-850'
          }`}
        >
          <Settings className="w-4 h-4 text-dark-400" />
          <span>Settings</span>
        </button>

        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-dark-400 hover:text-dark-200 hover:bg-dark-850 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-dark-400" />
            <span>Documentation & Help</span>
          </div>
        </a>

        {/* User Card */}
        <div className="pt-2 mt-1 border-t border-dark-800/80 flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 p-[1px] shrink-0">
            <div className="w-full h-full rounded-full bg-dark-900 flex items-center justify-center text-[11px] font-semibold text-white">
              SR
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-dark-200 truncate">Saransh Rana</p>
            <p className="text-[10px] text-dark-400 truncate">Data Engineer</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden md:flex flex-col shrink-0 h-screen sticky top-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex animate-in fade-in duration-150"
          onClick={onCloseMobile}
        >
          <div 
            className="w-64 h-full animate-in slide-in-from-left duration-200"
            onClick={e => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
