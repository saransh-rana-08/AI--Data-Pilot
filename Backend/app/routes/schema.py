from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from app.services.schema_service import schema_service

router = APIRouter(prefix="/api/schema", tags=["Schema"])


class ColumnSchema(BaseModel):
    name: str = Field(..., description="Column name")
    type: str = Field(..., description="Data type representation")
    nullable: bool = Field(..., description="Whether column accepts NULL")
    default: Optional[str] = Field(None, description="Default value if any")


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
