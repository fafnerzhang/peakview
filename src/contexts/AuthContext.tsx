import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: string
  username: string
  email?: string
}

interface AuthContextType {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('peakflow_access_token')
    const userData = localStorage.getItem('peakflow_user')

    if (token && userData) {
      setAccessToken(token)
      try {
        setUser(JSON.parse(userData))
      } catch (e) {
        // Invalid user data, clear everything
        localStorage.removeItem('peakflow_access_token')
        localStorage.removeItem('peakflow_user')
      }
    }
  }, [])

  const login = async (username: string, password: string) => {
    setIsLoading(true)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010'
    const loginUrl = `${apiUrl}/api/v1/auth/login`

    console.log('🔐 Starting login attempt...', { username, apiUrl, loginUrl })

    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      console.log('📡 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ HTTP Error:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        })

        let errorData: any = {}
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          console.warn('⚠️ Could not parse error response as JSON')
        }

        throw new Error(errorData.detail || errorData.message || `Login failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Login response data:', {
        hasAccessToken: !!data.access_token,
        hasUser: !!data.user,
        userKeys: data.user ? Object.keys(data.user) : [],
        success: data.success
      })

      if (!data.access_token) {
        console.error('❌ No access token in response:', data)
        throw new Error('No access token received')
      }

      // Create user object from response
      const userData: User = {
        id: data.user?.id || data.user_id || username,
        username: data.user?.username || username,
        email: data.user?.email || data.email
      }

      console.log('👤 User data created:', userData)

      // Store in state and localStorage
      setAccessToken(data.access_token)
      setUser(userData)

      localStorage.setItem('peakflow_access_token', data.access_token)
      localStorage.setItem('peakflow_user', JSON.stringify(userData))

      console.log('✅ Login successful - stored in localStorage')
    } catch (error: unknown) {
      const errorInfo = error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : { message: String(error) }

      console.error('❌ Login failed:', errorInfo)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    console.log('👋 Starting logout...', {
      currentUser: user?.username,
      hasToken: !!accessToken
    })

    setUser(null)
    setAccessToken(null)
    localStorage.removeItem('peakflow_access_token')
    localStorage.removeItem('peakflow_user')

    console.log('✅ Logout complete - cleared state and localStorage')
  }

  const isAuthenticated = !!user && !!accessToken

  const value: AuthContextType = {
    user,
    accessToken,
    isLoading,
    login,
    logout,
    isAuthenticated
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}