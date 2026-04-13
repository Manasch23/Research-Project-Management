"use client";

import React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit,
  Send,
  Users,
  Calendar,
  Building2,
  GraduationCap,
} from "lucide-react";
import type { ProposalStatus, Project } from "@/lib/types";

const statusConfig: Record<
  ProposalStatus,
  { label: string; variant: "default" | "secondary" | "destructive"; icon: React.ComponentType<{ className?: string }> }
> = {
  draft: { label: "Draft", variant: "secondary", icon: FileText },
  submitted: { label: "Submitted", variant: "default", icon: Clock },
  under_review: { label: "Under Review", variant: "default", icon: Clock },
  approved: { label: "Approved", variant: "default", icon: CheckCircle2 },
  rejected: { label: "Rejected", variant: "destructive", icon: AlertCircle },
  revision_required: { label: "Revision Required", variant: "destructive", icon: AlertCircle },
};

const Loading = () => null;

export default function ProposalsPage() {
  const { user } = useAuth();
  const { proposals, addProposal, updateProposal, users, projects, addAuditLog } = useData();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    abstract: "",
    objectives: "",
    methodology: "",
    timeline: "",
    budget: "",
    facultyAdvisor: "",
    projectId: "",
  });

  const searchParams = useSearchParams();

  const shouldOpenNew = searchParams.get("new") === "1";
  const isCoordinator = user?.role === "coordinator";

  React.useEffect(() => {
    if (shouldOpenNew && !isCoordinator) {
      setIsCreateOpen(true);
    }
  }, [shouldOpenNew, isCoordinator]);

  if (!user) return null;
  const myProposals = isCoordinator
    ? proposals.filter((p) => p.department === user.department)
    : proposals.filter((p) => p.submittedBy === user.id);

  const filteredProposals = myProposals.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.abstract.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const facultyUsers = users.filter((u) => u.role === "faculty");
  
  // Get available projects (open for applications)
  const availableProjects = projects.filter(
    (p) => p.status === "open" || p.status === "in_progress"
  );

  // Filter projects for display
  const filteredProjects = availableProjects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(projectSearchQuery.toLowerCase());
    const matchesDepartment = departmentFilter === "all" || p.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  // Get unique departments from projects
  const departments = Array.from(new Set(availableProjects.map((p) => p.department)));

  const hydrateFormFromProposal = (proposalId: string) => {
    const proposal = proposals.find((candidate) => candidate.id === proposalId);
    if (!proposal) return;
    setEditingProposalId(proposal.id);
    setSelectedProject(projects.find((project) => project.id === proposal.projectId) || null);
    setFormData({
      title: proposal.title,
      abstract: proposal.abstract,
      objectives: proposal.objectives,
      methodology: proposal.methodology,
      timeline: proposal.timeline,
      budget: String(proposal.budget),
      facultyAdvisor: proposal.facultyAdvisor || "",
      projectId: proposal.projectId || "",
    });
    setIsCreateOpen(true);
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      ...formData,
      title: `Research Proposal for: ${project.title}`,
      projectId: project.id,
      facultyAdvisor: project.facultyAdvisor,
    });
  };

  const handleCreateProposal = async () => {
    if (!formData.title || !formData.abstract) return;
    setError("");
    setIsSaving(true);

    const advisor = facultyUsers.find((u) => u.id === formData.facultyAdvisor);
    try {
      if (editingProposalId) {
        await updateProposal(editingProposalId, {
          title: formData.title,
          abstract: formData.abstract,
          objectives: formData.objectives,
          methodology: formData.methodology,
          timeline: formData.timeline,
          budget: Number.parseFloat(formData.budget) || 0,
          facultyAdvisor: formData.facultyAdvisor || undefined,
          facultyAdvisorName: advisor?.name,
          projectId: formData.projectId || undefined,
        });
        await addAuditLog({
          action: "PROPOSAL_UPDATED",
          details: `Updated proposal: ${formData.title}`,
        });
      } else {
        await addProposal({
          title: formData.title,
          abstract: formData.abstract,
          objectives: formData.objectives,
          methodology: formData.methodology,
          timeline: formData.timeline,
          budget: Number.parseFloat(formData.budget) || 0,
          status: "draft",
          submittedBy: user.id,
          submittedByName: user.name,
          department: user.department,
          facultyAdvisor: formData.facultyAdvisor || undefined,
          facultyAdvisorName: advisor?.name,
          projectId: formData.projectId || undefined,
        });
        await addAuditLog({
          action: "PROPOSAL_CREATED",
          details: `Created proposal: ${formData.title}`,
        });
      }

      resetForm();
      setIsCreateOpen(false);
      router.replace("/dashboard/proposals");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to save proposal.")
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitProposal = async (proposalId: string) => {
    setError("");
    const proposal = proposals.find((p) => p.id === proposalId);
    try {
      await updateProposal(proposalId, { status: "submitted" });
      await addAuditLog({
        action: "PROPOSAL_SUBMITTED",
        details: `Submitted proposal: ${proposal?.title || "Untitled proposal"}`,
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to submit proposal.")
    }
  };

  const viewProposal = proposals.find((p) => p.id === selectedProposal);

  const resetForm = () => {
    setEditingProposalId(null);
    setError("");
    setFormData({
      title: "",
      abstract: "",
      objectives: "",
      methodology: "",
      timeline: "",
      budget: "",
      facultyAdvisor: "",
      projectId: "",
    });
    setSelectedProject(null);
    setProjectSearchQuery("");
    setDepartmentFilter("all");
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {isCoordinator ? "Department Proposals" : "My Proposals"}
            </h2>
            <p className="text-muted-foreground">
              {isCoordinator
                ? "View and manage proposals from your department"
                : "Manage your research proposals"}
            </p>
          </div>
          {!isCoordinator && (
            <Dialog open={isCreateOpen} onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) {
                resetForm();
                router.replace("/dashboard/proposals");
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Proposal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProposalId ? "Edit Draft Proposal" : "Create New Proposal"}</DialogTitle>
                  <DialogDescription>
                    Select a project or create an independent research proposal
                  </DialogDescription>
                </DialogHeader>
                {error && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                
                <Tabs defaultValue="projects" className="mt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="projects">Available Projects</TabsTrigger>
                    <TabsTrigger value="custom">Custom Proposal</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="projects" className="space-y-4">
                    {/* Project Search and Filter */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search projects..."
                          className="pl-9"
                          value={projectSearchQuery}
                          onChange={(e) => setProjectSearchQuery(e.target.value)}
                        />
                      </div>
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Projects Grid */}
                    <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2">
                      {filteredProjects.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                          <p>No projects found matching your criteria</p>
                        </div>
                      ) : (
                        filteredProjects.map((project) => (
                          <Card
                            key={project.id}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              selectedProject?.id === project.id
                                ? "ring-2 ring-primary bg-primary/5"
                                : "hover:bg-muted/50"
                            }`}
                            onClick={() => handleSelectProject(project)}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <CardTitle className="text-base">{project.title}</CardTitle>
                                  <CardDescription className="line-clamp-2">
                                    {project.description}
                                  </CardDescription>
                                </div>
                                <Badge variant={project.status === "open" ? "default" : "secondary"}>
                                  {project.status === "open" ? "Open" : "In Progress"}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Building2 className="w-4 h-4" />
                                  {project.department}
                                </div>
                                <div className="flex items-center gap-1">
                                  <GraduationCap className="w-4 h-4" />
                                  {project.facultyAdvisorName}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {project.teamMembers.length} team member(s)
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>

                    {/* Selected Project Form */}
                    {selectedProject && (
                      <div className="border-t pt-4 space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <CheckCircle2 className="w-4 h-4" />
                          Selected: {selectedProject.title}
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="abstract">Your Research Abstract</Label>
                            <Textarea
                              id="abstract"
                              placeholder="Describe your research approach and what you plan to contribute..."
                              rows={3}
                              value={formData.abstract}
                              onChange={(e) =>
                                setFormData({ ...formData, abstract: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="objectives">Your Objectives</Label>
                            <Textarea
                              id="objectives"
                              placeholder="What specific goals do you want to achieve in this project?"
                              rows={3}
                              value={formData.objectives}
                              onChange={(e) =>
                                setFormData({ ...formData, objectives: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="methodology">Proposed Methodology</Label>
                            <Textarea
                              id="methodology"
                              placeholder="How do you plan to approach this research?"
                              rows={3}
                              value={formData.methodology}
                              onChange={(e) =>
                                setFormData({ ...formData, methodology: e.target.value })
                              }
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="timeline">Your Timeline</Label>
                              <Input
                                id="timeline"
                                placeholder="e.g., 6 months"
                                value={formData.timeline}
                                onChange={(e) =>
                                  setFormData({ ...formData, timeline: e.target.value })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="budget">Requested Budget ($)</Label>
                              <Input
                                id="budget"
                                type="number"
                                placeholder="5000"
                                value={formData.budget}
                                onChange={(e) =>
                                  setFormData({ ...formData, budget: e.target.value })
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                          <Button variant="outline" onClick={resetForm}>
                            Clear Selection
                          </Button>
                          <Button onClick={handleCreateProposal} disabled={!formData.abstract || isSaving}>
                            {isSaving ? "Saving..." : editingProposalId ? "Save Draft" : "Create Proposal"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="custom" className="space-y-4">
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="custom-title">Proposal Title</Label>
                        <Input
                          id="custom-title"
                          placeholder="Research proposal title"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value, projectId: "" })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="custom-abstract">Abstract</Label>
                        <Textarea
                          id="custom-abstract"
                          placeholder="Brief summary of your research"
                          rows={3}
                          value={formData.abstract}
                          onChange={(e) =>
                            setFormData({ ...formData, abstract: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="custom-objectives">Objectives</Label>
                        <Textarea
                          id="custom-objectives"
                          placeholder="List your research objectives"
                          rows={3}
                          value={formData.objectives}
                          onChange={(e) =>
                            setFormData({ ...formData, objectives: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="custom-methodology">Methodology</Label>
                        <Textarea
                          id="custom-methodology"
                          placeholder="Describe your research methodology"
                          rows={3}
                          value={formData.methodology}
                          onChange={(e) =>
                            setFormData({ ...formData, methodology: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="custom-timeline">Timeline</Label>
                          <Input
                            id="custom-timeline"
                            placeholder="e.g., 12 months"
                            value={formData.timeline}
                            onChange={(e) =>
                              setFormData({ ...formData, timeline: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="custom-budget">Budget ($)</Label>
                          <Input
                            id="custom-budget"
                            type="number"
                            placeholder="25000"
                            value={formData.budget}
                            onChange={(e) =>
                              setFormData({ ...formData, budget: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="custom-advisor">Faculty Advisor</Label>
                        <Select
                          value={formData.facultyAdvisor}
                          onValueChange={(value) =>
                            setFormData({ ...formData, facultyAdvisor: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an advisor" />
                          </SelectTrigger>
                          <SelectContent>
                            {facultyUsers.map((faculty) => (
                              <SelectItem key={faculty.id} value={faculty.id}>
                                {faculty.name} - {faculty.department}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsCreateOpen(false)
                            resetForm()
                            router.replace("/dashboard/proposals")
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleCreateProposal} disabled={!formData.title || !formData.abstract || isSaving}>
                          {isSaving ? "Saving..." : editingProposalId ? "Save Draft" : "Create Proposal"}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search proposals..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="revision_required">Revision Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProposals.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No proposals found</p>
                {!isCoordinator && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Click &quot;Create Proposal&quot; to get started
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      {isCoordinator && <TableHead>Submitted By</TableHead>}
                      <TableHead>Budget</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProposals.map((proposal) => {
                      const config = statusConfig[proposal.status];
                      return (
                        <TableRow key={proposal.id}>
                          <TableCell>
                            <div className="font-medium">{proposal.title}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {proposal.abstract}
                            </div>
                          </TableCell>
                          {isCoordinator && (
                            <TableCell>{proposal.submittedByName}</TableCell>
                          )}
                          <TableCell>
                            ${proposal.budget.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={config.variant}>{config.label}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(proposal.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedProposal(proposal.id);
                                  setIsViewOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              {!isCoordinator && proposal.status === "draft" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => hydrateFormFromProposal(proposal.id)}
                                  >
                                    <Edit className="w-4 h-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleSubmitProposal(proposal.id)}
                                  >
                                    <Send className="w-4 h-4" />
                                    <span className="sr-only">Submit</span>
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewProposal?.title}</DialogTitle>
              <DialogDescription>
                Submitted by {viewProposal?.submittedByName}
              </DialogDescription>
            </DialogHeader>
            {viewProposal && (
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge variant={statusConfig[viewProposal.status].variant}>
                      {statusConfig[viewProposal.status].label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Abstract</Label>
                  <p className="mt-1 text-foreground">{viewProposal.abstract}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Objectives</Label>
                  <p className="mt-1 text-foreground whitespace-pre-line">
                    {viewProposal.objectives}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Methodology</Label>
                  <p className="mt-1 text-foreground whitespace-pre-line">
                    {viewProposal.methodology}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Timeline</Label>
                    <p className="mt-1 text-foreground">{viewProposal.timeline}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Budget</Label>
                    <p className="mt-1 text-foreground">
                      ${viewProposal.budget.toLocaleString()}
                    </p>
                  </div>
                </div>
                {viewProposal.facultyAdvisorName && (
                  <div>
                    <Label className="text-muted-foreground">Faculty Advisor</Label>
                    <p className="mt-1 text-foreground">
                      {viewProposal.facultyAdvisorName}
                    </p>
                  </div>
                )}
                {viewProposal.reviewComments &&
                  viewProposal.reviewComments.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Review Comments</Label>
                      <div className="mt-2 space-y-3">
                        {viewProposal.reviewComments.map((comment) => (
                          <div
                            key={comment.id}
                            className="p-3 rounded-lg bg-muted border border-border"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">
                                {comment.reviewerName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-foreground">
                              {comment.comment}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Suspense>
  );
}
