import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Film, Users, Tag, Megaphone,
  CreditCard, LogOut, ChevronLeft, ChevronRight, Play, LayoutTemplate
} from 'lucide-react'

const NAV = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/content',       icon: Film,            label: 'Content' },
  { to: '/users',         icon: Users,           label: 'Users' },
  { to: '/categories',    icon: Tag,             label: 'Categories' },
  { to: '/ads',           icon: Megaphone,       label: 'Ads' },
  { to: '/subscriptions', icon: CreditCard,      label: 'Subscriptions' },
  { to: '/homescreen',    icon: LayoutTemplate,  label: 'Home Screen' },
  { to: '/speedotube', icon: Play, label: 'SpeedoTube' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => { logout(); nav('/login') }

  return (
    <div style={s.shell}>
      {/* Sidebar */}
      <aside style={{ ...s.sidebar, width: collapsed ? 72 : 240 }}>
        {/* Logo */}
        <div style={s.logoRow}>
          <div style={s.logoIcon}><Play size={16} fill="var(--accent)" color="var(--accent)" /></div>
          {!collapsed && <span style={s.logoText}>SpeedoPrime</span>}
        </div>

        {/* Toggle */}
        <button style={s.toggle} onClick={() => setCollapsed(c => !c)}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Nav */}
        <nav style={s.nav}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              ...s.navItem,
              background: isActive ? 'rgba(255,45,85,0.12)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text2)',
              borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
            })}>
              <Icon size={18} strokeWidth={1.8} />
              {!collapsed && <span style={s.navLabel}>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={s.userRow}>
          <div style={s.avatar}>{user?.username?.[0]?.toUpperCase() || 'A'}</div>
          {!collapsed && (
            <div style={{ flex:1, minWidth:0 }}>
              <div style={s.userName}>{user?.username}</div>
              <div style={s.userRole}>Administrator</div>
            </div>
          )}
          {!collapsed && (
            <button style={s.logoutBtn} onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          )}
          {collapsed && (
            <button style={{ ...s.logoutBtn, marginLeft: 0 }} onClick={handleLogout}>
              <LogOut size={14} />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <main style={s.main}>
        <div style={s.content} className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

const s = {
  shell: { display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' },
  sidebar: {
    display: 'flex', flexDirection: 'column',
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    transition: 'width 0.25s ease',
    overflow: 'hidden',
    flexShrink: 0,
    position: 'relative',
  },
  logoRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '24px 20px 20px',
    borderBottom: '1px solid var(--border)',
  },
  logoIcon: {
    width: 32, height: 32, flexShrink: 0,
    background: 'rgba(255,45,85,0.15)',
    border: '1px solid rgba(255,45,85,0.25)',
    borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700,
    whiteSpace: 'nowrap', color: 'var(--text)', letterSpacing: '-0.3px',
  },
  toggle: {
    position: 'absolute', top: 22, right: -12,
    width: 24, height: 24,
    background: 'var(--surface2)', border: '1px solid var(--border2)',
    borderRadius: '50%', cursor: 'pointer',
    color: 'var(--text2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  nav: { flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 12px', borderRadius: 10,
    transition: 'all 0.15s',
    fontWeight: 500, fontSize: 14, whiteSpace: 'nowrap',
    textDecoration: 'none',
  },
  navLabel: { overflow: 'hidden', textOverflow: 'ellipsis' },
  userRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '14px 16px',
    borderTop: '1px solid var(--border)',
  },
  avatar: {
    width: 32, height: 32, flexShrink: 0,
    background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 700, color: '#fff',
  },
  userName: { fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  userRole: { fontSize: 11, color: 'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px' },
  logoutBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text3)', padding: 4, borderRadius: 6,
    display: 'flex', alignItems: 'center',
    transition: 'color 0.15s',
  },
  main: { flex: 1, overflow: 'auto', background: 'var(--bg)' },
  content: { padding: '32px', maxWidth: 1400, margin: '0 auto' },
}