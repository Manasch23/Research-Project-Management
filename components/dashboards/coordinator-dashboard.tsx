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
  Users,
  TrendingUp,
  ArrowRight,
  Building2,
  DollarSign,
} from "lucide-react";

export function CoordinatorDashboard() {
  const { user } = useAuth();
  const { proposals, projects, users } = useData();

  if (!user) return null;

  // Filter by department
  const departmentProposals = proposals.filter(
    (p) => p.department === user.department
  );
  const departmentProjects = projects.filter(
    (p) => p.department === user.department
  );
  const departmentUsers = users.filter(
    (u) => u.department === user.department && u.role !== "admin"
  );

  const pendingProposals = departmentProposals.filter(
    (p) => p.status === "submitted" || p.status === "under_review"
  );
  const approvedProposals = departmentProposals.filter(
    (p) => p.status === "approved"
  );
  const activeProjects = departmentProjects.filter(
    (p) => p.status === "in_progress"
  );

  const totalBudget = approvedProposals.reduce((sum, p) => sum + p.budget, 0);
  const avgProgress =
    activeProjects.length > 0
      ? Math.round(
          activeProjects.reduce((sum, p) => sum + p.progress, 0) /
            activeProjects.length
        )
      : 0;

  const students = departmentUsers.filter((u) => u.role === "student");
  const faculty = departmentUsers.filter((u) => u.role === "faculty");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {user.department} Overview
        </h2>
        <p className="text-muted-foreground">
          Monitor research activities across your department
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
                  {departmentProposals.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingProposals.length} pending review
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
                <p className="text-xs text-muted-foreground mt-1">
                  {avgProgress}% avg progress
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
                  Researchers
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {departmentUsers.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {students.length} students, {faculty.length} faculty
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Budget
                </p>
                <p className="text-3xl font-bold text-foreground">
                  ${(totalBudget / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  From approved proposals
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-chart-3/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Department Projects</CardTitle>
              <CardDescription>
                Active research projects in your department
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/department">
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
                  No active projects in your department
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeProjects.slice(0, 4).map((project) => (
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
                          Lead: {project.leadResearcherName} | Advisor:{" "}
                          {project.facultyAdvisorName}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium text-accent shrink-0">
                        <TrendingUp className="w-4 h-4" />
                        {project.progress}%
                      </div>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>{project.teamMembers.length} team members</span>
                      <span>
                        Due: {new Date(project.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Proposals</CardTitle>
            <CardDescription>Latest submissions in your department</CardDescription>
          </CardHeader>
          <CardContent>
            {departmentProposals.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No proposals yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {departmentProposals.slice(0, 5).map((proposal) => (
                  <div
                    key={proposal.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm text-foreground truncate">
                        {proposal.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
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
                      className="text-xs shrink-0"
                    >
                      {proposal.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" className="w-full mt-4 bg-transparent" asChild>
              <Link href="/dashboard/proposals">View All Proposals</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
