import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator
from urllib.parse import unquote, urlparse

try:
    from backend.seed_data import (
        APPLICATIONS,
        AUDIT_LOGS,
        DEPARTMENTS,
        MILESTONES,
        PROJECT_MEMBERS,
        PROJECTS,
        PROGRESS_UPDATES,
        PROPOSALS,
        REVIEW_COMMENTS,
        USERS,
    )
except ModuleNotFoundError:
    from seed_data import (
        APPLICATIONS,
        AUDIT_LOGS,
        DEPARTMENTS,
        MILESTONES,
        PROJECT_MEMBERS,
        PROJECTS,
        PROGRESS_UPDATES,
        PROPOSALS,
        REVIEW_COMMENTS,
        USERS,
    )

try:
    import pymysql
except ImportError:  # pragma: no cover - dependency is optional for sqlite-only runs
    pymysql = None

try:
    import psycopg
except ImportError:  # pragma: no cover - dependency is optional for sqlite/mysql runs
    psycopg = None


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.getenv("DATABASE_PATH", BASE_DIR / "research_management.db"))
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()


MYSQL_MIGRATIONS: list[tuple[int, list[str]]] = [
    (
        1,
        [
            """
            CREATE TABLE IF NOT EXISTS departments (
                id INT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                code VARCHAR(32) NOT NULL UNIQUE,
                coordinator_user_id VARCHAR(255)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role VARCHAR(32) NOT NULL,
                department_id INT NULL,
                created_at VARCHAR(64) NOT NULL,
                FOREIGN KEY (department_id) REFERENCES departments(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS proposals (
                id VARCHAR(255) PRIMARY KEY,
                title TEXT NOT NULL,
                abstract TEXT NOT NULL,
                objectives TEXT NOT NULL,
                methodology TEXT NOT NULL,
                timeline TEXT NOT NULL,
                budget DOUBLE NOT NULL DEFAULT 0,
                status VARCHAR(64) NOT NULL,
                submitted_by_id VARCHAR(255) NOT NULL,
                department_id INT NOT NULL,
                faculty_advisor_id VARCHAR(255) NULL,
                project_id VARCHAR(255) NULL,
                created_at VARCHAR(64) NOT NULL,
                updated_at VARCHAR(64) NOT NULL,
                FOREIGN KEY (submitted_by_id) REFERENCES users(id),
                FOREIGN KEY (department_id) REFERENCES departments(id),
                FOREIGN KEY (faculty_advisor_id) REFERENCES users(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS review_comments (
                id VARCHAR(255) PRIMARY KEY,
                proposal_id VARCHAR(255) NOT NULL,
                reviewer_id VARCHAR(255) NOT NULL,
                comment TEXT NOT NULL,
                decision VARCHAR(64) NULL,
                created_at VARCHAR(64) NOT NULL,
                FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
                FOREIGN KEY (reviewer_id) REFERENCES users(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS projects (
                id VARCHAR(255) PRIMARY KEY,
                proposal_id VARCHAR(255) NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                status VARCHAR(64) NOT NULL,
                progress INT NOT NULL DEFAULT 0,
                start_date VARCHAR(32) NOT NULL,
                end_date VARCHAR(32) NOT NULL,
                lead_researcher_id VARCHAR(255) NULL,
                faculty_advisor_id VARCHAR(255) NOT NULL,
                department_id INT NOT NULL,
                created_at VARCHAR(64) NOT NULL,
                updated_at VARCHAR(64) NOT NULL,
                FOREIGN KEY (proposal_id) REFERENCES proposals(id),
                FOREIGN KEY (lead_researcher_id) REFERENCES users(id),
                FOREIGN KEY (faculty_advisor_id) REFERENCES users(id),
                FOREIGN KEY (department_id) REFERENCES departments(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS project_members (
                project_id VARCHAR(255) NOT NULL,
                user_id VARCHAR(255) NOT NULL,
                PRIMARY KEY (project_id, user_id),
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS milestones (
                id VARCHAR(255) PRIMARY KEY,
                project_id VARCHAR(255) NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                due_date VARCHAR(32) NOT NULL,
                completed INT NOT NULL DEFAULT 0,
                completed_at VARCHAR(64) NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS progress_updates (
                id VARCHAR(255) PRIMARY KEY,
                project_id VARCHAR(255) NOT NULL,
                submitted_by_id VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                created_at VARCHAR(64) NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (submitted_by_id) REFERENCES users(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS project_applications (
                id VARCHAR(255) PRIMARY KEY,
                project_id VARCHAR(255) NOT NULL,
                applicant_id VARCHAR(255) NOT NULL,
                cover_letter TEXT NOT NULL,
                status VARCHAR(64) NOT NULL,
                created_at VARCHAR(64) NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (applicant_id) REFERENCES users(id),
                UNIQUE KEY uq_project_applicant (project_id, applicant_id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS audit_logs (
                id VARCHAR(255) PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                action VARCHAR(255) NOT NULL,
                details TEXT NOT NULL,
                timestamp VARCHAR(64) NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id VARCHAR(255) PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                token VARCHAR(255) NOT NULL UNIQUE,
                expires_at VARCHAR(64) NOT NULL,
                used_at VARCHAR(64) NULL,
                created_at VARCHAR(64) NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id VARCHAR(255) PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                token_hash VARCHAR(255) NOT NULL UNIQUE,
                expires_at VARCHAR(64) NOT NULL,
                revoked_at VARCHAR(64) NULL,
                created_at VARCHAR(64) NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """,
        ],
    ),
]

POSTGRESQL_MIGRATIONS: list[tuple[int, list[str]]] = [
    (
        1,
        [
            """
            CREATE TABLE IF NOT EXISTS departments (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                code TEXT NOT NULL UNIQUE,
                coordinator_user_id TEXT
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                department_id INTEGER NULL REFERENCES departments(id),
                created_at TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS proposals (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                abstract TEXT NOT NULL,
                objectives TEXT NOT NULL,
                methodology TEXT NOT NULL,
                timeline TEXT NOT NULL,
                budget DOUBLE PRECISION NOT NULL DEFAULT 0,
                status TEXT NOT NULL,
                submitted_by_id TEXT NOT NULL REFERENCES users(id),
                department_id INTEGER NOT NULL REFERENCES departments(id),
                faculty_advisor_id TEXT NULL REFERENCES users(id),
                project_id TEXT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS review_comments (
                id TEXT PRIMARY KEY,
                proposal_id TEXT NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
                reviewer_id TEXT NOT NULL REFERENCES users(id),
                comment TEXT NOT NULL,
                decision TEXT NULL,
                created_at TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                proposal_id TEXT NULL REFERENCES proposals(id),
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                status TEXT NOT NULL,
                progress INTEGER NOT NULL DEFAULT 0,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                lead_researcher_id TEXT NULL REFERENCES users(id),
                faculty_advisor_id TEXT NOT NULL REFERENCES users(id),
                department_id INTEGER NOT NULL REFERENCES departments(id),
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS project_members (
                project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                user_id TEXT NOT NULL REFERENCES users(id),
                PRIMARY KEY (project_id, user_id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS milestones (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                due_date TEXT NOT NULL,
                completed INTEGER NOT NULL DEFAULT 0,
                completed_at TEXT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS progress_updates (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                submitted_by_id TEXT NOT NULL REFERENCES users(id),
                content TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS project_applications (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                applicant_id TEXT NOT NULL REFERENCES users(id),
                cover_letter TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(project_id, applicant_id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id),
                action TEXT NOT NULL,
                details TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token TEXT NOT NULL UNIQUE,
                expires_at TEXT NOT NULL,
                used_at TEXT NULL,
                created_at TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token_hash TEXT NOT NULL UNIQUE,
                expires_at TEXT NOT NULL,
                revoked_at TEXT NULL,
                created_at TEXT NOT NULL
            )
            """,
        ],
    ),
]

SQLITE_MIGRATIONS: list[tuple[int, list[str]]] = [
    (
        1,
        [
            """
            CREATE TABLE IF NOT EXISTS departments (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                code TEXT NOT NULL UNIQUE,
                coordinator_user_id TEXT
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                department_id INTEGER,
                created_at TEXT NOT NULL,
                FOREIGN KEY (department_id) REFERENCES departments(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS proposals (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                abstract TEXT NOT NULL,
                objectives TEXT NOT NULL,
                methodology TEXT NOT NULL,
                timeline TEXT NOT NULL,
                budget REAL NOT NULL DEFAULT 0,
                status TEXT NOT NULL,
                submitted_by_id TEXT NOT NULL,
                department_id INTEGER NOT NULL,
                faculty_advisor_id TEXT,
                project_id TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (submitted_by_id) REFERENCES users(id),
                FOREIGN KEY (department_id) REFERENCES departments(id),
                FOREIGN KEY (faculty_advisor_id) REFERENCES users(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS review_comments (
                id TEXT PRIMARY KEY,
                proposal_id TEXT NOT NULL,
                reviewer_id TEXT NOT NULL,
                comment TEXT NOT NULL,
                decision TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
                FOREIGN KEY (reviewer_id) REFERENCES users(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                proposal_id TEXT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                status TEXT NOT NULL,
                progress INTEGER NOT NULL DEFAULT 0,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                lead_researcher_id TEXT,
                faculty_advisor_id TEXT NOT NULL,
                department_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (proposal_id) REFERENCES proposals(id),
                FOREIGN KEY (lead_researcher_id) REFERENCES users(id),
                FOREIGN KEY (faculty_advisor_id) REFERENCES users(id),
                FOREIGN KEY (department_id) REFERENCES departments(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS project_members (
                project_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                PRIMARY KEY (project_id, user_id),
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS milestones (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                due_date TEXT NOT NULL,
                completed INTEGER NOT NULL DEFAULT 0,
                completed_at TEXT,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS progress_updates (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                submitted_by_id TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (submitted_by_id) REFERENCES users(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS project_applications (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                applicant_id TEXT NOT NULL,
                cover_letter TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (applicant_id) REFERENCES users(id),
                UNIQUE(project_id, applicant_id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                action TEXT NOT NULL,
                details TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                token TEXT NOT NULL UNIQUE,
                expires_at TEXT NOT NULL,
                used_at TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                token_hash TEXT NOT NULL UNIQUE,
                expires_at TEXT NOT NULL,
                revoked_at TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """,
            "CREATE INDEX IF NOT EXISTS idx_proposals_updated_at ON proposals(updated_at)",
            "CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at)",
            "CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)",
        ],
    ),
]

SQLITE_SEED_STATEMENTS: list[tuple[str, list[dict[str, Any]]]] = [
    ("INSERT INTO departments (id, name, code, coordinator_user_id) VALUES (:id, :name, :code, :coordinator_user_id)", DEPARTMENTS),
    (
        """
        INSERT INTO users (id, name, email, password_hash, role, department_id, created_at)
        VALUES (:id, :name, :email, :password_hash, :role, :department_id, :created_at)
        """,
        USERS,
    ),
    (
        """
        INSERT INTO proposals (
            id, title, abstract, objectives, methodology, timeline, budget, status,
            submitted_by_id, department_id, faculty_advisor_id, project_id, created_at, updated_at
        ) VALUES (
            :id, :title, :abstract, :objectives, :methodology, :timeline, :budget, :status,
            :submitted_by_id, :department_id, :faculty_advisor_id, :project_id, :created_at, :updated_at
        )
        """,
        PROPOSALS,
    ),
    (
        """
        INSERT INTO review_comments (id, proposal_id, reviewer_id, comment, decision, created_at)
        VALUES (:id, :proposal_id, :reviewer_id, :comment, :decision, :created_at)
        """,
        REVIEW_COMMENTS,
    ),
    (
        """
        INSERT INTO projects (
            id, proposal_id, title, description, status, progress, start_date, end_date,
            lead_researcher_id, faculty_advisor_id, department_id, created_at, updated_at
        ) VALUES (
            :id, :proposal_id, :title, :description, :status, :progress, :start_date, :end_date,
            :lead_researcher_id, :faculty_advisor_id, :department_id, :created_at, :updated_at
        )
        """,
        PROJECTS,
    ),
    ("INSERT INTO project_members (project_id, user_id) VALUES (:project_id, :user_id)", PROJECT_MEMBERS),
    (
        """
        INSERT INTO milestones (id, project_id, title, description, due_date, completed, completed_at)
        VALUES (:id, :project_id, :title, :description, :due_date, :completed, :completed_at)
        """,
        MILESTONES,
    ),
    (
        """
        INSERT INTO progress_updates (id, project_id, submitted_by_id, content, created_at)
        VALUES (:id, :project_id, :submitted_by_id, :content, :created_at)
        """,
        PROGRESS_UPDATES,
    ),
    (
        """
        INSERT INTO project_applications (id, project_id, applicant_id, cover_letter, status, created_at)
        VALUES (:id, :project_id, :applicant_id, :cover_letter, :status, :created_at)
        """,
        APPLICATIONS,
    ),
    (
        """
        INSERT INTO audit_logs (id, user_id, action, details, timestamp)
        VALUES (:id, :user_id, :action, :details, :timestamp)
        """,
        AUDIT_LOGS,
    ),
]

SEED_INSERT_ORDER = [
    "departments",
    "users",
    "proposals",
    "review_comments",
    "projects",
    "project_members",
    "milestones",
    "progress_updates",
    "project_applications",
    "audit_logs",
]


class DictRow(dict):
    def __getattr__(self, item: str) -> Any:
        return self[item]


def _normalize_query_for_driver(query: str) -> str:
    normalized = query
    if _is_postgresql() or _is_mysql():
        normalized = normalized.replace("?", "%s")
    if "INSERT OR IGNORE" in normalized:
        if _is_mysql():
            normalized = normalized.replace("INSERT OR IGNORE", "INSERT IGNORE")
        elif _is_postgresql():
            normalized = normalized.replace("INSERT OR IGNORE", "INSERT")
            normalized = f"{normalized} ON CONFLICT DO NOTHING"
    return normalized


class CursorAdapter:
    def __init__(self, raw_cursor: Any):
        self._raw_cursor = raw_cursor

    def fetchone(self) -> DictRow | None:
        row = self._raw_cursor.fetchone()
        if row is None:
            return None
        if isinstance(row, sqlite3.Row):
            return DictRow(dict(row))
        return DictRow(dict(row))

    def fetchall(self) -> list[DictRow]:
        rows = self._raw_cursor.fetchall()
        return [DictRow(dict(row)) if not isinstance(row, sqlite3.Row) else DictRow(dict(row)) for row in rows]


class ConnectionAdapter:
    def __init__(self, raw_connection: Any):
        self._raw_connection = raw_connection

    def execute(self, query: str, params: tuple[Any, ...] | list[Any] = ()):
        normalized_query = _normalize_query_for_driver(query)
        raw_cursor = self._raw_connection.cursor()
        raw_cursor.execute(normalized_query, tuple(params))
        return CursorAdapter(raw_cursor)

    def executemany(self, query: str, seq_params: list[tuple[Any, ...]]):
        normalized_query = _normalize_query_for_driver(query)
        raw_cursor = self._raw_connection.cursor()
        raw_cursor.executemany(normalized_query, seq_params)
        return CursorAdapter(raw_cursor)

    def commit(self) -> None:
        self._raw_connection.commit()

    def close(self) -> None:
        self._raw_connection.close()


def _is_mysql() -> bool:
    lowered = DATABASE_URL.lower()
    return lowered.startswith("mysql://") or lowered.startswith("mysql+pymysql://")


def _is_postgresql() -> bool:
    lowered = DATABASE_URL.lower()
    return lowered.startswith("postgresql://") or lowered.startswith("postgres://")


def _is_sqlite() -> bool:
    return not DATABASE_URL or DATABASE_URL.lower().startswith("sqlite:///")


def _normalize_mysql_url(url: str) -> str:
    if url.startswith("mysql+pymysql://"):
        return "mysql://" + url[len("mysql+pymysql://") :]
    return url


def _parse_mysql_url(url: str) -> tuple[str, int, str, str, str]:
    normalized = _normalize_mysql_url(url)
    parsed = urlparse(normalized)
    if not parsed.hostname or not parsed.path or not parsed.username:
        raise RuntimeError("Invalid MySQL DATABASE_URL format.")
    return (
        parsed.hostname,
        parsed.port or 3306,
        unquote(parsed.username),
        unquote(parsed.password or ""),
        parsed.path.lstrip("/"),
    )


def _parse_postgres_url(url: str) -> tuple[str, int, str, str, str]:
    normalized = "postgresql://" + url[len("postgres://") :] if url.startswith("postgres://") else url
    parsed = urlparse(normalized)
    if not parsed.hostname or not parsed.path or not parsed.username:
        raise RuntimeError("Invalid PostgreSQL DATABASE_URL format.")
    return (
        parsed.hostname,
        parsed.port or 5432,
        unquote(parsed.username),
        unquote(parsed.password or ""),
        parsed.path.lstrip("/"),
    )


def _sqlite_path() -> Path:
    if DATABASE_URL and DATABASE_URL.lower().startswith("sqlite:///"):
        return Path(DATABASE_URL[len("sqlite:///") :])
    return DB_PATH


def _dict_row_factory(cursor: Any, row: Any) -> DictRow:
    keys = [column[0] for column in cursor.description]
    return DictRow(zip(keys, row))


def _get_mysql_connection():
    if pymysql is None:
        raise RuntimeError("MySQL support requires 'PyMySQL'. Install backend requirements first.")
    host, port, username, password, db_name = _parse_mysql_url(DATABASE_URL)
    return pymysql.connect(
        host=host,
        port=port,
        user=username,
        password=password,
        database=db_name,
        autocommit=False,
        cursorclass=pymysql.cursors.DictCursor,
        charset="utf8mb4",
    )


def _get_postgresql_connection():
    if psycopg is None:
        raise RuntimeError("PostgreSQL support requires 'psycopg'. Install backend requirements first.")
    host, port, username, password, db_name = _parse_postgres_url(DATABASE_URL)
    connection = psycopg.connect(host=host, port=port, user=username, password=password, dbname=db_name, autocommit=False)
    connection.row_factory = psycopg.rows.dict_row
    return connection


def get_connection():
    if _is_mysql():
        return ConnectionAdapter(_get_mysql_connection())
    if _is_postgresql():
        return ConnectionAdapter(_get_postgresql_connection())

    sqlite_path = _sqlite_path()
    sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(sqlite_path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return ConnectionAdapter(connection)


@contextmanager
def db_session() -> Iterator[Any]:
    connection = get_connection()
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def _placeholder() -> str:
    if _is_postgresql():
        return "%s"
    return "?"


def _insert_or_ignore_statement(table: str, columns: list[str]) -> str:
    cols = ", ".join(columns)
    placeholders = ", ".join([_placeholder()] * len(columns))
    if _is_sqlite():
        return f"INSERT OR IGNORE INTO {table} ({cols}) VALUES ({placeholders})"
    if _is_mysql():
        return f"INSERT IGNORE INTO {table} ({cols}) VALUES ({placeholders})"
    return f"INSERT INTO {table} ({cols}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"


def _table_count_query(table: str) -> str:
    return f"SELECT COUNT(*) AS total FROM {table}"


def _schema_table_create_statement() -> str:
    if _is_mysql():
        return """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INT PRIMARY KEY,
            applied_at VARCHAR(64) NOT NULL
        )
        """
    return """
    CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
    )
    """


def _run_migrations(connection: Any) -> None:
    connection.execute(_schema_table_create_statement())
    rows = connection.execute("SELECT version FROM schema_migrations").fetchall()
    applied_versions = {int(row["version"]) for row in rows}

    if _is_mysql():
        migrations = MYSQL_MIGRATIONS
    elif _is_postgresql():
        migrations = POSTGRESQL_MIGRATIONS
    else:
        migrations = SQLITE_MIGRATIONS

    for version, statements in migrations:
        if version in applied_versions:
            continue
        for statement in statements:
            connection.execute(statement)
        connection.execute(
            f"INSERT INTO schema_migrations (version, applied_at) VALUES ({_placeholder()}, {_placeholder()})",
            (version, _utc_now_iso()),
        )


def _utc_now_iso() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _seed_users(connection: Any) -> None:
    statement = _insert_or_ignore_statement(
        "users",
        ["id", "name", "email", "password_hash", "role", "department_id", "created_at"],
    )
    for user in USERS:
        connection.execute(
            statement,
            (
                user["id"],
                user["name"],
                user["email"],
                user["password_hash"],
                user["role"],
                user["department_id"],
                user["created_at"],
            ),
        )


def _seed_departments(connection: Any) -> None:
    statement = _insert_or_ignore_statement(
        "departments",
        ["id", "name", "code", "coordinator_user_id"],
    )
    for department in DEPARTMENTS:
        connection.execute(
            statement,
            (
                department["id"],
                department["name"],
                department["code"],
                department["coordinator_user_id"],
            ),
        )


def _seed_proposals(connection: Any) -> None:
    statement = _insert_or_ignore_statement(
        "proposals",
        [
            "id",
            "title",
            "abstract",
            "objectives",
            "methodology",
            "timeline",
            "budget",
            "status",
            "submitted_by_id",
            "department_id",
            "faculty_advisor_id",
            "project_id",
            "created_at",
            "updated_at",
        ],
    )
    for item in PROPOSALS:
        connection.execute(
            statement,
            (
                item["id"],
                item["title"],
                item["abstract"],
                item["objectives"],
                item["methodology"],
                item["timeline"],
                item["budget"],
                item["status"],
                item["submitted_by_id"],
                item["department_id"],
                item["faculty_advisor_id"],
                item["project_id"],
                item["created_at"],
                item["updated_at"],
            ),
        )


def _seed_review_comments(connection: Any) -> None:
    statement = _insert_or_ignore_statement(
        "review_comments",
        ["id", "proposal_id", "reviewer_id", "comment", "decision", "created_at"],
    )
    for item in REVIEW_COMMENTS:
        connection.execute(
            statement,
            (
                item["id"],
                item["proposal_id"],
                item["reviewer_id"],
                item["comment"],
                item["decision"],
                item["created_at"],
            ),
        )


def _seed_projects(connection: Any) -> None:
    statement = _insert_or_ignore_statement(
        "projects",
        [
            "id",
            "proposal_id",
            "title",
            "description",
            "status",
            "progress",
            "start_date",
            "end_date",
            "lead_researcher_id",
            "faculty_advisor_id",
            "department_id",
            "created_at",
            "updated_at",
        ],
    )
    for item in PROJECTS:
        connection.execute(
            statement,
            (
                item["id"],
                item["proposal_id"],
                item["title"],
                item["description"],
                item["status"],
                item["progress"],
                item["start_date"],
                item["end_date"],
                item["lead_researcher_id"],
                item["faculty_advisor_id"],
                item["department_id"],
                item["created_at"],
                item["updated_at"],
            ),
        )


def _seed_project_members(connection: Any) -> None:
    statement = _insert_or_ignore_statement("project_members", ["project_id", "user_id"])
    for item in PROJECT_MEMBERS:
        connection.execute(statement, (item["project_id"], item["user_id"]))


def _seed_milestones(connection: Any) -> None:
    statement = _insert_or_ignore_statement(
        "milestones",
        ["id", "project_id", "title", "description", "due_date", "completed", "completed_at"],
    )
    for item in MILESTONES:
        connection.execute(
            statement,
            (
                item["id"],
                item["project_id"],
                item["title"],
                item["description"],
                item["due_date"],
                item["completed"],
                item["completed_at"],
            ),
        )


def _seed_progress_updates(connection: Any) -> None:
    statement = _insert_or_ignore_statement(
        "progress_updates",
        ["id", "project_id", "submitted_by_id", "content", "created_at"],
    )
    for item in PROGRESS_UPDATES:
        connection.execute(
            statement,
            (
                item["id"],
                item["project_id"],
                item["submitted_by_id"],
                item["content"],
                item["created_at"],
            ),
        )


def _seed_project_applications(connection: Any) -> None:
    statement = _insert_or_ignore_statement(
        "project_applications",
        ["id", "project_id", "applicant_id", "cover_letter", "status", "created_at"],
    )
    for item in APPLICATIONS:
        connection.execute(
            statement,
            (
                item["id"],
                item["project_id"],
                item["applicant_id"],
                item["cover_letter"],
                item["status"],
                item["created_at"],
            ),
        )


def _seed_audit_logs(connection: Any) -> None:
    statement = _insert_or_ignore_statement("audit_logs", ["id", "user_id", "action", "details", "timestamp"])
    for item in AUDIT_LOGS:
        connection.execute(
            statement,
            (
                item["id"],
                item["user_id"],
                item["action"],
                item["details"],
                item["timestamp"],
            ),
        )


def _seed_if_empty(connection: Any) -> None:
    count_row = connection.execute(_table_count_query("users")).fetchone()
    total = int(count_row["total"]) if count_row else 0
    if total:
        return

    _seed_departments(connection)
    _seed_users(connection)
    _seed_proposals(connection)
    _seed_review_comments(connection)
    _seed_projects(connection)
    _seed_project_members(connection)
    _seed_milestones(connection)
    _seed_progress_updates(connection)
    _seed_project_applications(connection)
    _seed_audit_logs(connection)


def init_db() -> None:
    with db_session() as connection:
        if _is_sqlite():
            connection.execute("PRAGMA foreign_keys = ON")
        _run_migrations(connection)
        _seed_if_empty(connection)

