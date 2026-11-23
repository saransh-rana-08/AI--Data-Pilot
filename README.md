#DataPilot

A secure, read-only SQL analyst for cloud MySQL databases.
DataPilot is a full-stack web app for exploring and querying a MySQL database from a clean React interface. A FastAPI backend sits between the UI and the database, and every SQL query is parsed into an Abstract Syntax Tree (AST) and validated before it can reach your data, so only safe, read-only queries ever run.


#Features
1.Read-only by design: only SELECT and CTE (WITH ... SELECT) statements are allowed.
2.AST-based validation (SQLGlot): not fooled by comments, string tricks or chained statements like SELECT 1; DROP TABLE users.
3.Automatic schema discovery: tables, columns, types, primary keys and foreign keys.
4.Live connection switching: test and change database credentials from the UI without restarting the server.
5.Cloud-ready: TLS/SSL, connection pooling, health checks and masked credentials in logs.
6.Query metrics: JSON results with columns, rows, row count and execution time.
7.Schema-agnostic: works with any MySQL database.

#Tech Stack
Layer	Technology
Frontend	React, Vite
Backend	FastAPI, Uvicorn
Database access	SQLAlchemy, PyMySQL
SQL validation	SQLGlot
Configuration	pydantic-settings
Database	MySQL (Aiven Cloud)


#How It Works
React Frontend (Vite :5173)
        │  HTTP JSON
        ▼
FastAPI  →  Routes  →  Services (validation, schema)
        │  SQLAlchemy + connection pool, TLS
        ▼
Cloud MySQL (Aiven)

Every query goes through validate_sql() first: it must be a single statement, its root must be a SELECT, UNION or CTE, and the whole AST is scanned for write or admin operations (INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, SET, KILL, ...). Anything else is rejected with HTTP 400.

See docs/ARCHITECTURE.md for the full diagram, backend modules and project structure.

1.Getting Started
2.Prerequisites
3.Python 3.11+
4.Node.js 18+ and npm
5.A MySQL database (local or cloud)

#Security
-AST parsing and single-statement enforcement block query chaining and obfuscation tricks.
-Passwords are masked in logs and clients only receive sanitized errors.
-CORS limits which origins can call the API, and TLS protects the database connection.
-Recommended: connect with a database user that has read-only privileges for defense in depth.


#Limitations
-No authentication or user roles. Anyone who can reach the API can run read-only queries and switch the database connection, so run DataPilot locally or behind your own access control.
-Credentials are persisted by rewriting a plain .env file.
-MySQL only. Write operations are intentionally unsupported.


#Future Scope
-Natural-language to SQL with an LLM, validated by the existing AST checks
-Authentication and per-user connections
-Query history, CSV/Excel export and charts
-ER diagram view, automatic LIMIT and query timeouts
-Multi-database support, Docker and CI/CD


#Contributors
Saransh Rana
Anuksha Negi