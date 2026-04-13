"use client";

import { useData } from "@/lib/data-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users,
  Building2,
  FileText,
  FolderKanban,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Activity,
} from "lucide-react";

export function AdminDashboard() {
  const { users, proposals, projects, departments, auditLogs } = useData();

  const students = users.filter((u) => u.role === "student");
  const faculty = users.filter((u) => u.role === "faculty");
  const coordinators = users.filter((u) => u.role === "coordinator");

  const activeProjects = projects.filter((p) => p.status === "in_progress");
  const pendingProposals = proposals.filter(
    (p) => p.status === "submitted" || p.status === "under_review"
  );

  const recentLogs = auditLogs.slice(0, 8);

  const stats = [
    {
      label: "Total Users",
      value: users.length,
      detail: `${students.length} students, ${faculty.length} faculty`,
      icon: Users,
      color: "bg-primary/10 text-primary",
      href: "/dashboard/users",
    },
    {
      label: "Departments",
      value: departments.length,
      detail: `${coordinators.length} coordinators assigned`,
      icon: Building2,
      color: "bg-chart-1/10 text-chart-1",
      href: "/dashboard/departments",
    },
    {
      label: "Proposals",
      value: proposals.length,
      detail: `${pendingProposals.length} pending review`,
      icon: FileText,
      color: "bg-chart-3/10 text-chart-3",
      href: "/dashboard/proposals",
    },
    {
      label: "Active Projects",
      value: activeProjects.length,
      detail: `${projects.length} total projects`,
      icon: FolderKanban,
      color: "bg-accent/10 text-accent",
      href: "/dashboard/projects",
    },
  ];

  const getActionIcon = (action: string) => {
    if (action.includes("USER")) return Users;
    if (action.includes("PROPOSAL")) return FileText;
    if (action.includes("PROJECT") || action.includes("APPLICATION"))
      return FolderKanban;
    return Activity;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">System Overview</h2>
        <p className="text-muted-foreground">
          Monitor system health and manage platform settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:border-primary/50 transition-colors">
            <Link href={stat.href}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.detail}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}
                  >
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/audit">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLogs.map((log) => {
                const ActionIcon = getActionIcon(log.action);
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <ActionIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {log.userName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {log.details}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto p-4 flex flex-col gap-2 bg-transparent" asChild>
                <Link href="/dashboard/users">
                  <Users className="w-6 h-6" />
                  <span className="text-sm">Manage Users</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col gap-2 bg-transparent" asChild>
                <Link href="/dashboard/departments">
                  <Building2 className="w-6 h-6" />
                  <span className="text-sm">Departments</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col gap-2 bg-transparent" asChild>
                <Link href="/dashboard/audit">
                  <ShieldCheck className="w-6 h-6" />
                  <span className="text-sm">Audit Logs</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col gap-2 bg-transparent" asChild>
                <Link href="/dashboard/settings">
                  <TrendingUp className="w-6 h-6" />
                  <span className="text-sm">Settings</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Platform status and metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-lg bg-accent/10">
              <div className="w-3 h-3 rounded-full bg-accent mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Database</p>
              <p className="text-xs text-muted-foreground">Connected</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-accent/10">
              <div className="w-3 h-3 rounded-full bg-accent mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">API</p>
              <p className="text-xs text-muted-foreground">Operational</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-accent/10">
              <div className="w-3 h-3 rounded-full bg-accent mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Auth</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-accent/10">
              <div className="w-3 h-3 rounded-full bg-accent mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Storage</p>
              <p className="text-xs text-muted-foreground">75% Available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
