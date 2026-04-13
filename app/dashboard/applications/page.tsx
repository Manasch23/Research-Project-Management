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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
} from "lucide-react";
import type { ProjectApplication } from "@/lib/types";

export default function ApplicationsPage() {
  const { user } = useAuth();
  const { projects, projectApplications, updateApplicationStatus, updateProject, users, addAuditLog } =
    useData();
  const [selectedApplication, setSelectedApplication] =
    useState<ProjectApplication | null>(null);

  if (!user) return null;

  // Get projects this faculty advises
  const myProjects = projects.filter((p) => p.facultyAdvisor === user.id);
  const myProjectIds = myProjects.map((p) => p.id);

  // Get applications for my projects
  const applications = projectApplications.filter((a) =>
    myProjectIds.includes(a.projectId)
  );

  const pendingApplications = applications.filter(
    (a) => a.status === "pending"
  );
  const processedApplications = applications.filter(
    (a) => a.status !== "pending"
  );

  const handleDecision = (
    applicationId: string,
    decision: "accepted" | "rejected"
  ) => {
    const application = applications.find((a) => a.id === applicationId);
    if (!application) return;

    updateApplicationStatus(applicationId, decision);

    if (decision === "accepted") {
      const project = projects.find((p) => p.id === application.projectId);
      if (project) {
        const applicant = users.find((u) => u.id === application.applicantId);
        updateProject(project.id, {
          teamMembers: [...project.teamMembers, application.applicantId],
          teamMemberNames: [
            ...project.teamMemberNames,
            applicant?.name || application.applicantName,
          ],
        });
      }
    }

    addAuditLog({
      userId: user.id,
      userName: user.name,
      action: `APPLICATION_${decision.toUpperCase()}`,
      details: `${decision === "accepted" ? "Accepted" : "Rejected"} ${
        application.applicantName
      }'s application for ${application.projectTitle}`,
    });

    setSelectedApplication(null);
  };

  const ApplicationCard = ({
    application,
    showActions = false,
  }: {
    application: ProjectApplication;
    showActions?: boolean;
  }) => {
    const project = myProjects.find((p) => p.id === application.projectId);

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">
                {application.applicantName}
              </CardTitle>
              <CardDescription>
                Applied to: {application.projectTitle}
              </CardDescription>
            </div>
            <Badge
              variant={
                application.status === "pending"
                  ? "secondary"
                  : application.status === "accepted"
                  ? "default"
                  : "destructive"
              }
            >
              {application.status.charAt(0).toUpperCase() +
                application.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {application.coverLetter}
          </p>

          <div className="text-sm text-muted-foreground mb-4">
            Applied on:{" "}
            {new Date(application.createdAt).toLocaleDateString()}
          </div>

          {showActions && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => setSelectedApplication(application)}
              >
                Review
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Project Applications
        </h2>
        <p className="text-muted-foreground">
          Review applications from students wanting to join your projects
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingApplications.length})
          </TabsTrigger>
          <TabsTrigger value="processed" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Processed ({processedApplications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingApplications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <UserPlus className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">
                  No pending applications
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {pendingApplications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  showActions
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="processed" className="mt-6">
          {processedApplications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">
                  No processed applications
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {processedApplications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!selectedApplication}
        onOpenChange={(open) => !open && setSelectedApplication(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
            <DialogDescription>
              {selectedApplication?.applicantName}&apos;s application for{" "}
              {selectedApplication?.projectTitle}
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {selectedApplication.applicantName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Applied{" "}
                    {new Date(
                      selectedApplication.createdAt
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Cover Letter
                </p>
                <p className="text-sm bg-card border border-border rounded-lg p-4">
                  {selectedApplication.coverLetter}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1"
                  onClick={() =>
                    handleDecision(selectedApplication.id, "accepted")
                  }
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() =>
                    handleDecision(selectedApplication.id, "rejected")
                  }
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
