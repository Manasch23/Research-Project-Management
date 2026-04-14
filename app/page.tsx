"use client";

import React from "react"

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  GraduationCap,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";

function LoginPageContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const resetSucceeded = searchParams.get("reset") === "success";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error || "Invalid credentials. Please try again.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8">
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-foreground mb-4 text-balance">
              Streamline Your Research Journey
            </h2>
            <p className="text-lg text-muted-foreground mb-8 text-pretty">
              A centralized platform to manage research proposals, approvals,
              progress tracking, and reporting efficiently across your
              institution.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Proposals", value: "150+" },
                { label: "Active Projects", value: "45" },
                { label: "Researchers", value: "200+" },
                { label: "Departments", value: "12" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-4 rounded-lg bg-card border border-border"
                >
                  <div className="text-2xl font-bold text-primary">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

          </div>

          <div className="flex flex-col gap-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                  Enter your university credentials to access the portal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {resetSucceeded && (
                    <Alert>
                      <AlertDescription>
                        Password reset successful. You can sign in with your new password now.
                      </AlertDescription>
                    </Alert>
                  )}
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>

                  <div className="flex justify-end">
                    <Link
                      href="/forgot-password"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <KeyRound className="h-4 w-4" />
                      Forgot password?
                    </Link>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 border-t pt-6">
                <p className="text-sm text-muted-foreground text-center">
                  New here? Create your account to get started
                </p>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/register">Create Account</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
