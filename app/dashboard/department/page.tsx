"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { Suspense } from "react";
import Loading from "./loading";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  FolderKanban,
  Calendar,
  Users,
  TrendingUp,
} from "lucide-react";
import type { Project, ProjectStatus } from "@/lib/types";

const statusConfig: Record<ProjectStatus, { label: string; color: string }> = {
  not_started: { label: "Not Started", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", color: "bg-chart-1/10 text-chart-1" },
  on_hold: { label: "On Hold", color: "bg-chart-3/10 text-chart-3" },
  completed: { label: "Completed", color: "bg-accent/10 text-accent" },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive" },
  open: { label: "Open", color: "bg-primary/10 text-primary" },
};

export default function DepartmentProjectsPage() {
  const { user } = useAuth();
  const { projects, progressUpdates } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  if (!user) return null;

  const departmentProjects = projects.filter(
    (p) => p.department === user.department
  );

  const filteredProjects = departmentProjects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.leadResearcherName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.facultyAdvisorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getProjectUpdates = (projectId: string) =>
    progressUpdates
      .filter((u) => u.projectId === projectId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Department Projects
          </h2>
          <p className="text-muted-foreground">
            Overview of all research projects in {user.department}
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, researcher, or advisor..."
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
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No projects found</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Lead Researcher</TableHead>
                      <TableHead>Advisor</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => {
                      const config = statusConfig[project.status];
                      return (
                        <TableRow key={project.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{project.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {project.teamMembers.length} team members
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{project.leadResearcherName}</TableCell>
                          <TableCell>{project.facultyAdvisorName}</TableCell>
                          <TableCell>
                            <div className="w-32">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">
                                  {project.progress}%
                                </span>
                              </div>
                              <Progress value={project.progress} className="h-2" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={config.color}>{config.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedProject(project)}
                            >
                              View Details
                            </Button>
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

        <Dialog
          open={!!selectedProject}
          onOpenChange={(open) => !open && setSelectedProject(null)}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProject?.title}</DialogTitle>
              <DialogDescription>
                {selectedProject?.description}
              </DialogDescription>
            </DialogHeader>
            {selectedProject && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge className={statusConfig[selectedProject.status].color}>
                        {statusConfig[selectedProject.status].label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Progress</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Progress
                        value={selectedProject.progress}
                        className="h-2 flex-1"
                      />
                      <span className="text-sm font-medium">
                        {selectedProject.progress}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Lead Researcher</Label>
                    <p className="mt-1 font-medium">
                      {selectedProject.leadResearcherName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Faculty Advisor</Label>
                    <p className="mt-1 font-medium">
                      {selectedProject.facultyAdvisorName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(selectedProject.startDate).toLocaleDateString()} -{" "}
                      {new Date(selectedProject.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {selectedProject.teamMemberNames.join(", ")}
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Milestones</Label>
                  <div className="mt-2 space-y-2">
                    {selectedProject.milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border"
                      >
                        <div>
                          <p
                            className={`font-medium text-sm ${
                              milestone.completed
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {milestone.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(milestone.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={milestone.completed ? "default" : "secondary"}>
                          {milestone.completed ? "Completed" : "Pending"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Recent Updates</Label>
                  <div className="mt-2 space-y-2">
                    {getProjectUpdates(selectedProject.id).length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No updates yet
                      </p>
                    ) : (
                      getProjectUpdates(selectedProject.id)
                        .slice(0, 3)
                        .map((update) => (
                          <div
                            key={update.id}
                            className="p-3 rounded-lg bg-muted"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">
                                {update.submittedByName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(update.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {update.content}
                            </p>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Suspense>
  );
}
