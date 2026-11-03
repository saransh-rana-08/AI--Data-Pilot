import React, { useState } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  Loader2, 
  Server, 
  Lock, 
  User, 
  FolderGit2, 
  AlertCircle,
  Unplug,
  ShieldCheck
} from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';
import { testConnection } from '../../services/api';

export default function ConnectionModal() {
  const { 
    isConnectionModalOpen, 
    setIsConnectionModalOpen, 
    dbConfig, 
    connectDatabase, 
    disconnectDatabase,
    addToast
  } = useDatabase();

  const [dbType, setDbType] = useState('MySQL');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('3306');
  const [dbName, setDbName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sslMode, setSslMode] = useState('REQUIRED');

  // Initialize form state once when modal opens, without overwriting while user is typing
  React.useEffect(() => {
    if (isConnectionModalOpen) {
      const isPg = (dbConfig?.type || '').toLowerCase().includes('postgr');
      setDbType(isPg ? 'PostgreSQL' : 'MySQL');
      setHost(dbConfig?.host && dbConfig.host !== 'localhost' ? dbConfig.host : (dbConfig?.host || ''));
      setPort(dbConfig?.port ? String(dbConfig.port) : (isPg ? '5432' : '3306'));
      const activeName = dbConfig?.name && dbConfig.name !== 'No Database' ? dbConfig.name : '';
      setDbName(activeName);
      setUsername(dbConfig?.user || '');
      setSslMode(dbConfig?.ssl_mode || 'REQUIRED');
      setPassword('');
      setTestStatus('idle');
      setTestStepMessage('');
    }
  }, [isConnectionModalOpen]);

  // Test connection simulation states: 'idle' | 'testing' | 'success' | 'failed'
  const [testStatus, setTestStatus] = useState('idle');
  const [testStepMessage, setTestStepMessage] = useState('');

  if (!isConnectionModalOpen) return null;

  const handleDbTypeChange = (type) => {
    setDbType(type);
    if (type === 'MySQL') setPort('3306');
    else if (type === 'PostgreSQL') setPort('5432');
    setTestStatus('idle');
  };

  const runTestConnection = async () => {
    setTestStatus('testing');
    const isPg = dbType.toLowerCase().includes('postgr');
    setTestStepMessage(`Testing connection to ${dbType} at ${host}:${port}...`);

    try {
      const creds = {
        db_type: isPg ? 'postgresql' : 'mysql',
        host,
        port: Number(port) || (isPg ? 5432 : 3306),
        database: dbName,
        user: username,
        password: password || '',
        ssl_mode: sslMode
      };

      const data = await testConnection(creds);
      setTestStatus('success');
      setTestStepMessage(`Connected successfully (${data.latency_ms ? data.latency_ms + ' ms' : 'OK'})`);
      if (addToast) {
        addToast('Connection Successful', `Connected to ${dbName} in ${data.latency_ms || 0} ms`, 'success');
      }
    } catch (err) {
      setTestStatus('failed');
      setTestStepMessage(err.message || 'Database connection failed');
      if (addToast) {
        addToast('Connection Failed', err.message || 'Database connection failed', 'error');
      }
    }
  };

  const handleSaveConnection = async (e) => {
    e.preventDefault();
    setTestStatus('testing');
    setTestStepMessage(`Connecting to ${dbType} and saving credentials...`);

    const isPg = dbType.toLowerCase().includes('postgr');
    const ok = await connectDatabase({
      name: dbName,
      database: dbName,
      type: dbType,
      db_type: isPg ? 'postgresql' : 'mysql',
      host,
      port: Number(port) || (isPg ? 5432 : 3306),
      user: username,
      password: password || '',
      ssl_mode: sslMode
    });

    if (ok) {
      setTestStatus('idle');
    } else {
      setTestStatus('failed');
      setTestStepMessage('Could not connect with provided credentials.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-dark-900 border border-dark-700 rounded-2xl shadow-elevated overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700/80 bg-dark-850/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Database className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-dark-100">Connect a Database</h2>
              <p className="text-xs text-dark-400">Configure connection credentials for QueryAI</p>
            </div>
          </div>
          <button
            onClick={() => setIsConnectionModalOpen(false)}
            className="p-1.5 text-dark-400 hover:text-dark-200 rounded-lg hover:bg-dark-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveConnection} className="p-6 space-y-5">
          {/* Database Type Selectors */}
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-2">
              Database Type
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {['MySQL', 'PostgreSQL'].map(type => (
                <button
                  type="button"
                  key={type}
                  onClick={() => handleDbTypeChange(type)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all ${
                    dbType === type
                      ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-sm'
                      : 'bg-dark-850 border-dark-700 text-dark-400 hover:text-dark-200 hover:bg-dark-800'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Host & Port */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-dark-300 mb-1.5">
                Host
              </label>
              <div className="relative flex items-center">
                <Server className="w-3.5 h-3.5 text-dark-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={host}
                  onChange={(e) => { setHost(e.target.value); setTestStatus('idle'); }}
                  className="w-full pl-9 pr-3 py-2 bg-dark-850 border border-dark-700 rounded-lg text-xs text-dark-100 placeholder-dark-400 outline-none focus:border-indigo-500 transition-colors font-mono"
                  placeholder="localhost"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">
                Port
              </label>
              <input
                type="text"
                value={port}
                onChange={(e) => { setPort(e.target.value); setTestStatus('idle'); }}
                className="w-full px-3 py-2 bg-dark-850 border border-dark-700 rounded-lg text-xs text-dark-100 placeholder-dark-400 outline-none focus:border-indigo-500 transition-colors font-mono"
                placeholder="3306"
              />
            </div>
          </div>

          {/* Database Name */}
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1.5">
              Database Name
            </label>
            <div className="relative flex items-center">
              <FolderGit2 className="w-3.5 h-3.5 text-dark-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={dbName}
                onChange={(e) => { setDbName(e.target.value); setTestStatus('idle'); }}
                className="w-full pl-9 pr-3 py-2 bg-dark-850 border border-dark-700 rounded-lg text-xs text-dark-100 placeholder-dark-400 outline-none focus:border-indigo-500 transition-colors font-mono"
                placeholder="e.g. customer"
                required
              />
            </div>
          </div>

          {/* Credentials: User & Password */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">
                Username
              </label>
              <div className="relative flex items-center">
                <User className="w-3.5 h-3.5 text-dark-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setTestStatus('idle'); }}
                  className="w-full pl-9 pr-3 py-2 bg-dark-850 border border-dark-700 rounded-lg text-xs text-dark-100 placeholder-dark-400 outline-none focus:border-indigo-500 transition-colors font-mono"
                  placeholder="root"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-3.5 h-3.5 text-dark-400 absolute left-3 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setTestStatus('idle'); }}
                  className="w-full pl-9 pr-3 py-2 bg-dark-850 border border-dark-700 rounded-lg text-xs text-dark-100 placeholder-dark-400 outline-none focus:border-indigo-500 transition-colors font-mono"
                  placeholder="Password"
                />
              </div>
            </div>
          </div>

          {/* SSL / TLS Encryption Mode */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-dark-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>SSL / TLS Encryption</span>
              </label>
              <span className="text-[11px] text-dark-400">
                {sslMode === 'REQUIRED' ? 'Encrypted (Cloud: Neon / Aiven / RDS)' : 'Disabled (Local host)'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => { setSslMode('REQUIRED'); setTestStatus('idle'); }}
                className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all ${
                  sslMode === 'REQUIRED'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-sm'
                    : 'bg-dark-850 border-dark-700 text-dark-400 hover:text-dark-200 hover:bg-dark-800'
                }`}
              >
                SSL Required (Cloud)
              </button>
              <button
                type="button"
                onClick={() => { setSslMode('DISABLED'); setTestStatus('idle'); }}
                className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all ${
                  sslMode === 'DISABLED'
                    ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-sm'
                    : 'bg-dark-850 border-dark-700 text-dark-400 hover:text-dark-200 hover:bg-dark-800'
                }`}
              >
                SSL Disabled (Local)
              </button>
            </div>
          </div>

          {/* Test Status Banner / Feedback */}
          {testStatus === 'testing' && (
            <div className="p-3.5 rounded-lg bg-dark-850 border border-indigo-500/30 flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
              <div className="text-xs">
                <p className="font-medium text-dark-100">{testStepMessage}</p>
                <p className="text-[11px] text-dark-400">Verifying network handshake and catalog permissions</p>
              </div>
            </div>
          )}

          {testStatus === 'success' && (
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium text-emerald-400">Connection successful</p>
                <p className="text-dark-300 text-[11px] mt-0.5">
                  {testStepMessage}
                </p>
              </div>
            </div>
          )}

          {testStatus === 'failed' && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium text-rose-400">Connection failed</p>
                <p className="text-dark-300 text-[11px] mt-0.5">
                  {testStepMessage}
                </p>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-3 border-t border-dark-700/80 flex items-center justify-between gap-3">
            {dbConfig.connected ? (
              <button
                type="button"
                onClick={async () => {
                  await disconnectDatabase();
                  setTestStatus('idle');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              >
                <Unplug className="w-3.5 h-3.5" />
                Disconnect
              </button>
            ) : (
              <span className="text-xs text-dark-400">Not connected</span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={runTestConnection}
                disabled={testStatus === 'testing'}
                className="px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-750 border border-dark-700 text-xs font-medium text-dark-200 hover:text-white transition-colors disabled:opacity-50"
              >
                {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
              </button>

              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-all shadow-sm active:scale-[0.98]"
              >
                {dbConfig.connected ? 'Save Changes' : 'Connect Database'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
