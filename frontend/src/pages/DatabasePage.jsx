import React, { useState } from 'react';
import { Database, RefreshCw, Settings2, Layers, Columns3, GitFork, HardDrive, CheckCircle2 } from 'lucide-react';
import TableSchemaView from '../components/database/TableSchemaView';
import EmptyState from '../components/common/EmptyState';
import { useDatabase } from '../context/DatabaseContext';

export default function DatabasePage() {
  const { dbConfig, setIsConnectionModalOpen, addToast, refreshDatabase } = useDatabase();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (refreshDatabase) {
      await refreshDatabase();
    }
    setIsRefreshing(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white flex items-center gap-2.5">
              <Database className="w-5 h-5 text-indigo-400" />
              <span>Database Explorer</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-dark-400 font-mono">
            <span className="font-semibold text-dark-200">{dbConfig.name}</span>
            <span>•</span>
            <span>{dbConfig.type} 8.0</span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Connected
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || !dbConfig.connected}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700 text-xs font-medium text-dark-200 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => setIsConnectionModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-750 border border-dark-700 text-xs font-medium text-dark-200 hover:text-white transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Manage Connection</span>
          </button>
        </div>
      </div>

      {!dbConfig.connected ? (
        <div className="rounded-2xl bg-dark-900 border border-dark-700/80 p-8 shadow-subtle">
          <EmptyState
            icon={Database}
            title="No database connected"
            description="Connect a database to view its schemas, tables, relationships, and column structures."
            actionLabel="Connect Database"
            onAction={() => setIsConnectionModalOpen(true)}
          />
        </div>
      ) : (
        <>
          {/* Statistics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-dark-900 border border-dark-700/80 shadow-subtle">
              <div className="flex items-center justify-between text-dark-400 mb-1">
                <span className="text-xs font-medium">Tables</span>
                <Layers className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-xl font-semibold text-dark-100 font-mono">
                {dbConfig.totalTables || 12}
              </div>
              <span className="text-[10px] text-dark-500">public schema</span>
            </div>

            <div className="p-4 rounded-xl bg-dark-900 border border-dark-700/80 shadow-subtle">
              <div className="flex items-center justify-between text-dark-400 mb-1">
                <span className="text-xs font-medium">Columns</span>
                <Columns3 className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-xl font-semibold text-dark-100 font-mono">
                {dbConfig.totalColumns || 48}
              </div>
              <span className="text-[10px] text-dark-500">across catalog</span>
            </div>

            <div className="p-4 rounded-xl bg-dark-900 border border-dark-700/80 shadow-subtle">
              <div className="flex items-center justify-between text-dark-400 mb-1">
                <span className="text-xs font-medium">Relationships</span>
                <GitFork className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-xl font-semibold text-dark-100 font-mono">
                {dbConfig.totalRelationships || 3}
              </div>
              <span className="text-[10px] text-dark-500">foreign key constraints</span>
            </div>

            <div className="p-4 rounded-xl bg-dark-900 border border-dark-700/80 shadow-subtle">
              <div className="flex items-center justify-between text-dark-400 mb-1">
                <span className="text-xs font-medium">Total Storage</span>
                <HardDrive className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-xl font-semibold text-dark-100 font-mono">
                {dbConfig.size || '18.4 MB'}
              </div>
              <span className="text-[10px] text-dark-500">~14,200 total records</span>
            </div>
          </div>

          {/* Table Schema Explorer */}
          <TableSchemaView />
        </>
      )}
    </div>
  );
}
