import logging
from typing import Generator
from sqlalchemy import create_engine, Engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings

logger = logging.getLogger("datapilot.database")

_engine: Engine | None = None

def get_engine() -> Engine:
    """
    Lazily initialize and return the SQLAlchemy Engine with connection pooling.
    pool_pre_ping=True detects stale connections before attempting queries.
    """
    global _engine
    if _engine is None:
        db_url = settings.get_database_url()
        connect_args = {}
        
        # Aiven MySQL requires or recommends SSL
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


def reset_engine() -> None:
    """Dispose and reset the current engine (useful on reconnect/config changes)."""
    global _engine
    if _engine is not None:
        try:
            _engine.dispose()
        except Exception as e:
            logger.warning(f"Error disposing database engine: {e}")
        _engine = None


def get_db_session() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a SQLAlchemy session.
    Automatically closes session upon completion.
    """
    engine = get_engine()
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()
