"use client"

import { useState, useEffect } from "react"

interface AdminSession {
  id: number
  username: string
  name: string
  loginTime: string
}

export function useAdminSession() {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = () => {
      try {
        const sessionData = localStorage.getItem("admin_session")
        if (sessionData) {
          const parsedSession = JSON.parse(sessionData) as AdminSession
          if (parsedSession && parsedSession.id && parsedSession.username) {
            setSession(parsedSession)
          } else {
            setSession(null)
            localStorage.removeItem("admin_session")
          }
        } else {
          setSession(null)
        }
      } catch (error) {
        console.error("Session check error:", error)
        setSession(null)
        localStorage.removeItem("admin_session")
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = (sessionData: AdminSession) => {
    localStorage.setItem("admin_session", JSON.stringify(sessionData))
    setSession(sessionData)
  }

  const logout = () => {
    localStorage.removeItem("admin_session")
    localStorage.removeItem("admin_username")
    localStorage.removeItem("admin_remember_me")
    setSession(null)
  }

  const isAuthenticated = !!session

  return {
    session,
    isLoading,
    isAuthenticated,
    login,
    logout
  }
}
