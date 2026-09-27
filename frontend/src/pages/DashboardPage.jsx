import React from 'react';
import { Database, Sparkles, Plus } from 'lucide-react';
import DatabaseStatusCard from '../components/dashboard/DatabaseStatusCard';
import AskDatabaseHero from '../components/dashboard/AskDatabaseHero';
import RecentQueriesTable from '../components/dashboard/RecentQueriesTable';
import EmptyState from '../components/common/EmptyState';
import { useDatabase } from '../context/DatabaseContext';

export default function DashboardPage() {
  const { dbConfig, setIsConnectionModalOpen } = useDatabase();

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header section */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Good morning
        </h1>
        <p className="text-sm text-dark-400 max-w-2xl leading-relaxed">
          Analyze your database with natural language. Ask questions, generate SQL, and explore your data.
        </p>
      </div>

      {!dbConfig.connected ? (
        <div className="rounded-2xl bg-dark-900 border border-dark-700/80 p-8 shadow-subtle">
          <EmptyState
            icon={Database}
            title="No database connected"
            description="Connect your database to start asking questions in natural language, generating SQL, and exploring schemas."
            actionLabel="Connect Database"
            onAction={() => setIsConnectionModalOpen(true)}
          />
        </div>
      ) : (
        <>
          {/* Database status widget */}
          <DatabaseStatusCard />

          {/* Centerpiece: Ask your database hero area */}
          <AskDatabaseHero />

          {/* Recent queries */}
          <RecentQueriesTable />
        </>
      )}
    </div>
  );
}
