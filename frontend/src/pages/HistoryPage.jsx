import React, { useState } from 'react';
import { History, Search, Filter, ArrowUpRight, Clock, Database, ChevronRight } from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import QueryDetailDrawer from '../components/modals/QueryDetailDrawer';
import EmptyState from '../components/common/EmptyState';
import { useDatabase } from '../context/DatabaseContext';

export default function HistoryPage() {
  const { historyList, navigate } = useDatabase();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Successful' | 'Failed'
  const [selectedQuery, setSelectedQuery] = useState(null);

  const filteredQueries = historyList.filter(item => {
    const matchesSearch = item.prompt.toLowerCase().includes(search.toLowerCase()) ||
                          (item.sql && item.sql.toLowerCase().includes(search.toLowerCase()));
    
    if (statusFilter === 'Successful') {
      return matchesSearch && item.status === 'Success';
    }
    if (statusFilter === 'Failed') {
      return matchesSearch && item.status === 'Failed';
    }
    return matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white flex items-center gap-2.5">
          <History className="w-5 h-5 text-indigo-400" />
          <span>Query History</span>
        </h1>
        <p className="text-xs sm:text-sm text-dark-400 mt-0.5">
          Review your previous database queries, execution latencies, and generated SQL.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md flex items-center">
          <Search className="w-3.5 h-3.5 text-dark-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search queries or SQL..."
            className="w-full pl-9 pr-3 py-2 bg-dark-900 border border-dark-700/80 rounded-xl text-xs text-dark-100 placeholder-dark-400 outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter Pills: All, Successful, Failed */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-dark-900 border border-dark-700/80 self-start sm:self-auto">
          {['All', 'Successful', 'Failed'].map(filter => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === filter
                  ? 'bg-dark-800 text-white shadow-sm'
                  : 'text-dark-400 hover:text-dark-200 hover:bg-dark-850'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Queries Table */}
      <div className="rounded-2xl bg-dark-900 border border-dark-700/80 shadow-subtle overflow-hidden">
        {filteredQueries.length === 0 ? (
          <div className="p-12 text-center text-xs text-dark-400">
            No queries matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-dark-800 bg-dark-950/40 text-dark-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-5 font-medium">Natural Query</th>
                  <th className="py-3 px-4 font-medium hidden md:table-cell">Database</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium hidden sm:table-cell">Execution</th>
                  <th className="py-3 px-4 font-medium">Time</th>
                  <th className="py-3 px-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800/60">
                {filteredQueries.map(q => (
                  <tr
                    key={q.id}
                    onClick={() => setSelectedQuery(q)}
                    className="hover:bg-dark-850/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-5 text-dark-100 font-medium max-w-sm">
                      <div className="truncate font-sans text-xs group-hover:text-indigo-300 transition-colors">
                        {q.prompt}
                      </div>
                      <div className="truncate font-mono text-[10px] text-dark-500 mt-0.5 max-w-xs">
                        {q.sql.replace(/\n/g, ' ')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-dark-300 font-mono text-xs hidden md:table-cell">
                      college_db
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={q.status} />
                    </td>

                    <td className="py-3.5 px-4 font-mono text-dark-400 text-[11px] hidden sm:table-cell">
                      {q.executionTime || '112 ms'}
                    </td>

                    <td className="py-3.5 px-4 text-dark-400 text-xs">
                      {q.timestamp}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('query', { prompt: q.prompt, runImmediately: true });
                        }}
                        className="p-1.5 rounded-lg bg-dark-800 hover:bg-indigo-600 text-dark-300 hover:text-white transition-colors"
                        title="Re-run in workspace"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Query Modal Drawer */}
      {selectedQuery && (
        <QueryDetailDrawer
          query={selectedQuery}
          onClose={() => setSelectedQuery(null)}
        />
      )}
    </div>
  );
}
