import React, { useState } from 'react';
import { History, ArrowUpRight, Clock, ChevronRight } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import QueryDetailDrawer from '../modals/QueryDetailDrawer';
import { useDatabase } from '../../context/DatabaseContext';

export default function RecentQueriesTable() {
  const { historyList, navigate } = useDatabase();
  const [selectedQuery, setSelectedQuery] = useState(null);

  const recent = historyList.slice(0, 5);

  return (
    <div className="rounded-2xl bg-dark-900 border border-dark-700/80 shadow-subtle overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-dark-800 bg-dark-850/50">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-dark-100">
            Recent Queries
          </h3>
        </div>

        <button
          onClick={() => navigate('history')}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-medium"
        >
          <span>View all history</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Rows */}
      <div className="divide-y divide-dark-800">
        {recent.map((q) => (
          <div
            key={q.id}
            onClick={() => setSelectedQuery(q)}
            className="flex items-center justify-between p-4 hover:bg-dark-850/60 transition-colors cursor-pointer group"
          >
            <div className="min-w-0 flex-1 pr-4">
              <p className="text-xs font-medium text-dark-100 group-hover:text-indigo-300 transition-colors truncate">
                {q.prompt}
              </p>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-dark-400">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-dark-500" />
                  {q.executionTime}
                </span>
                <span>•</span>
                <span>{q.timestamp}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <StatusBadge status={q.status} />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('query', { prompt: q.prompt, runImmediately: true });
                }}
                className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-750 text-dark-400 hover:text-white transition-colors"
                title="Run in workspace"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Query Detail Modal Drawer */}
      {selectedQuery && (
        <QueryDetailDrawer
          query={selectedQuery}
          onClose={() => setSelectedQuery(null)}
        />
      )}
    </div>
  );
}
