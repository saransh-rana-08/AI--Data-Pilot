import React from 'react';
import { Database, Plus } from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

export default function EmptyState({
  icon: Icon = Database,
  title = 'No database connected',
  description = 'Connect your database to start asking questions in natural language, generating SQL, and exploring schemas.',
  actionLabel = 'Connect Database',
  onAction,
}) {
  const { setIsConnectionModalOpen } = useDatabase();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      setIsConnectionModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-md mx-auto">
      <div className="w-12 h-12 rounded-xl bg-dark-850 border border-dark-700 flex items-center justify-center text-dark-400 mb-4 shadow-subtle">
        <Icon className="w-5 h-5 text-brand-accent" />
      </div>
      <h3 className="text-base font-medium text-dark-100 mb-1.5">{title}</h3>
      <p className="text-sm text-dark-400 leading-relaxed mb-6">
        {description}
      </p>
      {actionLabel && (
        <button
          onClick={handleAction}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
