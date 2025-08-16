import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, authApi } from '@/lib/api'

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user')
    const accessToken = localStorage.getItem('accessToken')
    
    if (storedUser && accessToken) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
      }
    }
    
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const response = await authApi.login({ username, password })
      const { token, user: userData } = response.data

      localStorage.setItem('accessToken', token)
      localStorage.setItem('user', JSON.stringify(userData))

      setUser(userData)
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed')
    }
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    setUser(null)
  }

  const value = {
    user,
    login,
    logout,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
