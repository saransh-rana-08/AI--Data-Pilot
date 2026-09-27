# DataPilot Backend — Comprehensive Architectural & Code Reference Manual

Welcome to the comprehensive code-level documentation for the **DataPilot** backend. This document provides an exhaustive, function-by-function and line-by-line architectural breakdown of every file, class, method, data model, and route in the `backend/` directory.

---

## Table of Contents
1. [System Architecture & Flow](#1-system-architecture--flow)
2. [Directory Structure](#2-directory-structure)
3. [Configuration Layer (`app/config.py`)](#3-configuration-layer-appconfigpy)
4. [Database Engine & Connection Pooling (`app/database.py`)](#4-database-engine--connection-pooling-appdatabasepy)
5. [Application Core & Lifecycle (`app/main.py`)](#5-application-core--lifecycle-appmainpy)
6. [Services Layer](#6-services-layer)
   - [Database & SQL Execution Service (`app/services/db_service.py`)](#database--sql-execution-service-appservicesdb_servicepy)
   - [Database Schema Inspection Service (`app/services/schema_service.py`)](#database-schema-inspection-service-appservicesschema_servicepy)
7. [API Routes Layer](#7-api-routes-layer)
   - [Connection Routes (`app/routes/connection.py`)](#connection-routes-approutesconnectionpy)
   - [Schema Introspection Routes (`app/routes/schema.py`)](#schema-introspection-routes-approutesschemapy)
   - [Query Execution & Validation Routes (`app/routes/query.py`)](#query-execution--validation-routes-approutesquerypy)
8. [Test Suite Architecture (`test_api.py`)](#8-test-suite-architecture-test_apipy)
9. [Security, AST Parsing & Guardrails](#9-security-ast-parsing--guardrails)
10. [Setup, Execution & Environment Variables](#10-setup-execution--environment-variables)

---

## 1. System Architecture & Flow

DataPilot backend is built with **FastAPI**, **SQLAlchemy**, and **PyMySQL**. It serves as a secure, read-only bridge between the React frontend and a cloud-hosted MySQL database (such as Aiven).

```
┌────────────────────────────────────────────────────────┐
│            React Frontend (Vite @ :5173)              │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP JSON API Requests
                            ▼
┌────────────────────────────────────────────────────────┐
│             FastAPI Application (app/main.py)          │
│   ├── CORS Middleware (Cross-Origin Resource Sharing)  │
│   ├── Global Exception Handler (Zero-leakage security) │
│   └── Lifespan Context Manager                         │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
      /api/connection            /api/query & /api/schema
               │                          │
               ▼                          ▼
┌────────────────────────┐      ┌────────────────────────┐
│ Connection Route       │      │ Query & Schema Routes  │
│ (routes/connection.py) │      │ (query.py / schema.py) │
└──────────────┬─────────┘      └──────────┬─────────────┘
               │                           │
               ▼                           ▼
┌────────────────────────────────────────────────────────┐
│                     Services Layer                     │
│  ├── DatabaseService (app/services/db_service.py)      │
│  │   ├── validate_sql(): SQLGlot AST validation        │
│  │   ├── execute_read_only_query(): Timer + PyMySQL    │
│  │   ├── test_connection(): Ping active database       │
│  │   └── update_connection_config(): Persist to .env  │
│  └── SchemaService (app/services/schema_service.py)    │
│      ├── get_database_schema(): Inspect all tables     │
│      └── get_table_schema(): Deep column/key metadata  │
└───────────────────────────┬────────────────────────────┘
                            │ SQLAlchemy Engine & Pooling
                            ▼
┌────────────────────────────────────────────────────────┐
│             app/database.py & app/config.py            │
│  ├── pool_pre_ping=True (Health check on check-out)    │
│  ├── pool_recycle=3600 (Prevent MySQL timeout drops)   │
│  └── SSL mode: REQUIRED (Encrypted TLS tunnel)         │
└───────────────────────────┬────────────────────────────┘
                            │ Encrypted MySQL Protocol
                            ▼
┌────────────────────────────────────────────────────────┐
│           Aiven Cloud MySQL Database Instance          │
└────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```text
backend/
├── .env                  # Local environment file with active DB credentials (git-ignored)
├── .env.example          # Template environment file
├── requirements.txt      # Python dependencies
├── test_api.py           # Automated smoke test suite (12 test suites)
├── README.md             # This comprehensive technical manual
└── app/
    ├── __init__.py       # Package marker
    ├── config.py         # Pydantic Settings management & connection URL builder
    ├── database.py       # SQLAlchemy engine factory, connection pool, session generator
    ├── main.py           # FastAPI entrypoint, middleware, global error handler
    ├── routes/
    │   ├── __init__.py   # Routes package marker
    │   ├── connection.py # Endpoints for database connection test and configuration
    │   ├── query.py      # Endpoints for SQL validation and read-only query execution
    │   └── schema.py     # Endpoints for table and column introspection
    └── services/
        ├── __init__.py   # Services package marker
        ├── db_service.py # SQL AST validation, query execution, value serialization
        └── schema_service.py # SQLAlchemy Inspector table metadata extraction
```

---

## 3. Configuration Layer (`app/config.py`)

This module uses `pydantic-settings` to parse, validate, and load environment variables from the `.env` file into a type-safe singleton object.

### Variables & Code Breakdown

```python
BASE_DIR = Path(__file__).resolve().parent.parent
```
- Determines the absolute directory path of the `backend/` folder by going two levels up from `app/config.py`.
- Ensures that the `.env` file is loaded correctly regardless of where the terminal starts `uvicorn`.

#### Class `Settings(BaseSettings)`
Inherits from `pydantic_settings.BaseSettings`. Reads environment variables and converts them to strongly-typed Python attributes with sensible defaults:

| Attribute | Type | Default | Description |
|---|---|---|---|
| `DB_HOST` | `str` | `"localhost"` | Hostname of the database (e.g., `mysql-...aivencloud.com`). |
| `DB_PORT` | `int` | `3306` | Port number of the MySQL service. |
| `DB_NAME` | `str` | `"datapilot_db"` | Target database/schema name. |
| `DB_USER` | `str` | `"root"` | Database username (e.g., `avnadmin`). |
| `DB_PASSWORD` | `str` | `""` | Database user password. |
| `DB_SSL_MODE` | `str` | `"DISABLED"` | SSL connection mode (`"REQUIRED"` or `"DISABLED"`). |
| `APP_HOST` | `str` | `"0.0.0.0"` | IP address on which FastAPI binds. |
| `APP_PORT` | `int` | `8000` | Port on which FastAPI listens. |
| `CORS_ORIGINS` | `str` | `"http://localhost:5173,..."` | Comma-delimited list of allowed browser origins. |

#### Methods in `Settings`:

1. **`cors_origin_list` (Property)**
   ```python
   @property
   def cors_origin_list(self) -> List[str]:
       return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
   ```
   - **Logic**: Splits the `CORS_ORIGINS` string by commas, trims whitespace around each URL, filters out empty tokens, and returns a Python list of strings for the CORS middleware.

2. **`get_database_url(self) -> str`**
   ```python
   def get_database_url(self) -> str:
       from urllib.parse import quote_plus
       user = quote_plus(self.DB_USER)
       password = quote_plus(self.DB_PASSWORD)
       return f"mysql+pymysql://{user}:{password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
   ```
   - **Logic**: 
     - Uses `urllib.parse.quote_plus` to URL-encode special characters in the username and password (such as `@`, `:`, `/`, or `%`).
     - Formats the connection URI using the `mysql+pymysql` dialect for SQLAlchemy.

3. **`get_masked_db_info(self) -> str`**
   ```python
   def get_masked_db_info(self) -> str:
       return f"mysql+pymysql://{self.DB_USER}:****@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
   ```
   - **Logic**: Generates a sanitized database URL replacing the actual password with `****`. This enables informative startup logging without leaking credentials into log collectors.

4. **`settings = Settings()`**
   - Instantiates a module-level singleton instance loaded when the application imports `config`.

---

## 4. Database Engine & Connection Pooling (`app/database.py`)

This module manages the SQLAlchemy `Engine` lifecycle, connection pooling, and session generation.

### Module-Level Variables
- `logger`: Dedicated logger for database events under `"datapilot.database"`.
- `_engine: Engine | None = None`: Module-level private variable caching the active database engine instance (Singleton pattern).

### Functions Breakdown

#### 1. `get_engine() -> Engine`
Lazily initializes and caches the SQLAlchemy engine.

```python
def get_engine() -> Engine:
    global _engine
    if _engine is None:
        db_url = settings.get_database_url()
        connect_args = {}
        if settings.DB_SSL_MODE.upper() == "REQUIRED":
            connect_args["ssl"] = {"ssl_mode": "REQUIRED"}
            
        logger.info(f"Initializing database engine for: {settings.get_masked_db_info()}")
        
        _engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_recycle=3600,
            pool_size=5,
            max_overflow=10,
            connect_args=connect_args,
        )
    return _engine
```
- **Connection Arguments**:
  - `connect_args["ssl"] = {"ssl_mode": "REQUIRED"}`: Tells PyMySQL to enforce TLS/SSL encryption when connecting to Aiven Cloud.
- **Connection Pool Parameters**:
  - `pool_pre_ping=True`: Tests connections with a lightweight ping (`SELECT 1`) upon check-out from the pool. If Aiven closed the idle connection, SQLAlchemy transparently discards it and creates a fresh connection instead of throwing a `2006 MySQL server has gone away` error.
  - `pool_recycle=3600`: Recycles idle connections older than 1 hour (3600 seconds), preventing cloud firewalls or MySQL's `wait_timeout` from dropping stale connections.
  - `pool_size=5`: Retains 5 persistent connections open in the pool.
  - `max_overflow=10`: Allows bursting up to 10 additional connections during peak traffic spikes (total 15 concurrent connections).

#### 2. `reset_engine() -> None`
```python
def reset_engine() -> None:
    global _engine
    if _engine is not None:
        try:
            _engine.dispose()
        except Exception as e:
            logger.warning(f"Error disposing database engine: {e}")
        _engine = None
```
- **Purpose**: Called whenever the user updates database credentials from the frontend (`/api/connection/connect`).
- **Logic**: Disposes of all pooled socket connections held by the old engine and sets `_engine` to `None`. The next request will invoke `get_engine()` and instantiate a new pool pointing to the updated credentials.

#### 3. `get_db_session() -> Generator[Session, None, None]`
```python
def get_db_session() -> Generator[Session, None, None]:
    engine = get_engine()
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()
```
- **Purpose**: Standard FastAPI dependency injection generator for ORM sessions. Automatically yields a transactional session and guarantees closure inside the `finally` block.

---

## 5. Application Core & Lifecycle (`app/main.py`)

The main entrypoint that initializes FastAPI, configures middlewares, registers routes, and handles unhandled exceptions.

### Functions & Configuration Breakdown

#### 1. Logger Setup
```python
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
```
- Configures consistent logging with timestamps, log severity levels, and module names.

#### 2. `lifespan(app: FastAPI)`
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting DataPilot FastAPI Backend...")
    logger.info(f"Target Database: {settings.get_masked_db_info()}")
    logger.info(f"Allowed CORS Origins: {settings.cors_origin_list}")
    yield
    logger.info("Shutting down DataPilot Backend...")
```
- Implements FastAPI's modern lifespan context manager.
- Runs before the server begins receiving requests (logs target DB and CORS configuration).
- Code after `yield` runs gracefully on server shutdown.

#### 3. FastAPI Application Initialization
```python
app = FastAPI(
    title="DataPilot API",
    description="Backend API for DataPilot AI SQL Analyst...",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)
```
- Enables interactive Swagger documentation at `/docs` and ReDoc at `/redoc`.

#### 4. CORS Middleware
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
- Grants web browsers permission to make fetch/AJAX requests from the React frontend running on `localhost` or `127.0.0.1` on any port (e.g. 5173, 3000, 4173).

#### 5. `global_exception_handler(request: Request, exc: Exception)`
```python
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {type(exc).__name__}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )
```
- Catches any unhandled error across all routes.
- Writes full error details to server logs while returning a sanitized JSON response `{"detail": "Internal server error"}` to the client, preventing database passwords or table structures from leaking in stack traces.

#### 6. Router Inclusions & Health Check
- `app.include_router(connection.router)`
- `app.include_router(schema.router)`
- `app.include_router(query.router)`
- `GET /`: Health check endpoint returning `{"message": "DataPilot API is running"}`.

---

## 6. Services Layer

### Database & SQL Execution Service (`app/services/db_service.py`)

This file contains the core security logic for parsing SQL, executing read-only queries, converting database types to JSON, and managing connection configurations.

#### Constants
```python
DISALLOWED_KEYWORDS = {
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", 
    "CREATE", "RENAME", "GRANT", "REVOKE", "REPLACE", "LOCK", 
    "UNLOCK", "CALL", "EXEC", "EXECUTE", "SHUTDOWN"
}
```
- Set of SQL keywords prohibited from read-only execution.

---

#### 1. `serialize_value(val: Any) -> Any`
```python
def serialize_value(val: Any) -> Any:
```
- **Purpose**: Converts non-JSON-serializable Python database types returned by PyMySQL into standard JSON primitives.
- **Conversion Rules**:
  - `None` $\rightarrow$ `None` (JSON `null`)
  - `int`, `float`, `str`, `bool` $\rightarrow$ unchanged
  - `Decimal` $\rightarrow$ Converted to `int` if whole number (`val % 1 == 0`), otherwise `float`.
  - `datetime`, `date`, `time` $\rightarrow$ ISO 8601 string via `.isoformat()` (e.g., `"2026-09-27T11:40:00"`).
  - `bytes`, `bytearray` $\rightarrow$ Decoded with UTF-8 (`errors="replace"`).
  - Any other object $\rightarrow$ Converted to `str(val)`.

---

#### 2. `validate_sql(sql: str) -> Tuple[bool, str]`
```python
def validate_sql(sql: str) -> Tuple[bool, str]:
```
- **Purpose**: Determines whether a submitted SQL query is safe and strictly read-only before it ever reaches the database engine.
- **Returns**: A tuple `(is_valid: bool, reason_message: str)`.
- **Step-by-Step Logic**:
  1. **Empty check**: Rejects empty or whitespace-only queries.
  2. **SQLGlot AST Parsing**:
     - Attempts to parse the SQL string into an Abstract Syntax Tree (AST) using `sqlglot.parse(cleaned_sql, read="mysql")`.
     - **Multiple Statements Check**: Verifies `len(expressions) == 1`. If `len(expressions) > 1` (e.g. `SELECT 1; DROP TABLE users`), validation fails immediately with `"Multiple SQL statements are not permitted"`.
     - **Read-Only Root Check**: Validates that the top-level AST node is an instance of `sqlglot.exp.Select` or `sqlglot.exp.Union` or a CTE (`WITH ... SELECT ...`).
     - **Subtree Inspection**: Iterates through the AST to verify that no mutating nodes (`Insert`, `Update`, `Delete`, `Drop`, `Create`, `Alter`, `Command`, `Set`, `Kill`) exist anywhere inside nested subqueries or expressions.
  3. **Fallback Regex Token Validator**:
     - If `sqlglot` is not installed or encounters an unknown syntax, the fallback mechanism takes over:
     - Strips single-line comments (`-- comment`) and block comments (`/* comment */`).
     - Splits on semicolons to reject semicolon chaining.
     - Enforces that the statement begins with `SELECT` or `WITH`.
     - Tokenizes words and computes the set intersection with `DISALLOWED_KEYWORDS`.

---

#### 3. `DatabaseService.test_connection() -> Dict[str, Any]`
```python
@staticmethod
def test_connection() -> Dict[str, Any]:
```
- **Logic**:
  - Starts high-resolution timer (`time.perf_counter()`).
  - Acquires a connection from `get_engine().connect()`.
  - Executes `SELECT 1`.
  - Calculates round-trip latency: `round((time.perf_counter() - start_time) * 1000, 2)`.
  - Returns `{"success": True, "message": "Database connected successfully", "latency_ms": latency_ms}`.
  - Catches `SQLAlchemyError` without crashing, returning `{"success": False, "message": "Database connection failed"}`.

---

#### 4. `DatabaseService.test_custom_connection(...) -> Dict[str, Any]`
```python
@staticmethod
def test_custom_connection(
    host: str, port: int, database: str, user: str, password: str, ssl_mode: str = "REQUIRED"
) -> Dict[str, Any]:
```
- **Purpose**: Verifies new database credentials submitted from the frontend settings form without modifying the active engine or writing to `.env`.
- **Logic**:
  - Builds a temporary connection URL with URL-encoded user and password.
  - Creates an isolated temporary engine (`temp_engine = create_engine(...)`).
  - Executes `SELECT 1` and measures latency.
  - Always disposes `temp_engine` inside a `finally` block to prevent socket leaks.
  - Returns detailed error messages (`exc.orig`) if authentication fails.

---

#### 5. `DatabaseService.update_connection_config(...) -> Dict[str, Any]`
```python
@staticmethod
def update_connection_config(
    host: str, port: int, database: str, user: str, password: str, ssl_mode: str = "REQUIRED"
) -> Dict[str, Any]:
```
- **Purpose**: Switches the backend to use new database credentials.
- **Logic**:
  1. Calls `test_custom_connection()`. If the credentials fail to connect, aborts immediately and returns the failure response.
  2. Updates the in-memory `settings` object (`settings.DB_HOST = host`, etc.).
  3. Calls `reset_engine()` so existing connection pools are discarded.
  4. Rewrites the `backend/.env` file on disk with the new values, ensuring credentials persist across backend restarts.
  5. Returns `{"success": True, "database": database, "latency_ms": ...}`.

---

#### 6. `DatabaseService.execute_read_only_query(sql_query: str) -> Dict[str, Any]`
```python
@staticmethod
def execute_read_only_query(sql_query: str) -> Dict[str, Any]:
```
- **Purpose**: Validates and executes a SQL query, returning structured columns, rows, row count, and millisecond execution metrics.
- **Logic**:
  1. Validates the query using `validate_sql(sql_query)`. If invalid, immediately returns `{ "success": False, "error": validation_msg }` with 0 execution time.
  2. Measures execution duration using `time.perf_counter()`.
  3. Executes the query within `engine.connect()`.
  4. Extracts column names via `list(result.keys())`.
  5. Fetches all rows and sanitizes each cell using `serialize_value(val)`.
  6. Computes execution time: `round((time.perf_counter() - start_time) * 1000, 2)`.
  7. Returns:
     ```python
     {
         "success": True,
         "columns": columns,
         "rows": rows,
         "row_count": len(rows),
         "execution_time_ms": execution_time_ms
     }
     ```
  8. Catches `SQLAlchemyError`, formats a clean error string, and returns `success: False` with execution time.

---

### Database Schema Inspection Service (`app/services/schema_service.py`)

This service uses SQLAlchemy's `inspect` subsystem to discover database metadata without writing manual database-specific SQL queries.

#### 1. `SchemaService.get_database_schema() -> Dict[str, Any]`
```python
@staticmethod
def get_database_schema() -> Dict[str, Any]:
```
- **Logic**:
  1. Obtains the engine via `get_engine()` and wraps it with `inspector = inspect(engine)`.
  2. Calls `inspector.get_table_names()` to retrieve all tables in the active database.
  3. Loops through each table name and calls `_inspect_single_table(inspector, tbl_name)`.
  4. Returns:
     ```json
     {
       "database": "datapilot_db",
       "tables": [ ... ]
     }
     ```

#### 2. `SchemaService.get_table_schema(table_name: str) -> Optional[Dict[str, Any]]`
```python
@staticmethod
def get_table_schema(table_name: str) -> Optional[Dict[str, Any]]:
```
- **Logic**:
  1. Retrieves all existing table names from the inspector.
  2. Performs a case-insensitive search to find a match (supporting MySQL's case-insensitivity on Windows while preserving Linux naming).
  3. If no match is found, returns `None`.
  4. If found, returns the detailed structure from `_inspect_single_table`.

#### 3. `SchemaService._inspect_single_table(inspector: Any, table_name: str) -> Dict[str, Any]`
```python
@staticmethod
def _inspect_single_table(inspector: Any, table_name: str) -> Dict[str, Any]:
```
- **Logic**:
  - **Columns**: Calls `inspector.get_columns(table_name)`. Formats each column into:
    - `name`: Column name (`str`).
    - `type`: Data type representation (e.g. `INTEGER`, `VARCHAR(100)`).
    - `nullable`: Boolean flag.
    - `default`: Default value or `None`.
  - **Primary Keys**: Calls `inspector.get_pk_constraint(table_name)`. Extracts `constrained_columns` list.
  - **Foreign Keys**: Calls `inspector.get_foreign_keys(table_name)`. Formats constraint name, source columns, target table, and target columns.

---

## 7. API Routes Layer

### Connection Routes (`app/routes/connection.py`)

Handles connectivity health checks, credential tests, and credential persistence.

#### Pydantic Schemas:
- `ConnectionConfigRequest`: Validates incoming payload containing `host`, `port`, `database`, `user`, `password`, `ssl_mode`.
- `ConnectionTestResponse`: Standardized response with `success`, `message`, `latency_ms`.
- `CurrentConnectionResponse`: Returns active database details (`connected`, `host`, `port`, `database`, `user`, `ssl_mode`) without passwords.

#### Endpoints:
1. **`GET /api/connection/current`**: Returns current database connection info and active status.
2. **`GET /api/connection/test`**: Runs `SELECT 1` on the active database. Returns HTTP 200 on success or HTTP 503 if unreachable.
3. **`POST /api/connection/test`**: Tests temporary credentials provided in request body without saving them. Returns HTTP 200 or HTTP 400.
4. **`POST /api/connection/connect`**: Validates new credentials and updates in-memory config and `.env`. Returns HTTP 200 on success or HTTP 400.

---

### Schema Introspection Routes (`app/routes/schema.py`)

Exposes relational metadata to the frontend and AI tools.

#### Pydantic Schemas:
- `ColumnSchema`: Represents a column's name, type, nullability, and default value.
- `ForeignKeySchema`: Represents relationships (`constrained_columns`, `referred_table`, `referred_columns`).
- `TableSchema`: Represents a table including columns, primary keys, and foreign keys.
- `DatabaseSchemaResponse`: Encapsulates database name and array of `TableSchema`.

#### Endpoints:
1. **`GET /api/schema`**: Introspects and returns all tables, columns, and foreign keys. Returns HTTP 503 if database is disconnected.
2. **`GET /api/schema/{table_name}`**: Returns schema of a specific table. Returns HTTP 404 if table does not exist, or HTTP 503 if database is disconnected.

---

### Query Execution & Validation Routes (`app/routes/query.py`)

Provides endpoints for query syntax/safety checking and read-only execution.

#### Pydantic Schemas:
- `SQLQueryRequest`: Requires a non-empty `sql` string.
- `SQLValidateResponse`: Contains `valid: bool` and `message: str`.
- `SQLExecuteResponse`: Returns `success`, `columns`, `rows`, `row_count`, `execution_time_ms`, and `error`.

#### Endpoints:
1. **`POST /api/query/validate`**:
   - Accepts `{ "sql": "..." }`.
   - Passes SQL to `validate_sql(sql)`.
   - Returns validation status without executing the query.
2. **`POST /api/query`**:
   - Performs two-step execution:
     1. Validates query safety via `validate_sql`. If invalid, returns HTTP 400 immediately.
     2. Executes query via `db_service.execute_read_only_query`. If execution fails (e.g. invalid table name), returns HTTP 400 with the database error message. If successful, returns HTTP 200 with result rows.

---

## 8. Test Suite Architecture (`test_api.py`)

The backend includes a comprehensive, automated smoke test suite in `backend/test_api.py` using FastAPI's `TestClient`.

### 12 Test Cases Covered:

| # | Test Case | Target Endpoint | Description |
|---|---|---|---|
| 1 | Health Check | `GET /` | Verifies API is running and returns HTTP 200. |
| 2 | Swagger UI | `GET /docs` | Ensures interactive documentation renders. |
| 3 | Read-Only SELECT | `POST /api/query/validate` | Verifies standard `SELECT` query passes validation. |
| 4 | CTE Query | `POST /api/query/validate` | Verifies `WITH ... SELECT ...` passes validation. |
| 5 | DROP TABLE Block | `POST /api/query/validate` | Verifies destructive DDL query is rejected. |
| 6 | INSERT Block | `POST /api/query/validate` | Verifies mutating DML query is rejected. |
| 7 | Multi-Statement Block | `POST /api/query/validate` | Verifies semicolon-chained queries are rejected. |
| 8 | Execute Rejection | `POST /api/query` | Verifies `/api/query` rejects mutating queries with HTTP 400. |
| 9 | Connection Test Fallback | `GET /api/connection/test` | Verifies graceful 503 response if DB is unreachable. |
| 10 | Schema Endpoint Fallback | `GET /api/schema` | Verifies schema endpoint handles connection failures gracefully. |
| 11 | Nonexistent Table | `GET /api/schema/missing` | Verifies proper 404 or 503 response. |
| 12 | In-Memory Live DB Test | Multiple | Mocks an in-memory SQLite database using `unittest.mock.patch`, runs schema creation, inserts test rows, and verifies full end-to-end execution, column names, row counts, and latency tracking. |

### Running the Test Suite:
```bash
python test_api.py
```

---

## 9. Security, AST Parsing & Guardrails

1. **SQLGlot AST Parsing**:
   - Unlike naive regex filters that can be bypassed by comments or string obfuscation, DataPilot parses incoming SQL into an Abstract Syntax Tree.
   - Any mutating statement node (`Insert`, `Update`, `Delete`, `Drop`, `Alter`, `Truncate`, `Create`, `Set`, `Kill`) anywhere in the syntax tree is rejected.
2. **Single-Statement Enforcement**:
   - Multiple statements separated by semicolons (e.g., `SELECT 1; DROP TABLE users;`) are strictly blocked.
3. **Zero Credential Leakage**:
   - Passwords and connection strings are masked in logs (`get_masked_db_info()`).
   - The global exception handler prevents internal database errors or connection strings from leaking to client responses.
4. **CORS Isolation**:
   - Only explicitly configured frontend origins (such as `http://localhost:5173`) are allowed.
5. **SSL Encrypted Connection**:
   - PyMySQL connects with `ssl_mode=REQUIRED`, ensuring all traffic to cloud databases is TLS-encrypted.

---

## 10. Setup, Execution & Environment Variables

### 1. Requirements
- Python 3.11+
- Virtual environment (recommended)

### 2. Installation
```bash
cd backend
python -m venv .venv
# On Windows:
.\.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Environment File Configuration (`.env`)
Create a `.env` file in the `backend/` directory:
```env
# Database Credentials
DB_HOST=your-mysql-host.aivencloud.com
DB_PORT=3306
DB_NAME=defaultdb
DB_USER=avnadmin
DB_PASSWORD=your-secure-password
DB_SSL_MODE=REQUIRED

# Server Settings
APP_HOST=0.0.0.0
APP_PORT=8000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
```

### 4. Running the Development Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Base: `http://localhost:8000`
- Swagger Documentation: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
