import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Content from './pages/Content'
import Users from './pages/Users'
import Categories from './pages/Categories'
import Ads from './pages/Ads'
import Subscriptions from './pages/Subscriptions'
import HomeScreen from './pages/HomeScreen'
import SpeedoTube from './pages/SpeedoTube'

function Guard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--surface2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Guard><Layout /></Guard>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="content" element={<Content />} />
            <Route path="users" element={<Users />} />
            <Route path="categories" element={<Categories />} />
            <Route path="ads" element={<Ads />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="homescreen" element={<HomeScreen />} />
            <Route path="speedotube" element={<SpeedoTube />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}