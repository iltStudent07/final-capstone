import { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import type { User, AuthContextValue } from '../types/types'


// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user')
    if (!storedUser) return null

    try {
      const parsedUser = JSON.parse(storedUser) as { _id?: string; id?: string; [key: string]: unknown }
      return {
        ...parsedUser,
        _id: parsedUser._id ?? parsedUser.id ?? '',
        role: String(parsedUser.role ?? 'member'),
      } as User
    } catch {
      localStorage.removeItem('user')
      return null
    }
  })

  const [loading] = useState(false)

  const persistAuth = (newToken: string, newUser: { _id?: string; id?: string; [key: string]: unknown }) => {
    const normalizedUser: User = {
      ...newUser,
      _id: newUser._id ?? newUser.id ?? '',
      name: String(newUser.name ?? ''),
      email: String(newUser.email ?? ''),
      role: String(newUser.role ?? 'member'),
    }

    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(normalizedUser))
    setToken(newToken)
    setUser(normalizedUser)
  }

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    persistAuth(data.token, data.user)
  }

  const register = async (
    name: string,
    email: string,
    password: string,
    role: 'admin' | 'member',
  ) => {
    const { data } = await api.post('/auth/register', {
      name,
      email,
      password,
      role,
    })
    persistAuth(data.token, data.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    navigate('/login', { replace: true })
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within a AuthProvider')
  }

  return context
}