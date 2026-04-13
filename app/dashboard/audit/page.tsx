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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  ShieldCheck,
  Users,
  FileText,
  FolderKanban,
  Activity,
} from "lucide-react";
import { Suspense } from "react";

const actionCategories: Record<string, { label: string; color: string }> = {
  USER: { label: "User", color: "bg-chart-1/10 text-chart-1" },
  PROPOSAL: { label: "Proposal", color: "bg-chart-2/10 text-chart-2" },
  PROJECT: { label: "Project", color: "bg-chart-3/10 text-chart-3" },
  APPLICATION: { label: "Application", color: "bg-accent/10 text-accent" },
  PROGRESS: { label: "Progress", color: "bg-chart-5/10 text-chart-5" },
};

const getActionCategory = (action: string) => {
  if (action.includes("USER")) return "USER";
  if (action.includes("PROPOSAL")) return "PROPOSAL";
  if (action.includes("PROJECT")) return "PROJECT";
  if (action.includes("APPLICATION")) return "APPLICATION";
  if (action.includes("PROGRESS")) return "PROGRESS";
  return "OTHER";
};

const getActionIcon = (action: string) => {
  if (action.includes("USER")) return Users;
  if (action.includes("PROPOSAL")) return FileText;
  if (action.includes("PROJECT") || action.includes("APPLICATION"))
    return FolderKanban;
  return Activity;
};

const Loading = () => null;

export default function AuditLogsPage() {
  const { user } = useAuth();
  const { auditLogs } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">
          You don&apos;t have permission to access this page.
        </p>
      </div>
    );
  }

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());
    const category = getActionCategory(log.action);
    const matchesCategory = categoryFilter === "all" || category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Audit Logs</h2>
        <p className="text-muted-foreground">
          Track all system activities and changes
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(actionCategories).map(([key, config]) => {
          const count = auditLogs.filter(
            (log) => getActionCategory(log.action) === key
          ).length;

          return (
            <Card
              key={key}
              className={`cursor-pointer transition-colors ${
                categoryFilter === key ? "border-primary" : ""
              }`}
              onClick={() =>
                setCategoryFilter(categoryFilter === key ? "all" : key)
              }
            >
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground">
                  {config.label} Events
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Suspense fallback={<Loading />}>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="USER">User Events</SelectItem>
                  <SelectItem value="PROPOSAL">Proposal Events</SelectItem>
                  <SelectItem value="PROJECT">Project Events</SelectItem>
                  <SelectItem value="APPLICATION">Application Events</SelectItem>
                  <SelectItem value="PROGRESS">Progress Events</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No audit logs found</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12" />
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => {
                      const category = getActionCategory(log.action);
                      const config = actionCategories[category] || {
                        label: "Other",
                        color: "bg-muted text-muted-foreground",
                      };
                      const ActionIcon = getActionIcon(log.action);

                      return (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <ActionIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={config.color}>
                              {log.action.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {log.userName}
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            {log.details}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
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
      </Suspense>
    </div>
  );
}
