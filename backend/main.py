import secrets
import logging
import hashlib
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

try:
    from backend.config import load_settings
    from backend.database import db_session, init_db
    from backend.schemas import (
        AuditLogResponse,
        AuthResponse,
        CreateApplicationRequest,
        ChangePasswordRequest,
        CreateAuditLogRequest,
        CreateProgressUpdateRequest,
        CreateProjectRequest,
        CreateProposalRequest,
        DepartmentResponse,
        ForgotPasswordRequest,
        ForgotPasswordResponse,
        LoginRequest,
        AdminResetPasswordRequest,
        ProgressUpdateResponse,
        ProjectApplicationResponse,
        ProjectResponse,
        ProposalResponse,
        RefreshTokenRequest,
        RegisterRequest,
        ResetPasswordRequest,
        ReviewCommentResponse,
        ReviewProposalRequest,
        StatisticsResponse,
        UpdateApplicationRequest,
        UpdateProjectRequest,
        UpdateProposalRequest,
        UserMutationRequest,
        UserResponse,
    )
    from backend.security import (
        create_access_token,
        create_refresh_token,
        decode_access_token,
        decode_refresh_token,
        hash_password,
        verify_password,
    )
except ModuleNotFoundError:
    from config import load_settings
    from database import db_session, init_db
    from schemas import (
        AuditLogResponse,
        AuthResponse,
        CreateApplicationRequest,
        ChangePasswordRequest,
        CreateAuditLogRequest,
        CreateProgressUpdateRequest,
        CreateProjectRequest,
        CreateProposalRequest,
        DepartmentResponse,
        ForgotPasswordRequest,
        ForgotPasswordResponse,
        LoginRequest,
        AdminResetPasswordRequest,
        ProgressUpdateResponse,
        ProjectApplicationResponse,
        ProjectResponse,
        ProposalResponse,
        RefreshTokenRequest,
        RegisterRequest,
        ResetPasswordRequest,
        ReviewCommentResponse,
        ReviewProposalRequest,
        StatisticsResponse,
        UpdateApplicationRequest,
        UpdateProjectRequest,
        UpdateProposalRequest,
        UserMutationRequest,
        UserResponse,
    )
    from security import (
        create_access_token,
        create_refresh_token,
        decode_access_token,
        decode_refresh_token,
        hash_password,
        verify_password,
    )


settings = load_settings()
logger = logging.getLogger("research_api")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    logger.addHandler(handler)
logger.setLevel(logging.INFO)

app = FastAPI(title="University Research Project Management API", version="1.1.0")
security = HTTPBearer()
_login_attempts: dict[str, list[float]] = {}

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=settings.allowed_methods,
    allow_headers=settings.allowed_headers,
)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_iso_datetime(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def row_or_404(row: Any, message: str):
    if row is None:
        raise HTTPException(status_code=404, detail=message)
    return row


def get_user_row(connection, user_id: str):
    return connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()


def get_user_name(connection, user_id: str | None) -> str | None:
    if not user_id:
        return None
    row = get_user_row(connection, user_id)
    return row["name"] if row else None


def user_to_response(connection, user_row) -> UserResponse:
    department_name = ""
    if user_row["department_id"]:
        department = connection.execute(
            "SELECT name FROM departments WHERE id = ?",
            (user_row["department_id"],),
        ).fetchone()
        department_name = department["name"] if department else ""
    return UserResponse(
        id=user_row["id"],
        name=user_row["name"],
        email=user_row["email"],
        role=user_row["role"],
        department=department_name or "Administration",
        createdAt=user_row["created_at"],
    )


def proposal_to_response(connection, proposal_row) -> ProposalResponse:
    comments = connection.execute(
        """
        SELECT rc.id, rc.proposal_id, rc.reviewer_id, rc.comment, rc.decision, rc.created_at, u.name AS reviewer_name
        FROM review_comments rc
        JOIN users u ON u.id = rc.reviewer_id
        WHERE rc.proposal_id = ?
        ORDER BY rc.created_at ASC
        """,
        (proposal_row["id"],),
    ).fetchall()
    submitted_by_name = get_user_name(connection, proposal_row["submitted_by_id"]) or ""
    advisor_name = get_user_name(connection, proposal_row["faculty_advisor_id"])
    department = connection.execute(
        "SELECT name FROM departments WHERE id = ?",
        (proposal_row["department_id"],),
    ).fetchone()

    return ProposalResponse(
        id=proposal_row["id"],
        title=proposal_row["title"],
        abstract=proposal_row["abstract"],
        objectives=proposal_row["objectives"],
        methodology=proposal_row["methodology"],
        timeline=proposal_row["timeline"],
        budget=proposal_row["budget"],
        status=proposal_row["status"],
        submittedBy=proposal_row["submitted_by_id"],
        submittedByName=submitted_by_name,
        department=department["name"] if department else "",
        facultyAdvisor=proposal_row["faculty_advisor_id"],
        facultyAdvisorName=advisor_name,
        projectId=proposal_row["project_id"],
        createdAt=proposal_row["created_at"],
        updatedAt=proposal_row["updated_at"],
        reviewComments=[
            ReviewCommentResponse(
                id=comment["id"],
                proposalId=comment["proposal_id"],
                reviewerId=comment["reviewer_id"],
                reviewerName=comment["reviewer_name"],
                comment=comment["comment"],
                decision=comment["decision"],
                createdAt=comment["created_at"],
            )
            for comment in comments
        ],
    )


def project_to_response(connection, project_row) -> ProjectResponse:
    members = connection.execute(
        """
        SELECT pm.user_id, u.name
        FROM project_members pm
        JOIN users u ON u.id = pm.user_id
        WHERE pm.project_id = ?
        ORDER BY u.name
        """,
        (project_row["id"],),
    ).fetchall()
    milestones = connection.execute(
        """
        SELECT id, project_id, title, description, due_date, completed, completed_at
        FROM milestones
        WHERE project_id = ?
        ORDER BY due_date ASC
        """,
        (project_row["id"],),
    ).fetchall()
    advisor_name = get_user_name(connection, project_row["faculty_advisor_id"]) or ""
    lead_name = get_user_name(connection, project_row["lead_researcher_id"])
    department = connection.execute(
        "SELECT name FROM departments WHERE id = ?",
        (project_row["department_id"],),
    ).fetchone()

    return ProjectResponse(
        id=project_row["id"],
        proposalId=project_row["proposal_id"],
        title=project_row["title"],
        description=project_row["description"],
        status=project_row["status"],
        progress=project_row["progress"],
        startDate=project_row["start_date"],
        endDate=project_row["end_date"],
        teamMembers=[member["user_id"] for member in members],
        teamMemberNames=[member["name"] for member in members],
        leadResearcher=project_row["lead_researcher_id"],
        leadResearcherName=lead_name,
        facultyAdvisor=project_row["faculty_advisor_id"],
        facultyAdvisorName=advisor_name,
        department=department["name"] if department else "",
        milestones=[
            {
                "id": milestone["id"],
                "projectId": milestone["project_id"],
                "title": milestone["title"],
                "description": milestone["description"],
                "dueDate": milestone["due_date"],
                "completed": bool(milestone["completed"]),
                "completedAt": milestone["completed_at"],
            }
            for milestone in milestones
        ],
        createdAt=project_row["created_at"],
        updatedAt=project_row["updated_at"],
    )


def progress_update_to_response(connection, row) -> ProgressUpdateResponse:
    return ProgressUpdateResponse(
        id=row["id"],
        projectId=row["project_id"],
        submittedBy=row["submitted_by_id"],
        submittedByName=get_user_name(connection, row["submitted_by_id"]) or "",
        content=row["content"],
        createdAt=row["created_at"],
    )


def application_to_response(connection, row) -> ProjectApplicationResponse:
    project = connection.execute("SELECT title FROM projects WHERE id = ?", (row["project_id"],)).fetchone()
    return ProjectApplicationResponse(
        id=row["id"],
        projectId=row["project_id"],
        projectTitle=project["title"] if project else "",
        applicantId=row["applicant_id"],
        applicantName=get_user_name(connection, row["applicant_id"]) or "",
        coverLetter=row["cover_letter"],
        status=row["status"],
        createdAt=row["created_at"],
    )


def audit_log_to_response(connection, row) -> AuditLogResponse:
    return AuditLogResponse(
        id=row["id"],
        userId=row["user_id"],
        userName=get_user_name(connection, row["user_id"]) or "",
        action=row["action"],
        details=row["details"],
        timestamp=row["timestamp"],
    )


def get_department_id_by_name(connection, department_name: str | None) -> int | None:
    if not department_name:
        return None
    row = connection.execute("SELECT id FROM departments WHERE name = ?", (department_name,)).fetchone()
    return row["id"] if row else None


def require_role(current_user, allowed_roles: set[str]):
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="You do not have permission to perform this action.")


def create_audit_log(connection, user_id: str, action: str, details: str) -> None:
    connection.execute(
        "INSERT INTO audit_logs (id, user_id, action, details, timestamp) VALUES (?, ?, ?, ?, ?)",
        (f"log-{uuid.uuid4().hex[:12]}", user_id, action, details, utc_now_iso()),
    )


def token_fingerprint(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def save_refresh_token(connection, user_id: str, refresh_token: str) -> None:
    payload = decode_refresh_token(refresh_token)
    exp_value = payload.get("exp")
    if isinstance(exp_value, (int, float)):
        expires_at = datetime.fromtimestamp(exp_value, tz=timezone.utc)
    else:
        expires_at = parse_iso_datetime(str(exp_value))
    connection.execute(
        """
        INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            f"rt-{uuid.uuid4().hex[:12]}",
            user_id,
            token_fingerprint(refresh_token),
            expires_at.replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            None,
            utc_now_iso(),
        ),
    )


def revoke_refresh_token(connection, refresh_token: str) -> None:
    connection.execute(
        "UPDATE refresh_tokens SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL",
        (utc_now_iso(), token_fingerprint(refresh_token)),
    )


def issue_auth_tokens(connection, user_row) -> tuple[str, str]:
    access_token = create_access_token({"sub": user_row["id"], "role": user_row["role"]})
    refresh_token = create_refresh_token({"sub": user_row["id"], "role": user_row["role"]})
    save_refresh_token(connection, user_row["id"], refresh_token)
    return access_token, refresh_token


def enforce_login_rate_limit(request: Request, email: str) -> None:
    now = time.time()
    identifier = f"{request.client.host if request.client else 'unknown'}:{email}"
    recent_attempts = [attempt for attempt in _login_attempts.get(identifier, []) if now - attempt <= 60]
    if len(recent_attempts) >= settings.login_rate_limit_per_minute:
        raise HTTPException(status_code=429, detail="Too many login attempts. Please try again later.")
    recent_attempts.append(now)
    _login_attempts[identifier] = recent_attempts


@app.middleware("http")
async def logging_and_security_middleware(request: Request, call_next):
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("request_failed method=%s path=%s", request.method, request.url.path)
        raise
    duration_ms = (time.perf_counter() - started) * 1000
    logger.info(
        "request_completed method=%s path=%s status=%s duration_ms=%.2f",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    if settings.app_env == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    return response


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token.") from exc

    with db_session() as connection:
        user = get_user_row(connection, payload["sub"])
        if not user:
            raise HTTPException(status_code=401, detail="User not found.")
        return dict(user)


@app.on_event("startup")
def on_startup():
    init_db()
    logger.info("startup_complete db_type=%s env=%s", settings.database_type, settings.app_env)


@app.get("/health")
def health():
    return {"status": "ok", "env": settings.app_env}


@app.get("/health/readiness")
def readiness():
    with db_session() as connection:
        connection.execute("SELECT 1")
    return {"status": "ready"}


@app.post("/api/auth/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest):
    if payload.role == "admin":
        raise HTTPException(status_code=400, detail="Admin accounts must be created by an existing admin.")
    if payload.role not in {"student", "faculty", "coordinator"}:
        raise HTTPException(status_code=400, detail="Unsupported account role.")

    with db_session() as connection:
        normalized_email = payload.email.strip().lower()
        existing = connection.execute("SELECT id FROM users WHERE email = ?", (normalized_email,)).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="An account with this email already exists.")

        department_id = get_department_id_by_name(connection, payload.department)
        if not department_id:
            raise HTTPException(status_code=400, detail="Selected department does not exist.")
        if payload.role == "coordinator":
            existing_coordinator = connection.execute(
                "SELECT coordinator_user_id FROM departments WHERE id = ?",
                (department_id,),
            ).fetchone()
            if existing_coordinator and existing_coordinator["coordinator_user_id"]:
                raise HTTPException(status_code=409, detail="A coordinator already exists for this department.")

        role_prefix = {"student": "stu", "faculty": "fac", "coordinator": "coord"}[payload.role]
        user_id = f"user-{role_prefix}-{uuid.uuid4().hex[:8]}"
        created_at = utc_now_iso()
        connection.execute(
            """
            INSERT INTO users (id, name, email, password_hash, role, department_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, payload.name, normalized_email, hash_password(payload.password), payload.role, department_id, created_at),
        )
        if payload.role == "coordinator":
            connection.execute(
                "UPDATE departments SET coordinator_user_id = ? WHERE id = ?",
                (user_id, department_id),
            )
        create_audit_log(connection, user_id, "USER_REGISTERED", f"Registered {payload.role} account: {normalized_email}")
        user = get_user_row(connection, user_id)
        access_token, refresh_token = issue_auth_tokens(connection, user)
        return AuthResponse(accessToken=access_token, refreshToken=refresh_token, user=user_to_response(connection, user))


@app.post("/api/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest, request: Request):
    normalized_email = payload.email.strip().lower()
    enforce_login_rate_limit(request, normalized_email)
    with db_session() as connection:
        user = connection.execute("SELECT * FROM users WHERE email = ?", (normalized_email,)).fetchone()
        if not user or not verify_password(payload.password, user["password_hash"]):
            if user:
                create_audit_log(connection, user["id"], "LOGIN_FAILED", "Invalid login attempt")
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        access_token, refresh_token = issue_auth_tokens(connection, user)
        create_audit_log(connection, user["id"], "LOGIN_SUCCESS", "Successful login")
        return AuthResponse(accessToken=access_token, refreshToken=refresh_token, user=user_to_response(connection, user))


@app.get("/api/auth/me", response_model=UserResponse)
def me(current_user=Depends(get_current_user)):
    with db_session() as connection:
        user = row_or_404(get_user_row(connection, current_user["id"]), "User not found.")
        return user_to_response(connection, user)


@app.post("/api/auth/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest):
    with db_session() as connection:
        normalized_email = payload.email.strip().lower()
        user = connection.execute("SELECT * FROM users WHERE email = ?", (normalized_email,)).fetchone()
        if not user:
            return ForgotPasswordResponse(message="If an account exists for that email, a reset link has been prepared.")

        raw_token = secrets.token_urlsafe(32)
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=30)
        connection.execute(
            """
            INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                f"prt-{uuid.uuid4().hex[:8]}",
                user["id"],
                raw_token,
                expires_at.replace(microsecond=0).isoformat().replace("+00:00", "Z"),
                None,
                now.replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            ),
        )
        return ForgotPasswordResponse(
            message="Password reset link generated.",
            resetToken=raw_token,
            resetUrl=f"{settings.frontend_url}/reset-password?token={raw_token}",
        )


@app.post("/api/auth/reset-password")
def reset_password(payload: ResetPasswordRequest):
    with db_session() as connection:
        token_row = connection.execute(
            """
            SELECT * FROM password_reset_tokens
            WHERE token = ?
            """,
            (payload.token,),
        ).fetchone()
        if not token_row:
            raise HTTPException(status_code=404, detail="Reset token is invalid.")
        if token_row["used_at"]:
            raise HTTPException(status_code=400, detail="Reset token has already been used.")
        if parse_iso_datetime(token_row["expires_at"]) < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Reset token has expired.")

        connection.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (hash_password(payload.newPassword), token_row["user_id"]),
        )
        connection.execute(
            "UPDATE password_reset_tokens SET used_at = ? WHERE id = ?",
            (utc_now_iso(), token_row["id"]),
        )
        create_audit_log(connection, token_row["user_id"], "PASSWORD_RESET", "Reset account password")
        return {"message": "Password reset successfully."}


@app.post("/api/auth/change-password")
def change_password(payload: ChangePasswordRequest, current_user=Depends(get_current_user)):
    with db_session() as connection:
        user_row = row_or_404(get_user_row(connection, current_user["id"]), "User not found.")
        if not verify_password(payload.currentPassword, user_row["password_hash"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect.")
        if payload.currentPassword == payload.newPassword:
            raise HTTPException(status_code=400, detail="New password must be different from current password.")

        connection.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (hash_password(payload.newPassword), current_user["id"]),
        )
        connection.execute("UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL", (utc_now_iso(), current_user["id"]))
        create_audit_log(connection, current_user["id"], "PASSWORD_CHANGED", "Changed account password")
        return {"message": "Password changed successfully."}


@app.post("/api/auth/refresh", response_model=AuthResponse)
def refresh_auth(payload: RefreshTokenRequest):
    try:
        token_payload = decode_refresh_token(payload.refreshToken)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.") from exc

    with db_session() as connection:
        refresh_row = connection.execute(
            "SELECT * FROM refresh_tokens WHERE token_hash = ?",
            (token_fingerprint(payload.refreshToken),),
        ).fetchone()
        if not refresh_row or refresh_row["revoked_at"]:
            raise HTTPException(status_code=401, detail="Refresh token is not active.")
        if parse_iso_datetime(refresh_row["expires_at"]) < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Refresh token has expired.")

        user = get_user_row(connection, token_payload["sub"])
        if not user:
            raise HTTPException(status_code=401, detail="User not found.")

        revoke_refresh_token(connection, payload.refreshToken)
        access_token, refresh_token = issue_auth_tokens(connection, user)
        return AuthResponse(accessToken=access_token, refreshToken=refresh_token, user=user_to_response(connection, user))


@app.get("/api/departments", response_model=list[DepartmentResponse])
def list_departments(current_user=Depends(get_current_user)):
    with db_session() as connection:
        rows = connection.execute(
            """
            SELECT d.id, d.name, d.code, d.coordinator_user_id, u.name AS coordinator_name
            FROM departments d
            LEFT JOIN users u ON u.id = d.coordinator_user_id
            ORDER BY d.name
            """
        ).fetchall()
        return [
            DepartmentResponse(
                id=row["id"],
                name=row["name"],
                code=row["code"],
                coordinatorId=row["coordinator_user_id"],
                coordinatorName=row["coordinator_name"],
            )
            for row in rows
        ]


@app.get("/api/users", response_model=list[UserResponse])
def list_users(
    role: str | None = Query(default=None),
    department: str | None = Query(default=None),
    current_user=Depends(get_current_user),
):
    with db_session() as connection:
        query = """
            SELECT u.*
            FROM users u
            LEFT JOIN departments d ON d.id = u.department_id
            WHERE 1 = 1
        """
        values: list[Any] = []
        if current_user["role"] == "coordinator":
            query += " AND u.department_id = ? AND u.role != 'admin'"
            values.append(current_user["department_id"])
        if role:
            query += " AND u.role = ?"
            values.append(role)
        if department:
            query += " AND d.name = ?"
            values.append(department)
        rows = connection.execute(query + " ORDER BY u.name", values).fetchall()
        return [user_to_response(connection, row) for row in rows]


@app.post("/api/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserMutationRequest, current_user=Depends(get_current_user)):
    require_role(current_user, {"admin"})
    with db_session() as connection:
        normalized_email = payload.email.strip().lower()
        existing = connection.execute("SELECT id FROM users WHERE email = ?", (normalized_email,)).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="A user with this email already exists.")
        department_id = get_department_id_by_name(connection, payload.department)
        if payload.role == "coordinator":
            existing_coordinator = connection.execute(
                "SELECT coordinator_user_id FROM departments WHERE id = ?",
                (department_id,),
            ).fetchone()
            if existing_coordinator and existing_coordinator["coordinator_user_id"]:
                raise HTTPException(status_code=409, detail="A coordinator already exists for this department.")
        user_id = f"user-{uuid.uuid4().hex[:8]}"
        connection.execute(
            """
            INSERT INTO users (id, name, email, password_hash, role, department_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, payload.name, normalized_email, hash_password("password123"), payload.role, department_id, utc_now_iso()),
        )
        create_audit_log(connection, current_user["id"], "USER_CREATED", f"Created new user: {normalized_email} ({payload.role})")
        return user_to_response(connection, get_user_row(connection, user_id))


@app.patch("/api/users/{user_id}", response_model=UserResponse)
def update_user(user_id: str, payload: UserMutationRequest, current_user=Depends(get_current_user)):
    require_role(current_user, {"admin"})
    with db_session() as connection:
        existing_user = row_or_404(get_user_row(connection, user_id), "User not found.")
        department_id = get_department_id_by_name(connection, payload.department)
        normalized_email = payload.email.strip().lower()
        if payload.role == "coordinator":
            existing_coordinator = connection.execute(
                "SELECT coordinator_user_id FROM departments WHERE id = ?",
                (department_id,),
            ).fetchone()
            if (
                existing_coordinator
                and existing_coordinator["coordinator_user_id"]
                and existing_coordinator["coordinator_user_id"] != user_id
            ):
                raise HTTPException(status_code=409, detail="A coordinator already exists for this department.")
        connection.execute(
            """
            UPDATE users
            SET name = ?, email = ?, role = ?, department_id = ?
            WHERE id = ?
            """,
            (payload.name, normalized_email, payload.role, department_id, user_id),
        )
        if existing_user["role"] == "coordinator":
            connection.execute("UPDATE departments SET coordinator_user_id = NULL WHERE coordinator_user_id = ?", (user_id,))
        if payload.role == "coordinator":
            connection.execute(
                "UPDATE departments SET coordinator_user_id = ? WHERE id = ?",
                (user_id, department_id),
            )
        create_audit_log(connection, current_user["id"], "USER_UPDATED", f"Updated user: {normalized_email}")
        return user_to_response(connection, get_user_row(connection, user_id))


@app.post("/api/users/{user_id}/reset-password")
def admin_reset_user_password(user_id: str, payload: AdminResetPasswordRequest, current_user=Depends(get_current_user)):
    require_role(current_user, {"admin"})
    with db_session() as connection:
        target_user = row_or_404(get_user_row(connection, user_id), "User not found.")
        connection.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hash_password(payload.newPassword), user_id))
        connection.execute("UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL", (utc_now_iso(), user_id))
        create_audit_log(connection, current_user["id"], "USER_PASSWORD_RESET", f"Reset password for user: {target_user['email']}")
        return {"message": "User password reset successfully."}


@app.delete("/api/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: str, current_user=Depends(get_current_user)):
    require_role(current_user, {"admin"})
    with db_session() as connection:
        user = row_or_404(get_user_row(connection, user_id), "User not found.")
        connection.execute("DELETE FROM users WHERE id = ?", (user_id,))
        create_audit_log(connection, current_user["id"], "USER_DELETED", f"Deleted user: {user['email']}")


@app.get("/api/proposals", response_model=list[ProposalResponse])
def list_proposals(
    status_filter: str | None = Query(default=None, alias="status"),
    department: str | None = Query(default=None),
    user_id: str | None = Query(default=None, alias="userId"),
    current_user=Depends(get_current_user),
):
    with db_session() as connection:
        query = """
            SELECT p.*
            FROM proposals p
            JOIN departments d ON d.id = p.department_id
            WHERE 1 = 1
        """
        values: list[Any] = []
        if current_user["role"] == "coordinator":
            query += " AND p.department_id = ?"
            values.append(current_user["department_id"])
        if status_filter:
            query += " AND p.status = ?"
            values.append(status_filter)
        if department:
            query += " AND d.name = ?"
            values.append(department)
        if user_id:
            query += " AND p.submitted_by_id = ?"
            values.append(user_id)
        rows = connection.execute(query + " ORDER BY p.updated_at DESC", values).fetchall()
        return [proposal_to_response(connection, row) for row in rows]


@app.post("/api/proposals", response_model=ProposalResponse, status_code=status.HTTP_201_CREATED)
def create_proposal(payload: CreateProposalRequest, current_user=Depends(get_current_user)):
    require_role(current_user, {"student"})
    with db_session() as connection:
        user = get_user_row(connection, current_user["id"])
        proposal_id = f"prop-{uuid.uuid4().hex[:8]}"
        now = utc_now_iso()
        connection.execute(
            """
            INSERT INTO proposals (
                id, title, abstract, objectives, methodology, timeline, budget, status,
                submitted_by_id, department_id, faculty_advisor_id, project_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                proposal_id,
                payload.title,
                payload.abstract,
                payload.objectives,
                payload.methodology,
                payload.timeline,
                payload.budget,
                "draft",
                current_user["id"],
                user["department_id"],
                payload.facultyAdvisor,
                payload.projectId,
                now,
                now,
            ),
        )
        create_audit_log(connection, current_user["id"], "PROPOSAL_CREATED", f"Created proposal: {payload.title}")
        return proposal_to_response(connection, connection.execute("SELECT * FROM proposals WHERE id = ?", (proposal_id,)).fetchone())


@app.patch("/api/proposals/{proposal_id}", response_model=ProposalResponse)
def update_proposal(proposal_id: str, payload: UpdateProposalRequest, current_user=Depends(get_current_user)):
    with db_session() as connection:
        proposal = row_or_404(connection.execute("SELECT * FROM proposals WHERE id = ?", (proposal_id,)).fetchone(), "Proposal not found.")
        if current_user["role"] == "student":
            if proposal["submitted_by_id"] != current_user["id"]:
                raise HTTPException(status_code=403, detail="You can only edit your own proposals.")
        elif current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only students can update proposals directly.")

        updates = payload.model_dump(exclude_unset=True)
        if not updates:
            return proposal_to_response(connection, proposal)

        field_map = {
            "title": "title",
            "abstract": "abstract",
            "objectives": "objectives",
            "methodology": "methodology",
            "timeline": "timeline",
            "budget": "budget",
            "facultyAdvisor": "faculty_advisor_id",
            "projectId": "project_id",
            "status": "status",
        }
        assignments = []
        values: list[Any] = []
        for key, value in updates.items():
            assignments.append(f"{field_map[key]} = ?")
            values.append(value)
        assignments.append("updated_at = ?")
        values.append(utc_now_iso())
        values.append(proposal_id)
        connection.execute(f"UPDATE proposals SET {', '.join(assignments)} WHERE id = ?", values)
        if updates.get("status") == "submitted":
            create_audit_log(connection, current_user["id"], "PROPOSAL_SUBMITTED", f"Submitted proposal: {proposal['title']}")
        return proposal_to_response(connection, connection.execute("SELECT * FROM proposals WHERE id = ?", (proposal_id,)).fetchone())


@app.post("/api/proposals/{proposal_id}/review", response_model=ProposalResponse)
def review_proposal(proposal_id: str, payload: ReviewProposalRequest, current_user=Depends(get_current_user)):
    require_role(current_user, {"faculty", "admin"})
    status_map = {"approve": "approved", "reject": "rejected", "revision_required": "revision_required"}
    with db_session() as connection:
        proposal = row_or_404(connection.execute("SELECT * FROM proposals WHERE id = ?", (proposal_id,)).fetchone(), "Proposal not found.")
        comment_id = f"review-{uuid.uuid4().hex[:8]}"
        connection.execute(
            """
            INSERT INTO review_comments (id, proposal_id, reviewer_id, comment, decision, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (comment_id, proposal_id, current_user["id"], payload.comment, payload.decision, utc_now_iso()),
        )
        connection.execute(
            "UPDATE proposals SET status = ?, updated_at = ? WHERE id = ?",
            (status_map[payload.decision], utc_now_iso(), proposal_id),
        )
        create_audit_log(
            connection,
            current_user["id"],
            f"PROPOSAL_{payload.decision.upper()}",
            f"{payload.decision.replace('_', ' ').title()} proposal: {proposal['title']}",
        )
        return proposal_to_response(connection, connection.execute("SELECT * FROM proposals WHERE id = ?", (proposal_id,)).fetchone())


@app.get("/api/projects", response_model=list[ProjectResponse])
def list_projects(
    status_filter: str | None = Query(default=None, alias="status"),
    department: str | None = Query(default=None),
    user_id: str | None = Query(default=None, alias="userId"),
    current_user=Depends(get_current_user),
):
    with db_session() as connection:
        query = """
            SELECT p.*
            FROM projects p
            JOIN departments d ON d.id = p.department_id
            WHERE 1 = 1
        """
        values: list[Any] = []
        if current_user["role"] == "coordinator":
            query += " AND p.department_id = ?"
            values.append(current_user["department_id"])
        if status_filter:
            query += " AND p.status = ?"
            values.append(status_filter)
        if department:
            query += " AND d.name = ?"
            values.append(department)
        if user_id:
            query += """
                AND (
                    p.lead_researcher_id = ?
                    OR p.faculty_advisor_id = ?
                    OR EXISTS (
                        SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = ?
                    )
                )
            """
            values.extend([user_id, user_id, user_id])
        rows = connection.execute(query + " ORDER BY p.updated_at DESC", values).fetchall()
        return [project_to_response(connection, row) for row in rows]


@app.post("/api/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(payload: CreateProjectRequest, current_user=Depends(get_current_user)):
    require_role(current_user, {"faculty", "admin"})
    with db_session() as connection:
        creator = row_or_404(get_user_row(connection, current_user["id"]), "User not found.")
        if current_user["role"] == "faculty":
            department_id = creator["department_id"]
            faculty_advisor_id = current_user["id"]
        else:
            department_id = get_department_id_by_name(connection, payload.department)
            faculty_advisor_id = payload.facultyAdvisor
        project_id = f"proj-{uuid.uuid4().hex[:8]}"
        now = utc_now_iso()
        connection.execute(
            """
            INSERT INTO projects (
                id, proposal_id, title, description, status, progress, start_date, end_date,
                lead_researcher_id, faculty_advisor_id, department_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                project_id,
                payload.proposalId,
                payload.title,
                payload.description,
                payload.status,
                payload.progress,
                payload.startDate,
                payload.endDate,
                payload.leadResearcher,
                faculty_advisor_id,
                department_id,
                now,
                now,
            ),
        )
        if payload.leadResearcher:
            connection.execute(
                "INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)",
                (project_id, payload.leadResearcher),
            )
        create_audit_log(connection, current_user["id"], "PROJECT_CREATED", f"Created project: {payload.title}")
        return project_to_response(connection, connection.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone())


@app.patch("/api/projects/{project_id}", response_model=ProjectResponse)
def update_project(project_id: str, payload: UpdateProjectRequest, current_user=Depends(get_current_user)):
    if current_user["role"] == "coordinator":
        raise HTTPException(status_code=403, detail="Coordinator accounts are read-only for project updates.")
    with db_session() as connection:
        project = row_or_404(connection.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone(), "Project not found.")
        if current_user["role"] == "faculty" and project["faculty_advisor_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="You can only update projects you advise.")
        if current_user["role"] not in {"faculty", "admin"} and project["lead_researcher_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="You do not have permission to update this project.")

        updates = payload.model_dump(exclude_unset=True)
        team_members = updates.pop("teamMembers", None)
        milestone_updates = updates.pop("milestoneUpdates", None)
        field_map = {
            "title": "title",
            "description": "description",
            "status": "status",
            "progress": "progress",
            "startDate": "start_date",
            "endDate": "end_date",
            "leadResearcher": "lead_researcher_id",
            "facultyAdvisor": "faculty_advisor_id",
            "department": "department_id",
        }
        assignments = []
        values: list[Any] = []
        for key, value in updates.items():
            if key == "department":
                value = get_department_id_by_name(connection, value)
            assignments.append(f"{field_map[key]} = ?")
            values.append(value)
        assignments.append("updated_at = ?")
        values.append(utc_now_iso())
        values.append(project_id)
        if assignments:
            connection.execute(f"UPDATE projects SET {', '.join(assignments)} WHERE id = ?", values)

        if team_members is not None:
            connection.execute("DELETE FROM project_members WHERE project_id = ?", (project_id,))
            for member_id in team_members:
                connection.execute(
                    "INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)",
                    (project_id, member_id),
                )

        if milestone_updates is not None:
            for milestone in milestone_updates:
                connection.execute(
                    """
                    UPDATE milestones
                    SET title = ?, description = ?, due_date = ?, completed = ?, completed_at = ?
                    WHERE id = ? AND project_id = ?
                    """,
                    (
                        milestone["title"],
                        milestone["description"],
                        milestone["dueDate"],
                        1 if milestone["completed"] else 0,
                        milestone["completedAt"],
                        milestone["id"],
                        project_id,
                    ),
                )
        return project_to_response(connection, connection.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone())


@app.get("/api/progress-updates", response_model=list[ProgressUpdateResponse])
def list_progress_updates(
    project_id: str | None = Query(default=None, alias="projectId"),
    user_id: str | None = Query(default=None, alias="userId"),
    current_user=Depends(get_current_user),
):
    with db_session() as connection:
        query = """
            SELECT pu.*
            FROM progress_updates pu
            JOIN projects p ON p.id = pu.project_id
            WHERE 1 = 1
        """
        values: list[Any] = []
        if current_user["role"] == "coordinator":
            query += " AND p.department_id = ?"
            values.append(current_user["department_id"])
        if project_id:
            query += " AND pu.project_id = ?"
            values.append(project_id)
        if user_id:
            query += " AND pu.submitted_by_id = ?"
            values.append(user_id)
        rows = connection.execute(query + " ORDER BY pu.created_at DESC", values).fetchall()
        return [progress_update_to_response(connection, row) for row in rows]


@app.post("/api/projects/{project_id}/progress", response_model=ProgressUpdateResponse, status_code=status.HTTP_201_CREATED)
def add_progress_update(project_id: str, payload: CreateProgressUpdateRequest, current_user=Depends(get_current_user)):
    if current_user["role"] == "coordinator":
        raise HTTPException(status_code=403, detail="Coordinator accounts are read-only for progress updates.")
    with db_session() as connection:
        project = row_or_404(connection.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone(), "Project not found.")
        is_member = connection.execute(
            "SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?",
            (project_id, current_user["id"]),
        ).fetchone()
        if current_user["role"] not in {"faculty", "admin"} and not is_member:
            raise HTTPException(status_code=403, detail="You must belong to the project to submit updates.")

        update_id = f"update-{uuid.uuid4().hex[:8]}"
        now = utc_now_iso()
        connection.execute(
            "INSERT INTO progress_updates (id, project_id, submitted_by_id, content, created_at) VALUES (?, ?, ?, ?, ?)",
            (update_id, project_id, current_user["id"], payload.content, now),
        )
        create_audit_log(connection, current_user["id"], "PROGRESS_UPDATE", f"Submitted progress update for project: {project['title']}")
        row = connection.execute("SELECT * FROM progress_updates WHERE id = ?", (update_id,)).fetchone()
        return progress_update_to_response(connection, row)


@app.get("/api/applications", response_model=list[ProjectApplicationResponse])
def list_applications(
    project_id: str | None = Query(default=None, alias="projectId"),
    applicant_id: str | None = Query(default=None, alias="applicantId"),
    status_filter: str | None = Query(default=None, alias="status"),
    current_user=Depends(get_current_user),
):
    with db_session() as connection:
        query = """
            SELECT pa.*
            FROM project_applications pa
            JOIN projects p ON p.id = pa.project_id
            WHERE 1 = 1
        """
        values: list[Any] = []
        if current_user["role"] == "coordinator":
            query += " AND p.department_id = ?"
            values.append(current_user["department_id"])
        if project_id:
            query += " AND pa.project_id = ?"
            values.append(project_id)
        if applicant_id:
            query += " AND pa.applicant_id = ?"
            values.append(applicant_id)
        if status_filter:
            query += " AND pa.status = ?"
            values.append(status_filter)
        rows = connection.execute(query + " ORDER BY pa.created_at DESC", values).fetchall()
        return [application_to_response(connection, row) for row in rows]


@app.post("/api/projects/{project_id}/applications", response_model=ProjectApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(project_id: str, payload: CreateApplicationRequest, current_user=Depends(get_current_user)):
    require_role(current_user, {"student"})
    with db_session() as connection:
        project = row_or_404(connection.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone(), "Project not found.")
        existing = connection.execute(
            "SELECT id FROM project_applications WHERE project_id = ? AND applicant_id = ?",
            (project_id, current_user["id"]),
        ).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="You have already applied to this project.")

        application_id = f"app-{uuid.uuid4().hex[:8]}"
        connection.execute(
            """
            INSERT INTO project_applications (id, project_id, applicant_id, cover_letter, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (application_id, project_id, current_user["id"], payload.coverLetter, "pending", utc_now_iso()),
        )
        create_audit_log(connection, current_user["id"], "PROJECT_APPLICATION", f"Applied to join project: {project['title']}")
        row = connection.execute("SELECT * FROM project_applications WHERE id = ?", (application_id,)).fetchone()
        return application_to_response(connection, row)


@app.patch("/api/applications/{application_id}", response_model=ProjectApplicationResponse)
def update_application(application_id: str, payload: UpdateApplicationRequest, current_user=Depends(get_current_user)):
    require_role(current_user, {"faculty", "admin"})
    with db_session() as connection:
        application = row_or_404(connection.execute("SELECT * FROM project_applications WHERE id = ?", (application_id,)).fetchone(), "Application not found.")
        project = row_or_404(connection.execute("SELECT * FROM projects WHERE id = ?", (application["project_id"],)).fetchone(), "Project not found.")
        if current_user["role"] == "faculty" and project["faculty_advisor_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="You can only review applications for your own projects.")

        connection.execute("UPDATE project_applications SET status = ? WHERE id = ?", (payload.status, application_id))
        if payload.status == "accepted":
            connection.execute(
                "INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)",
                (application["project_id"], application["applicant_id"]),
            )
        create_audit_log(
            connection,
            current_user["id"],
            f"APPLICATION_{payload.status.upper()}",
            f"{payload.status.title()} application for project: {project['title']}",
        )
        row = connection.execute("SELECT * FROM project_applications WHERE id = ?", (application_id,)).fetchone()
        return application_to_response(connection, row)


@app.get("/api/audit-logs", response_model=list[AuditLogResponse])
def list_audit_logs(current_user=Depends(get_current_user)):
    require_role(current_user, {"admin"})
    with db_session() as connection:
        rows = connection.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC").fetchall()
        return [audit_log_to_response(connection, row) for row in rows]


@app.post("/api/audit-logs", response_model=AuditLogResponse, status_code=status.HTTP_201_CREATED)
def create_audit_log_endpoint(payload: CreateAuditLogRequest, current_user=Depends(get_current_user)):
    with db_session() as connection:
        log_id = f"log-{uuid.uuid4().hex[:8]}"
        now = utc_now_iso()
        connection.execute(
            "INSERT INTO audit_logs (id, user_id, action, details, timestamp) VALUES (?, ?, ?, ?, ?)",
            (log_id, current_user["id"], payload.action, payload.details, now),
        )
        row = connection.execute("SELECT * FROM audit_logs WHERE id = ?", (log_id,)).fetchone()
        return audit_log_to_response(connection, row)


@app.get("/api/statistics", response_model=StatisticsResponse)
def statistics(current_user=Depends(get_current_user)):
    require_role(current_user, {"admin", "coordinator"})
    with db_session() as connection:
        user_filter = ""
        proposal_filter = ""
        project_filter = ""
        values: list[Any] = []
        if current_user["role"] == "coordinator":
            user_filter = " WHERE department_id = ?"
            proposal_filter = " WHERE department_id = ?"
            project_filter = " WHERE department_id = ?"
            values = [current_user["department_id"]]

        total_users = connection.execute(f"SELECT COUNT(*) AS total FROM users{user_filter}", values).fetchone()["total"]
        total_students = connection.execute(
            f"SELECT COUNT(*) AS total FROM users WHERE role = 'student'" + (" AND department_id = ?" if current_user["role"] == "coordinator" else ""),
            values,
        ).fetchone()["total"]
        total_faculty = connection.execute(
            f"SELECT COUNT(*) AS total FROM users WHERE role = 'faculty'" + (" AND department_id = ?" if current_user["role"] == "coordinator" else ""),
            values,
        ).fetchone()["total"]
        proposal_rows = connection.execute(f"SELECT status, budget FROM proposals{proposal_filter}", values).fetchall()
        project_rows = connection.execute(f"SELECT status, progress FROM projects{project_filter}", values).fetchall()
        proposals_by_status = {key: 0 for key in ["draft", "submitted", "under_review", "approved", "rejected", "revision_required"]}
        projects_by_status = {key: 0 for key in ["not_started", "in_progress", "on_hold", "completed", "cancelled", "open"]}
        total_budget = 0.0
        for proposal in proposal_rows:
            proposals_by_status[proposal["status"]] += 1
            if proposal["status"] == "approved":
                total_budget += proposal["budget"]
        for project in project_rows:
            projects_by_status[project["status"]] += 1
        average_progress = round(sum(project["progress"] for project in project_rows) / len(project_rows)) if project_rows else 0

        return StatisticsResponse(
            totalUsers=total_users,
            totalStudents=total_students,
            totalFaculty=total_faculty,
            totalProposals=len(proposal_rows),
            proposalsByStatus=proposals_by_status,
            totalProjects=len(project_rows),
            projectsByStatus=projects_by_status,
            activeProjects=projects_by_status["in_progress"],
            openProjects=projects_by_status["open"],
            completedProjects=projects_by_status["completed"],
            averageProgress=average_progress,
            totalDepartments=connection.execute("SELECT COUNT(*) AS total FROM departments").fetchone()["total"],
            totalBudget=total_budget,
        )
