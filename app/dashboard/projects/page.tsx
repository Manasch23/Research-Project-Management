"use client";

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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FolderKanban,
  Calendar,
  Users,
  CheckCircle2,
  Circle,
  MessageSquare,
  Plus,
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

export default function ProjectsPage() {
  const { user } = useAuth();
  const { projects, progressUpdates, addProgressUpdate, updateProject, addAuditLog } =
    useData();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updateContent, setUpdateContent] = useState("");

  if (!user) return null;

  const myProjects = projects.filter(
    (p) => p.teamMembers.includes(user.id) || p.leadResearcher === user.id
  );

  const handleAddUpdate = () => {
    if (!selectedProject || !updateContent.trim()) return;

    addProgressUpdate({
      projectId: selectedProject.id,
      submittedBy: user.id,
      submittedByName: user.name,
      content: updateContent,
    });

    addAuditLog({
      userId: user.id,
      userName: user.name,
      action: "PROGRESS_UPDATE",
      details: `Submitted progress update for project: ${selectedProject.title}`,
    });

    setUpdateContent("");
    setIsUpdateOpen(false);
  };

  const handleToggleMilestone = (projectId: string, milestoneId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const updatedMilestones = project.milestones.map((m) =>
      m.id === milestoneId
        ? {
            ...m,
            completed: !m.completed,
            completedAt: !m.completed ? new Date().toISOString() : undefined,
          }
        : m
    );

    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const progress = Math.round((completedCount / updatedMilestones.length) * 100);

    updateProject(projectId, {
      milestones: updatedMilestones,
      progress,
    });
  };

  const getProjectUpdates = (projectId: string) =>
    progressUpdates.filter((u) => u.projectId === projectId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">My Projects</h2>
        <p className="text-muted-foreground">
          Track and manage your research projects
        </p>
      </div>

      {myProjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground mb-4">
              You don&apos;t have any active projects yet
            </p>
            <Button variant="outline">Browse Open Projects</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {myProjects.map((project) => {
            const config = statusConfig[project.status];
            const updates = getProjectUpdates(project.id);

            return (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{project.title}</CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </div>
                    <Badge className={config.color}>{config.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="milestones">Milestones</TabsTrigger>
                      <TabsTrigger value="updates">
                        Updates ({updates.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-muted-foreground">
                              Progress
                            </Label>
                            <div className="mt-2">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">
                                  {project.progress}% Complete
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {
                                    project.milestones.filter((m) => m.completed)
                                      .length
                                  }
                                  /{project.milestones.length} milestones
                                </span>
                              </div>
                              <Progress value={project.progress} className="h-2" />
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {new Date(project.startDate).toLocaleDateString()}{" "}
                                - {new Date(project.endDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label className="text-muted-foreground">
                              Faculty Advisor
                            </Label>
                            <p className="mt-1">{project.facultyAdvisorName}</p>
                          </div>

                          <div>
                            <Label className="text-muted-foreground">
                              Team Members
                            </Label>
                            <div className="mt-1 flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span>{project.teamMemberNames.join(", ")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="milestones" className="mt-4">
                      <div className="space-y-3">
                        {project.milestones.map((milestone) => (
                          <div
                            key={milestone.id}
                            className="flex items-start gap-3 p-4 rounded-lg border border-border"
                          >
                            <Checkbox
                              id={milestone.id}
                              checked={milestone.completed}
                              onCheckedChange={() =>
                                handleToggleMilestone(project.id, milestone.id)
                              }
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <label
                                htmlFor={milestone.id}
                                className={`font-medium cursor-pointer ${
                                  milestone.completed
                                    ? "line-through text-muted-foreground"
                                    : "text-foreground"
                                }`}
                              >
                                {milestone.title}
                              </label>
                              <p className="text-sm text-muted-foreground mt-1">
                                {milestone.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>
                                  Due:{" "}
                                  {new Date(milestone.dueDate).toLocaleDateString()}
                                </span>
                                {milestone.completed && milestone.completedAt && (
                                  <span className="text-accent">
                                    Completed:{" "}
                                    {new Date(
                                      milestone.completedAt
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            {milestone.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="updates" className="mt-4">
                      <div className="space-y-4">
                        <Button
                          onClick={() => {
                            setSelectedProject(project);
                            setIsUpdateOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Update
                        </Button>

                        {updates.length === 0 ? (
                          <div className="text-center py-8">
                            <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                            <p className="text-sm text-muted-foreground">
                              No updates yet
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {updates.map((update) => (
                              <div
                                key={update.id}
                                className="p-4 rounded-lg border border-border"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-sm">
                                    {update.submittedByName}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(update.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground">
                                  {update.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Progress Update</DialogTitle>
            <DialogDescription>
              Share your progress on {selectedProject?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="update">Update</Label>
              <Textarea
                id="update"
                placeholder="Describe your progress..."
                rows={4}
                value={updateContent}
                onChange={(e) => setUpdateContent(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsUpdateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUpdate}>Submit Update</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
