"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"

import { apiRequest, ApiError, setAuthFailureHandler } from "@/lib/api"
import type { User, UserRole } from "@/lib/types"

const TOKEN_KEY = "research-portal-token"
const REFRESH_TOKEN_KEY = "research-portal-refresh-token"

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string; resetUrl?: string }>
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  refreshUser: () => Promise<void>
}

interface RegisterData {
  name: string
  email: string
  password: string
  department: string
  role: Extract<UserRole, "student" | "faculty" | "coordinator">
}

type AuthApiResponse = {
  accessToken: string
  refreshToken: string
  user: User
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY)
    window.localStorage.removeItem(REFRESH_TOKEN_KEY)
    setToken(null)
    setRefreshToken(null)
    setUser(null)
    setIsLoading(false)
  }, [])

  const persistAuth = useCallback((response: AuthApiResponse) => {
    window.localStorage.setItem(TOKEN_KEY, response.accessToken)
    window.localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken)
    setToken(response.accessToken)
    setRefreshToken(response.refreshToken)
    setUser(response.user)
    setIsLoading(false)
  }, [])

  const refreshSession = useCallback(async (): Promise<string | null> => {
    const currentRefreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!currentRefreshToken) {
      logout()
      return null
    }
    try {
      const response = await apiRequest<AuthApiResponse>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      })
      persistAuth(response)
      return response.accessToken
    } catch {
      logout()
      return null
    }
  }, [logout, persistAuth])

  useEffect(() => {
    const bootstrap = async () => {
      const savedToken = window.localStorage.getItem(TOKEN_KEY)
      const savedRefreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY)
      if (!savedToken || !savedRefreshToken) {
        setIsLoading(false)
        return
      }

      setToken(savedToken)
      setRefreshToken(savedRefreshToken)
      try {
        const currentUser = await apiRequest<User>("/auth/me", { token: savedToken })
        setUser(currentUser)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          const refreshedToken = await refreshSession()
          if (refreshedToken) {
            const currentUser = await apiRequest<User>("/auth/me", { token: refreshedToken })
            setUser(currentUser)
          }
        } else {
          logout()
        }
      } finally {
        setIsLoading(false)
      }
    }

    void bootstrap()
  }, [refreshSession, logout])

  useEffect(() => {
    setAuthFailureHandler(isLoading ? null : refreshSession)
    return () => {
      setAuthFailureHandler(null)
    }
  }, [isLoading, refreshSession])

  const login = async (email: string, password: string) => {
    try {
      const response = await apiRequest<AuthApiResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
      persistAuth(response)
      return { success: true }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to sign in."
      return { success: false, error: message }
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await apiRequest<AuthApiResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      })
      persistAuth(response)
      return { success: true }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to register."
      return { success: false, error: message }
    }
  }

  const forgotPassword = async (email: string) => {
    try {
      const response = await apiRequest<{ message: string; resetUrl?: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      })
      return { success: true, resetUrl: response.resetUrl }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to start password reset."
      return { success: false, error: message }
    }
  }

  const resetPassword = async (resetToken: string, newPassword: string) => {
    try {
      await apiRequest<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: resetToken, newPassword }),
      })
      return { success: true }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to reset password."
      return { success: false, error: message }
    }
  }

  const refreshUser = async () => {
    if (!token) return
    try {
      const currentUser = await apiRequest<User>("/auth/me", { token })
      setUser(currentUser)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const refreshedToken = await refreshSession()
        if (refreshedToken) {
          const currentUser = await apiRequest<User>("/auth/me", { token: refreshedToken })
          setUser(currentUser)
          return
        }
      }
      logout()
    }
  }

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token && !!refreshToken,
    isLoading,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
