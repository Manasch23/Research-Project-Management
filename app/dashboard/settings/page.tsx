"use client";

import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Bell,
  Shield,
  Database,
  Mail,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">
          You don&apos;t have permission to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">System Settings</h2>
        <p className="text-muted-foreground">
          Configure system-wide settings and preferences
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <CardTitle>General Settings</CardTitle>
            </div>
            <CardDescription>
              Basic system configuration options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="systemName">System Name</Label>
                <Input
                  id="systemName"
                  defaultValue="University Research Portal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  defaultValue="support@university.edu"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement">System Announcement</Label>
              <Input
                id="announcement"
                placeholder="Enter a system-wide announcement..."
              />
              <p className="text-xs text-muted-foreground">
                This will be displayed to all users on login
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <CardTitle>Notification Settings</CardTitle>
            </div>
            <CardDescription>
              Configure email and in-app notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send email notifications for important events
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Proposal Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Notify users when proposal status changes
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Project Milestones</Label>
                <p className="text-sm text-muted-foreground">
                  Send reminders for upcoming milestone deadlines
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Weekly Digest</Label>
                <p className="text-sm text-muted-foreground">
                  Send weekly summary emails to coordinators
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <CardTitle>Security Settings</CardTitle>
            </div>
            <CardDescription>
              Manage authentication and security policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Require 2FA for all admin accounts
                </p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Session Timeout</Label>
                <p className="text-sm text-muted-foreground">
                  Auto-logout after 30 minutes of inactivity
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Audit Logging</Label>
                <p className="text-sm text-muted-foreground">
                  Log all user actions for security review
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-muted-foreground" />
              <CardTitle>Data Management</CardTitle>
            </div>
            <CardDescription>
              Database and storage configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold">8</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold">5</div>
                <div className="text-sm text-muted-foreground">Proposals</div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold">1</div>
                <div className="text-sm text-muted-foreground">Projects</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">Export Data</Button>
              <Button variant="outline">Backup Database</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <CardTitle>Email Configuration</CardTitle>
            </div>
            <CardDescription>
              SMTP settings for outgoing emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input id="smtpHost" placeholder="smtp.university.edu" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input id="smtpPort" placeholder="587" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpUser">SMTP Username</Label>
                <Input id="smtpUser" placeholder="noreply@university.edu" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPass">SMTP Password</Label>
                <Input id="smtpPass" type="password" placeholder="********" />
              </div>
            </div>
            <Button variant="outline">Test Connection</Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline">Reset to Defaults</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}
