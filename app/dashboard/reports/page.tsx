"use client";

import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  Users,
  Calendar,
  PieChart,
} from "lucide-react";
import { useState } from "react";

export default function ReportsPage() {
  const { user } = useAuth();
  const { projects, proposals, users, statistics } = useData();
  const [reportType, setReportType] = useState("overview");
  const [dateRange, setDateRange] = useState("all");

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "in_progress").length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;
  const totalProposals = proposals.length;
  const approvedProposals = proposals.filter((p) => p.status === "approved").length;
  const pendingProposals = proposals.filter(
    (p) => p.status === "submitted" || p.status === "under_review"
  ).length;

  const studentCount = users.filter((u) => u.role === "student").length;
  const facultyCount = users.filter((u) => u.role === "faculty").length;

  const departmentStats = projects.reduce(
    (acc, project) => {
      acc[project.department] = (acc[project.department] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const avgProgress =
    projects.length > 0
      ? Math.round(
          projects.reduce((sum, p) => sum + p.progress, 0) / projects.length
        )
      : 0;

  if (user?.role === "student") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My Reports</h1>
          <p className="text-muted-foreground mt-1">
            View your research activity reports
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                My Proposals
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {proposals.filter((p) => p.submittedBy === user.id).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Projects
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  projects.filter(
                      (p) =>
                      p.teamMembers.includes(user.id) && p.status === "in_progress"
                  ).length
                }
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  projects.filter(
                    (p) =>
                      p.teamMembers.includes(user.id) && p.status === "completed"
                  ).length
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive research activity reports
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={reportType === "overview" ? "default" : "outline"}
          size="sm"
          onClick={() => setReportType("overview")}
        >
          Overview
        </Button>
        <Button
          variant={reportType === "projects" ? "default" : "outline"}
          size="sm"
          onClick={() => setReportType("projects")}
        >
          Projects
        </Button>
        <Button
          variant={reportType === "proposals" ? "default" : "outline"}
          size="sm"
          onClick={() => setReportType("proposals")}
        >
          Proposals
        </Button>
        <Button
          variant={reportType === "departments" ? "default" : "outline"}
          size="sm"
          onClick={() => setReportType("departments")}
        >
          Departments
        </Button>
      </div>

      {reportType === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Projects
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProjects}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeProjects} active, {completedProjects} completed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Proposals
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProposals}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {approvedProposals} approved, {pendingProposals} pending
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Researchers
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {studentCount + facultyCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {studentCount} students, {facultyCount} faculty
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg. Progress
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgProgress}%</div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${avgProgress}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Project Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: "Active", count: activeProjects, color: "bg-primary" },
                    {
                      label: "Completed",
                      count: completedProjects,
                      color: "bg-accent",
                    },
                    {
                      label: "On Hold",
                      count: projects.filter((p) => p.status === "on_hold")
                        .length,
                      color: "bg-chart-3",
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span>{item.label}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div
                            className={`${item.color} h-2 rounded-full transition-all`}
                            style={{
                              width: `${totalProjects > 0 ? (item.count / totalProjects) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Proposal Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      label: "Approved",
                      count: approvedProposals,
                      color: "bg-accent",
                    },
                    {
                      label: "Pending",
                      count: pendingProposals,
                      color: "bg-chart-3",
                    },
                    {
                      label: "Under Review",
                      count: proposals.filter((p) => p.status === "under_review")
                        .length,
                      color: "bg-primary",
                    },
                    {
                      label: "Rejected",
                      count: proposals.filter((p) => p.status === "rejected")
                        .length,
                      color: "bg-destructive",
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span>{item.label}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {reportType === "projects" && (
        <Card>
          <CardHeader>
            <CardTitle>Project Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.slice(0, 8).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{project.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.department}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{project.progress}%</p>
                      <div className="w-20 bg-muted rounded-full h-1.5 mt-1">
                        <div
                          className="bg-primary h-1.5 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                    <Badge
                      variant={
                        project.status === "in_progress"
                          ? "default"
                          : project.status === "completed"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {project.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === "proposals" && (
        <Card>
          <CardHeader>
            <CardTitle>Proposal Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {proposals.slice(0, 8).map((proposal) => {
                return (
                  <div
                    key={proposal.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{proposal.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {proposal.submittedByName} - {proposal.department}
                      </p>
                    </div>
                    <Badge
                      variant={
                        proposal.status === "approved"
                          ? "default"
                          : proposal.status === "submitted" || proposal.status === "under_review"
                            ? "secondary"
                            : proposal.status === "rejected"
                              ? "destructive"
                              : "outline"
                      }
                    >
                      {proposal.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === "departments" && (
        <Card>
          <CardHeader>
            <CardTitle>Department Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(departmentStats).map(([dept, count]) => (
                <div
                  key={dept}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{dept}</p>
                    <p className="text-sm text-muted-foreground">
                      {count} project{count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="w-32">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${(count / totalProjects) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {statistics && reportType === "overview" && (
        <Card>
          <CardHeader>
            <CardTitle>Backend Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold">{statistics.totalUsers}</div>
              <p className="text-sm text-muted-foreground">Managed users</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold">{statistics.averageProgress}%</div>
              <p className="text-sm text-muted-foreground">Average project progress</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold">${statistics.totalBudget.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Approved proposal budget</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
