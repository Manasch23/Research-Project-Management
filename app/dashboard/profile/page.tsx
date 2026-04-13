"use client";

import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Building2, CalendarDays, FolderKanban, FileText } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { proposals, projects } = useData();

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const myProposalCount =
    user.role === "faculty"
      ? proposals.filter((proposal) => proposal.facultyAdvisor === user.id).length
      : proposals.filter((proposal) => proposal.submittedBy === user.id).length;

  const myProjectCount =
    user.role === "faculty"
      ? projects.filter((project) => project.facultyAdvisor === user.id).length
      : projects.filter(
          (project) => project.teamMembers.includes(user.id) || project.leadResearcher === user.id
        ).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">My Profile</h2>
        <p className="text-muted-foreground">
          Review your account details and activity summary.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
            <CardDescription>Your registered identity inside the research portal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="text-xl font-semibold">{user.name}</div>
                <Badge variant="secondary" className="capitalize">
                  {user.role}
                </Badge>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Email
                </div>
                <div className="font-medium">{user.email}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  Department
                </div>
                <div className="font-medium">{user.department}</div>
              </div>
              <div className="rounded-lg border p-4 md:col-span-2">
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  Joined
                </div>
                <div className="font-medium">{new Date(user.createdAt).toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Snapshot</CardTitle>
            <CardDescription>Helpful quick counts for your role</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                Proposal Activity
              </div>
              <div className="text-3xl font-bold">{myProposalCount}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <FolderKanban className="h-4 w-4" />
                Project Activity
              </div>
              <div className="text-3xl font-bold">{myProjectCount}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
