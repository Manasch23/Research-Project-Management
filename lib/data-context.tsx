"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { apiRequest } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type {
  AuditLog,
  Department,
  ProgressUpdate,
  Project,
  ProjectApplication,
  Proposal,
  ProposalStatus,
  ReviewComment,
  Statistics,
  User,
} from "@/lib/types"

interface DataContextType {
  users: User[]
  proposals: Proposal[]
  projects: Project[]
  progressUpdates: ProgressUpdate[]
  projectApplications: ProjectApplication[]
  departments: Department[]
  auditLogs: AuditLog[]
  facultyList: User[]
  statistics: Statistics | null
  isLoading: boolean
  refreshAll: () => Promise<void>
  addUser: (user: Omit<User, "id" | "createdAt">) => Promise<User>
  updateUser: (id: string, updates: Omit<User, "id" | "createdAt">) => Promise<User>
  resetUserPassword: (id: string, newPassword: string) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  addProposal: (proposal: Partial<Proposal> & { title: string; abstract: string }) => Promise<Proposal>
  updateProposal: (id: string, updates: Partial<Proposal>) => Promise<Proposal>
  updateProposalStatus: (id: string, status: ProposalStatus, comment?: ReviewComment) => Promise<Proposal>
  addProject: (project: Omit<Project, "id" | "createdAt" | "updatedAt" | "teamMembers" | "teamMemberNames" | "facultyAdvisorName" | "leadResearcherName" | "milestones">) => Promise<Project>
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project>
  addProgressUpdate: (update: Omit<ProgressUpdate, "id" | "createdAt">) => Promise<ProgressUpdate>
  addProjectApplication: (application: Partial<ProjectApplication> & { projectId: string; coverLetter: string }) => Promise<ProjectApplication>
  updateApplicationStatus: (id: string, status: "accepted" | "rejected") => Promise<ProjectApplication>
  addAuditLog: (log: Pick<AuditLog, "action" | "details"> & Partial<Pick<AuditLog, "userId" | "userName">>) => Promise<AuditLog | null>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const { token, user, isAuthenticated } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([])
  const [projectApplications, setProjectApplications] = useState<ProjectApplication[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refreshAll = useCallback(async () => {
    if (!token || !user) return
    setIsLoading(true)
    try {
      const requests: Promise<unknown>[] = [
        apiRequest<User[]>("/users", { token }),
        apiRequest<Proposal[]>("/proposals", { token }),
        apiRequest<Project[]>("/projects", { token }),
        apiRequest<ProgressUpdate[]>("/progress-updates", { token }),
        apiRequest<ProjectApplication[]>("/applications", { token }),
        apiRequest<Department[]>("/departments", { token }),
      ]

      const includeAudit = user.role === "admin"
      const includeStats = user.role === "admin" || user.role === "coordinator"

      if (includeAudit) {
        requests.push(apiRequest<AuditLog[]>("/audit-logs", { token }))
      }
      if (includeStats) {
        requests.push(apiRequest<Statistics>("/statistics", { token }))
      }

      const result = await Promise.all(requests)
      setUsers(result[0] as User[])
      setProposals(result[1] as Proposal[])
      setProjects(result[2] as Project[])
      setProgressUpdates(result[3] as ProgressUpdate[])
      setProjectApplications(result[4] as ProjectApplication[])
      setDepartments(result[5] as Department[])
      setAuditLogs(includeAudit ? (result[6] as AuditLog[]) : [])
      setStatistics(
        includeStats
          ? (result[includeAudit ? 7 : 6] as Statistics)
          : null
      )
    } finally {
      setIsLoading(false)
    }
  }, [token, user])

  useEffect(() => {
    if (!isAuthenticated || !token || !user) {
      setUsers([])
      setProposals([])
      setProjects([])
      setProgressUpdates([])
      setProjectApplications([])
      setDepartments([])
      setAuditLogs([])
      setStatistics(null)
      return
    }
    void refreshAll()
  }, [isAuthenticated, token, user, refreshAll])

  const addUser: DataContextType["addUser"] = useCallback(async (userData) => {
    const created = await apiRequest<User>("/users", {
      method: "POST",
      token: token || undefined,
      body: JSON.stringify(userData),
    })
    await refreshAll()
    return created
  }, [token, refreshAll])

  const updateUser: DataContextType["updateUser"] = useCallback(async (id, updates) => {
    const updated = await apiRequest<User>(`/users/${id}`, {
      method: "PATCH",
      token: token || undefined,
      body: JSON.stringify(updates),
    })
    await refreshAll()
    return updated
  }, [token, refreshAll])

  const deleteUser: DataContextType["deleteUser"] = useCallback(async (id) => {
    await apiRequest<void>(`/users/${id}`, {
      method: "DELETE",
      token: token || undefined,
    })
    await refreshAll()
  }, [token, refreshAll])

  const resetUserPassword: DataContextType["resetUserPassword"] = useCallback(async (id, newPassword) => {
    await apiRequest<{ message: string }>(`/users/${id}/reset-password`, {
      method: "POST",
      token: token || undefined,
      body: JSON.stringify({ newPassword }),
    })
  }, [token])

  const addProposal: DataContextType["addProposal"] = useCallback(async (proposal) => {
    const created = await apiRequest<Proposal>("/proposals", {
      method: "POST",
      token: token || undefined,
      body: JSON.stringify(proposal),
    })
    await refreshAll()
    return created
  }, [token, refreshAll])

  const updateProposal: DataContextType["updateProposal"] = useCallback(async (id, updates) => {
    const payload = {
      title: updates.title,
      abstract: updates.abstract,
      objectives: updates.objectives,
      methodology: updates.methodology,
      timeline: updates.timeline,
      budget: updates.budget,
      facultyAdvisor: updates.facultyAdvisor,
      projectId: updates.projectId,
      status: updates.status,
    }
    const updated = await apiRequest<Proposal>(`/proposals/${id}`, {
      method: "PATCH",
      token: token || undefined,
      body: JSON.stringify(payload),
    })
    await refreshAll()
    return updated
  }, [token, refreshAll])

  const updateProposalStatus: DataContextType["updateProposalStatus"] = useCallback(async (id, status, comment) => {
    if (status === "submitted") {
      const updated = await updateProposal(id, { status })
      return updated
    }

    const decisionMap: Record<string, "approve" | "reject" | "revision_required"> = {
      approved: "approve",
      rejected: "reject",
      revision_required: "revision_required",
    }
    const updated = await apiRequest<Proposal>(`/proposals/${id}/review`, {
      method: "POST",
      token: token || undefined,
      body: JSON.stringify({
        decision: decisionMap[status],
        comment: comment?.comment || "",
      }),
    })
    await refreshAll()
    return updated
  }, [token, updateProposal, refreshAll])

  const addProject: DataContextType["addProject"] = useCallback(async (project) => {
    const created = await apiRequest<Project>("/projects", {
      method: "POST",
      token: token || undefined,
      body: JSON.stringify(project),
    })
    await refreshAll()
    return created
  }, [token, refreshAll])

  const updateProject: DataContextType["updateProject"] = useCallback(async (id, updates) => {
    const payload = {
      title: updates.title,
      description: updates.description,
      status: updates.status,
      progress: updates.progress,
      startDate: updates.startDate,
      endDate: updates.endDate,
      leadResearcher: updates.leadResearcher,
      facultyAdvisor: updates.facultyAdvisor,
      department: updates.department,
      teamMembers: updates.teamMembers,
      milestoneUpdates: updates.milestones,
    }
    const updated = await apiRequest<Project>(`/projects/${id}`, {
      method: "PATCH",
      token: token || undefined,
      body: JSON.stringify(payload),
    })
    await refreshAll()
    return updated
  }, [token, refreshAll])

  const addProgressUpdate: DataContextType["addProgressUpdate"] = useCallback(async (update) => {
    const created = await apiRequest<ProgressUpdate>(`/projects/${update.projectId}/progress`, {
      method: "POST",
      token: token || undefined,
      body: JSON.stringify({ content: update.content }),
    })
    await refreshAll()
    return created
  }, [token, refreshAll])

  const addProjectApplication: DataContextType["addProjectApplication"] = useCallback(async (application) => {
    const created = await apiRequest<ProjectApplication>(`/projects/${application.projectId}/applications`, {
      method: "POST",
      token: token || undefined,
      body: JSON.stringify({ coverLetter: application.coverLetter }),
    })
    await refreshAll()
    return created
  }, [token, refreshAll])

  const updateApplicationStatus: DataContextType["updateApplicationStatus"] = useCallback(async (id, status) => {
    const updated = await apiRequest<ProjectApplication>(`/applications/${id}`, {
      method: "PATCH",
      token: token || undefined,
      body: JSON.stringify({ status }),
    })
    await refreshAll()
    return updated
  }, [token, refreshAll])

  const addAuditLog: DataContextType["addAuditLog"] = useCallback(async (log) => {
    if (!token) return null
    const created = await apiRequest<AuditLog>("/audit-logs", {
      method: "POST",
      token,
      body: JSON.stringify(log),
    })
    if (user?.role === "admin") {
      await refreshAll()
    }
    return created
  }, [token, user, refreshAll])

  const value = useMemo(
    () => ({
      users,
      proposals,
      projects,
      progressUpdates,
      projectApplications,
      departments,
      auditLogs,
      facultyList: users.filter((candidate) => candidate.role === "faculty"),
      statistics,
      isLoading,
      refreshAll,
      addUser,
      updateUser,
      resetUserPassword,
      deleteUser,
      addProposal,
      updateProposal,
      updateProposalStatus,
      addProject,
      updateProject,
      addProgressUpdate,
      addProjectApplication,
      updateApplicationStatus,
      addAuditLog,
    }),
    [
      users,
      proposals,
      projects,
      progressUpdates,
      projectApplications,
      departments,
      auditLogs,
      statistics,
      isLoading,
      refreshAll,
      addUser,
      updateUser,
      resetUserPassword,
      deleteUser,
      addProposal,
      updateProposal,
      updateProposalStatus,
      addProject,
      updateProject,
      addProgressUpdate,
      addProjectApplication,
      updateApplicationStatus,
      addAuditLog,
    ]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
