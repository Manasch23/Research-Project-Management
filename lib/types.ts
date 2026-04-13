export type UserRole = "student" | "faculty" | "coordinator" | "admin"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  department: string
  createdAt: string
}

export type ProposalStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "revision_required"

export interface ReviewComment {
  id: string
  proposalId: string
  reviewerId: string
  reviewerName: string
  comment: string
  decision?: "approve" | "reject" | "revision_required"
  createdAt: string
}

export interface Proposal {
  id: string
  title: string
  abstract: string
  objectives: string
  methodology: string
  timeline: string
  budget: number
  status: ProposalStatus
  submittedBy: string
  submittedByName: string
  department: string
  facultyAdvisor?: string
  facultyAdvisorName?: string
  projectId?: string | null
  createdAt: string
  updatedAt: string
  reviewComments?: ReviewComment[]
}

export type ProjectStatus =
  | "not_started"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "cancelled"
  | "open"

export interface Milestone {
  id: string
  projectId: string
  title: string
  description: string
  dueDate: string
  completed: boolean
  completedAt?: string | null
}

export interface Project {
  id: string
  proposalId: string | null
  title: string
  description: string
  status: ProjectStatus
  progress: number
  startDate: string
  endDate: string
  teamMembers: string[]
  teamMemberNames: string[]
  leadResearcher: string | null
  leadResearcherName: string | null
  facultyAdvisor: string
  facultyAdvisorName: string
  department: string
  milestones: Milestone[]
  createdAt: string
  updatedAt: string
}

export interface ProgressUpdate {
  id: string
  projectId: string
  submittedBy: string
  submittedByName: string
  content: string
  createdAt: string
}

export interface ProjectApplication {
  id: string
  projectId: string
  projectTitle: string
  applicantId: string
  applicantName: string
  coverLetter: string
  status: "pending" | "accepted" | "rejected"
  createdAt: string
}

export interface Department {
  id: number
  name: string
  code: string
  coordinatorId?: string | null
  coordinatorName?: string | null
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  details: string
  timestamp: string
}

export interface Statistics {
  totalUsers: number
  totalStudents: number
  totalFaculty: number
  totalProposals: number
  proposalsByStatus: Record<string, number>
  totalProjects: number
  projectsByStatus: Record<string, number>
  activeProjects: number
  openProjects: number
  completedProjects: number
  averageProgress: number
  totalDepartments: number
  totalBudget: number
}
