import { useEffect, useState } from 'react'
import { Users, Film, Eye, CreditCard, UserCheck, TrendingUp, Clock, Star } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import api from '../api/client'
import { StatCard, PageHeader, Badge } from '../components/UI'

const CONTENT_COLORS = ['#FF2D55','#FF6B35','#FFB800','#2D9CDB','#27AE60','#9B59B6']

// ── Tiny thumbnail card used in "Recent Additions" ───────────────────────────
function ContentThumbCard({ item }) {
  const [imgErr, setImgErr] = useState(false)
  const typeColor = t => ({
    Movie: '#2D9CDB', Series: '#FF2D55', 'TV Show': '#FFB800',
    Documentary: '#27AE60', Anime: '#9B59B6',
  })[t] || '#5A5B60'

  return (
    <div style={ts.card}>
      {/* Thumbnail */}
      <div style={ts.imgWrap}>
        {item.thumbnail_url && !imgErr
          ? <img src={item.thumbnail_url} alt={item.title} style={ts.img} onError={() => setImgErr(true)} />
          : (
            <div style={ts.imgPlaceholder}>
              <Film size={20} color="rgba(255,255,255,0.15)" />
            </div>
          )
        }
        {/* Premium badge */}
        {item.is_premium && (
          <div style={ts.premBadge}>PRE</div>
        )}
        {/* Rating pill */}
        {item.rating > 0 && (
          <div style={ts.ratingPill}>
            <Star size={8} fill="#FFB800" color="#FFB800" />
            <span>{Number(item.rating).toFixed(1)}</span>
          </div>
        )}
      </div>
      {/* Info */}
      <div style={ts.info}>
        <div style={ts.title}>{item.title}</div>
        <div style={ts.meta}>
          <span style={{ ...ts.typeDot, background: typeColor(item.content_type) }} />
          <span style={ts.metaText}>{item.content_type}</span>
          {item.release_year && <span style={ts.metaText}> · {item.release_year}</span>}
        </div>
        {item.director && (
          <div style={ts.director}>Dir: {item.director}</div>
        )}
      </div>
    </div>
  )
}

const ts = {
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 10, overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    transition: 'border-color 0.15s',
  },
  imgWrap: { position: 'relative', aspectRatio: '16/9', background: 'var(--surface2)', overflow: 'hidden' },
  img: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  imgPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  premBadge: {
    position: 'absolute', top: 6, left: 6,
    background: 'rgba(255,184,0,0.9)', color: '#000',
    fontSize: 8, fontWeight: 800, letterSpacing: '0.5px',
    padding: '2px 5px', borderRadius: 4,
  },
  ratingPill: {
    position: 'absolute', bottom: 6, right: 6,
    background: 'rgba(0,0,0,0.7)', borderRadius: 5,
    display: 'flex', alignItems: 'center', gap: 3,
    padding: '2px 6px', fontSize: 10, color: '#FFB800', fontWeight: 700,
  },
  info: { padding: '10px 12px' },
  title: { fontWeight: 700, fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 },
  meta: { display: 'flex', alignItems: 'center', gap: 5 },
  typeDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  metaText: { fontSize: 10, color: 'var(--text3)' },
  director: { fontSize: 10, color: 'var(--text3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
}

// ── Top content row ──────────────────────────────────────────────────────────
function TopContentRow({ item, rank }) {
  const [imgErr, setImgErr] = useState(false)
  return (
    <div style={tc.row}>
      <span style={tc.rank}>{rank}</span>
      {/* Thumbnail */}
      <div style={tc.thumb}>
        {item.thumbnail_url && !imgErr
          ? <img src={item.thumbnail_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgErr(true)} />
          : <div style={{ background: 'var(--surface2)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Film size={12} color="var(--text3)" />
            </div>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={tc.title}>{item.title}</div>
        <div style={{ fontSize: 10, color: 'var(--text3)' }}>{item.content_type} · {item.release_year || '—'}</div>
      </div>
      <div style={tc.views}>
        <Eye size={11} color="var(--text3)" />
        <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>
          {formatViews(item.total_views)}
        </span>
      </div>
      {item.rating > 0 && (
        <div style={tc.rating}>
          <Star size={10} fill="#FFB800" color="#FFB800" />
          <span>{Number(item.rating).toFixed(1)}</span>
        </div>
      )}
    </div>
  )
}

const tc = {
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' },
  rank: { fontSize: 13, fontWeight: 700, color: 'var(--text3)', width: 20, textAlign: 'center', flexShrink: 0 },
  thumb: { width: 44, height: 28, borderRadius: 5, overflow: 'hidden', flexShrink: 0 },
  title: { fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  views: { display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 },
  rating: { display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#FFB800', fontWeight: 700, flexShrink: 0 },
}

function formatViews(v = 0) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`
  if (v >= 1000)    return `${(v / 1000).toFixed(0)}K`
  return v
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats,   setStats]   = useState(null)
  const [content, setContent] = useState([])
  const [cats,    setCats]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/users/stats'),
      api.get('/content?limit=100'),
      api.get('/categories'),
    ]).then(([s, c, cat]) => {
      setStats(s.data)
      setContent(c.data.data || [])
      setCats(cat.data || [])
    }).finally(() => setLoading(false))
  }, [])

  // Content by type — pie
  const byType = content.reduce((acc, c) => {
    acc[c.content_type] = (acc[c.content_type] || 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(byType).map(([name, value]) => ({ name, value }))

  // Content per category — area chart
  const catViews = cats.slice(0, 6).map(c => ({
    name:  c.name.slice(0, 8),
    count: c.content_count || 0,
  }))

  // Free vs Paid
  const plans = [
    { name: 'Free', value: Math.max(0, (stats?.active_users || 0) - (stats?.active_subscriptions || 0)) },
    { name: 'Paid', value: stats?.active_subscriptions || 0 },
  ]

  // Recent additions (latest 8 by creation order — API already returns newest first)
  const recentContent = content.slice(0, 8)

  // Top content by views (sorted)
  const topContent = [...content]
    .sort((a, b) => (b.total_views || 0) - (a.total_views || 0))
    .slice(0, 8)

  // Premium breakdown
  const premiumCount = content.filter(c => c.is_premium).length
  const freeCount    = content.length - premiumCount

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back — here's what's happening on SpeedoPrime."
      />

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div style={s.grid4}>
        <StatCard label="Total Users"    value={stats?.total_users}          icon={Users}      color="var(--blue)"   loading={loading} />
        <StatCard label="Active Users"   value={stats?.active_users}         icon={UserCheck}  color="var(--green)"  loading={loading} delta={stats?.new_users_7d} />
        <StatCard label="Total Content"  value={stats?.total_content}        icon={Film}       color="var(--accent)" loading={loading} delta={stats?.new_content_30d} />
        <StatCard label="Active Subs"    value={stats?.active_subscriptions} icon={CreditCard} color="var(--gold)"   loading={loading} />
      </div>

      {/* ── Charts Row 1 ─────────────────────────────────────────────────── */}
      <div style={s.grid2}>
        {/* Content by Type — Donut */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Content by Type</h2>
          {loading
            ? <div className="skeleton" style={{ height: 240 }} />
            : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={58} outerRadius={92}
                    paddingAngle={3} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false} fontSize={11}>
                    {pieData.map((_, i) => <Cell key={i} fill={CONTENT_COLORS[i % CONTENT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Content per Category — Area */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Content per Category</h2>
          {loading
            ? <div className="skeleton" style={{ height: 240 }} />
            : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={catViews} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gAcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" stroke="var(--accent)" fill="url(#gAcc)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>

      {/* ── Recent Additions (thumbnail grid) ─────────────────────────────── */}
      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ ...s.cardTitle, marginBottom: 0 }}>
            <Clock size={15} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Recently Added
          </h2>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{recentContent.length} items</span>
        </div>
        {loading
          ? (
            <div style={s.thumbGrid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 10 }} />
              ))}
            </div>
          )
          : recentContent.length === 0
            ? <p style={{ color: 'var(--text3)', fontSize: 13 }}>No content yet.</p>
            : (
              <div style={s.thumbGrid}>
                {recentContent.map(c => <ContentThumbCard key={c.content_id} item={c} />)}
              </div>
            )
        }
      </div>

      {/* ── Charts Row 2 ─────────────────────────────────────────────────── */}
      <div style={s.grid2}>
        {/* Free vs Paid pie */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Free vs Paid Users</h2>
          {loading
            ? <div className="skeleton" style={{ height: 200 }} />
            : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={plans} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`} fontSize={12}>
                    <Cell fill="var(--text3)" />
                    <Cell fill="var(--gold)" />
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text2)' }} />
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Platform summary */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Platform Summary</h2>
          <div style={s.summaryList}>
            {[
              { label: 'Total Views',          value: stats?.total_views?.toLocaleString() },
              { label: 'New Users (7 days)',    value: stats?.new_users_7d },
              { label: 'New Content (30 days)', value: stats?.new_content_30d },
              { label: 'Categories',            value: cats.length },
              { label: 'Premium Titles',        value: loading ? '—' : premiumCount },
              { label: 'Free Titles',           value: loading ? '—' : freeCount },
            ].map(r => (
              <div key={r.label} style={s.summaryRow}>
                <span style={s.summaryLabel}>{r.label}</span>
                <span style={s.summaryValue}>{loading ? '—' : r.value ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top Content by Views ──────────────────────────────────────────── */}
      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 style={{ ...s.cardTitle, marginBottom: 0 }}>
            <TrendingUp size={15} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Top Content by Views
          </h2>
        </div>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8, marginTop: 8 }} />
            ))
          : topContent.length === 0
            ? <p style={{ color: 'var(--text3)', fontSize: 13, paddingTop: 12 }}>No content yet.</p>
            : topContent.map((c, i) => (
                <TopContentRow key={c.content_id} item={c} rank={i + 1} />
              ))
        }
      </div>
    </div>
  )
}

const s = {
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 24 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 },
  card:  { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 24 },
  cardTitle: { fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 20, color: 'var(--text)' },
  summaryList: { display: 'flex', flexDirection: 'column', gap: 0 },
  summaryRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' },
  summaryLabel: { fontSize: 13, color: 'var(--text2)' },
  summaryValue: { fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: 'var(--text)' },
  thumbGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 14,
  },
}