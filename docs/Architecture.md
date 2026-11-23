#Architecture

DataPilot uses a three-tier design: a React frontend, a layered FastAPI backend (routes, services, database layer) and a cloud MySQL database.

System diagram
┌────────────────────────────────────────────────────────┐
│            React Frontend (Vite @ :5173)               │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP JSON API
                            ▼
┌────────────────────────────────────────────────────────┐
│             FastAPI Application (app/main.py)          │
│   ├── CORS Middleware                                  │
│   ├── Global Exception Handler (no info leakage)       │
│   └── Lifespan Context Manager                         │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
      /api/connection            /api/query & /api/schema
               ▼                          ▼
┌────────────────────────┐      ┌────────────────────────┐
│ routes/connection.py   │      │ routes/query.py        │
│                        │      │ routes/schema.py       │
└──────────────┬─────────┘      └──────────┬─────────────┘
               ▼                           ▼
┌────────────────────────────────────────────────────────┐
│                     Services Layer                     │
│  ├── DatabaseService  (db_service.py)                  │
│  └── SchemaService    (schema_service.py)              │
└───────────────────────────┬────────────────────────────┘
                            │ SQLAlchemy Engine + Pooling
                            ▼
┌────────────────────────────────────────────────────────┐
│             app/database.py & app/config.py            │
│  ├── pool_pre_ping=True                                │
│  ├── pool_recycle=3600                                 │
│  └── SSL mode: REQUIRED                                │
└───────────────────────────┬────────────────────────────┘
                            │ Encrypted MySQL protocol
                            ▼
┌────────────────────────────────────────────────────────┐
│           Aiven Cloud MySQL Database Instance          │
└────────────────────────────────────────────────────────┘


#Backend modules
Module	Responsibility
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
app/config.py	Loads .env into typed settings, builds the mysql+pymysql:// URL (URL-encoded credentials) and returns a password-masked URL for logging
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
app/database.py	Lazily creates one cached SQLAlchemy engine (pool_size=5, max_overflow=10, pool_pre_ping, pool_recycle=3600), enables SSL, disposes the pool when credentials change
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
app/main.py	FastAPI entrypoint: logging, lifespan, CORS, global exception handler, router registration, GET / health check
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
app/services/db_service.py	SQL validation, query execution and timing, JSON-safe serialization, connection testing and switching
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
app/services/schema_service.py	Table and column discovery with the SQLAlchemy Inspector, including primary and foreign keys
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
app/routes/connection.py	Health check, credential test, credential switch
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
app/routes/schema.py	Database and table metadata endpoints
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
app/routes/query.py	SQL validation and execution endpoints
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────


#Project structure
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
AI--Data-Pilot/
├── Backend/
│   ├── .env                  # Active DB credentials (git-ignored)
│   ├── .env.example          # Template environment file
│   ├── requirements.txt      # Python dependencies
│   ├── test_api.py           # Automated smoke tests
│   └── app/
│       ├── config.py
│       ├── database.py
│       ├── main.py
│       ├── routes/
│       │   ├── connection.py
│       │   ├── query.py
│       │   └── schema.py
│       └── services/
│           ├── db_service.py
│           └── schema_service.py
├── frontend/                 # React + Vite application
├── docs/
│   ├── API.md
│   └── ARCHITECTURE.md
└── README.md
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
# Startup flow
1.Uvicorn starts app.main:app.
2.Settings load from Backend/.env.
3.The lifespan manager logs the masked DB target and allowed CORS origins.
4.Routers are registered and the API begins accepting requests.
5.The database engine is created lazily on the first request that needs it.