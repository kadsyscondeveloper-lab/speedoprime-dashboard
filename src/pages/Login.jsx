import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email,    setEmail]    = useState('admin@speedoprime.com')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const submit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      nav('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.root}>
      {/* Background grid */}
      <div style={styles.grid} />
      <div style={styles.glow} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <polygon points="6,4 22,14 6,24" fill="var(--accent)" />
            </svg>
          </div>
          <span style={styles.logoText}>SpeedoPrime</span>
        </div>

        <p style={styles.subtitle}>Admin Dashboard</p>

        <form onSubmit={submit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="admin@speedoprime.com"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading
              ? <span style={styles.spinner} />
              : 'Sign In'
            }
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    position: 'relative',
    overflow: 'hidden',
  },
  grid: {
    position: 'absolute', inset: 0,
    backgroundImage: `linear-gradient(var(--surface2) 1px, transparent 1px),
                      linear-gradient(90deg, var(--surface2) 1px, transparent 1px)`,
    backgroundSize: '40px 40px',
    opacity: 0.3,
  },
  glow: {
    position: 'absolute',
    width: 600, height: 600,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,45,85,0.12) 0%, transparent 70%)',
    top: '50%', left: '50%',
    transform: 'translate(-50%,-50%)',
  },
  card: {
    position: 'relative',
    background: 'var(--surface)',
    border: '1px solid var(--border2)',
    borderRadius: 20,
    padding: '44px 40px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8,
  },
  logoIcon: {
    width: 44, height: 44,
    background: 'rgba(255,45,85,0.15)',
    border: '1px solid rgba(255,45,85,0.3)',
    borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'var(--font-head)',
    fontSize: 22, fontWeight: 700,
    color: 'var(--text)',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    color: 'var(--text3)', fontSize: 13,
    marginBottom: 32, marginLeft: 56,
    fontWeight: 500, letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.8px' },
  input: {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '12px 16px',
    color: 'var(--text)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  error: {
    background: 'rgba(255,45,85,0.1)',
    border: '1px solid rgba(255,45,85,0.3)',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#FF6B8A',
    fontSize: 13,
  },
  btn: {
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '14px',
    fontSize: 15,
    fontWeight: 600,
    fontFamily: 'var(--font-head)',
    cursor: 'pointer',
    marginTop: 4,
    letterSpacing: '0.3px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'opacity 0.2s',
  },
  spinner: {
    width: 18, height: 18,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'block',
  },
}
