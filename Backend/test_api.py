"""Smoke tests for DataPilot FastAPI backend endpoints."""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_tests():
    print("--- 1. Testing GET / (Health Check) ---")
    res = client.get("/")
    print(f"Status: {res.status_code}, Body: {res.json()}")
    assert res.status_code == 200
    assert res.json() == {"message": "DataPilot API is running"}
    print("[PASS] Health check passed!")

    print("\n--- 2. Testing GET /docs (Swagger UI) ---")
    res = client.get("/docs")
    print(f"Status: {res.status_code}")
    assert res.status_code == 200
    assert "swagger-ui" in res.text.lower()
    print("[PASS] Swagger documentation passed!")

    print("\n--- 3. Testing POST /api/query/validate (Valid Read-Only SELECT) ---")
    res = client.post("/api/query/validate", json={"sql": "SELECT * FROM students WHERE cgpa > 8.5"})
    print(f"Status: {res.status_code}, Body: {res.json()}")
    assert res.status_code == 200
    assert res.json()["valid"] is True
    print("[PASS] Valid query validation passed!")

    print("\n--- 4. Testing POST /api/query/validate (Valid CTE WITH) ---")
    res = client.post("/api/query/validate", json={"sql": "WITH top_students AS (SELECT * FROM students WHERE cgpa > 9.0) SELECT * FROM top_students"})
    print(f"Status: {res.status_code}, Body: {res.json()}")
    assert res.status_code == 200
    assert res.json()["valid"] is True
    print("[PASS] CTE validation passed!")

    print("\n--- 5. Testing POST /api/query/validate (Dangerous DROP TABLE) ---")
    res = client.post("/api/query/validate", json={"sql": "DROP TABLE students;"})
    print(f"Status: {res.status_code}, Body: {res.json()}")
    assert res.status_code == 200
    assert res.json()["valid"] is False
    print("[PASS] Dangerous DROP TABLE rejection passed!")

    print("\n--- 6. Testing POST /api/query/validate (Dangerous INSERT) ---")
    res = client.post("/api/query/validate", json={"sql": "INSERT INTO students (name) VALUES ('Hacker')"})
    print(f"Status: {res.status_code}, Body: {res.json()}")
    assert res.status_code == 200
    assert res.json()["valid"] is False
    print("[PASS] Dangerous INSERT rejection passed!")

    print("\n--- 7. Testing POST /api/query/validate (Multi-statement Semicolon Chaining) ---")
    res = client.post("/api/query/validate", json={"sql": "SELECT * FROM students; DROP TABLE students;"})
    print(f"Status: {res.status_code}, Body: {res.json()}")
    assert res.status_code == 200
    assert res.json()["valid"] is False
    print("[PASS] Multi-statement rejection passed!")

    print("\n--- 8. Testing POST /api/query (Rejecting dangerous query at execution endpoint) ---")
    res = client.post("/api/query", json={"sql": "DELETE FROM students WHERE id = 1"})
    print(f"Status: {res.status_code}, Body: {res.json()}")
    assert res.status_code == 400
    assert res.json()["success"] is False
    print("[PASS] Execution rejection for mutating query passed!")

    print("\n--- 9. Testing GET /api/connection/test (Graceful failure when DB unconfigured) ---")
    res = client.get("/api/connection/test")
    print(f"Status: {res.status_code}, Body: {res.json()}")
    # With unconfigured placeholder localhost credentials, it should return 503 without crashing
    assert res.status_code in [200, 503]
    assert "success" in res.json()
    print("[PASS] Connection test endpoint behaves correctly!")

    print("\n--- 10. Testing GET /api/schema (Graceful response or 503 without crashing) ---")
    res = client.get("/api/schema")
    print(f"Status: {res.status_code}, Body: {res.json()}")
    assert res.status_code in [200, 503]
    print("[PASS] Schema endpoint behaves correctly!")

    print("\n--- 11. Testing GET /api/schema/nonexistent_table (Handling when DB unconfigured or 404) ---")
    res = client.get("/api/schema/nonexistent_table")
    print(f"Status: {res.status_code}, Body: {res.json()}")
    assert res.status_code in [404, 503]
    print("[PASS] Table schema endpoint behaves correctly!")

    print("\n--- 12. Testing Live DB Execution & Schema Introspection (In-Memory Engine) ---")
    from unittest.mock import patch
    from sqlalchemy import create_engine, text
    import tempfile

    temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    temp_db.close()
    mock_eng = create_engine(f"sqlite:///{temp_db.name}")

    with mock_eng.connect() as conn:
        conn.execute(text("CREATE TABLE students (id INTEGER PRIMARY KEY, name VARCHAR(50), cgpa REAL)"))
        conn.execute(text("INSERT INTO students (id, name, cgpa) VALUES (1, 'Rahul', 8.7), (2, 'Aman', 9.1)"))
        conn.commit()

    with patch("app.services.db_service.get_engine", return_value=mock_eng), \
         patch("app.services.schema_service.get_engine", return_value=mock_eng):
        # Test connection
        conn_res = client.get("/api/connection/test")
        print(f"Connection test: {conn_res.status_code}, Body: {conn_res.json()}")
        assert conn_res.status_code == 200
        assert conn_res.json()["success"] is True

        # Test schema
        schema_res = client.get("/api/schema")
        print(f"Schema test: {schema_res.status_code}, Body: {schema_res.json()}")
        assert schema_res.status_code == 200
        assert len(schema_res.json()["tables"]) >= 1
        table_names = [t["name"] for t in schema_res.json()["tables"]]
        assert "students" in table_names

        # Test single table schema
        tbl_res = client.get("/api/schema/students")
        print(f"Single table schema test: {tbl_res.status_code}, Body: {tbl_res.json()}")
        assert tbl_res.status_code == 200
        assert tbl_res.json()["name"] == "students"
        col_names = [c["name"] for c in tbl_res.json()["columns"]]
        assert "id" in col_names and "name" in col_names and "cgpa" in col_names

        # Test live query execution
        query_res = client.post("/api/query", json={"sql": "SELECT id, name, cgpa FROM students WHERE cgpa > 8.5"})
        print(f"Query execution test: {query_res.status_code}, Body: {query_res.json()}")
        assert query_res.status_code == 200
        data = query_res.json()
        assert data["success"] is True
        assert data["columns"] == ["id", "name", "cgpa"]
        assert len(data["rows"]) == 2
        assert data["rows"][0] == [1, "Rahul", 8.7]
        assert data["rows"][1] == [2, "Aman", 9.1]
        assert data["row_count"] == 2
        assert data["execution_time_ms"] >= 0

    print("[PASS] In-memory database live execution and schema introspection passed!")

    print("\n==========================================")
    print("ALL ENDPOINT SMOKE TESTS PASSED!")
    print("==========================================")

if __name__ == "__main__":
    run_tests()
