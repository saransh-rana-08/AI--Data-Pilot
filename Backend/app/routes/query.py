from typing import Any, List, Optional
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from app.config import settings
from app.services.db_service import db_service, validate_sql
from app.services.ai_service import ai_service

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


class AISQLGenerateRequest(BaseModel):
    """Request model for natural language prompt to SQL synthesis."""
    prompt: str = Field(..., min_length=1, description="Natural language question to translate into SQL")
    api_key: Optional[str] = Field(None, description="Optional custom Groq API key override")
    model: Optional[str] = Field(None, description="Optional custom Groq model override")
    execute: Optional[bool] = Field(True, description="Whether to immediately execute the generated query")


class AISQLGenerateResponse(BaseModel):
    """Response model for AI SQL generation."""
    success: bool = Field(..., description="Whether generation succeeded")
    sql: Optional[str] = Field(None, description="Generated SQL query")
    explanation: Optional[str] = Field(None, description="Explanation of how the query works")
    dialect: Optional[str] = Field(None, description="Target database dialect")
    model: Optional[str] = Field(None, description="Model used for synthesis")
    error: Optional[str] = Field(None, description="Error message if generation failed")
    execution_result: Optional[SQLExecuteResponse] = Field(None, description="Execution outcome if execute=True")


class AIConfigUpdateRequest(BaseModel):
    """Request model to update Groq configuration."""
    api_key: Optional[str] = Field(None, description="Groq API key")
    model: Optional[str] = Field(None, description="Groq model name")


@router.get(
    "/ai-config",
    summary="Get Groq AI Configuration",
    description="Returns whether Groq API key is configured and active model."
)
async def get_ai_config():
    """Retrieve Groq AI configuration status."""
    return {
        "has_api_key": bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip()),
        "model": settings.GROQ_MODEL,
        "available_models": [
            {"id": "openai/gpt-oss-120b", "name": "OpenAI GPT-OSS 120B", "desc": "High accuracy, best for complex joins, aggregations and reasoning"},
            {"id": "openai/gpt-oss-20b", "name": "OpenAI GPT-OSS 20B", "desc": "Ultra low latency for fast single-table lookups"},
            {"id": "qwen/qwen3.8-27b", "name": "Qwen 3.8 27B", "desc": "Powerful reasoning and multilingual analysis"}
        ]
    }


@router.post(
    "/ai-config",
    summary="Update Groq AI Configuration",
    description="Updates and persists Groq API key and model to .env."
)
async def update_ai_config(req: AIConfigUpdateRequest):
    """Update Groq API key and/or model."""
    res = ai_service.update_config(api_key=req.api_key, model=req.model)
    return res


@router.post(
    "/generate",
    response_model=AISQLGenerateResponse,
    summary="Generate SQL with LangChain & Groq",
    description="Translates a natural language question into dialect-specific, read-only SQL and optionally executes it."
)
async def generate_sql(request: AISQLGenerateRequest):
    """
    Generate SQL using Groq + LangChain, validate it with SQLGlot AST,
    and optionally execute against connected database.
    """
    gen_result = ai_service.generate_sql(
        prompt=request.prompt,
        api_key=request.api_key,
        model=request.model
    )

    if not gen_result.get("success"):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "sql": gen_result.get("sql"),
                "explanation": gen_result.get("explanation"),
                "dialect": gen_result.get("dialect"),
                "model": gen_result.get("model"),
                "error": gen_result.get("error", "AI SQL generation failed"),
                "execution_result": None
            }
        )

    sql = gen_result["sql"]
    exec_result_data = None

    if request.execute:
        exec_outcome = db_service.execute_read_only_query(sql)
        exec_result_data = SQLExecuteResponse(
            success=exec_outcome.get("success", False),
            columns=exec_outcome.get("columns", []),
            rows=exec_outcome.get("rows", []),
            row_count=exec_outcome.get("row_count", 0),
            execution_time_ms=exec_outcome.get("execution_time_ms", 0.0),
            error=exec_outcome.get("error")
        )

    return AISQLGenerateResponse(
        success=True,
        sql=sql,
        explanation=gen_result.get("explanation"),
        dialect=gen_result.get("dialect"),
        model=gen_result.get("model"),
        execution_result=exec_result_data
    )


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
