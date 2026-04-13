"use client";

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
import Link from "next/link";
import {
  FileText,
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  UserPlus,
} from "lucide-react";

export function FacultyDashboard() {
  const { user } = useAuth();
  const { proposals, projects, projectApplications } = useData();

  if (!user) return null;

  // Proposals awaiting this faculty's review
  const pendingReview = proposals.filter(
    (p) =>
      p.facultyAdvisor === user.id &&
      (p.status === "submitted" || p.status === "under_review")
  );

  // All proposals this faculty is advising
  const myAdvisedProposals = proposals.filter(
    (p) => p.facultyAdvisor === user.id
  );

  // Projects this faculty is advising
  const myProjects = projects.filter((p) => p.facultyAdvisor === user.id);
  const activeProjects = myProjects.filter((p) => p.status === "in_progress");

  // Pending applications for projects this faculty advises
  const pendingApplications = projectApplications.filter(
    (a) =>
      a.status === "pending" &&
      myProjects.some((p) => p.id === a.projectId)
  );

  const recentProposals = [...myAdvisedProposals]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Welcome, {user.name}
        </h2>
        <p className="text-muted-foreground">
          Review proposals and monitor your research projects
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Review
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {pendingReview.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-chart-3/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Advised Proposals
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {myAdvisedProposals.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Projects
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {activeProjects.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-chart-1/10 flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-chart-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Applications
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {pendingApplications.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {pendingReview.length > 0 && (
        <Card className="border-chart-3/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-chart-3" />
              <CardTitle className="text-lg">Requires Your Attention</CardTitle>
            </div>
            <CardDescription>
              {pendingReview.length} proposal(s) waiting for your review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingReview.slice(0, 3).map((proposal) => (
                <div
                  key={proposal.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border bg-card"
                >
                  <div className="min-w-0">
                    <h4 className="font-medium text-foreground truncate">
                      {proposal.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      By {proposal.submittedByName} | Budget: $
                      {proposal.budget.toLocaleString()}
                    </p>
                  </div>
                  <Button size="sm" asChild>
                    <Link href="/dashboard/review">Review</Link>
                  </Button>
                </div>
              ))}
            </div>
            {pendingReview.length > 3 && (
              <Button variant="outline" className="w-full mt-4 bg-transparent" asChild>
                <Link href="/dashboard/review">
                  View All {pendingReview.length} Proposals
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Proposals</CardTitle>
              <CardDescription>Latest proposals you&apos;re advising</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/review">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentProposals.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No proposals assigned yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-foreground truncate">
                        {proposal.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {proposal.submittedByName}
                      </p>
                    </div>
                    <Badge
                      variant={
                        proposal.status === "approved"
                          ? "default"
                          : proposal.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {proposal.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Projects</CardTitle>
              <CardDescription>Projects under your supervision</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/projects">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {activeProjects.length === 0 ? (
              <div className="text-center py-8">
                <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No active projects
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeProjects.slice(0, 3).map((project) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-lg border border-border"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {project.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Lead: {project.leadResearcherName}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-accent">
                        {project.progress}%
                      </span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
