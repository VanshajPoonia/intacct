"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { AuthUser, AuthSession } from '@/lib/types'
import { login as loginService, logout as logoutService, getCurrentUser } from '@/lib/services'

interface AuthContextType {
  user: AuthUser | null
  session: AuthSession | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SESSION_KEY = 'intacct_session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const stored = localStorage.getItem(SESSION_KEY)
        if (stored) {
          const parsedSession = JSON.parse(stored) as AuthSession
          // Check if session is expired
          if (new Date(parsedSession.expiresAt) > new Date()) {
            setSession(parsedSession)
            setUser(parsedSession.user)
          } else {
            localStorage.removeItem(SESSION_KEY)
          }
        }
      } catch {
        localStorage.removeItem(SESSION_KEY)
      } finally {
        setIsLoading(false)
      }
    }
    initAuth()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const result = await loginService(email, password)
      if (result.success && result.session) {
        setSession(result.session)
        setUser(result.session.user)
        localStorage.setItem(SESSION_KEY, JSON.stringify(result.session))
        return { success: true }
      }
      return { success: false, error: result.error || 'Login failed' }
    } catch {
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await logoutService()
    } finally {
      setSession(null)
      setUser(null)
      localStorage.removeItem(SESSION_KEY)
      setIsLoading(false)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    if (!session) return
    try {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      }
    } catch {
      // Handle error silently
    }
  }, [session])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user && !!session,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
