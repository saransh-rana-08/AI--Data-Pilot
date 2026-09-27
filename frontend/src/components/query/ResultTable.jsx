import React, { useState, useMemo } from 'react';
import { 
  Table as TableIcon, 
  Download, 
  ArrowUpDown, 
  Search, 
  FileSpreadsheet, 
  AlertCircle, 
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

export default function ResultTable() {
  const { activeQuery, isGenerating, executeAiGeneration, addToast } = useDatabase();
  const [filterText, setFilterText] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [copiedJson, setCopiedJson] = useState(false);

  if (isGenerating || !activeQuery) return null;

  // Error State handling
  if (activeQuery.status === 'Failed') {
    return (
      <div className="rounded-2xl bg-dark-900 border border-rose-500/20 p-6 shadow-subtle space-y-4 animate-in fade-in duration-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-rose-400">Query couldn't be executed</h3>
            <p className="text-xs text-dark-300 leading-relaxed font-mono">
              {activeQuery.errorMessage || 'The generated SQL contains an invalid column or table reference.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-dark-800">
          <button
            onClick={() => executeAiGeneration('What are the top 5 students by CGPA?')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-750 border border-dark-700 text-xs font-medium text-dark-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Safe Query</span>
          </button>
        </div>
      </div>
    );
  }

  const columns = activeQuery.columns || (activeQuery.rows && activeQuery.rows.length > 0 ? Object.keys(activeQuery.rows[0]) : []);
  const rawRows = activeQuery.rows || [];

  // Filter & Sort
  const processedRows = useMemo(() => {
    let list = [...rawRows];

    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      list = list.filter(row => 
        Object.values(row).some(val => String(val).toLowerCase().includes(q))
      );
    }

    if (sortKey) {
      list.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        // Numerical comparison if possible
        if (!isNaN(valA) && !isNaN(valB)) {
          return sortOrder === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return list;
  }, [rawRows, filterText, sortKey, sortOrder]);

  const handleSort = (col) => {
    if (sortKey === col) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(col);
      setSortOrder('asc');
    }
  };

  const handleExportCSV = () => {
    if (!columns.length || !processedRows.length) return;
    const headerRow = columns.join(',');
    const bodyRows = processedRows.map(r => columns.map(c => `"${r[c] ?? ''}"`).join(','));
    const csvContent = [headerRow, ...bodyRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query_result_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('CSV Downloaded', `${processedRows.length} rows exported`, 'success');
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(processedRows, null, 2));
    setCopiedJson(true);
    addToast('JSON Copied', 'Result dataset copied as JSON', 'success');
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-dark-900 border border-dark-700/90 shadow-subtle overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-dark-800 bg-dark-850/60">
        <div className="flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-dark-100 uppercase tracking-wider">
            Query Result
          </span>
          <span className="text-[11px] font-mono text-dark-400">
            ({processedRows.length} {processedRows.length === 1 ? 'row' : 'rows'})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter input */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-dark-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter results..."
              className="pl-8 pr-2.5 py-1 bg-dark-800 border border-dark-700 rounded-lg text-xs text-dark-100 placeholder-dark-400 outline-none focus:border-indigo-500 transition-colors w-32 sm:w-44"
            />
          </div>

          <button
            onClick={handleCopyJSON}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-dark-800 hover:bg-dark-750 border border-dark-700 text-xs font-mono text-dark-300 hover:text-dark-100 transition-colors"
            title="Copy as JSON"
          >
            {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">JSON</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-dark-800 hover:bg-dark-750 border border-dark-700 text-xs font-medium text-dark-200 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Grid Table */}
      {processedRows.length === 0 ? (
        <div className="py-12 text-center text-xs text-dark-400">
          No records matching the filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-dark-800 bg-dark-950/40 text-dark-400 font-mono text-[11px] uppercase tracking-wider">
                {columns.map(col => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="py-3 px-4 font-medium select-none cursor-pointer hover:text-dark-200 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col}</span>
                      <ArrowUpDown className={`w-3 h-3 transition-opacity ${sortKey === col ? 'opacity-100 text-indigo-400' : 'opacity-30 group-hover:opacity-70'}`} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800/60 font-mono">
              {processedRows.map((row, rIndex) => (
                <tr 
                  key={rIndex}
                  className="hover:bg-dark-850/50 transition-colors group"
                >
                  {columns.map(col => {
                    const val = row[col];
                    const isNumber = !isNaN(val) && val !== '' && val !== null;
                    return (
                      <td 
                        key={col} 
                        className={`py-3 px-4 text-dark-200 ${isNumber ? 'tabular-nums font-medium' : ''}`}
                      >
                        {val !== null && val !== undefined ? String(val) : <span className="text-dark-600 italic">NULL</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
