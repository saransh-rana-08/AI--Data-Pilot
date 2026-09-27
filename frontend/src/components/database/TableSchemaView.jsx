import React, { useState } from 'react';
import { 
  Table2, 
  Key, 
  Link2, 
  Search, 
  ChevronRight, 
  Database, 
  FileText, 
  Layers, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

export default function TableSchemaView() {
  const { tables, navigate } = useDatabase();
  const [selectedTable, setSelectedTable] = useState(tables[0] || null);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeTab, setActiveTab] = useState('columns'); // 'columns' | 'data'

  const filteredTables = tables.filter(t => 
    t.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Tables List */}
      <div className="lg:col-span-4 rounded-2xl bg-dark-900 border border-dark-700/80 shadow-subtle overflow-hidden">
        {/* Search header */}
        <div className="p-3.5 border-b border-dark-800 bg-dark-850/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-dark-400 flex items-center gap-1.5">
              <Table2 className="w-3.5 h-3.5 text-indigo-400" />
              Tables ({tables.length})
            </span>
            <span className="text-[11px] font-mono text-dark-500">Schema: public</span>
          </div>

          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-dark-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search tables..."
              className="w-full pl-8 pr-3 py-1.5 bg-dark-800 border border-dark-700 rounded-lg text-xs text-dark-100 placeholder-dark-400 outline-none focus:border-indigo-500 transition-colors font-mono"
            />
          </div>
        </div>

        {/* Tables list */}
        <div className="max-h-[600px] overflow-y-auto divide-y divide-dark-800/60 font-mono">
          {filteredTables.map(table => {
            const isSelected = selectedTable?.name === table.name;

            return (
              <button
                key={table.name}
                onClick={() => setSelectedTable(table)}
                className={`w-full flex items-center justify-between p-3 text-left transition-all group ${
                  isSelected
                    ? 'bg-indigo-600/10 border-l-2 border-l-indigo-500 text-white'
                    : 'hover:bg-dark-850/60 text-dark-300 hover:text-dark-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Table2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-dark-500 group-hover:text-dark-300'}`} />
                  <div className="min-w-0">
                    <span className="text-xs font-medium truncate block font-mono">
                      {table.name}
                    </span>
                    <span className="text-[10px] text-dark-500 font-sans block truncate">
                      {table.rowCount?.toLocaleString()} rows
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-800 text-dark-400 border border-dark-700 font-sans">
                    {table.columnsCount} cols
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-indigo-400 translate-x-0.5' : 'text-dark-600'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Selected Table Detail Panel */}
      {selectedTable && (
        <div className="lg:col-span-8 rounded-2xl bg-dark-900 border border-dark-700/80 shadow-subtle overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-dark-800 bg-dark-850/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-semibold text-dark-100 font-mono">
                  {selectedTable.name}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-dark-800 text-dark-300 border border-dark-700 font-sans">
                  {selectedTable.rowCount?.toLocaleString()} rows
                </span>
              </div>
              {selectedTable.description && (
                <p className="text-xs text-dark-400 mt-1">
                  {selectedTable.description}
                </p>
              )}
            </div>

            {/* Quick action: query this table */}
            <button
              onClick={() => navigate('query', { 
                prompt: `Show the first 10 records from ${selectedTable.name}`, 
                runImmediately: true 
              })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-medium text-indigo-300 transition-colors shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Query Table</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sub-tabs: Columns vs Preview Data */}
          <div className="flex items-center gap-1 px-5 pt-3 border-b border-dark-800 bg-dark-850/20">
            <button
              onClick={() => setActiveTab('columns')}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all ${
                activeTab === 'columns'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-dark-400 hover:text-dark-200'
              }`}
            >
              Columns & Types ({selectedTable.columns?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all ${
                activeTab === 'data'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-dark-400 hover:text-dark-200'
              }`}
            >
              Sample Data Preview
            </button>
          </div>

          {/* Tab 1: Columns list */}
          {activeTab === 'columns' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-dark-800 bg-dark-950/40 text-dark-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-5 font-medium">Column Name</th>
                    <th className="py-3 px-4 font-medium">Data Type</th>
                    <th className="py-3 px-4 font-medium">Constraints / Keys</th>
                    <th className="py-3 px-4 font-medium">Default</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800/60 font-mono">
                  {selectedTable.columns?.map(col => (
                    <tr key={col.name} className="hover:bg-dark-850/40 transition-colors">
                      <td className="py-3 px-5 font-medium text-dark-100 flex items-center gap-2">
                        {col.isPrimary && <Key className="w-3.5 h-3.5 text-amber-400" title="Primary Key" />}
                        {col.isForeign && <Link2 className="w-3.5 h-3.5 text-indigo-400" title="Foreign Key" />}
                        <span>{col.name}</span>
                      </td>
                      <td className="py-3 px-4 text-indigo-300 font-mono">
                        {col.type}
                      </td>
                      <td className="py-3 px-4 font-sans text-[11px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {col.isPrimary && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium">
                              Primary Key
                            </span>
                          )}
                          {col.isForeign && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium">
                              FK → {col.references}
                            </span>
                          )}
                          {!col.nullable && !col.isPrimary && (
                            <span className="px-1.5 py-0.5 rounded bg-dark-800 text-dark-400 border border-dark-700">
                              NOT NULL
                            </span>
                          )}
                          {col.nullable && (
                            <span className="text-dark-500">NULL</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-dark-400 font-mono text-[11px]">
                        {col.defaultVal || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: Sample data preview */}
          {activeTab === 'data' && (
            <div className="overflow-x-auto">
              {selectedTable.sampleData && selectedTable.sampleData.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-dark-800 bg-dark-950/40 text-dark-400 font-mono text-[11px] uppercase tracking-wider">
                      {Object.keys(selectedTable.sampleData[0]).map(key => (
                        <th key={key} className="py-3 px-4 font-medium">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800/60 font-mono">
                    {selectedTable.sampleData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-dark-850/40 transition-colors">
                        {Object.values(row).map((val, cIdx) => (
                          <td key={cIdx} className="py-3 px-4 text-dark-200">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-dark-400 text-xs">
                  No sample rows cached for this table.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
