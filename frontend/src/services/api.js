/**
 * DataPilot Backend API Service Client
 * Interfaces with the FastAPI backend running on http://localhost:8000
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Retrieve active database configuration from backend.
 */
export async function fetchCurrentConnection() {
  const response = await fetch(`${API_BASE_URL}/api/connection/current`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.detail || 'Could not fetch current connection');
  }
  return data;
}

/**
 * Test database connectivity (SELECT 1).
 * Accepts optional credentials to test dynamic connection parameters.
 */
export async function testConnection(credentials = null) {
  let response;
  if (credentials) {
    response = await fetch(`${API_BASE_URL}/api/connection/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
  } else {
    response = await fetch(`${API_BASE_URL}/api/connection/test`);
  }

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || data.detail || 'Database connection failed');
  }
  return data;
}

/**
 * Connect to a new database and persist credentials.
 */
export async function saveAndConnectDatabase(credentials) {
  const response = await fetch(`${API_BASE_URL}/api/connection/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || data.detail || 'Failed to connect to database');
  }
  return data;
}

/**
 * Introspect full database schema (all tables, columns, primary keys, foreign keys).
 */
export async function fetchDatabaseSchema() {
  const response = await fetch(`${API_BASE_URL}/api/schema`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to fetch database schema');
  }
  return data;
}

/**
 * Introspect a specific table's schema.
 */
export async function fetchTableSchema(tableName) {
  const response = await fetch(`${API_BASE_URL}/api/schema/${encodeURIComponent(tableName)}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || `Failed to fetch schema for ${tableName}`);
  }
  return data;
}

/**
 * Check if a SQL query is read-only (SELECT/WITH) without executing it.
 */
export async function validateSQLQuery(sql) {
  const response = await fetch(`${API_BASE_URL}/api/query/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql }),
  });
  const data = await response.json();
  return data;
}

/**
 * Execute a read-only SQL query against the database.
 */
export async function executeSQLQuery(sql) {
  const response = await fetch(`${API_BASE_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || data.error || 'SQL execution failed');
  }
  return data;
}
