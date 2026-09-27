import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initialDatabaseConfig, mockTables, mockSampleQueries } from '../data/mockDatabase';
import { synthesizeSQLFromPrompt, AI_GENERATION_STEPS } from '../services/sqlGenerator';
import { 
  testConnection, 
  fetchDatabaseSchema, 
  executeSQLQuery, 
  saveAndConnectDatabase, 
  fetchCurrentConnection 
} from '../services/api';

const DatabaseContext = createContext();

export function DatabaseProvider({ children }) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [dbConfig, setDbConfig] = useState(initialDatabaseConfig);
  const [tables, setTables] = useState(mockTables);
  const [historyList, setHistoryList] = useState(mockSampleQueries);

  // Active query state
  const [queryPrompt, setQueryPrompt] = useState('Show the top 5 students by CGPA');
  const [activeQuery, setActiveQuery] = useState(mockSampleQueries[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  // Modals & UI states
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast notification helper
  const addToast = (title, message = '', type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Navigation helper
  const navigate = (view, extraState = {}) => {
    setCurrentView(view);
    if (extraState.prompt !== undefined) {
      setQueryPrompt(extraState.prompt);
    }
    if (extraState.runImmediately && extraState.prompt) {
      executeAiGeneration(extraState.prompt);
    }
  };

  // Simulated AI query generation with realistic stepped feedback
  const executeAiGeneration = (promptToRun) => {
    if (!dbConfig.connected) {
      addToast('No Database Connected', 'Please connect a database before asking queries.', 'error');
      setIsConnectionModalOpen(true);
      return;
    }

    const trimmed = (promptToRun || queryPrompt).trim();
    if (!trimmed) return;

    setIsGenerating(true);
    setGenerationStep(0);

    // Step 1
    const step1Timer = setTimeout(() => {
      setGenerationStep(1);
    }, 450);

    // Step 2
    const step2Timer = setTimeout(() => {
      setGenerationStep(2);
    }, 900);

    // Completion
    const step3Timer = setTimeout(() => {
      const generated = synthesizeSQLFromPrompt(trimmed);
      const newQueryItem = {
        id: 'q-' + Date.now(),
        prompt: trimmed,
        sql: generated.sql,
        executionTime: generated.executionTime,
        rowCount: generated.rowCount,
        status: generated.status,
        errorMessage: generated.errorMessage,
        columns: generated.columns,
        rows: generated.rows,
        timestamp: 'Just now'
      };

      setActiveQuery(newQueryItem);
      setHistoryList(prev => [newQueryItem, ...prev]);
      setIsGenerating(false);

      if (generated.status === 'Success') {
        addToast('SQL Generated & Executed', `${generated.rowCount} rows returned in ${generated.executionTime}`, 'success');
      } else {
        addToast('Execution Warning', generated.errorMessage || 'Query failed', 'error');
      }
    }, 1400);

    return () => {
      clearTimeout(step1Timer);
      clearTimeout(step2Timer);
      clearTimeout(step3Timer);
    };
  };

  // Load database metadata and tables from FastAPI backend
  const loadDatabaseFromBackend = useCallback(async (silent = false) => {
    try {
      const conn = await testConnection();
      if (!conn.success) return false;

      const schema = await fetchDatabaseSchema();
      if (!schema || !schema.tables) return false;

      // Transform tables into the structure TableSchemaView expects
      const transformedTables = await Promise.all(
        schema.tables.map(async (table) => {
          let sampleData = [];
          let rowCount = 0;

          try {
            // Fetch preview data and count
            const previewRes = await executeSQLQuery(`SELECT * FROM \`${table.name}\` LIMIT 10`);
            if (previewRes.success && previewRes.rows) {
              sampleData = previewRes.rows.map(row => {
                const obj = {};
                previewRes.columns.forEach((col, idx) => {
                  obj[col] = row[idx];
                });
                return obj;
              });
              rowCount = previewRes.row_count;
            }

            const countRes = await executeSQLQuery(`SELECT COUNT(*) as cnt FROM \`${table.name}\``);
            if (countRes.success && countRes.rows && countRes.rows.length > 0) {
              rowCount = countRes.rows[0][0];
            }
          } catch (e) {
            console.warn(`Could not load preview for table ${table.name}:`, e);
          }

          const columns = table.columns.map(col => {
            const isPrimary = table.primary_keys.includes(col.name);
            const fk = table.foreign_keys.find(f => f.constrained_columns.includes(col.name));
            const isForeign = Boolean(fk);
            const references = fk ? `${fk.referred_table}.${fk.referred_columns[0] || 'id'}` : null;

            return {
              name: col.name,
              type: col.type,
              isPrimary,
              isForeign,
              references,
              nullable: col.nullable,
              defaultVal: col.default,
            };
          });

          return {
            name: table.name,
            description: `Aiven Cloud MySQL table: ${table.name}`,
            rowCount: Number(rowCount),
            columnsCount: columns.length,
            columns,
            sampleData,
          };
        })
      );

      setTables(transformedTables);

      const totalCols = transformedTables.reduce((acc, t) => acc + t.columnsCount, 0);
      const totalFks = schema.tables.reduce((acc, t) => acc + (t.foreign_keys?.length || 0), 0);
      const totalRows = transformedTables.reduce((acc, t) => acc + (t.rowCount || 0), 0);

      let currentConn = null;
      try {
        currentConn = await fetchCurrentConnection();
      } catch (e) {
        console.warn('Could not fetch current connection:', e);
      }

      setDbConfig(prev => ({
        ...prev,
        connected: true,
        name: schema.database || currentConn?.database || 'defaultdb',
        type: 'MySQL (Aiven)',
        version: '8.0',
        host: currentConn?.host || 'mysql-18a0a7e9-saranshrana08-b982.b.aivencloud.com',
        port: String(currentConn?.port || 15352),
        user: currentConn?.user || 'avnadmin',
        connectedAt: 'Just now',
        totalTables: transformedTables.length,
        totalColumns: totalCols,
        totalRelationships: totalFks,
        totalRows: totalRows.toLocaleString(),
        size: 'Aiven Cloud',
      }));

      // Set initial sample query on real table if currently targeting unmapped table
      if (transformedTables.length > 0) {
        const firstTable = transformedTables[0].name;
        setQueryPrompt(`SELECT * FROM ${firstTable} LIMIT 10`);
      }

      if (!silent) {
        addToast('Database Synced', `Connected to Aiven MySQL (${transformedTables.length} tables found)`, 'success');
      }

      return true;
    } catch (err) {
      console.warn('Could not auto-connect to backend database:', err);
      return false;
    }
  }, [addToast]);

  // Initial auto-sync with backend on mount
  useEffect(() => {
    loadDatabaseFromBackend(true);
  }, [loadDatabaseFromBackend]);

  // Re-run an edited SQL statement using live backend execution
  const reRunSQL = async (sqlText) => {
    if (!dbConfig.connected) {
      addToast('Error', 'Database disconnected', 'error');
      return;
    }

    const queryToRun = (sqlText || activeQuery?.sql || '').trim();
    if (!queryToRun) return;

    try {
      const data = await executeSQLQuery(queryToRun);
      const objectRows = (data.rows || []).map(row => {
        const obj = {};
        data.columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });

      const updatedQuery = {
        id: 'q-' + Date.now(),
        prompt: activeQuery?.prompt || queryToRun,
        sql: queryToRun,
        executionTime: `${data.execution_time_ms} ms`,
        rowCount: data.row_count,
        status: 'Success',
        errorMessage: null,
        columns: data.columns,
        rows: objectRows,
        timestamp: 'Just now'
      };

      setActiveQuery(updatedQuery);
      setHistoryList(prev => [updatedQuery, ...prev]);
      addToast('Query Executed', `${data.row_count} rows returned in ${data.execution_time_ms} ms`, 'success');
    } catch (err) {
      const failedQuery = {
        id: 'q-' + Date.now(),
        prompt: activeQuery?.prompt || queryToRun,
        sql: queryToRun,
        executionTime: '0 ms',
        rowCount: 0,
        status: 'Failed',
        errorMessage: err.message,
        columns: [],
        rows: [],
        timestamp: 'Just now'
      };
      setActiveQuery(failedQuery);
      addToast('Query Failed', err.message, 'error');
    }
  };

  // Reset / clear query workspace
  const clearQuery = () => {
    setQueryPrompt('');
    setActiveQuery(null);
  };

  // Connect database with dynamic parameters
  const connectDatabase = async (newConfig) => {
    setIsConnectionModalOpen(false);
    if (newConfig && newConfig.host && (newConfig.name || newConfig.database)) {
      try {
        await saveAndConnectDatabase({
          host: newConfig.host,
          port: Number(newConfig.port) || 3306,
          database: newConfig.name || newConfig.database,
          user: newConfig.user,
          password: newConfig.password || '',
          ssl_mode: newConfig.ssl_mode || 'DISABLED'
        });
        addToast('Connected Successfully', `Connected to ${newConfig.name || newConfig.database}`, 'success');
      } catch (err) {
        addToast('Connection Failed', err.message, 'error');
        return false;
      }
    }
    const synced = await loadDatabaseFromBackend(false);
    return synced;
  };

  // Disconnect database
  const disconnectDatabase = () => {
    setDbConfig(prev => ({
      ...prev,
      connected: false
    }));
    setIsConnectionModalOpen(false);
    addToast('Database Disconnected', 'Connection closed.', 'info');
  };

  return (
    <DatabaseContext.Provider
      value={{
        currentView,
        setCurrentView,
        navigate,
        dbConfig,
        setDbConfig,
        tables,
        historyList,
        queryPrompt,
        setQueryPrompt,
        activeQuery,
        setActiveQuery,
        isGenerating,
        generationStep,
        generationSteps: AI_GENERATION_STEPS,
        executeAiGeneration,
        reRunSQL,
        refreshDatabase: () => loadDatabaseFromBackend(false),
        clearQuery,
        isConnectionModalOpen,
        setIsConnectionModalOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        toasts,
        addToast,
        removeToast,
        connectDatabase,
        disconnectDatabase,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
