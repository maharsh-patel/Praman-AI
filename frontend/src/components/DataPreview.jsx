import React, { useState } from 'react';
import { Database, Columns, Rows, Eye, Hash, Calendar, Type, HelpCircle } from 'lucide-react';

export default function DataPreview({ metadata, previewRows }) {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  
  if (!metadata || !previewRows) return null;

  const totalPages = Math.ceil(previewRows.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentRows = previewRows.slice(startIndex, startIndex + rowsPerPage);

  const getColIcon = (type) => {
    switch (type) {
      case 'numeric':
        return <Hash className="w-4 h-4 text-emerald-400" />;
      case 'date':
        return <Calendar className="w-4 h-4 text-sky-400" />;
      default:
        return <Type className="w-4 h-4 text-violet-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* File Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-brand-950/50 border border-brand-900/50 text-brand-500 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">File Name</p>
            <p className="text-lg font-bold text-slate-100 truncate max-w-[200px]" title={metadata.fileName}>
              {metadata.fileName}
            </p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-emerald-950/50 border border-emerald-900/50 text-emerald-500 rounded-xl">
            <Rows className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Rows</p>
            <p className="text-2xl font-black text-emerald-400">{metadata.rowCount.toLocaleString()}</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-sky-950/50 border border-sky-900/50 text-sky-500 rounded-xl">
            <Columns className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Columns</p>
            <p className="text-2xl font-black text-sky-400">{metadata.columnCount}</p>
          </div>
        </div>
      </div>

      {/* Columns Profiler (Auto Analysis Agent) */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center space-x-2 mb-6">
          <Columns className="w-5 h-5 text-brand-500" />
          <h2 className="text-xl font-bold text-slate-100">Column Profiler (Auto-Analysis)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metadata.columns.map((col, idx) => (
            <div key={idx} className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <span className="font-semibold text-slate-200 truncate pr-2" title={col.name}>{col.name}</span>
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                  {getColIcon(col.type)}
                  {col.type}
                </span>
              </div>

              {/* Data profiling details */}
              <div className="text-xs space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span>Missing Values:</span>
                  <span className={col.stats.missingValues > 0 ? 'text-amber-400 font-medium' : 'text-slate-500'}>
                    {col.stats.missingValues} ({col.stats.missingPercentage}%)
                  </span>
                </div>

                {col.type === 'numeric' ? (
                  <>
                    <div className="flex justify-between">
                      <span>Mean (Avg):</span>
                      <span className="font-semibold text-slate-200">{col.stats.mean}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Median:</span>
                      <span className="font-semibold text-slate-200">{col.stats.median}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Min / Max:</span>
                      <span className="font-semibold text-slate-200">{col.stats.min} / {col.stats.max}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sum:</span>
                      <span className="font-semibold text-slate-200">{col.stats.sum?.toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Unique Values:</span>
                      <span className="font-semibold text-slate-200">{col.stats.uniqueValues}</span>
                    </div>
                    {col.stats.topCategories && col.stats.topCategories.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Top Categories:</span>
                        <div className="bg-slate-950/60 p-1.5 rounded space-y-1">
                          {col.stats.topCategories.map((cat, cIdx) => (
                            <div key={cIdx} className="flex justify-between text-[11px]">
                              <span className="truncate max-w-[120px] text-slate-300" title={cat.name}>{cat.name || 'empty'}</span>
                              <span className="text-slate-500">x{cat.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dataset Grid Preview */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-brand-500" />
            <h2 className="text-xl font-bold text-slate-100">Dataset Grid Preview</h2>
          </div>
          <span className="text-xs text-slate-500 bg-slate-950/60 border border-slate-900 px-3 py-1 rounded-full">
            Showing first {previewRows.length} rows
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-900 rounded-xl">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-950/70 border-b border-slate-900">
              <tr>
                <th className="px-6 py-4 font-semibold text-center border-r border-slate-900 w-16">#</th>
                {metadata.columns.map((col, idx) => (
                  <th key={idx} className="px-6 py-4 font-semibold">
                    <div className="flex items-center gap-1.5">
                      {getColIcon(col.type)}
                      <span>{col.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/50">
              {currentRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-900/20 transition-colors">
                  <td className="px-6 py-3.5 text-center font-medium text-slate-500 border-r border-slate-900/50 bg-slate-950/20">
                    {startIndex + rIdx + 1}
                  </td>
                  {metadata.columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-6 py-3.5 whitespace-nowrap max-w-xs truncate">
                      {row[col.name] === null || row[col.name] === undefined ? (
                        <span className="text-red-500/70 font-semibold italic text-xs">null</span>
                      ) : typeof row[col.name] === 'object' ? (
                        JSON.stringify(row[col.name])
                      ) : (
                        String(row[col.name])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-900/60 pt-4 text-sm">
            <span className="text-slate-500">
              Showing page {currentPage} of {totalPages}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 text-slate-400 rounded-lg hover:border-slate-700 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 text-slate-400 rounded-lg hover:border-slate-700 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
