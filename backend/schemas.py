from typing import Literal

from pydantic import BaseModel, Field


UserRole = Literal["student", "faculty", "coordinator", "admin"]
ProposalStatus = Literal["draft", "submitted", "under_review", "approved", "rejected", "revision_required"]
ProjectStatus = Literal["not_started", "in_progress", "on_hold", "completed", "cancelled", "open"]
ApplicationStatus = Literal["pending", "accepted", "rejected"]


class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: str
    coordinatorId: str | None = None
    coordinatorName: str | None = None


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    department: str
    createdAt: str


class AuthResponse(BaseModel):
    accessToken: str
    refreshToken: str
    user: UserResponse


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2)
    email: str
    password: str = Field(min_length=8)
    department: str
    role: UserRole = "student"


class LoginRequest(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ForgotPasswordResponse(BaseModel):
    message: str
    resetToken: str | None = None
    resetUrl: str | None = None


class ResetPasswordRequest(BaseModel):
    token: str
    newPassword: str = Field(min_length=8)


class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str = Field(min_length=8)


class RefreshTokenRequest(BaseModel):
    refreshToken: str


class ReviewCommentResponse(BaseModel):
    id: str
    proposalId: str
    reviewerId: str
    reviewerName: str
    comment: str
    decision: Literal["approve", "reject", "revision_required"] | None = None
    createdAt: str


class ProposalResponse(BaseModel):
    id: str
    title: str
    abstract: str
    objectives: str
    methodology: str
    timeline: str
    budget: float
    status: ProposalStatus
    submittedBy: str
    submittedByName: str
    department: str
    facultyAdvisor: str | None = None
    facultyAdvisorName: str | None = None
    projectId: str | None = None
    createdAt: str
    updatedAt: str
    reviewComments: list[ReviewCommentResponse] = []


class CreateProposalRequest(BaseModel):
    title: str
    abstract: str
    objectives: str = ""
    methodology: str = ""
    timeline: str = ""
    budget: float = 0
    facultyAdvisor: str | None = None
    projectId: str | None = None


class UpdateProposalRequest(BaseModel):
    title: str | None = None
    abstract: str | None = None
    objectives: str | None = None
    methodology: str | None = None
    timeline: str | None = None
    budget: float | None = None
    facultyAdvisor: str | None = None
    projectId: str | None = None
    status: ProposalStatus | None = None


class ReviewProposalRequest(BaseModel):
    decision: Literal["approve", "reject", "revision_required"]
    comment: str = ""


class MilestoneResponse(BaseModel):
    id: str
    projectId: str
    title: str
    description: str
    dueDate: str
    completed: bool
    completedAt: str | None = None


class ProjectResponse(BaseModel):
    id: str
    proposalId: str | None = None
    title: str
    description: str
    status: ProjectStatus
    progress: int
    startDate: str
    endDate: str
    teamMembers: list[str]
    teamMemberNames: list[str]
    leadResearcher: str | None = None
    leadResearcherName: str | None = None
    facultyAdvisor: str
    facultyAdvisorName: str
    department: str
    milestones: list[MilestoneResponse]
    createdAt: str
    updatedAt: str


class CreateProjectRequest(BaseModel):
    proposalId: str | None = None
    title: str
    description: str
    status: ProjectStatus = "not_started"
    progress: int = 0
    startDate: str
    endDate: str
    leadResearcher: str | None = None
    facultyAdvisor: str
    department: str


class UpdateProjectRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    status: ProjectStatus | None = None
    progress: int | None = None
    startDate: str | None = None
    endDate: str | None = None
    leadResearcher: str | None = None
    facultyAdvisor: str | None = None
    department: str | None = None
    teamMembers: list[str] | None = None
    milestoneUpdates: list[MilestoneResponse] | None = None


class ProgressUpdateResponse(BaseModel):
    id: str
    projectId: str
    submittedBy: str
    submittedByName: str
    content: str
    createdAt: str


class CreateProgressUpdateRequest(BaseModel):
    content: str = Field(min_length=1)


class ProjectApplicationResponse(BaseModel):
    id: str
    projectId: str
    projectTitle: str
    applicantId: str
    applicantName: str
    coverLetter: str
    status: ApplicationStatus
    createdAt: str


class CreateApplicationRequest(BaseModel):
    coverLetter: str = Field(min_length=1)


class UpdateApplicationRequest(BaseModel):
    status: Literal["accepted", "rejected"]


class AuditLogResponse(BaseModel):
    id: str
    userId: str
    userName: str
    action: str
    details: str
    timestamp: str


class CreateAuditLogRequest(BaseModel):
    action: str
    details: str


class UserMutationRequest(BaseModel):
    name: str
    email: str
    role: UserRole
    department: str


class AdminResetPasswordRequest(BaseModel):
    newPassword: str = Field(min_length=8)


class StatisticsResponse(BaseModel):
    totalUsers: int
    totalStudents: int
    totalFaculty: int
    totalProposals: int
    proposalsByStatus: dict[str, int]
    totalProjects: int
    projectsByStatus: dict[str, int]
    activeProjects: int
    openProjects: int
    completedProjects: int
    averageProgress: int
    totalDepartments: int
    totalBudget: float
