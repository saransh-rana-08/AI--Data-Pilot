import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useDatabase();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg bg-dark-850/95 backdrop-blur-md border border-dark-700 shadow-elevated transition-all animate-in fade-in slide-in-from-bottom-3 duration-200"
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {isError && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {!isSuccess && !isError && <Info className="w-4 h-4 text-brand-accent" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-dark-100">{toast.title}</p>
              {toast.message && (
                <p className="text-xs text-dark-400 mt-0.5 break-words line-clamp-2">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-dark-400 hover:text-dark-200 p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
