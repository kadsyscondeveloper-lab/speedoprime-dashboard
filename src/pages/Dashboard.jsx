import { useEffect, useState } from 'react'
import { Users, Film, Eye, CreditCard, TrendingUp, UserCheck } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import api from '../api/client'
import { StatCard, PageHeader } from '../components/UI'

const CONTENT_TYPES_COLORS = ['#FF2D55','#FF6B35','#FFB800','#2D9CDB','#27AE60','#9B59B6']

export default function Dashboard() {
  const [stats,    setStats]    = useState(null)
  const [content,  setContent]  = useState([])
  const [cats,     setCats]     = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/users/stats'),
      api.get('/content?limit=100'),
      api.get('/categories'),
    ]).then(([s, c, cats]) => {
      setStats(s.data)
      setContent(c.data.data || [])
      setCats(cats.data || [])
    }).finally(() => setLoading(false))
  }, [])

  // Aggregate content by type
  const byType = content.reduce((acc, c) => {
    acc[c.content_type] = (acc[c.content_type] || 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(byType).map(([name, value]) => ({ name, value }))

  // Views by category (mock top 6)
  const catViews = cats.slice(0,6).map(c => ({
    name: c.name.slice(0,8),
    count: c.content_count || 0,
  }))

  const plans = [
    { name:'Free', value: Math.max(0, (stats?.active_users || 0) - (stats?.active_subscriptions || 0)) },
    { name:'Paid', value: stats?.active_subscriptions || 0 },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back — here's what's happening on SpeedoPrime."
      />

      {/* Stat Cards */}
      <div style={s.grid4}>
        <StatCard label="Total Users"        value={stats?.total_users}          icon={Users}     color="var(--blue)"  loading={loading} />
        <StatCard label="Active Users"       value={stats?.active_users}         icon={UserCheck} color="var(--green)" loading={loading} delta={stats?.new_users_7d} />
        <StatCard label="Total Content"      value={stats?.total_content}        icon={Film}      color="var(--accent)" loading={loading} delta={stats?.new_content_30d} />
        <StatCard label="Active Subs"        value={stats?.active_subscriptions} icon={CreditCard} color="var(--gold)"  loading={loading} />
      </div>

      <div style={s.grid2}>
        {/* Content by Type — Pie */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Content by Type</h2>
          {loading ? <div className="skeleton" style={{ height:240 }} /> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                  paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                  labelLine={false} fontSize={11}>
                  {pieData.map((_, i) => <Cell key={i} fill={CONTENT_TYPES_COLORS[i % CONTENT_TYPES_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Content per Category — Area */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Content per Category</h2>
          {loading ? <div className="skeleton" style={{ height:240 }} /> : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={catViews} margin={{ top:10, right:10, left:-20, bottom:0 }}>
                <defs>
                  <linearGradient id="gAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill:'var(--text3)', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'var(--text3)', fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} />
                <Area type="monotone" dataKey="count" stroke="var(--accent)" fill="url(#gAcc)" strokeWidth={2} dot={{ fill:'var(--accent)', r:3 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={s.grid2}>
        {/* Free vs Paid */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Free vs Paid Users</h2>
          {loading ? <div className="skeleton" style={{ height:200 }} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={plans} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} fontSize={12}>
                  <Cell fill="var(--text3)" />
                  <Cell fill="var(--gold)"  />
                </Pie>
                <Tooltip contentStyle={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} />
                <Legend wrapperStyle={{ fontSize:12, color:'var(--text2)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick Stats */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Platform Summary</h2>
          <div style={s.summaryList}>
            {[
              { label:'Total Views',         value: stats?.total_views?.toLocaleString() },
              { label:'New Users (7 days)',   value: stats?.new_users_7d },
              { label:'New Content (30 days)',value: stats?.new_content_30d },
              { label:'Categories',           value: cats.length },
            ].map(r => (
              <div key={r.label} style={s.summaryRow}>
                <span style={s.summaryLabel}>{r.label}</span>
                <span style={s.summaryValue}>{loading ? '—' : r.value ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  grid4: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:24 },
  grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 },
  card:  { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'20px 24px' },
  cardTitle: { fontFamily:'var(--font-head)', fontSize:15, fontWeight:700, marginBottom:20, color:'var(--text)' },
  summaryList: { display:'flex', flexDirection:'column', gap:0 },
  summaryRow:  { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'1px solid var(--border)' },
  summaryLabel:{ fontSize:13, color:'var(--text2)' },
  summaryValue:{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:700, color:'var(--text)' },
}
