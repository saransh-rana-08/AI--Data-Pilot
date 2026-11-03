from typing import List
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

# Determine backend base directory
BASE_DIR = Path(__file__).resolve().parent.parent #going to root folder

class Settings(BaseSettings):#basesetting automatically read the data from the external file such as env
    """Application and Database configuration loaded from environment variables."""

    # Database Settings
    DB_TYPE: str = Field(default="mysql", description="Database dialect: mysql or postgresql")
    DB_HOST: str = Field(default="localhost", description="Database hostname (e.g. Aiven host)")
    DB_PORT: int = Field(default=3306, description="Database port (default 3306 for MySQL, 5432 for PostgreSQL)")
    DB_NAME: str = Field(default="datapilot_db", description="Database name")
    DB_USER: str = Field(default="root", description="Database user")
    DB_PASSWORD: str = Field(default="", description="Database password")
    DB_SSL_MODE: str = Field(default="DISABLED", description="SSL mode: REQUIRED or DISABLED")

    # AI / LLM Settings (Groq + LangChain)
    GROQ_API_KEY: str = Field(default="", description="Groq API Key for LangChain SQL generation")
    GROQ_MODEL: str = Field(default="openai/gpt-oss-120b", description="Groq model for SQL synthesis")

    # Application Settings
    APP_HOST: str = Field(default="0.0.0.0", description="App server bind host")
    APP_PORT: int = Field(default=8000, description="App server bind port")
    CORS_ORIGINS: str = Field(
        default="http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
        description="Comma-separated allowed CORS origins"
    )

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origin_list(self) -> List[str]:
        """Return list of allowed CORS origins."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    def get_database_url(self) -> str:
        """
        Construct the SQLAlchemy database URL for MySQL or PostgreSQL.
        Passwords and usernames containing special characters are safely escaped.
        """
        from urllib.parse import quote_plus
        user = quote_plus(self.DB_USER)
        password = quote_plus(self.DB_PASSWORD)

        db_type = (self.DB_TYPE or "mysql").strip().lower()
        if db_type in ("postgresql", "postgres"):
            url = f"postgresql+psycopg2://{user}:{password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            ssl_upper = (self.DB_SSL_MODE or "").strip().upper()
            if ssl_upper in ("REQUIRED", "REQUIRE"):
                url += "?sslmode=require"
            elif ssl_upper == "DISABLED":
                url += "?sslmode=disable"
            return url
        else:
            return f"mysql+pymysql://{user}:{password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    def get_masked_db_info(self) -> str:
        """Return non-sensitive connection string representation for logging."""
        db_type = (self.DB_TYPE or "mysql").strip().lower()
        driver = "postgresql+psycopg2" if db_type in ("postgresql", "postgres") else "mysql+pymysql"
        return f"{driver}://{self.DB_USER}:****@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME} (SSL: {self.DB_SSL_MODE})"


settings = Settings()
