"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { Suspense } from "react";
import Loading from "./loading"; // Import the loading component
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Calendar,
  Users,
  Building2,
  Send,
  CheckCircle,
} from "lucide-react";

export default function BrowseProjectsPage() {
  const { user } = useAuth();
  const { projects, projectApplications, addProjectApplication, addAuditLog } =
    useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState("");

  if (!user) return null;
  if (user.role !== "student") {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">
          You don&apos;t have permission to access this page.
        </p>
      </div>
    );
  }

  // Filter projects that are open for applications or in progress
  const openProjects = projects.filter(
    (p) =>
      (p.status === "open" || p.status === "in_progress") &&
      !p.teamMembers.includes(user.id) &&
      p.leadResearcher !== user.id
  );

  const filteredProjects = openProjects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasApplied = (projectId: string) =>
    projectApplications.some(
      (a) => a.projectId === projectId && a.applicantId === user.id
    );

  const handleApply = () => {
    if (!selectedProject || !coverLetter.trim()) return;

    const project = projects.find((p) => p.id === selectedProject);
    if (!project) return;

    addProjectApplication({
      projectId: selectedProject,
      projectTitle: project.title,
      applicantId: user.id,
      applicantName: user.name,
      coverLetter,
      status: "pending",
    });

    addAuditLog({
      userId: user.id,
      userName: user.name,
      action: "PROJECT_APPLICATION",
      details: `Applied to join project: ${project.title}`,
    });

    setCoverLetter("");
    setSelectedProject(null);
  };

  const selectedProjectData = projects.find((p) => p.id === selectedProject);

  return (
    <Suspense fallback={<Loading />}> {/* Wrap the main content in Suspense */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Browse Projects</h2>
          <p className="text-muted-foreground">
            Find and apply to join ongoing research projects
          </p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects by title, description, or department..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">
                No open projects found matching your search
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredProjects.map((project) => {
              const applied = hasApplied(project.id);

              return (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {project.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {project.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {project.department}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {new Date(project.endDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {project.teamMembers.length} members
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Faculty Advisor
                        </p>
                        <p className="text-sm font-medium">
                          {project.facultyAdvisorName}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Lead Researcher
                        </p>
                        <p className="text-sm font-medium">
                          {project.leadResearcherName}
                        </p>
                      </div>

                      {applied ? (
                        <Button disabled className="w-full">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Application Submitted
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() => setSelectedProject(project.id)}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Apply to Join
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog
          open={!!selectedProject}
          onOpenChange={(open) => !open && setSelectedProject(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply to Project</DialogTitle>
              <DialogDescription>
                Submit your application to join {selectedProjectData?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="coverLetter">Cover Letter</Label>
                <Textarea
                  id="coverLetter"
                  placeholder="Explain why you want to join this project and what skills you can contribute..."
                  rows={6}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedProject(null)}>
                  Cancel
                </Button>
                <Button onClick={handleApply} disabled={!coverLetter.trim()}>
                  Submit Application
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Suspense>
  );
}
