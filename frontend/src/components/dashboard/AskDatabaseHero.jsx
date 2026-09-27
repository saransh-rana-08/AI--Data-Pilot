import React, { useState } from 'react';
import { Sparkles, ArrowRight, CornerDownLeft, Sparkle, Compass } from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

export default function AskDatabaseHero() {
  const { navigate, dbConfig, setIsConnectionModalOpen } = useDatabase();
  const [heroPrompt, setHeroPrompt] = useState('');

  const quickPrompts = [
    'Show the top 10 students by CGPA',
    'Monthly student enrollment breakdown',
    'Students with CGPA above 9.0',
    'Professors in Computer Science department',
  ];

  const handleSubmit = (promptToRun) => {
    const text = (promptToRun || heroPrompt).trim();
    if (!text) return;

    if (!dbConfig.connected) {
      setIsConnectionModalOpen(true);
      return;
    }

    navigate('query', { prompt: text, runImmediately: true });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-b from-dark-850 to-dark-900 border border-dark-700/80 p-6 sm:p-8 shadow-elevated relative overflow-hidden group">
      {/* Subtle background glow effect */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 space-y-5">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Natural Language Query Engine</span>
          </div>
          <span className="text-[11px] font-mono text-dark-400 hidden sm:inline">
            Press Enter ↵ to synthesize
          </span>
        </div>

        {/* Large prompt input area */}
        <div className="space-y-3">
          <div className="relative rounded-xl bg-dark-950/80 border border-dark-700 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all p-4 shadow-subtle">
            <textarea
              rows={3}
              value={heroPrompt}
              onChange={(e) => setHeroPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Ask anything about your database... e.g. "Show the top 10 students by CGPA"'
              className="w-full bg-transparent text-base sm:text-lg text-dark-100 placeholder-dark-500 outline-none resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between pt-3 border-t border-dark-800/80 mt-2">
              <div className="text-xs text-dark-400 hidden sm:block">
                Connected to <span className="font-mono text-dark-200">{dbConfig.name}</span>
              </div>

              <button
                onClick={() => handleSubmit()}
                disabled={!heroPrompt.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold tracking-wide transition-all shadow-glow active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
              >
                <span>Generate SQL</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Suggested queries quick pills */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-dark-400 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>Quick Start Prompts:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSubmit(prompt)}
                className="flex items-center justify-between p-3 rounded-xl bg-dark-850/60 hover:bg-dark-800 border border-dark-700/60 hover:border-dark-600 transition-all text-left text-xs text-dark-200 hover:text-white group/btn"
              >
                <span className="truncate">"{prompt}"</span>
                <ArrowRight className="w-3.5 h-3.5 text-dark-500 group-hover/btn:text-indigo-400 group-hover/btn:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
