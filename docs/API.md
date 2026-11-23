#API Reference

Base URL (local): http://localhost:8000. Interactive docs: /docs (Swagger UI) and /redoc.

#Endpoints
Method	             Endpoint	                         Description
GET	                   /	                                 Health check
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
GET	                 /api/connection/current	        Active connection info (password never returned)
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
GET	                 /api/connection/test            	Test the active database (200 or 503)
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
POST	            /api/connection/test	                Test new credentials without saving (200 or 400)
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
POST	            /api/connection/connect	            Validate, apply and persist new credentials (200 or 400)
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
GET	                /api/schema                   	    Full database schema (503 if disconnected)
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
GET	               /api/schema/{table_name}	         Schema of one table (404 or 503 on failure)
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
POST	           /api/query/validate	                Check SQL safety only
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
POST	             /api/query                      	Validate and execute read-only SQL
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

#Run a query

POST /api/query

json
{ "sql": "SELECT id, name FROM users LIMIT 2" }

Response:

json
{
  "success": true,
  "columns": ["id", "name"],
  "rows": [[1, "Asha"], [2, "Ravi"]],
  "row_count": 2,
  "execution_time_ms": 4.8,
  "error": null
}

A mutating query such as DROP TABLE users is rejected with HTTP 400 and a reason. Values are converted to JSON-safe types (Decimal to number, dates and times to ISO 8601 strings, bytes UTF-8 decoded).

#Schema response

GET /api/schema/{table_name} returns a TableSchema:

json
{
  "name": "orders",
  "columns": [
    { "name": "id", "type": "INTEGER", "nullable": false, "default": null },
    { "name": "user_id", "type": "INTEGER", "nullable": false, "default": null }
  ],
  "primary_keys": ["id"],
  "foreign_keys": [
    {
      "name": "fk_orders_user",
      "constrained_columns": ["user_id"],
      "referred_table": "users",
      "referred_columns": ["id"]
    }
  ]
}

GET /api/schema wraps these in { "database": "<name>", "tables": [ ... ] }.

#Switch the connection

POST /api/connection/test and POST /api/connection/connect accept:

json
{
  "host": "your-mysql-host",
  "port": 3306,
  "database": "defaultdb",
  "user": "avnadmin",
  "password": "your-password",
  "ssl_mode": "REQUIRED"
}

Flow:

The user enters new credentials in the settings form.
POST /api/connection/test checks them on a temporary engine without changing anything.
POST /api/connection/connect re-tests the credentials and stops on failure.
On success, the in-memory settings are updated and the old connection pool is disposed.
The .env file is rewritten so the change survives restarts.
The next request builds a new engine for the new database.


#Query validation

Primary validator (SQLGlot, MySQL dialect)

Reject empty input.
Parse the SQL into an AST.
Reject more than one statement.
Require the root node to be a SELECT, UNION or CTE.
Walk the whole tree and reject any Insert, Update, Delete, Drop, Create, Alter, Command, Set or Kill node.

Fallback validator (used if SQLGlot is unavailable or cannot parse unusual syntax)

Strip -- and /* */ comments.
Reject semicolon chaining.
Require the statement to begin with SELECT or WITH.
Check tokens against a disallowed keyword list.

#Errors

Unhandled exceptions are logged on the server only. Clients receive {"detail": "Internal server error"} with HTTP 500.