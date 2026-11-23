# DataPilot

**A secure, read-only SQL analyst for cloud MySQL databases.**

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?logo=sqlalchemy&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)

DataPilot is a full-stack web app for exploring and querying a MySQL database from a clean React interface. A FastAPI backend sits between the UI and the database, and every SQL query is parsed into an Abstract Syntax Tree (AST) and validated **before** it can reach your data, so only safe, read-only queries ever run.

## Features

- **Read-only by design:** only `SELECT` and CTE (`WITH ... SELECT`) statements are allowed.
- **AST-based validation (SQLGlot):** not fooled by comments, string tricks or chained statements like `SELECT 1; DROP TABLE users`.
- **Automatic schema discovery:** tables, columns, types, primary keys and foreign keys.
- **Live connection switching:** test and change database credentials from the UI without restarting the server.
- **Cloud-ready:** TLS/SSL, connection pooling, health checks and masked credentials in logs.
- **Query metrics:** JSON results with columns, rows, row count and execution time.
- **Schema-agnostic:** works with any MySQL database.

## Screenshots

<!-- Add screenshots here, for example:
![Query editor](docs/images/query-editor.png)
![Schema explorer](docs/images/schema-explorer.png)
-->

_Screenshots coming soon._

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite |
| Backend | FastAPI, Uvicorn |
| Database access | SQLAlchemy, PyMySQL |
| SQL validation | SQLGlot |
| Configuration | pydantic-settings |
| Database | MySQL (Aiven Cloud) |

## How It Works

```
React Frontend (Vite :5173)
        │  HTTP JSON
        ▼
FastAPI  →  Routes  →  Services (validation, schema)
        │  SQLAlchemy + connection pool, TLS
        ▼
Cloud MySQL (Aiven)
```

Every query goes through `validate_sql()` first: it must be a single statement, its root must be a `SELECT`, `UNION` or CTE, and the whole AST is scanned for write or admin operations (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `CREATE`, `ALTER`, `SET`, `KILL`, ...). Anything else is rejected with HTTP 400.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full diagram, backend modules and project structure.

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- A MySQL database (local or cloud)

### 1. Clone

```bash
git clone https://github.com/saransh-rana-08/AI--Data-Pilot.git
cd AI--Data-Pilot
```

### 2. Backend

```bash
cd Backend
python -m venv .venv

# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1
# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in your database details (see the table below), then start the server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

> **Never commit your `.env` file.** Share only `.env.example`.

## Environment Variables

Set these in `Backend/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | Database hostname |
| `DB_PORT` | `3306` | MySQL port |
| `DB_NAME` | `datapilot_db` | Target database |
| `DB_USER` | `root` | Username |
| `DB_PASSWORD` | `""` | Password |
| `DB_SSL_MODE` | `DISABLED` | `REQUIRED` or `DISABLED` |
| `APP_HOST` | `0.0.0.0` | Host the server binds to |
| `APP_PORT` | `8000` | Server port |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated allowed origins |

## Documentation

- [API Reference](docs/API.md): endpoints, request and response examples, connection switching
- [Architecture](docs/ARCHITECTURE.md): system diagram, backend modules, project structure, tests

## Security

- AST parsing and single-statement enforcement block query chaining and obfuscation tricks.
- Passwords are masked in logs and clients only receive sanitized errors.
- CORS limits which origins can call the API, and TLS protects the database connection.
- **Recommended:** connect with a database user that has **read-only privileges** for defense in depth.

## Limitations

- **No authentication or user roles.** Anyone who can reach the API can run read-only queries and switch the database connection, so run DataPilot locally or behind your own access control.
- Credentials are persisted by rewriting a plain `.env` file.
- MySQL only. Write operations are intentionally unsupported.

## Future Scope

- Natural-language to SQL with an LLM, validated by the existing AST checks
- Authentication and per-user connections
- Query history, CSV/Excel export and charts
- ER diagram view, automatic `LIMIT` and query timeouts
- Multi-database support, Docker and CI/CD

## Contributors

- [Saransh Rana](https://github.com/saransh-rana-08)
- [Anuksha Negi](https://github.com/Anuksha-Negi)

## License

Add a license (for example, MIT) and include a `LICENSE` file in the repository root. Until then, all rights are reserved by the authors.
