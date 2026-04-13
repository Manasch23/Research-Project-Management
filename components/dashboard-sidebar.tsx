"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  GraduationCap,
  LayoutDashboard,
  FileText,
  FolderKanban,
  Users,
  Building2,
  ShieldCheck,
  Settings,
  ClipboardList,
  UserPlus,
  BarChart3,
  User,
} from "lucide-react";

const navigationByRole = {
  student: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Proposals", href: "/dashboard/proposals", icon: FileText },
    { name: "My Projects", href: "/dashboard/projects", icon: FolderKanban },
    { name: "Browse Projects", href: "/dashboard/browse", icon: ClipboardList },
    { name: "Profile", href: "/dashboard/profile", icon: User },
  ],
  faculty: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Review Proposals", href: "/dashboard/review", icon: FileText },
    { name: "My Projects", href: "/dashboard/projects", icon: FolderKanban },
    { name: "Applications", href: "/dashboard/applications", icon: UserPlus },
    { name: "Profile", href: "/dashboard/profile", icon: User },
  ],
  coordinator: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Department Projects", href: "/dashboard/department", icon: Building2 },
    { name: "All Proposals", href: "/dashboard/proposals", icon: FileText },
    { name: "Researchers", href: "/dashboard/researchers", icon: Users },
    { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
    { name: "Profile", href: "/dashboard/profile", icon: User },
  ],
  admin: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "User Management", href: "/dashboard/users", icon: Users },
    { name: "Departments", href: "/dashboard/departments", icon: Building2 },
    { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
    { name: "Audit Logs", href: "/dashboard/audit", icon: ShieldCheck },
    { name: "Profile", href: "/dashboard/profile", icon: User },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ],
};

export function DashboardSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const navigation = navigationByRole[user.role] || [];

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sidebar-foreground text-sm truncate">
              Research Portal
            </div>
            <div className="text-xs text-sidebar-foreground/60 capitalize">
              {user.role} Portal
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="px-3 py-2">
          <div className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider mb-1">
            Department
          </div>
          <div className="text-sm text-sidebar-foreground truncate">
            {user.department}
          </div>
        </div>
      </div>
    </aside>
  );
}
