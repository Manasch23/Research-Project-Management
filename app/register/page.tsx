"use client";

import React from "react"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  GraduationCap,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft,
  Briefcase,
  Users,
} from "lucide-react";

const roles = [
  { value: "student", label: "Student", icon: GraduationCap },
  { value: "faculty", label: "Faculty", icon: Briefcase },
  { value: "coordinator", label: "Coordinator", icon: Users },
] as const;

const departments = [
  "Computer Science",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Biology",
  "Chemistry",
  "Physics",
  "Mathematics",
];

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    role: "student",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const passwordRequirements = [
    { label: "At least 8 characters", met: formData.password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(formData.password) },
    { label: "Contains a letter", met: /[a-zA-Z]/.test(formData.password) },
  ];

  const isPasswordValid = passwordRequirements.every((req) => req.met);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError("Please meet all password requirements.");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    if (!formData.department) {
      setError("Please select your department.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        department: formData.department,
        role: formData.role as "student" | "faculty" | "coordinator",
      });

      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error || "Registration failed. Please try again.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Research Project Management
            </h1>
            <p className="text-sm text-muted-foreground">University Portal</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Create Account</CardTitle>
              <CardDescription>
                Create a student, faculty, or coordinator account to start managing research work
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="role">Account Type</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => updateField("role", value)}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select your account type" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => {
                        const Icon = role.icon
                        return (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{role.label}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Any valid email address can be used
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => updateField("department", value)}
                  >
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="space-y-1 mt-2">
                      {passwordRequirements.map((req) => (
                        <div
                          key={req.label}
                          className={`flex items-center gap-2 text-xs ${
                            req.met ? "text-green-600" : "text-muted-foreground"
                          }`}
                        >
                          <CheckCircle2
                            className={`h-3 w-3 ${
                              req.met ? "text-green-600" : "text-muted-foreground/50"
                            }`}
                          />
                          {req.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {formData.confirmPassword && (
                    <p
                      className={`text-xs ${
                        passwordsMatch ? "text-green-600" : "text-destructive"
                      }`}
                    >
                      {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !isPasswordValid || !passwordsMatch}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 border-t pt-6">
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Link href="/" className="text-primary hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
            </CardFooter>
          </Card>

          <p className="text-xs text-muted-foreground text-center mt-4">
            By creating an account, you agree to the university&apos;s terms of service
            and research ethics guidelines.
          </p>
        </div>
      </main>

      <footer className="border-t border-border py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          University Research Project Management System
        </div>
      </footer>
    </div>
  );
}
