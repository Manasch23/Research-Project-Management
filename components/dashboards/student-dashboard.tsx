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
  TrendingUp,
} from "lucide-react";

const statusConfig = {
  draft: { label: "Draft", variant: "secondary" as const, icon: FileText },
  submitted: { label: "Submitted", variant: "default" as const, icon: Clock },
  under_review: { label: "Under Review", variant: "default" as const, icon: Clock },
  approved: { label: "Approved", variant: "default" as const, icon: CheckCircle2 },
  rejected: { label: "Rejected", variant: "destructive" as const, icon: AlertCircle },
  revision_required: { label: "Revision Required", variant: "destructive" as const, icon: AlertCircle },
};

export function StudentDashboard() {
  const { user } = useAuth();
  const { proposals, projects } = useData();

  if (!user) return null;

  const myProposals = proposals.filter((p) => p.submittedBy === user.id);
  const myProjects = projects.filter(
    (p) => p.teamMembers.includes(user.id) || p.leadResearcher === user.id
  );

  const pendingProposals = myProposals.filter(
    (p) => p.status === "submitted" || p.status === "under_review"
  );
  const approvedProposals = myProposals.filter((p) => p.status === "approved");
  const activeProjects = myProjects.filter((p) => p.status === "in_progress");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Welcome back, {user.name.split(" ")[0]}
        </h2>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your research activities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Proposals
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {myProposals.length}
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
                  Pending Review
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {pendingProposals.length}
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
                  Approved
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {approvedProposals.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-accent" />
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
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Proposals</CardTitle>
              <CardDescription>Your latest research proposals</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/proposals">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {myProposals.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  No proposals yet
                </p>
                <Button asChild>
                  <Link href="/dashboard/proposals?new=1">
                    Create Your First Proposal
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {myProposals.slice(0, 4).map((proposal) => {
                  const config = statusConfig[proposal.status];
                  return (
                    <div
                      key={proposal.id}
                      className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border bg-card"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-foreground truncate">
                          {proposal.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Budget: ${proposal.budget.toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={config.variant} className="shrink-0">
                        {config.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Projects</CardTitle>
              <CardDescription>Track your research progress</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/projects">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {myProjects.length === 0 ? (
              <div className="text-center py-8">
                <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  No active projects
                </p>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/browse">Browse Open Projects</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {myProjects.slice(0, 3).map((project) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {project.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Advisor: {project.facultyAdvisorName}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium text-accent shrink-0">
                        <TrendingUp className="w-4 h-4" />
                        {project.progress}%
                      </div>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>
                        {project.milestones.filter((m) => m.completed).length}/
                        {project.milestones.length} milestones
                      </span>
                      <span>Due: {new Date(project.endDate).toLocaleDateString()}</span>
                    </div>
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
