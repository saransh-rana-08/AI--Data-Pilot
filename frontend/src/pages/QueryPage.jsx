import React from 'react';
import { Terminal, Database, HelpCircle } from 'lucide-react';
import QueryInput from '../components/query/QueryInput';
import AiGenerationLoader from '../components/query/AiGenerationLoader';
import SQLViewer from '../components/query/SQLViewer';
import ResultTable from '../components/query/ResultTable';
import EmptyState from '../components/common/EmptyState';
import { useDatabase } from '../context/DatabaseContext';

export default function QueryPage() {
  const { dbConfig, setIsConnectionModalOpen, activeQuery, isGenerating } = useDatabase();

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <span>Query Workspace</span>
          </h1>
          <p className="text-xs sm:text-sm text-dark-400 mt-0.5">
            Ask questions in plain English, inspect the synthesized SQL, and view live results.
          </p>
        </div>

        {dbConfig.connected && (
          <div className="flex items-center gap-2 text-xs text-dark-400 font-mono bg-dark-850 px-3 py-1.5 rounded-lg border border-dark-700/80 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Target: <strong className="text-dark-100">{dbConfig.name}</strong> ({dbConfig.type})</span>
          </div>
        )}
      </div>

      {!dbConfig.connected ? (
        <div className="rounded-2xl bg-dark-900 border border-dark-700/80 p-8 shadow-subtle">
          <EmptyState
            icon={Database}
            title="Database required for SQL analysis"
            description="Please connect your database before entering questions in the query workspace."
            actionLabel="Connect Database"
            onAction={() => setIsConnectionModalOpen(true)}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Natural language question input */}
          <QueryInput />

          {/* Stepped AI Generation Pipeline State */}
          {isGenerating && <AiGenerationLoader />}

          {/* Generated SQL Monospace Editor / Viewer */}
          {!isGenerating && activeQuery && <SQLViewer />}

          {/* Query Result Grid Table */}
          {!isGenerating && activeQuery && <ResultTable />}
        </div>
      )}
    </div>
  );
}
