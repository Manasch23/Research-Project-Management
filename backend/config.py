import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_env: str
    frontend_url: str
    allowed_origins: list[str]
    allowed_methods: list[str]
    allowed_headers: list[str]
    database_url: str
    database_type: str
    database_path: str
    jwt_secret: str
    access_token_expire_minutes: int
    refresh_token_expire_days: int
    login_rate_limit_per_minute: int


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def load_settings() -> Settings:
    app_env = os.getenv("APP_ENV", "development").strip().lower()
    frontend_url = os.getenv("FRONTEND_URL", "").strip()
    if not frontend_url:
        raise RuntimeError("FRONTEND_URL must be set.")

    allowed_origins = _split_csv(os.getenv("ALLOWED_ORIGINS", frontend_url))
    if not allowed_origins:
        raise RuntimeError("ALLOWED_ORIGINS must include at least one origin.")

    allowed_methods = _split_csv(os.getenv("ALLOWED_METHODS", "GET,POST,PATCH,DELETE,OPTIONS"))
    allowed_headers = _split_csv(os.getenv("ALLOWED_HEADERS", "Authorization,Content-Type"))
    if not allowed_methods:
        raise RuntimeError("ALLOWED_METHODS must include at least one HTTP method.")
    if not allowed_headers:
        raise RuntimeError("ALLOWED_HEADERS must include at least one header.")

    jwt_secret = os.getenv("JWT_SECRET", "").strip()
    if not jwt_secret or len(jwt_secret) < 32:
        raise RuntimeError("JWT_SECRET must be set and at least 32 characters long.")

    access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    if access_token_expire_minutes < 5 or access_token_expire_minutes > 240:
        raise RuntimeError("ACCESS_TOKEN_EXPIRE_MINUTES must be between 5 and 240.")

    refresh_token_expire_days = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    if refresh_token_expire_days < 1 or refresh_token_expire_days > 30:
        raise RuntimeError("REFRESH_TOKEN_EXPIRE_DAYS must be between 1 and 30.")

    login_rate_limit_per_minute = int(os.getenv("LOGIN_RATE_LIMIT_PER_MINUTE", "10"))
    if login_rate_limit_per_minute < 1 or login_rate_limit_per_minute > 120:
        raise RuntimeError("LOGIN_RATE_LIMIT_PER_MINUTE must be between 1 and 120.")

    database_url = os.getenv("DATABASE_URL", "").strip()
    database_path = os.getenv("DATABASE_PATH", "backend\\research_management.db").strip()
    if database_url:
        lowered = database_url.lower()
        if lowered.startswith("mysql://") or lowered.startswith("mysql+pymysql://"):
            database_type = "mysql"
        elif lowered.startswith("postgresql://") or lowered.startswith("postgres://"):
            database_type = "postgresql"
        elif lowered.startswith("sqlite:///"):
            database_type = "sqlite"
        else:
            raise RuntimeError("DATABASE_URL must start with mysql://, mysql+pymysql://, postgresql://, postgres://, or sqlite:///.")
    else:
        database_type = "sqlite"
        database_url = f"sqlite:///{database_path.replace('\\', '/')}"

    return Settings(
        app_env=app_env,
        frontend_url=frontend_url,
        allowed_origins=allowed_origins,
        allowed_methods=allowed_methods,
        allowed_headers=allowed_headers,
        database_url=database_url,
        database_type=database_type,
        database_path=database_path,
        jwt_secret=jwt_secret,
        access_token_expire_minutes=access_token_expire_minutes,
        refresh_token_expire_days=refresh_token_expire_days,
        login_rate_limit_per_minute=login_rate_limit_per_minute,
    )

