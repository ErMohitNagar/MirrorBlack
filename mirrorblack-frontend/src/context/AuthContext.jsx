import { createContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/auth.api'
import { getToken, setToken as setStorageToken, removeToken } from '../utils/tokenStorage'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(getToken())
  const [isLoading, setIsLoading] = useState(true)

  const loadUser = useCallback(async () => {
    if (!token) {
      setIsLoading(false)
      return
    }
    try {
      const data = await authApi.getMe()
      setUser(data.user || data)
    } catch (err) {
      console.error('Failed to load user', err)
      removeToken()
      setToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = (newToken, newUser) => {
    setStorageToken(newToken)
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    removeToken()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
