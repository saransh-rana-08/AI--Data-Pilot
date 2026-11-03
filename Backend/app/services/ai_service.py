import json
import logging
import re
from typing import Any, Dict, Optional
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from app.config import settings, BASE_DIR
from app.services.db_service import validate_sql
from app.services.schema_service import SchemaService

logger = logging.getLogger("datapilot.ai_service")


def format_schema_for_llm(schema: Dict[str, Any]) -> str:
    """Format introspected database schema into a compact representation for LLM context."""
    if not schema or not schema.get("tables"):
        return "No database tables found. The database may be empty."

    lines = []
    for table in schema.get("tables", []):
        t_name = table.get("name")
        cols = table.get("columns", [])
        pks = table.get("primary_keys", [])
        fks = table.get("foreign_keys", [])

        col_defs = []
        for c in cols:
            c_name = c.get("name")
            c_type = c.get("type", "TEXT")
            pk_marker = " [PRIMARY KEY]" if c_name in pks else ""
            col_defs.append(f"  - {c_name} ({c_type}){pk_marker}")

        lines.append(f"Table: {t_name}")
        lines.append("Columns:\n" + "\n".join(col_defs))

        if fks:
            fk_strs = []
            for fk in fks:
                constrained = ", ".join(fk.get("constrained_columns", []))
                ref_tbl = fk.get("referred_table", "")
                ref_cols = ", ".join(fk.get("referred_columns", []))
                fk_strs.append(f"  - ({constrained}) -> {ref_tbl}({ref_cols})")
            lines.append("Relationships:\n" + "\n".join(fk_strs))

        lines.append("")

    return "\n".join(lines).strip()


SYSTEM_PROMPT = """You are DataPilot AI, an elite SQL and database analyst.
Your job is to translate the user's natural language question into an accurate, optimal, strictly read-only SQL query for {dialect}.

### Current Database Schema:
{schema}

### Rules & Guidelines:
1. Dialect: Generate strictly valid {dialect} syntax.
2. Read-Only Only: Use ONLY SELECT or WITH (CTE) queries. Mutating queries (INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE) are completely forbidden.
3. Schema Loyalty: Use ONLY the tables, columns, and relations provided in the schema above. Do NOT make up table or column names.
4. Output Format: Return ONLY a valid JSON object without surrounding prose or markdown fences. The JSON format must be:
{{
  "sql": "SELECT ...",
  "explanation": "A concise 1-2 sentence explanation of the query and tables used."
}}
5. Default Limit: If the user query does not ask for all rows or specify a limit, append LIMIT 50 to avoid result overflows.
"""


class AIService:
    """Service utilizing LangChain and ChatGroq for natural language to SQL synthesis."""

    @staticmethod
    def get_api_key(override_key: Optional[str] = None) -> str:
        """Resolve active Groq API Key."""
        return (override_key or settings.GROQ_API_KEY or "").strip()

    @staticmethod
    def get_model(override_model: Optional[str] = None) -> str:
        """Resolve active Groq model with valid fallback."""
        model = (override_model or settings.GROQ_MODEL or "openai/gpt-oss-120b").strip()
        # If an outdated model was passed from old client state, map it to an active model
        if "llama" in model.lower() or "mixtral" in model.lower():
            model = "openai/gpt-oss-120b"
        return model

    @staticmethod
    def is_configured() -> bool:
        """Check if Groq API Key is configured."""
        return bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip())

    @staticmethod
    def update_config(api_key: Optional[str] = None, model: Optional[str] = None) -> Dict[str, Any]:
        """Update Groq API Key and Model in memory and persist to .env."""
        if api_key is not None:
            settings.GROQ_API_KEY = api_key.strip()
        if model is not None:
            settings.GROQ_MODEL = model.strip()

        env_path = BASE_DIR / ".env"
        try:
            content = env_path.read_text(encoding="utf-8") if env_path.exists() else ""
            lines = content.splitlines()
            new_lines = []
            has_key = False
            has_model = False

            for line in lines:
                if line.startswith("GROQ_API_KEY="):
                    new_lines.append(f"GROQ_API_KEY={settings.GROQ_API_KEY}")
                    has_key = True
                elif line.startswith("GROQ_MODEL="):
                    new_lines.append(f"GROQ_MODEL={settings.GROQ_MODEL}")
                    has_model = True
                else:
                    new_lines.append(line)

            if not has_key:
                new_lines.append(f"GROQ_API_KEY={settings.GROQ_API_KEY}")
            if not has_model:
                new_lines.append(f"GROQ_MODEL={settings.GROQ_MODEL}")

            env_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
        except Exception as e:
            logger.warning(f"Could not persist Groq config to .env: {e}")

        return {
            "success": True,
            "has_api_key": bool(settings.GROQ_API_KEY),
            "model": settings.GROQ_MODEL
        }

    @staticmethod
    def generate_sql(
        prompt: str,
        api_key: Optional[str] = None,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate SQL from user prompt using LangChain ChatGroq and current DB schema.
        Validates safety via validate_sql before returning.
        """
        resolved_key = AIService.get_api_key(api_key)
        if not resolved_key:
            return {
                "success": False,
                "error": "Groq API Key is not configured. Please enter your GROQ_API_KEY in Settings or provide it with the request."
            }

        resolved_model = AIService.get_model(model)
        dialect = "PostgreSQL" if settings.DB_TYPE in ("postgresql", "postgres") else "MySQL"

        # Fetch current database schema
        try:
            schema_data = SchemaService.get_database_schema()
            schema_str = format_schema_for_llm(schema_data)
        except Exception as e:
            logger.warning(f"Could not inspect schema for AI context: {e}")
            schema_str = "Schema could not be introspected. Use standard SQL."

        try:
            llm = ChatGroq(
                api_key=resolved_key,
                model_name=resolved_model,
                temperature=0.0,
                max_tokens=1024
            )

            prompt_template = ChatPromptTemplate.from_messages([
                ("system", SYSTEM_PROMPT),
                ("user", "{question}")
            ])

            chain = prompt_template | llm | StrOutputParser()

            raw_response = chain.invoke({
                "dialect": dialect,
                "schema": schema_str,
                "question": prompt
            })

            # Parse JSON from response
            cleaned_response = raw_response.strip()
            # If wrapped in ```json ... ``` or ``` ... ```
            if cleaned_response.startswith("```"):
                cleaned_response = re.sub(r"^```(?:json)?\s*", "", cleaned_response)
                cleaned_response = re.sub(r"\s*```$", "", cleaned_response)

            parsed_data = {}
            try:
                parsed_data = json.loads(cleaned_response)
            except json.JSONDecodeError:
                # Fallback: extract sql field via regex or treat raw response as SQL
                sql_match = re.search(r'"sql"\s*:\s*"([^"]+)"', cleaned_response)
                if sql_match:
                    parsed_data["sql"] = sql_match.group(1).replace(r"\n", "\n")
                    parsed_data["explanation"] = "Generated from query."
                else:
                    # Treat the raw text as SQL directly
                    parsed_data["sql"] = cleaned_response
                    parsed_data["explanation"] = "Generated from query."

            sql = parsed_data.get("sql", "").strip()
            explanation = parsed_data.get("explanation", "SQL synthesized successfully.")

            # Safety Guardrail Check
            is_valid, validation_msg = validate_sql(sql, dialect=settings.DB_TYPE)
            if not is_valid:
                return {
                    "success": False,
                    "sql": sql,
                    "error": f"Generated SQL failed safety check: {validation_msg}",
                    "explanation": explanation,
                    "dialect": dialect,
                    "model": resolved_model
                }

            return {
                "success": True,
                "sql": sql,
                "explanation": explanation,
                "dialect": dialect,
                "model": resolved_model
            }

        except Exception as e:
            err_msg = str(e)
            logger.error(f"LangChain Groq generation error: {err_msg}")
            if "invalid_api_key" in err_msg.lower() or "unauthorized" in err_msg.lower():
                err_msg = "Invalid Groq API Key. Please verify your API key."
            return {
                "success": False,
                "error": f"AI Generation Failed: {err_msg}"
            }


ai_service = AIService()

