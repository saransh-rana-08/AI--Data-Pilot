import React from 'react';
import { Sparkles, ArrowRight, CornerDownLeft, X, Lightbulb } from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

export default function QueryInput() {
  const { 
    queryPrompt, 
    setQueryPrompt, 
    executeAiGeneration, 
    isGenerating,
    dbConfig 
  } = useDatabase();

  const suggestions = [
    'What are the top 5 students by CGPA?',
    'Students with CGPA above 9.0',
    'Professors in Computer Science department',
    'Course enrollment statistics by course code',
    'Monthly student enrollment breakdown',
  ];

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      executeAiGeneration(queryPrompt);
    }
  };

  const handleSelectSuggestion = (text) => {
    setQueryPrompt(text);
    executeAiGeneration(text);
  };

  return (
    <div className="space-y-3">
      {/* Main prompt container */}
      <div className="relative rounded-2xl bg-dark-900 border border-dark-700/90 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all shadow-subtle group">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-dark-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Ask your database a question
            </span>
            {queryPrompt && (
              <button
                onClick={() => setQueryPrompt('')}
                className="text-[11px] text-dark-400 hover:text-dark-200 transition-colors flex items-center gap-1 p-0.5 rounded"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          <textarea
            value={queryPrompt}
            onChange={(e) => setQueryPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. What are the top 5 students by CGPA, or show active courses..."
            rows={3}
            disabled={isGenerating || !dbConfig.connected}
            className="w-full bg-transparent text-sm text-dark-100 placeholder-dark-400 outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Action bar inside input box */}
        <div className="px-4 py-2.5 border-t border-dark-800/80 bg-dark-850/40 rounded-b-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-dark-400 font-mono hidden sm:flex">
            <kbd className="bg-dark-800 px-1.5 py-0.5 rounded border border-dark-700 text-dark-400">⌘ + Enter</kbd>
            <span>to generate</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => executeAiGeneration(queryPrompt)}
              disabled={isGenerating || !queryPrompt.trim() || !dbConfig.connected}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Synthesizing SQL...' : 'Generate SQL'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Suggested prompts pills */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <span className="text-[11px] text-dark-400 font-medium flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-amber-400/80" />
          Try:
        </span>
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => handleSelectSuggestion(suggestion)}
            disabled={isGenerating}
            className="px-2.5 py-1 rounded-full bg-dark-850 hover:bg-dark-800 border border-dark-700/80 text-[11px] text-dark-300 hover:text-dark-100 transition-all truncate max-w-xs active:scale-[0.98]"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
