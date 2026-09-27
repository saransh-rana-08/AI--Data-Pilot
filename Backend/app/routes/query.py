from typing import Any, List, Optional
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from app.services.db_service import db_service, validate_sql

router = APIRouter(prefix="/api/query", tags=["Query"])


class SQLQueryRequest(BaseModel):
    """Request model for submitting a raw SQL query."""
    sql: str = Field(..., min_length=1, description="SQL query string to validate or execute")


class SQLValidateResponse(BaseModel):
    """Response model for SQL query validation."""
    valid: bool = Field(..., description="Whether the query is valid and read-only")
    message: str = Field(..., description="Validation outcome message")


class SQLExecuteResponse(BaseModel):
    """Response model for SQL query execution."""
    success: bool = Field(..., description="Whether execution was successful")
    columns: List[str] = Field(default_factory=list, description="Array of column names")
    rows: List[List[Any]] = Field(default_factory=list, description="Array of rows (each row is a list of values)")
    row_count: int = Field(..., description="Total count of rows returned")
    execution_time_ms: float = Field(..., description="Query execution elapsed time in milliseconds")
    error: Optional[str] = Field(None, description="Error message if execution failed")


@router.post(
    "/validate",
    response_model=SQLValidateResponse,
    summary="Validate SQL Query",
    description="Inspects SQL to verify it is read-only (SELECT/WITH) and free of mutating statements without running it."
)
async def validate_query(request: SQLQueryRequest):
    """
    Validate SQL query without executing it.
    Returns valid: true/false with appropriate message.
    """
    is_valid, message = validate_sql(request.sql)
    return SQLValidateResponse(valid=is_valid, message=message)


@router.post(
    "",
    response_model=SQLExecuteResponse,
    summary="Execute Read-Only SQL Query",
    description="Validates that the SQL query is read-only, executes it against the database, and returns the result set."
)
async def execute_query(request: SQLQueryRequest):
    """
    Validate and execute read-only SQL query.
    Rejects mutating statements, multi-statements, or invalid syntax.
    """
    # 1. Validation step
    is_valid, validation_msg = validate_sql(request.sql)
    if not is_valid:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "detail": validation_msg,
                "error": validation_msg,
                "columns": [],
                "rows": [],
                "row_count": 0,
                "execution_time_ms": 0.0
            }
        )

    # 2. Execution step
    result = db_service.execute_read_only_query(request.sql)
    if not result.get("success"):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "detail": result.get("error", "Invalid SQL query"),
                "error": result.get("error", "Invalid SQL query"),
                "columns": [],
                "rows": [],
                "row_count": 0,
                "execution_time_ms": result.get("execution_time_ms", 0.0)
            }
        )

    return SQLExecuteResponse(
        success=True,
        columns=result["columns"],
        rows=result["rows"],
        row_count=result["row_count"],
        execution_time_ms=result["execution_time_ms"]
    )
