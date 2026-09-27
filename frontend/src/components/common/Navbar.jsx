import React, { useState } from 'react';
import { Search, Bell, Database, ChevronRight, Menu, Check, ExternalLink } from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

export default function Navbar({ onOpenMobileSidebar }) {
  const { currentView, dbConfig, setIsConnectionModalOpen, setIsCommandPaletteOpen, navigate } = useDatabase();
  const [showNotifications, setShowNotifications] = useState(false);

  // View label mapping
  const viewTitles = {
    dashboard: 'Dashboard',
    query: 'Query Workspace',
    database: 'Database Explorer',
    history: 'Query History',
    settings: 'Settings & Integrations',
  };

  const currentTitle = viewTitles[currentView] || 'Dashboard';

  const mockNotifications = [
    { id: 1, title: 'Schema synchronized', time: '10m ago', unread: true },
    { id: 2, title: 'college_db backup completed', time: '1h ago', unread: false },
    { id: 3, title: 'AI model updated to v2.4', time: 'Yesterday', unread: false },
  ];

  return (
    <header className="h-14 border-b border-dark-700 bg-dark-900/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile hamburger & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-1.5 rounded-md text-dark-400 hover:text-dark-100 hover:bg-dark-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
          <span 
            onClick={() => navigate('dashboard')}
            className="text-dark-400 hover:text-dark-200 transition-colors cursor-pointer font-medium"
          >
            QueryAI
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-dark-600" />
          <span className="text-dark-100 font-semibold tracking-tight">
            {currentTitle}
          </span>
        </nav>
      </div>

      {/* Right: DB connection status, Search trigger, Notifications, Avatar */}
      <div className="flex items-center gap-3">
        {/* DB Connection Indicator */}
        <button
          onClick={() => setIsConnectionModalOpen(true)}
          className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-dark-850 hover:bg-dark-800 border border-dark-700/80 transition-all text-xs text-dark-200 hover:text-dark-100 group"
          title="Click to manage database connection"
        >
          {dbConfig.connected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-xs text-dark-200">
                {dbConfig.type} Connected
              </span>
              <span className="text-dark-400 text-[11px] font-mono hidden sm:inline">
                ({dbConfig.name})
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="font-medium text-rose-400">Disconnected</span>
            </>
          )}
        </button>

        {/* Quick Search / Command Palette shortcut */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-dark-850 hover:bg-dark-800 border border-dark-700/80 text-dark-400 hover:text-dark-200 transition-colors text-xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
          <kbd className="text-[10px] font-mono bg-dark-800 px-1 py-0.5 rounded border border-dark-700 text-dark-400">
            ⌘K
          </kbd>
        </button>

        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="sm:hidden p-2 text-dark-400 hover:text-dark-200 hover:bg-dark-800 rounded-md transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-dark-400 hover:text-dark-200 hover:bg-dark-800 rounded-md transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-dark-900 border border-dark-700 rounded-xl shadow-elevated py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 border-b border-dark-700/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-dark-100">Activity & Alerts</span>
                <span className="text-[10px] text-indigo-400 hover:underline cursor-pointer">Mark read</span>
              </div>
              <div className="divide-y divide-dark-800">
                {mockNotifications.map(n => (
                  <div key={n.id} className="px-3 py-2 text-xs hover:bg-dark-850 transition-colors">
                    <div className="flex items-center justify-between text-dark-200">
                      <span className={n.unread ? 'font-medium text-dark-100' : ''}>{n.title}</span>
                      <span className="text-[10px] text-dark-400">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div 
          onClick={() => navigate('settings')}
          className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 p-[1px] cursor-pointer hover:ring-2 hover:ring-indigo-500/30 transition-all shrink-0"
          title="Account profile"
        >
          <div className="w-full h-full rounded-full bg-dark-900 flex items-center justify-center text-[11px] font-semibold text-white">
            SR
          </div>
        </div>
      </div>
    </header>
  );
}
