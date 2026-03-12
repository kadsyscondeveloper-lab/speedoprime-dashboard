import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('sp_token')
    const saved = localStorage.getItem('sp_user')
    if (token && saved) {
      setUser(JSON.parse(saved))
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    if (data.user.role !== 'admin') throw new Error('Admin access required')
    localStorage.setItem('sp_token', data.token)
    localStorage.setItem('sp_user', JSON.stringify(data.user))
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('sp_token')
    localStorage.removeItem('sp_user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
