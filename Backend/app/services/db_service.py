import re
import time
import logging
from decimal import Decimal
from datetime import date, datetime, time as dt_time
from typing import Any, Dict, List, Tuple
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from app.database import get_engine
from app.config import settings
from typing import Optional

logger = logging.getLogger("datapilot.db_service")

# Disallowed keywords for read-only enforcement (case-insensitive)
DISALLOWED_KEYWORDS = {
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", 
    "CREATE", "RENAME", "GRANT", "REVOKE", "REPLACE", "LOCK", 
    "UNLOCK", "CALL", "EXEC", "EXECUTE", "SHUTDOWN"
}


def serialize_value(val: Any) -> Any:
    """Convert database values into JSON-serializable types."""
    if val is None:
        return None
    if isinstance(val, (int, float, str, bool)):
        return val
    if isinstance(val, Decimal):
        # Convert Decimals to float or int for clean JSON representations
        return float(val) if val % 1 != 0 else int(val)
    if isinstance(val, (datetime, date, dt_time)):
        return val.isoformat()
    if isinstance(val, (bytes, bytearray)):
        return val.decode("utf-8", errors="replace")
    return str(val)


def validate_sql(sql: str, dialect: Optional[str] = None) -> Tuple[bool, str]:
    """
    Validates that a SQL query is strictly single-statement and read-only.
    Uses sqlglot AST parsing (with PostgreSQL or MySQL dialect) when available, with a rigorous token fallback.
    """
    if not sql or not sql.strip():
        return False, "Query string is empty"

    cleaned_sql = sql.strip()

    # Try SQLGlot AST validation
    try:
        import sqlglot
        from sqlglot import exp

        active_type = (dialect or getattr(settings, "DB_TYPE", "mysql") or "mysql").strip().lower()
        active_dialect = "postgres" if active_type in ("postgresql", "postgres") else "mysql"

        try:
            expressions = sqlglot.parse(cleaned_sql, read=active_dialect)
        except Exception:
            # Fall back to generic dialect if specific parser encounters syntax specifics
            try:
                expressions = sqlglot.parse(cleaned_sql)
            except Exception as e:
                return False, f"SQL syntax error: {str(e)}"

        # Multiple statements check
        if len(expressions) == 0:
            return False, "No valid SQL statement found"
        if len(expressions) > 1:
            return False, "Multiple SQL statements are not permitted"

        expression = expressions[0]
        if expression is None:
            return False, "Unable to parse SQL expression"

        # The root statement must be a Select or CTE with Select
        is_select = isinstance(expression, (exp.Select, exp.Union))
        if not is_select:
            # Check if it's a CTE with SELECT (WITH ... SELECT ...)
            with_clause = expression.find(exp.With)
            if with_clause is not None and isinstance(expression, (exp.Select, exp.Union)):
                is_select = True

        if not is_select:
            return False, "Only read-only SQL queries (SELECT / WITH) are allowed"

        # Prohibited mutating expression AST nodes anywhere in the syntax tree
        prohibited_names = [
            "Insert", "Update", "Delete", "Drop", 
            "Create", "Alter", "Command", "Set", "Kill"
        ]
        prohibited_nodes = tuple(
            getattr(exp, name) for name in prohibited_names if hasattr(exp, name)
        )
        for prohibited in prohibited_nodes:
            if expression.find(prohibited) is not None:
                return False, "Only read-only SQL queries are allowed"

        return True, "SQL query is valid and read-only"

    except ImportError:
        logger.warning("sqlglot not installed; using fallback AST regex validator")

    # Fallback validator if sqlglot is not present
    # 1. Remove comments
    no_line_comments = re.sub(r"--.*$", "", cleaned_sql, flags=re.MULTILINE)
    no_comments = re.sub(r"/\*.*?\*/", "", no_line_comments, flags=re.DOTALL).strip()
    
    # Check for semicolon-separated multiple statements
    statements = [s.strip() for s in re.split(r";\s*", no_comments) if s.strip()]
    if len(statements) > 1:
        return False, "Multiple SQL statements are not permitted"
    if len(statements) == 0:
        return False, "No valid SQL statement found"

    single_stmt = statements[0]
    
    # Must start with SELECT or WITH
    if not re.match(r"^(SELECT|WITH)\b", single_stmt, re.IGNORECASE):
        return False, "Only read-only SQL queries (SELECT / WITH) are allowed"

    # Scan for forbidden mutating keywords
    tokens = set(re.findall(r"\b[A-Za-z_]+\b", single_stmt.upper()))
    intersection = tokens.intersection(DISALLOWED_KEYWORDS)
    if intersection:
        return False, f"Forbidden SQL operation detected: {', '.join(intersection)}"

    return True, "SQL query is valid and read-only"


class DatabaseService:
    """Service class handling database query executions and connectivity tests."""

    @staticmethod
    def test_connection() -> Dict[str, Any]:
        """
        Execute 'SELECT 1' to verify connection to the active database.
        Returns success status and latency.
        """
        if not settings.DB_HOST or not settings.DB_HOST.strip() or not settings.DB_NAME:
            return {
                "success": False,
                "message": "No active database connection configured"
            }

        start_time = time.perf_counter()
        try:
            engine = get_engine()
            with engine.connect() as conn:
                result = conn.execute(text("SELECT 1")).scalar()
                latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
                if result == 1:
                    logger.info(f"Database connection test successful ({latency_ms} ms)")
                    return {
                        "success": True,
                        "message": "Database connected successfully",
                        "latency_ms": latency_ms
                    }
                else:
                    return {
                        "success": False,
                        "message": "Database returned unexpected response"
                    }
        except SQLAlchemyError as exc:
            logger.error(f"Database connection error: {type(exc).__name__}")
            return {
                "success": False,
                "message": "Database connection failed"
            }

    @staticmethod
    def disconnect() -> Dict[str, Any]:
        """Disconnect active database and clear credentials."""
        from app.config import settings, BASE_DIR
        from app.database import reset_engine

        reset_engine()

        settings.DB_HOST = ""
        settings.DB_NAME = ""
        settings.DB_USER = ""
        settings.DB_PASSWORD = ""

        env_path = BASE_DIR / ".env"
        try:
            lines = [
                f"# Database Configuration (Disconnected)",
                f"DB_TYPE={settings.DB_TYPE}",
                f"DB_HOST=",
                f"DB_PORT={settings.DB_PORT}",
                f"DB_NAME=",
                f"DB_USER=",
                f"DB_PASSWORD=",
                f"DB_SSL_MODE={settings.DB_SSL_MODE}",
                f"",
                f"# Groq AI & LangChain Configuration",
                f"GROQ_API_KEY={settings.GROQ_API_KEY}",
                f"GROQ_MODEL={settings.GROQ_MODEL}",
                f"",
                f"APP_HOST={settings.APP_HOST}",
                f"APP_PORT={settings.APP_PORT}",
                f"CORS_ORIGINS={settings.CORS_ORIGINS}"
            ]
            env_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        except Exception as e:
            logger.warning(f"Could not persist disconnected state to .env: {e}")

        return {
            "success": True,
            "message": "Database disconnected successfully"
        }
    @staticmethod
    def test_custom_connection(
        host: str,
        port: int,
        database: str,
        user: str,
        password: str,
        ssl_mode: str = "REQUIRED",
        db_type: str = "mysql"
    ) -> Dict[str, Any]:
        """Test connectivity with custom provided credentials for MySQL or PostgreSQL."""
        from urllib.parse import quote_plus
        from sqlalchemy import create_engine
        
        start_time = time.perf_counter()
        escaped_user = quote_plus(user)
        escaped_pw = quote_plus(password)
        
        normalized_type = (db_type or "mysql").strip().lower()
        connect_args = {}

        if normalized_type in ("postgresql", "postgres"):
            db_url = f"postgresql+psycopg2://{escaped_user}:{escaped_pw}@{host}:{port}/{database}"
            ssl_upper = (ssl_mode or "").strip().upper()
            if ssl_upper in ("REQUIRED", "REQUIRE"):
                connect_args["sslmode"] = "require"
                db_url += "?sslmode=require"
            elif ssl_upper == "DISABLED":
                connect_args["sslmode"] = "disable"
                db_url += "?sslmode=disable"
        else:
            db_url = f"mysql+pymysql://{escaped_user}:{escaped_pw}@{host}:{port}/{database}"
            if ssl_mode and ssl_mode.upper() in ("REQUIRED", "REQUIRE"):
                connect_args["ssl"] = {"ssl_mode": "REQUIRED"}
            
        temp_engine = None
        try:
            temp_engine = create_engine(
                db_url,
                connect_args=connect_args,
                pool_pre_ping=True
            )
            with temp_engine.connect() as conn:
                res = conn.execute(text("SELECT 1")).scalar()
                latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
                if res == 1:
                    return {
                        "success": True,
                        "message": f"{normalized_type.upper()} database connected successfully",
                        "latency_ms": latency_ms
                    }
                return {
                    "success": False,
                    "message": "Database returned unexpected response"
                }
        except SQLAlchemyError as exc:
            err_msg = str(exc.orig) if hasattr(exc, "orig") and exc.orig else str(exc)
            logger.error(f"Custom connection test failed: {err_msg}")
            return {
                "success": False,
                "message": err_msg
            }
        except Exception as exc:
            logger.error(f"Unexpected custom connection test error: {exc}")
            return {
                "success": False,
                "message": f"Connection test failed: {str(exc)}"
            }
        finally:
            if temp_engine:
                temp_engine.dispose()

    @staticmethod
    def update_connection_config(
        host: str,
        port: int,
        database: str,
        user: str,
        password: str,
        ssl_mode: str = "REQUIRED",
        db_type: str = "mysql"
    ) -> Dict[str, Any]:
        """Test and update active database configuration in settings and .env."""
        from app.config import settings, BASE_DIR
        from app.database import reset_engine

        normalized_type = "postgresql" if (db_type or "").strip().lower() in ("postgresql", "postgres") else "mysql"

        # Verify credentials first
        test_res = DatabaseService.test_custom_connection(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password,
            ssl_mode=ssl_mode,
            db_type=normalized_type
        )
        if not test_res.get("success"):
            return test_res

        # Update in-memory settings
        settings.DB_TYPE = normalized_type
        settings.DB_HOST = host
        settings.DB_PORT = port
        settings.DB_NAME = database
        settings.DB_USER = user
        settings.DB_PASSWORD = password
        settings.DB_SSL_MODE = ssl_mode

        # Reset active engine so new queries use new credentials
        reset_engine()

        # Persist to .env
        env_path = BASE_DIR / ".env"
        try:
            lines = [
                f"# Database Configuration (Updated via Frontend)",
                f"DB_TYPE={normalized_type}",
                f"DB_HOST={host}",
                f"DB_PORT={port}",
                f"DB_NAME={database}",
                f"DB_USER={user}",
                f"DB_PASSWORD={password}",
                f"DB_SSL_MODE={ssl_mode}",
                f"",
                f"# Groq AI & LangChain Configuration",
                f"GROQ_API_KEY={settings.GROQ_API_KEY}",
                f"GROQ_MODEL={settings.GROQ_MODEL}",
                f"",
                f"APP_HOST={settings.APP_HOST}",
                f"APP_PORT={settings.APP_PORT}",
                f"CORS_ORIGINS={settings.CORS_ORIGINS}"
            ]
            env_path.write_text("\n".join(lines), encoding="utf-8")
        except Exception as e:
            logger.warning(f"Could not persist .env file: {e}")

        return {
            "success": True,
            "message": f"{normalized_type.upper()} configuration saved and connected successfully",
            "latency_ms": test_res.get("latency_ms")
        }

        return {
            "success": True,
            "message": "Connected to database successfully",
            "database": database,
            "latency_ms": test_res.get("latency_ms")
        }

    @staticmethod
    def execute_read_only_query(sql_query: str) -> Dict[str, Any]:
        """
        Validates and executes a read-only SQL query.
        Returns columns, row array, count, and execution time in ms.
        """
        is_valid, validation_msg = validate_sql(sql_query)
        if not is_valid:
            return {
                "success": False,
                "error": validation_msg,
                "columns": [],
                "rows": [],
                "row_count": 0,
                "execution_time_ms": 0
            }

        start_time = time.perf_counter()
        try:
            engine = get_engine()
            # Execute query using read-only execution options where supported
            with engine.connect() as conn:
                result = conn.execute(text(sql_query))
                
                # Fetch column names
                columns = list(result.keys()) if result.returns_rows else []
                
                # Fetch and sanitize rows
                raw_rows = result.fetchall() if result.returns_rows else []
                rows = [
                    [serialize_value(val) for val in row]
                    for row in raw_rows
                ]
                
                execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

                return {
                    "success": True,
                    "columns": columns,
                    "rows": rows,
                    "row_count": len(rows),
                    "execution_time_ms": execution_time_ms
                }

        except SQLAlchemyError as exc:
            execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
            # Clean safe error extraction
            error_message = str(exc.orig) if hasattr(exc, "orig") and exc.orig else "SQL execution failed"
            logger.error(f"Query execution failed: {error_message}")
            return {
                "success": False,
                "error": error_message,
                "columns": [],
                "rows": [],
                "row_count": 0,
                "execution_time_ms": execution_time_ms
            }
        except Exception as exc:
            execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(f"Unexpected query execution error: {type(exc).__name__}")
            return {
                "success": False,
                "error": "Query execution failed due to an internal server error",
                "columns": [],
                "rows": [],
                "row_count": 0,
                "execution_time_ms": execution_time_ms
            }

    @staticmethod
    def validate_row_data(table_name: str, row_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates row data against table schema:
        - checks required NOT NULL columns have values if necessary
        - checks type correctness (integer, float/decimal, date, boolean)
        - generates preview SQL for verification before final insertion
        """
        from app.services.schema_service import schema_service

        table_info = schema_service.get_table_schema(table_name)
        if not table_info:
            return {
                "valid": False,
                "errors": {"_general": f"Table '{table_name}' not found in active database"},
                "preview_sql": None,
                "message": f"Table '{table_name}' does not exist",
                "cleaned_data": {}
            }

        columns = table_info.get("columns", [])
        col_map = {c["name"]: c for c in columns}
        errors: Dict[str, str] = {}
        cleaned_params: Dict[str, Any] = {}

        # 1. Check for unknown columns
        for col_name in row_data.keys():
            if col_name not in col_map:
                errors[col_name] = f"Column '{col_name}' does not exist in table '{table_name}'"

        # 2. Check each column constraints & coerce types
        for col in columns:
            c_name = col["name"]
            c_type = (col.get("type") or "").upper()
            is_nullable = col.get("nullable", True)
            is_auto = col.get("autoincrement", False)
            default_val = col.get("default")

            val = row_data.get(c_name)

            # Auto-increment / sequence primary key: can be left empty
            if is_auto and (val is None or (isinstance(val, str) and val.strip() == "")):
                continue

            # Check required
            is_empty = val is None or (isinstance(val, str) and val.strip() == "")
            if not is_nullable and is_empty and default_val is None and not is_auto:
                errors[c_name] = f"'{c_name}' is required and cannot be empty"
                continue

            if is_empty:
                # Nullable column with no input
                cleaned_params[c_name] = None
                continue

            # Type checking and parsing
            str_val = str(val).strip()
            if any(t in c_type for t in ("INT", "SERIAL")):
                try:
                    cleaned_params[c_name] = int(str_val)
                except ValueError:
                    errors[c_name] = f"'{c_name}' must be a valid integer"
            elif any(t in c_type for t in ("NUMERIC", "DECIMAL", "FLOAT", "DOUBLE", "REAL")):
                try:
                    cleaned_params[c_name] = float(str_val)
                except ValueError:
                    errors[c_name] = f"'{c_name}' must be a valid numeric/decimal value"
            elif "BOOL" in c_type:
                if str_val.lower() in ("true", "1", "yes", "t"):
                    cleaned_params[c_name] = True
                elif str_val.lower() in ("false", "0", "no", "f"):
                    cleaned_params[c_name] = False
                else:
                    errors[c_name] = f"'{c_name}' must be true or false"
            elif "DATE" in c_type and "TIME" not in c_type:
                if not re.match(r"^\d{4}-\d{2}-\d{2}$", str_val):
                    errors[c_name] = f"'{c_name}' must be a valid date in YYYY-MM-DD format"
                else:
                    cleaned_params[c_name] = str_val
            else:
                cleaned_params[c_name] = str_val

        # 3. Generate preview SQL for user verification
        preview_sql = None
        if not errors:
            db_type = (settings.DB_TYPE or "mysql").strip().lower()
            quote = '"' if db_type in ("postgresql", "postgres") else '`'
            
            insert_cols = list(cleaned_params.keys())
            if insert_cols:
                cols_str = ", ".join(f"{quote}{c}{quote}" for c in insert_cols)
                formatted_vals = []
                for c in insert_cols:
                    v = cleaned_params[c]
                    if v is None:
                        formatted_vals.append("NULL")
                    elif isinstance(v, (int, float)):
                        formatted_vals.append(str(v))
                    elif isinstance(v, bool):
                        formatted_vals.append("TRUE" if v else "FALSE")
                    else:
                        escaped = str(v).replace("'", "''")
                        formatted_vals.append(f"'{escaped}'")
                vals_str = ", ".join(formatted_vals)
                preview_sql = f"INSERT INTO {quote}{table_name}{quote} ({cols_str})\nVALUES ({vals_str});"
            else:
                preview_sql = f"INSERT INTO {quote}{table_name}{quote} DEFAULT VALUES;"

        valid = len(errors) == 0
        message = "All column values are valid" if valid else f"{len(errors)} validation error(s) found"
        return {
            "valid": valid,
            "errors": errors,
            "preview_sql": preview_sql,
            "message": message,
            "cleaned_data": cleaned_params if valid else {}
        }

    @staticmethod
    def insert_row(table_name: str, row_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Safely inserts a verified new row into the specified table using parameterized SQL.
        Returns the inserted row data after commit.
        """
        # 1. Validate data first
        val_res = DatabaseService.validate_row_data(table_name, row_data)
        if not val_res["valid"]:
            return {
                "success": False,
                "error": "; ".join(f"{k}: {v}" for k, v in val_res["errors"].items()),
                "errors": val_res["errors"]
            }

        cleaned = val_res["cleaned_data"]
        db_type = (settings.DB_TYPE or "mysql").strip().lower()
        is_postgres = db_type in ("postgresql", "postgres")
        quote = '"' if is_postgres else '`'

        cols = list(cleaned.keys())
        if not cols:
            if is_postgres:
                sql = f'INSERT INTO {quote}{table_name}{quote} DEFAULT VALUES RETURNING *;'
            else:
                sql = f'INSERT INTO {quote}{table_name}{quote} () VALUES ();'
            params = {}
        else:
            cols_str = ", ".join(f"{quote}{c}{quote}" for c in cols)
            placeholders_str = ", ".join(f":{c}" for c in cols)
            sql = f"INSERT INTO {quote}{table_name}{quote} ({cols_str}) VALUES ({placeholders_str})"
            if is_postgres:
                sql += " RETURNING *;"
            else:
                sql += ";"
            params = cleaned

        try:
            engine = get_engine()
            with engine.begin() as conn:
                result = conn.execute(text(sql), params)
                
                inserted_row = {}
                if is_postgres and result.returns_rows:
                    row_map = result.mappings().fetchone()
                    if row_map:
                        inserted_row = {k: serialize_value(v) for k, v in dict(row_map).items()}
                else:
                    inserted_row = {k: serialize_value(v) for k, v in cleaned.items()}
                    if hasattr(result, "lastrowid") and result.lastrowid:
                        from app.services.schema_service import schema_service
                        t_info = schema_service.get_table_schema(table_name)
                        if t_info and t_info.get("primary_keys"):
                            pk = t_info["primary_keys"][0]
                            inserted_row[pk] = result.lastrowid

                logger.info(f"Successfully inserted row into '{table_name}': {inserted_row}")
                return {
                    "success": True,
                    "message": f"Successfully inserted 1 record into '{table_name}'",
                    "inserted_row": inserted_row,
                    "affected_rows": 1
                }

        except SQLAlchemyError as exc:
            error_message = str(exc.orig) if hasattr(exc, "orig") and exc.orig else str(exc)
            logger.error(f"Failed to insert row into '{table_name}': {error_message}")
            return {
                "success": False,
                "error": f"Database insertion error: {error_message}"
            }
        except Exception as exc:
            logger.error(f"Unexpected error inserting row into '{table_name}': {exc}")
            return {
                "success": False,
                "error": f"Failed to insert record: {str(exc)}"
            }


db_service = DatabaseService()
