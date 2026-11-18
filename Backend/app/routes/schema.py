from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from app.services.schema_service import schema_service
from app.services.db_service import db_service

router = APIRouter(prefix="/api/schema", tags=["Schema"])


class ColumnSchema(BaseModel):
    name: str = Field(..., description="Column name")
    type: str = Field(..., description="Data type representation")
    nullable: bool = Field(..., description="Whether column accepts NULL")
    default: Optional[str] = Field(None, description="Default value if any")
    autoincrement: Optional[bool] = Field(False, description="Whether column auto-increments")


class ForeignKeySchema(BaseModel):
    name: Optional[str] = Field(None, description="Foreign key constraint name")
    constrained_columns: List[str] = Field(default_factory=list, description="Columns in this table")
    referred_table: Optional[str] = Field(None, description="Target referenced table")
    referred_columns: List[str] = Field(default_factory=list, description="Target referenced columns")


class TableSchema(BaseModel):
    name: str = Field(..., description="Table name")
    columns: List[ColumnSchema] = Field(default_factory=list, description="Columns metadata")
    primary_keys: List[str] = Field(default_factory=list, description="Primary key column names")
    foreign_keys: List[ForeignKeySchema] = Field(default_factory=list, description="Foreign key relationships")


class DatabaseSchemaResponse(BaseModel):
    database: str = Field(..., description="Name of inspected database")
    tables: List[TableSchema] = Field(default_factory=list, description="List of inspected tables")


class RowDataPayload(BaseModel):
    data: Dict[str, Any] = Field(..., description="Dictionary of column values to insert or validate")


class RowValidationResponse(BaseModel):
    valid: bool = Field(..., description="Whether data is valid for insertion")
    errors: Dict[str, str] = Field(default_factory=dict, description="Field validation errors")
    preview_sql: Optional[str] = Field(None, description="Formatted SQL preview of the insert statement")
    message: str = Field(..., description="Summary status message")


class RowInsertResponse(BaseModel):
    success: bool = Field(..., description="Whether insertion succeeded")
    message: str = Field(..., description="Status message")
    inserted_row: Optional[Dict[str, Any]] = Field(None, description="The newly created row")
    affected_rows: int = Field(1, description="Count of affected rows")
    error: Optional[str] = Field(None, description="Error message if failed")


@router.get(
    "",
    response_model=DatabaseSchemaResponse,
    summary="Get Database Schema",
    description="Inspects the connected MySQL database and returns all tables, columns, primary keys, and foreign keys."
)
async def get_database_schema():
    """Dynamically retrieve full database metadata."""
    try:
        data = schema_service.get_database_schema()
        return data
    except RuntimeError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed"
        )


@router.get(
    "/{table_name}",
    response_model=TableSchema,
    summary="Get Table Schema Details",
    description="Returns detailed column, primary key, and foreign key information for a specific table."
)
async def get_table_schema(table_name: str):
    """Dynamically inspect a specific table."""
    try:
        table_info = schema_service.get_table_schema(table_name)
        if table_info is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )
        return table_info
    except HTTPException:
        raise
    except RuntimeError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed"
        )


@router.post(
    "/{table_name}/validate-row",
    response_model=RowValidationResponse,
    summary="Validate Row Data Before Insertion",
    description="Validates cell values against column constraints (nullability, types) and generates preview SQL for user verification."
)
async def validate_table_row(table_name: str, payload: RowDataPayload):
    """Validate data for table row insertion without committing."""
    result = db_service.validate_row_data(table_name, payload.data)
    if not result["valid"]:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "valid": False,
                "errors": result["errors"],
                "preview_sql": None,
                "message": result["message"]
            }
        )
    return RowValidationResponse(
        valid=True,
        errors={},
        preview_sql=result["preview_sql"],
        message=result["message"]
    )


@router.post(
    "/{table_name}/insert",
    response_model=RowInsertResponse,
    summary="Insert Row into Table",
    description="Executes a verified, approved parameterized SQL INSERT statement to append data into the active database."
)
async def insert_table_row(table_name: str, payload: RowDataPayload):
    """Insert a single row into the specified database table."""
    result = db_service.insert_row(table_name, payload.data)
    if not result["success"]:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "message": result.get("error", "Failed to insert record"),
                "inserted_row": None,
                "affected_rows": 0,
                "error": result.get("error")
            }
        )
    return RowInsertResponse(
        success=True,
        message=result["message"],
        inserted_row=result["inserted_row"],
        affected_rows=result.get("affected_rows", 1)
    )
