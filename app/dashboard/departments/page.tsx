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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Users,
  FileText,
  FolderKanban,
} from "lucide-react";

export default function DepartmentsPage() {
  const { user } = useAuth();
  const { departments, users, proposals, projects } = useData();

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">
          You don&apos;t have permission to access this page.
        </p>
      </div>
    );
  }

  const getDepartmentStats = (deptName: string) => {
    const deptUsers = users.filter((u) => u.department === deptName);
    const deptProposals = proposals.filter((p) => p.department === deptName);
    const deptProjects = projects.filter((p) => p.department === deptName);

    return {
      users: deptUsers.length,
      students: deptUsers.filter((u) => u.role === "student").length,
      faculty: deptUsers.filter((u) => u.role === "faculty").length,
      proposals: deptProposals.length,
      activeProjects: deptProjects.filter((p) => p.status === "in_progress").length,
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Departments</h2>
        <p className="text-muted-foreground">
          Overview of all departments and their research activities
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const stats = getDepartmentStats(dept.name);

          return (
            <Card key={dept.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{dept.name}</CardTitle>
                    <CardDescription>Code: {dept.code}</CardDescription>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Coordinator
                    </p>
                    {dept.coordinatorName ? (
                      <p className="font-medium">{dept.coordinatorName}</p>
                    ) : (
                      <Badge variant="secondary">Not Assigned</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div className="text-sm">
                        <span className="font-medium">{stats.users}</span>{" "}
                        <span className="text-muted-foreground">users</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div className="text-sm">
                        <span className="font-medium">{stats.proposals}</span>{" "}
                        <span className="text-muted-foreground">proposals</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-muted-foreground" />
                      <div className="text-sm">
                        <span className="font-medium">{stats.activeProjects}</span>{" "}
                        <span className="text-muted-foreground">active</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {stats.students} students
                      </span>
                      <span className="text-muted-foreground">
                        {stats.faculty} faculty
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Summary</CardTitle>
          <CardDescription>Comparison of all departments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Coordinator</TableHead>
                  <TableHead className="text-center">Users</TableHead>
                  <TableHead className="text-center">Proposals</TableHead>
                  <TableHead className="text-center">Active Projects</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => {
                  const stats = getDepartmentStats(dept.name);
                  return (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{dept.code}</Badge>
                      </TableCell>
                      <TableCell>
                        {dept.coordinatorName || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{stats.users}</TableCell>
                      <TableCell className="text-center">
                        {stats.proposals}
                      </TableCell>
                      <TableCell className="text-center">
                        {stats.activeProjects}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
