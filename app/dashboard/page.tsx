"use client";

import { useAuth } from "@/lib/auth-context";
import { StudentDashboard } from "@/components/dashboards/student-dashboard";
import { FacultyDashboard } from "@/components/dashboards/faculty-dashboard";
import { CoordinatorDashboard } from "@/components/dashboards/coordinator-dashboard";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "student":
      return <StudentDashboard />;
    case "faculty":
      return <FacultyDashboard />;
    case "coordinator":
      return <CoordinatorDashboard />;
    case "admin":
      return <AdminDashboard />;
    default:
      return <StudentDashboard />;
  }
}
