import React from 'react';

export default function StatusBadge({ status, className = '' }) {
  const isSuccess = status?.toLowerCase() === 'success' || status?.toLowerCase() === 'connected';
  const isFailed = status?.toLowerCase() === 'failed' || status?.toLowerCase() === 'error';

  if (isSuccess) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        {status}
      </span>
    );
  }

  if (isFailed) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
        {status}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-dark-750 text-dark-200 border border-dark-700 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-dark-400"></span>
      {status}
    </span>
  );
}
