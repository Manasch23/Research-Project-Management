"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Loading from "./loading"; // Import the Loading component

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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  Users,
  FileText,
  FolderKanban,
  GraduationCap,
  FlaskConical,
  Mail,
} from "lucide-react";
import type { User } from "@/lib/types";

const roleIcons = {
  student: GraduationCap,
  faculty: FlaskConical,
  coordinator: Users,
  admin: Users,
};

export default function ResearchersPage() {
  const { user } = useAuth();
  const { users, proposals, projects } = useData();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  if (!user) return null;

  const departmentUsers = users.filter(
    (u) => u.department === user.department && u.role !== "admin"
  );

  const filteredUsers = departmentUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getUserStats = (userId: string) => {
    const userProposals = proposals.filter((p) => p.submittedBy === userId);
    const userProjects = projects.filter(
      (p) => p.teamMembers.includes(userId) || p.leadResearcher === userId
    );
    const advisedProposals = proposals.filter((p) => p.facultyAdvisor === userId);
    const advisedProjects = projects.filter((p) => p.facultyAdvisor === userId);

    return {
      proposals: userProposals.length,
      projects: userProjects.length,
      advisedProposals: advisedProposals.length,
      advisedProjects: advisedProjects.length,
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Researchers</h2>
        <p className="text-muted-foreground">
          Faculty and students in {user.department}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No researchers found</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((researcher) => {
                const stats = getUserStats(researcher.id);
                const RoleIcon = roleIcons[researcher.role];
                const initials = researcher.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <Card
                    key={researcher.id}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedUser(researcher)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">
                            {researcher.name}
                          </h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {researcher.email}
                          </p>
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-xs">
                              <RoleIcon className="w-3 h-3 mr-1" />
                              {researcher.role.charAt(0).toUpperCase() +
                                researcher.role.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        {researcher.role === "student" ? (
                          <>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <FileText className="w-4 h-4" />
                              <span>{stats.proposals} proposals</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <FolderKanban className="w-4 h-4" />
                              <span>{stats.projects} projects</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <FileText className="w-4 h-4" />
                              <span>{stats.advisedProposals} advised</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <FolderKanban className="w-4 h-4" />
                              <span>{stats.advisedProjects} projects</span>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Suspense fallback={<Loading />}>
        <Dialog
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Researcher Profile</DialogTitle>
              <DialogDescription>
                View details and activity
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {selectedUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {selectedUser.email}
                    </div>
                    <Badge variant="secondary" className="mt-2">
                      {selectedUser.role.charAt(0).toUpperCase() +
                        selectedUser.role.slice(1)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Department</Label>
                    <p className="mt-1 font-medium">{selectedUser.department}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Joined</Label>
                    <p className="mt-1 font-medium">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {selectedUser.role === "student" && (
                  <div>
                    <Label className="text-muted-foreground">
                      Research Activity
                    </Label>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-muted">
                        <div className="text-2xl font-bold">
                          {getUserStats(selectedUser.id).proposals}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Proposals Submitted
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted">
                        <div className="text-2xl font-bold">
                          {getUserStats(selectedUser.id).projects}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Projects Joined
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedUser.role === "faculty" && (
                  <div>
                    <Label className="text-muted-foreground">Advisory Activity</Label>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-muted">
                        <div className="text-2xl font-bold">
                          {getUserStats(selectedUser.id).advisedProposals}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Proposals Advised
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted">
                        <div className="text-2xl font-bold">
                          {getUserStats(selectedUser.id).advisedProjects}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Projects Supervised
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Suspense>
    </div>
  );
}
