import base64
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt


JWT_SECRET = os.getenv("JWT_SECRET", "change-this-in-production-with-32-plus-characters")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return f"{base64.b64encode(salt).decode()}${base64.b64encode(digest).decode()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_b64, digest_b64 = stored_hash.split("$", 1)
        salt = base64.b64decode(salt_b64.encode())
        expected_digest = base64.b64decode(digest_b64.encode())
    except ValueError:
        return False

    candidate_digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        100_000,
    )
    return hmac.compare_digest(candidate_digest, expected_digest)


def create_access_token(payload: dict[str, Any]) -> str:
    expires_at = now_utc() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token_payload = {
        **payload,
        "token_type": "access",
        "exp": expires_at,
        "iat": now_utc(),
    }
    return jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    if payload.get("token_type") != "access":
        raise jwt.InvalidTokenError("Invalid access token type.")
    return payload


def create_refresh_token(payload: dict[str, Any]) -> str:
    expires_at = now_utc() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    token_payload = {
        **payload,
        "token_type": "refresh",
        "exp": expires_at,
        "iat": now_utc(),
    }
    return jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_refresh_token(token: str) -> dict[str, Any]:
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    if payload.get("token_type") != "refresh":
        raise jwt.InvalidTokenError("Invalid refresh token type.")
    return payload
