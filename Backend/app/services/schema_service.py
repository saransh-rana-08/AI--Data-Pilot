import logging
from typing import Any, Dict, List, Optional
from sqlalchemy import inspect
from sqlalchemy.exc import SQLAlchemyError
from app.database import get_engine
from app.config import settings

logger = logging.getLogger("datapilot.schema_service")


class SchemaService:
    """Service responsible for dynamically inspecting database tables, columns, and constraints."""

    @staticmethod
    def get_database_schema() -> Dict[str, Any]:
        """
        Dynamically inspects the connected database and returns metadata for all tables.
        """
        try:
            engine = get_engine()
            inspector = inspect(engine)

            database_name = settings.DB_NAME
            table_names = inspector.get_table_names()
            tables_data = []

            for tbl_name in table_names:
                table_info = SchemaService._inspect_single_table(inspector, tbl_name)
                tables_data.append(table_info)

            return {
                "database": database_name,
                "tables": tables_data
            }
        except SQLAlchemyError as exc:
            logger.error(f"Failed to inspect database schema: {type(exc).__name__}")
            raise RuntimeError("Database inspection failed") from exc

    @staticmethod
    def get_table_schema(table_name: str) -> Optional[Dict[str, Any]]:
        """
        Inspects metadata for a single specific table.
        Returns None if table does not exist.
        """
        try:
            engine = get_engine()
            inspector = inspect(engine)

            existing_tables = inspector.get_table_names()
            # Case-insensitive comparison for MySQL compatibility while retaining original name
            matched_table = None
            for tbl in existing_tables:
                if tbl.lower() == table_name.lower():
                    matched_table = tbl
                    break

            if not matched_table:
                return None

            return SchemaService._inspect_single_table(inspector, matched_table)
        except SQLAlchemyError as exc:
            logger.error(f"Failed to inspect table '{table_name}': {type(exc).__name__}")
            raise RuntimeError(f"Database inspection for table '{table_name}' failed") from exc

    @staticmethod
    def _inspect_single_table(inspector: Any, table_name: str) -> Dict[str, Any]:
        """Helper to extract columns, primary keys, and foreign keys for a table."""
        # Retrieve columns
        raw_columns = inspector.get_columns(table_name)
        columns_data = []
        for col in raw_columns:
            columns_data.append({
                "name": col.get("name"),
                "type": str(col.get("type")),
                "nullable": bool(col.get("nullable", True)),
                "default": str(col.get("default")) if col.get("default") is not None else None
            })

        # Retrieve primary keys
        pk_constraint = inspector.get_pk_constraint(table_name) or {}
        primary_keys = pk_constraint.get("constrained_columns", [])

        # Retrieve foreign keys
        raw_fks = inspector.get_foreign_keys(table_name) or []
        foreign_keys = []
        for fk in raw_fks:
            foreign_keys.append({
                "name": fk.get("name"),
                "constrained_columns": fk.get("constrained_columns", []),
                "referred_table": fk.get("referred_table"),
                "referred_columns": fk.get("referred_columns", [])
            })

        return {
            "name": table_name,
            "columns": columns_data,
            "primary_keys": primary_keys,
            "foreign_keys": foreign_keys
        }


schema_service = SchemaService()
