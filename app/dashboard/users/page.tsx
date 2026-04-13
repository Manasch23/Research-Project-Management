"use client";

import React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Plus,
  Users,
  Edit,
  Trash2,
  GraduationCap,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import type { User, UserRole } from "@/lib/types";

const roleConfig: Record<
  UserRole,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  student: {
    label: "Student",
    icon: GraduationCap,
    color: "bg-chart-1/10 text-chart-1",
  },
  faculty: {
    label: "Faculty",
    icon: FlaskConical,
    color: "bg-chart-2/10 text-chart-2",
  },
  coordinator: {
    label: "Coordinator",
    icon: Users,
    color: "bg-chart-3/10 text-chart-3",
  },
  admin: {
    label: "Admin",
    icon: ShieldCheck,
    color: "bg-chart-5/10 text-chart-5",
  },
};

const Loading = () => null;

function UserForm({
  isEdit = false,
  formData,
  setFormData,
  departments,
  onCancel,
  onSubmit,
}: {
  isEdit?: boolean;
  formData: { name: string; email: string; role: UserRole; department: string };
  setFormData: React.Dispatch<
    React.SetStateAction<{ name: string; email: string; role: UserRole; department: string }>
  >;
  departments: { id: number; name: string }[];
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="John Smith"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@university.edu"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select
            value={formData.role}
            onValueChange={(value) =>
              setFormData({ ...formData, role: value as UserRole })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
              <SelectItem value="coordinator">Coordinator</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select
            value={formData.department}
            onValueChange={(value) =>
              setFormData({ ...formData, department: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.name}>
                  {dept.name}
                </SelectItem>
              ))}
              <SelectItem value="IT Services">IT Services</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {isEdit ? "Save Changes" : "Create User"}
        </Button>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { user } = useAuth();
  const { users, departments, addUser, updateUser, deleteUser, addAuditLog } =
    useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "student" as UserRole,
    department: "",
  });

  const searchParams = useSearchParams();

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">
          You don&apos;t have permission to access this page.
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreate = () => {
    if (!formData.name || !formData.email || !formData.department) return;

    addUser({
      name: formData.name,
      email: formData.email,
      role: formData.role,
      department: formData.department,
    });

    addAuditLog({
      userId: user.id,
      userName: user.name,
      action: "USER_CREATED",
      details: `Created new user: ${formData.email} (${formData.role})`,
    });

    setFormData({ name: "", email: "", role: "student", department: "" });
    setIsCreateOpen(false);
  };

  const handleUpdate = () => {
    if (!editingUser) return;

    updateUser(editingUser.id, {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      department: formData.department,
    });

    addAuditLog({
      userId: user.id,
      userName: user.name,
      action: "USER_UPDATED",
      details: `Updated user: ${formData.email}`,
    });

    setEditingUser(null);
    setFormData({ name: "", email: "", role: "student", department: "" });
  };

  const handleDelete = () => {
    if (!deletingUser) return;

    deleteUser(deletingUser.id);

    addAuditLog({
      userId: user.id,
      userName: user.name,
      action: "USER_DELETED",
      details: `Deleted user: ${deletingUser.email}`,
    });

    setDeletingUser(null);
  };

  const openEditDialog = (userToEdit: User) => {
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      role: userToEdit.role,
      department: userToEdit.department,
    });
    setEditingUser(userToEdit);
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">User Management</h2>
            <p className="text-muted-foreground">
              Manage user accounts and permissions
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system
                </DialogDescription>
              </DialogHeader>
              <UserForm
                formData={formData}
                setFormData={setFormData}
                departments={departments}
                onCancel={() => {
                  setIsCreateOpen(false);
                  setFormData({ name: "", email: "", role: "student", department: "" });
                }}
                onSubmit={handleCreate}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
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
                  <SelectItem value="coordinator">Coordinators</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((userItem) => {
                      const config = roleConfig[userItem.role];
                      const initials = userItem.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);

                      return (
                        <TableRow key={userItem.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9">
                                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{userItem.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {userItem.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={config.color}>
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{userItem.department}</TableCell>
                          <TableCell>
                            {new Date(userItem.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(userItem)}
                              >
                                <Edit className="w-4 h-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingUser(userItem)}
                                disabled={userItem.id === user.id}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user information</DialogDescription>
            </DialogHeader>
            <UserForm
              isEdit
              formData={formData}
              setFormData={setFormData}
              departments={departments}
              onCancel={() => {
                setEditingUser(null);
                setFormData({ name: "", email: "", role: "student", department: "" });
              }}
              onSubmit={handleUpdate}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={!!deletingUser}
          onOpenChange={(open) => !open && setDeletingUser(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {deletingUser?.name}? This action
                cannot be undone and will remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Suspense>
  );
}
