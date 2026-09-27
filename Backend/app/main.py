import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routes import connection, schema, query

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("datapilot")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle management."""
    logger.info("Starting DataPilot FastAPI Backend...")
    logger.info(f"Target Database: {settings.get_masked_db_info()}")
    logger.info(f"Allowed CORS Origins: {settings.cors_origin_list}")
    yield
    logger.info("Shutting down DataPilot Backend...")


app = FastAPI(
    title="DataPilot API",
    description="Backend API for DataPilot AI SQL Analyst, interfacing between the React frontend and Aiven MySQL database.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS for React/Vite frontend (supports localhost and 127.0.0.1 on any port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global catch-all exception handler.
    Logs actual server-side exception while ensuring secrets are never leaked to clients.
    """
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {type(exc).__name__}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )


# Register Route Modules
app.include_router(connection.router)
app.include_router(schema.router)
app.include_router(query.router)


@app.get(
    "/",
    summary="Health Check",
    tags=["Health"],
    description="Basic service health check endpoint verifying the API is up and responding."
)
async def health_check():
    """Health check endpoint returning running status."""
    return {"message": "DataPilot API is running"}
