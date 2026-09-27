from typing import Optional
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from app.config import settings
from app.services.db_service import db_service

router = APIRouter(prefix="/api/connection", tags=["Connection"])


class ConnectionConfigRequest(BaseModel):
    """Request model for supplying database connection parameters."""
    host: str = Field(..., min_length=1, description="Database hostname (e.g. Aiven host)")
    port: int = Field(3306, description="Database port (default 3306)")
    database: str = Field(..., min_length=1, description="Database name")
    user: str = Field(..., min_length=1, description="Database user")
    password: str = Field("", description="Database password")
    ssl_mode: Optional[str] = Field("REQUIRED", description="SSL mode: REQUIRED or DISABLED")


class ConnectionTestResponse(BaseModel):
    """Response model for database connection testing."""
    success: bool = Field(..., description="Whether the connection test succeeded")
    message: str = Field(..., description="Status message description")
    latency_ms: Optional[float] = Field(None, description="Round-trip latency in milliseconds")


class CurrentConnectionResponse(BaseModel):
    """Response model for current database configuration."""
    connected: bool = Field(..., description="Current connectivity status")
    host: str = Field(..., description="Configured host")
    port: int = Field(..., description="Configured port")
    database: str = Field(..., description="Configured database name")
    user: str = Field(..., description="Configured database user")
    ssl_mode: str = Field(..., description="Configured SSL mode")


@router.get(
    "/current",
    response_model=CurrentConnectionResponse,
    summary="Get Current Connection Info",
    description="Returns the currently configured host, database, and user (passwords are never exposed)."
)
async def get_current_connection():
    """Retrieve active database configuration without credentials."""
    test_res = db_service.test_connection()
    return CurrentConnectionResponse(
        connected=test_res.get("success", False),
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        database=settings.DB_NAME,
        user=settings.DB_USER,
        ssl_mode=settings.DB_SSL_MODE
    )


@router.get(
    "/test",
    response_model=ConnectionTestResponse,
    summary="Test Current Database Connection",
    description="Tests connectivity to the active Aiven MySQL database by running 'SELECT 1'."
)
async def test_database_connection():
    """Test active database connection."""
    result = db_service.test_connection()
    if result["success"]:
        return ConnectionTestResponse(
            success=True,
            message=result["message"],
            latency_ms=result.get("latency_ms")
        )
    
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "success": False,
            "message": result["message"]
        }
    )


@router.post(
    "/test",
    response_model=ConnectionTestResponse,
    summary="Test Custom Database Credentials",
    description="Tests connectivity with custom parameters submitted from the frontend without persisting them."
)
async def test_custom_credentials(config: ConnectionConfigRequest):
    """Verify submitted credentials against MySQL database."""
    result = db_service.test_custom_connection(
        host=config.host,
        port=config.port,
        database=config.database,
        user=config.user,
        password=config.password,
        ssl_mode=config.ssl_mode or "REQUIRED"
    )
    if result["success"]:
        return ConnectionTestResponse(
            success=True,
            message=result["message"],
            latency_ms=result.get("latency_ms")
        )
    
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "message": result["message"]
        }
    )


@router.post(
    "/connect",
    response_model=ConnectionTestResponse,
    summary="Connect and Save New Database",
    description="Tests and updates the backend's active database connection with credentials provided from the frontend."
)
async def connect_and_save_database(config: ConnectionConfigRequest):
    """Test and switch backend active database to submitted credentials."""
    result = db_service.update_connection_config(
        host=config.host,
        port=config.port,
        database=config.database,
        user=config.user,
        password=config.password,
        ssl_mode=config.ssl_mode or "REQUIRED"
    )
    if result["success"]:
        return ConnectionTestResponse(
            success=True,
            message=result["message"],
            latency_ms=result.get("latency_ms")
        )

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "message": result["message"]
        }
    )
