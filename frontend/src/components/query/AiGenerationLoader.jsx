import React from 'react';
import { Loader2, CheckCircle2, CircleDot } from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

export default function AiGenerationLoader() {
  const { isGenerating, generationStep, generationSteps } = useDatabase();

  if (!isGenerating) return null;

  return (
    <div className="rounded-2xl bg-dark-900 border border-dark-700 p-5 shadow-elevated space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
          </span>
          <span className="text-xs font-semibold text-dark-100 uppercase tracking-wider">
            AI SQL Synthesis Pipeline
          </span>
        </div>
        <span className="text-[11px] font-mono text-indigo-400">Step {generationStep + 1} of 3</span>
      </div>

      <div className="space-y-2.5">
        {generationSteps.map((stepLabel, idx) => {
          const isDone = idx < generationStep;
          const isCurrent = idx === generationStep;
          const isPending = idx > generationStep;

          return (
            <div
              key={stepLabel}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all text-xs ${
                isCurrent
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200 font-medium'
                  : isDone
                  ? 'bg-dark-850 border-dark-750 text-dark-300'
                  : 'bg-dark-950/40 border-dark-800/60 text-dark-500'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
              ) : (
                <CircleDot className="w-4 h-4 text-dark-600 shrink-0" />
              )}
              <span className="flex-1">{stepLabel}</span>
              {isCurrent && (
                <span className="text-[10px] font-mono text-indigo-400 animate-pulse">
                  processing
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Sleek skeleton placeholder preview */}
      <div className="pt-2 border-t border-dark-800 space-y-2">
        <div className="h-3.5 bg-dark-800/80 rounded animate-pulse w-3/4"></div>
        <div className="h-3 bg-dark-850 rounded animate-pulse w-1/2"></div>
      </div>
    </div>
  );
}
