import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Megaphone, TrendingUp, Users, DollarSign, Eye, MousePointer,
  CheckCircle, XCircle, Clock, Play, Pause, BarChart2, RefreshCw,
  Plus, Edit2, Trash2, Search, Shield, ShieldOff, AlertTriangle,
  ArrowUpRight, Film, Zap, Star, Image, Video,
  ExternalLink, Ban, Layers, Upload, X,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import api from '../api/client'
import { PageHeader, Badge, Btn, Modal, Input, Select, Table, toast } from '../components/UI'

// ─── Constants ─────────────────────────────────────────────────────────────────
const AD_TYPES    = ['pre_roll', 'mid_roll', 'banner', 'overlay']
const AD_STATUSES = ['pending', 'approved', 'rejected', 'active', 'paused', 'completed']
const CHART_COLORS = ['#FF2D55', '#FF6B35', '#FFB800', '#2D9CDB', '#27AE60', '#9B59B6']

const STATUS_META = {
  pending:   { color: '#FFB800',        label: 'Pending Review' },
  approved:  { color: 'var(--blue)',    label: 'Approved' },
  rejected:  { color: 'var(--accent)',  label: 'Rejected' },
  active:    { color: 'var(--green)',   label: 'Active' },
  paused:    { color: 'var(--text3)',   label: 'Paused' },
  completed: { color: '#9B59B6',        label: 'Completed' },
}

const TYPE_META = {
  pre_roll:  { color: 'var(--accent)', icon: Play,   label: 'Pre-roll' },
  mid_roll:  { color: '#FF6B35',       icon: Layers, label: 'Mid-roll' },
  banner:    { color: 'var(--blue)',   icon: Image,  label: 'Banner' },
  overlay:   { color: '#9B59B6',       icon: Film,   label: 'Overlay' },
}

const fmtNum  = n => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : (n || 0)
const fmtCur  = n => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtCTR  = (clicks, imp) => imp > 0 ? `${((clicks / imp) * 100).toFixed(2)}%` : '—'

// ─── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview',    label: 'Overview',     icon: BarChart2   },
  { key: 'submissions', label: 'Submissions',  icon: Clock       },
  { key: 'campaigns',   label: 'Campaigns',    icon: Megaphone   },
  { key: 'advertisers', label: 'Advertisers',  icon: Users       },
  { key: 'revenue',     label: 'Revenue',      icon: DollarSign  },
]

// ─── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color, sub, loading, accent = false }) {
  return (
    <div style={{
      background: accent ? `linear-gradient(135deg, ${color}18, ${color}08)` : 'var(--surface)',
      border: `1px solid ${accent ? color + '33' : 'var(--border)'}`,
      borderTop: `3px solid ${color}`,
      borderRadius: 'var(--radius)',
      padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
        {sub !== undefined && (
          <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
            <ArrowUpRight size={11} />{sub}
          </span>
        )}
      </div>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: 'var(--text)', marginBottom: 4 }}>
        {loading ? '—' : value ?? '—'}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>{label}</div>
    </div>
  )
}

// ─── Ad Creative Preview ───────────────────────────────────────────────────────
function CreativePreview({ ad, size = 'sm' }) {
  const [err, setErr] = useState(false)
  const h = size === 'sm' ? 40 : 90
  const w = size === 'sm' ? 72 : 160
  const url = ad.image_url
    ? (ad.image_url.startsWith('http') ? ad.image_url : `http://103.88.81.7:5000${ad.image_url}`)
    : null

  return (
    <div style={{ width: w, height: h, borderRadius: 6, overflow: 'hidden', background: 'var(--surface2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
      {url && !err
        ? <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
        : ad.ad_type === 'pre_roll' || ad.ad_type === 'mid_roll'
          ? <Play  size={size === 'sm' ? 14 : 24} color="var(--text3)" />
          : <Image size={size === 'sm' ? 14 : 24} color="var(--text3)" />
      }
    </div>
  )
}

// ─── File Upload Input ─────────────────────────────────────────────────────────
function FileUploadInput({ label, accept, file, onFile, hint, icon: Icon = Upload }) {
  const ref = useRef()
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>{label}</div>
      <div
        onClick={() => ref.current.click()}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: file ? 'rgba(39,174,96,0.08)' : 'var(--surface2)',
          border: `1px dashed ${file ? 'rgba(39,174,96,0.4)' : 'var(--border)'}`,
          borderRadius: 8, padding: '10px 14px', cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <Icon size={16} color={file ? 'var(--green)' : 'var(--text3)'} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: file ? 'var(--text)' : 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file ? file.name : `Click to upload ${label.toLowerCase()}`}
          </div>
          {hint && !file && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{hint}</div>}
        </div>
        {file && (
          <span onClick={e => { e.stopPropagation(); onFile(null) }} style={{ color: 'var(--text3)', cursor: 'pointer', lineHeight: 1 }}>
            <X size={14} />
          </span>
        )}
      </div>
      <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} onChange={e => onFile(e.target.files[0] || null)} />
    </div>
  )
}

// ─── Section Label ─────────────────────────────────────────────────────────────
function SectionLabel({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

// ─── Search Input ──────────────────────────────────────────────────────────────
function SearchBox({ value, onChange, placeholder = 'Search…', width = 220 }) {
  return (
    <div style={{ position: 'relative' }}>
      <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px 8px 30px', color: 'var(--text)', fontSize: 13, outline: 'none', width }} />
    </div>
  )
}

function FilterSel({ value, onChange, children }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: value ? 'var(--text)' : 'var(--text3)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
      {children}
    </select>
  )
}

function Pager({ page, pages, onChange }) {
  if (pages <= 1) return null
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
      <Btn size="sm" variant="ghost" disabled={page === 1} onClick={() => onChange(p => p - 1)}>Prev</Btn>
      <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--text2)' }}>{page} / {pages}</span>
      <Btn size="sm" variant="ghost" disabled={page === pages} onClick={() => onChange(p => p + 1)}>Next</Btn>
    </div>
  )
}

function StatPill({ icon: Icon, val, color = 'var(--text3)' }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color }}>
      <Icon size={11} /> {val}
    </span>
  )
}

function Empty({ label = 'No data yet.', icon: Icon = Megaphone }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', color: 'var(--text3)' }}>
      <Icon size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
      <div style={{ fontSize: 14 }}>{label}</div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function SpeedoAds() {
  const [tab,     setTab]     = useState('overview')
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/speedoads/stats')
      setStats(data)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load stats')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  const ov = stats?.overview || {}
  const pendingCount = ov.pending_submissions || 0

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(255,45,85,0.15)', border: '1px solid rgba(255,45,85,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Megaphone size={20} color="var(--accent)" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>SpeedoAds</h1>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Ad network platform · Manage advertisers & campaigns</p>
          </div>
        </div>
        <Btn variant="ghost" onClick={loadStats}><RefreshCw size={13} /> Refresh</Btn>
      </div>

      {error && (
        <div style={{ background: 'rgba(255,45,85,0.08)', border: '1px solid rgba(255,45,85,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--accent)' }}>
          ⚠ {error} — make sure <code>SpeedoAds_Campaigns</code> and <code>SpeedoAds_Advertisers</code> tables exist in your DB.
        </div>
      )}

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>
        <KpiCard label="Total Advertisers"  value={fmtNum(ov.total_advertisers)}  icon={Users}        color="var(--blue)"   sub={ov.new_advertisers_7d ? `+${ov.new_advertisers_7d} this week` : undefined} loading={loading} />
        <KpiCard label="Active Campaigns"   value={fmtNum(ov.active_campaigns)}   icon={Megaphone}    color="var(--green)"  loading={loading} />
        <KpiCard label="Pending Review"     value={fmtNum(ov.pending_submissions)} icon={Clock}       color="#FFB800"       loading={loading} accent={pendingCount > 0} />
        <KpiCard label="Total Revenue"      value={fmtCur(ov.total_revenue)}      icon={DollarSign}   color="var(--gold)"   sub={ov.revenue_30d ? `${fmtCur(ov.revenue_30d)} this month` : undefined} loading={loading} />
        <KpiCard label="Impressions Served" value={fmtNum(ov.total_impressions)}  icon={Eye}          color="#9B59B6"       loading={loading} />
        <KpiCard label="Avg CTR"            value={ov.avg_ctr ? `${ov.avg_ctr}%` : '—'} icon={MousePointer} color="var(--accent)" loading={loading} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 28, gap: 2, overflowX: 'auto' }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 18px', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 14, fontWeight: 600,
            fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
            color: tab === key ? 'var(--text)' : 'var(--text3)',
            borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
            transition: 'all 0.15s',
          }}>
            <Icon size={14} />
            {label}
            {key === 'submissions' && pendingCount > 0 && (
              <span style={{ background: '#FFB800', color: '#000', borderRadius: 10, fontSize: 10, fontWeight: 800, padding: '1px 7px', lineHeight: '18px' }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'overview'    && <OverviewTab    stats={stats} loading={loading} />}
      {tab === 'submissions' && <SubmissionsTab onRefresh={loadStats} />}
      {tab === 'campaigns'   && <CampaignsTab  onRefresh={loadStats} />}
      {tab === 'advertisers' && <AdvertisersTab onRefresh={loadStats} />}
      {tab === 'revenue'     && <RevenueTab     stats={stats} loading={loading} />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// OVERVIEW TAB — real data only
// ══════════════════════════════════════════════════════════════════════════════
function OverviewTab({ stats, loading }) {
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[300, 260, 200].map((h, i) => <div key={i} className="skeleton" style={{ height: h, borderRadius: 'var(--radius)' }} />)}
    </div>
  )

  const daily        = stats?.daily_impressions   || []
  const typeDist     = stats?.type_distribution   || []
  const topCampaigns = stats?.top_campaigns       || []

  const hasImpData = daily.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Daily impressions chart */}
      <div style={card}>
        <h3 style={cardTitle}>Daily Impressions & Revenue (Last 14 Days)</h3>
        {!hasImpData ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: 13 }}>
            No impression data yet. Data populates as ads are served.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={daily} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gImp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--blue)"  stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--blue)"  stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--gold)"  stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--gold)"  stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left"  tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Area yAxisId="left"  type="monotone" dataKey="impressions" name="Impressions" stroke="var(--blue)" fill="url(#gImp)" strokeWidth={2} dot={false} />
              <Area yAxisId="right" type="monotone" dataKey="revenue"     name="Revenue (₹)" stroke="var(--gold)" fill="url(#gRev)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={card}>
          <h3 style={cardTitle}>Impressions by Ad Type</h3>
          {typeDist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)', fontSize: 13 }}>No campaigns yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={typeDist} dataKey="impressions" nameKey="type" cx="50%" cy="50%" outerRadius={75} innerRadius={40}
                  label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
                  {typeDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Avg CTR by Ad Type</h3>
          {typeDist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)', fontSize: 13 }}>No campaigns yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={typeDist} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="type" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={v => `${v}%`} contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="ctr" name="CTR %" radius={[4, 4, 0, 0]}>
                  {typeDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={card}>
        <h3 style={cardTitle}>Top Performing Campaigns</h3>
        {topCampaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)', fontSize: 13 }}>No campaigns have run yet.</div>
        ) : topCampaigns.map((c, i) => {
          const TypeIcon = TYPE_META[c.ad_type]?.icon || Play
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', width: 22, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: (TYPE_META[c.ad_type]?.color || 'var(--text3)') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TypeIcon size={15} color={TYPE_META[c.ad_type]?.color || 'var(--text3)'} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{c.advertiser}</div>
              </div>
              <div style={{ display: 'flex', gap: 20, flexShrink: 0, fontSize: 12 }}>
                <StatPill icon={Eye}          val={fmtNum(c.impressions)} />
                <StatPill icon={MousePointer} val={fmtCTR(c.clicks, c.impressions)} color="var(--green)" />
                <StatPill icon={DollarSign}   val={fmtCur(c.spend)}      color="var(--gold)" />
              </div>
              <Badge label={c.status} color={STATUS_META[c.status]?.color || 'var(--text3)'} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SUBMISSIONS TAB
// ══════════════════════════════════════════════════════════════════════════════
function SubmissionsTab({ onRefresh }) {
  const [rows,       setRows]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('pending')
  const [search,     setSearch]     = useState('')
  const [reviewing,  setReviewing]  = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [processing, setProcessing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/speedoads/submissions', { params: { status: filter, search } })
      setRows(data || [])
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to load', 'error')
      setRows([])
    } finally { setLoading(false) }
  }, [filter, search])

  useEffect(() => { load() }, [load])

  const approve = async id => {
    setProcessing(id)
    try {
      await api.post(`/speedoads/submissions/${id}/approve`)
      toast('Ad approved & campaign activated')
      setReviewing(null); load(); onRefresh()
    } catch { toast('Approval failed', 'error') }
    finally { setProcessing(null) }
  }

  const reject = async id => {
    if (!rejectNote.trim()) { toast('Please provide a rejection reason', 'error'); return }
    setProcessing(id)
    try {
      await api.post(`/speedoads/submissions/${id}/reject`, { note: rejectNote })
      toast('Ad rejected')
      setReviewing(null); setRejectNote(''); load(); onRefresh()
    } catch { toast('Rejection failed', 'error') }
    finally { setProcessing(null) }
  }

  const STATUS_FILTERS = ['pending', 'approved', 'rejected', 'all']

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {STATUS_FILTERS.map(s => {
            const meta = STATUS_META[s] || { color: 'var(--text3)' }
            const active = filter === s
            return (
              <button key={s} onClick={() => setFilter(s)} style={{
                padding: '6px 14px', borderRadius: 8, border: `1px solid ${active ? meta.color + '60' : 'var(--border)'}`,
                background: active ? meta.color + '18' : 'var(--surface2)', color: active ? meta.color : 'var(--text3)',
                fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'all 0.15s',
                textTransform: 'capitalize',
              }}>{s}</button>
            )
          })}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <SearchBox value={search} onChange={v => setSearch(v)} placeholder="Search by title or advertiser…" width={260} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius)' }} />)}
        </div>
      ) : rows.length === 0 ? (
        <Empty label={`No ${filter === 'all' ? '' : filter} submissions.`} icon={Clock} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map(ad => {
            const typeMeta   = TYPE_META[ad.ad_type]   || {}
            const statusMeta = STATUS_META[ad.status]  || {}
            const TypeIcon   = typeMeta.icon || Play
            return (
              <div key={ad.id || ad.ad_id} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                background: 'var(--surface)', border: `1px solid ${ad.status === 'pending' ? 'rgba(255,184,0,0.2)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', padding: '16px 20px',
              }}>
                <CreativePreview ad={ad} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.title}</span>
                    <Badge label={typeMeta.label || ad.ad_type} color={typeMeta.color || 'var(--text3)'} />
                    <Badge label={statusMeta.label || ad.status} color={statusMeta.color || 'var(--text3)'} />
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text3)', flexWrap: 'wrap' }}>
                    <span>By: <span style={{ color: 'var(--text2)', fontWeight: 600 }}>{ad.advertiser_name || '—'}</span></span>
                    <span>Budget: <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{fmtCur(ad.budget)}</span></span>
                    <span>CPM: <span style={{ color: 'var(--text2)' }}>{fmtCur(ad.cpm)}</span></span>
                    <span>Duration: <span style={{ color: 'var(--text2)' }}>{ad.duration_secs || '—'}s</span></span>
                    <span>Submitted: <span style={{ color: 'var(--text2)' }}>{fmtDate(ad.created_at)}</span></span>
                  </div>
                  {ad.target_url && (
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ExternalLink size={10} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>{ad.target_url}</span>
                    </div>
                  )}
                  {ad.rejection_note && (
                    <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 6, background: 'rgba(255,45,85,0.08)', borderRadius: 6, padding: '5px 10px', display: 'inline-block' }}>
                      Rejected: {ad.rejection_note}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Btn size="sm" variant="ghost" onClick={() => setReviewing(ad)}>
                    <Eye size={13} /> Review
                  </Btn>
                  {ad.status === 'pending' && (
                    <>
                      <Btn size="sm" variant="success" disabled={processing === (ad.id || ad.ad_id)} onClick={() => approve(ad.id || ad.ad_id)}>
                        <CheckCircle size={13} /> Approve
                      </Btn>
                      <Btn size="sm" variant="danger" onClick={() => { setReviewing(ad); setRejectNote('') }}>
                        <XCircle size={13} /> Reject
                      </Btn>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {reviewing && (
        <Modal open onClose={() => { setReviewing(null); setRejectNote('') }} title="Review Ad Submission" width={620}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <CreativePreview ad={reviewing} size="lg" />
            <SectionLabel label="Ad Details" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Title',       reviewing.title],
                ['Advertiser',  reviewing.advertiser_name],
                ['Type',        reviewing.ad_type],
                ['Duration',    `${reviewing.duration_secs || '—'}s`],
                ['Budget',      fmtCur(reviewing.budget)],
                ['CPM',         fmtCur(reviewing.cpm)],
                ['Target URL',  reviewing.target_url],
                ['Submitted',   fmtDate(reviewing.created_at)],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</div>
                </div>
              ))}
            </div>
            {reviewing.status === 'pending' && (
              <>
                <SectionLabel label="Rejection Note (required to reject)" />
                <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Explain why this ad is being rejected…" rows={3}
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%', resize: 'vertical' }}
                />
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <Btn variant="ghost" onClick={() => { setReviewing(null); setRejectNote('') }}>Close</Btn>
            {reviewing.status === 'pending' && (
              <>
                <Btn variant="danger" disabled={processing === (reviewing.id || reviewing.ad_id)} onClick={() => reject(reviewing.id || reviewing.ad_id)}>
                  <XCircle size={13} /> {processing ? 'Rejecting…' : 'Reject Ad'}
                </Btn>
                <Btn variant="success" disabled={processing === (reviewing.id || reviewing.ad_id)} onClick={() => approve(reviewing.id || reviewing.ad_id)}>
                  <CheckCircle size={13} /> {processing ? 'Approving…' : 'Approve & Activate'}
                </Btn>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// CAMPAIGNS TAB — with real file upload
// ══════════════════════════════════════════════════════════════════════════════
const EMPTY_CAMPAIGN = { title: '', ad_type: 'pre_roll', target_url: '', budget: '', cpm: '', duration_secs: 15, start_date: '', end_date: '', image_url: '', video_url: '' }

function CampaignsTab({ onRefresh }) {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [status,  setStatus]  = useState('')
  const [type,    setType]    = useState('')
  const [page,    setPage]    = useState(1)
  const [total,   setTotal]   = useState(0)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState(EMPTY_CAMPAIGN)
  const [imageFile, setImageFile] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [saving,  setSaving]  = useState(false)
  const LIMIT = 15

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/speedoads/campaigns', { params: { page, limit: LIMIT, search, status, type } })
      setRows(data.data || data || [])
      setTotal(data.total || (Array.isArray(data) ? data.length : 0))
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to load campaigns', 'error')
      setRows([])
    } finally { setLoading(false) }
  }, [page, search, status, type])

  useEffect(() => { load() }, [load])

  const openEdit = r => {
    setEditing(r.id || r.campaign_id)
    setForm({ title: r.title, ad_type: r.ad_type, target_url: r.target_url || '', budget: r.budget || '', cpm: r.cpm || '', duration_secs: r.duration_secs || 15, start_date: r.start_date ? r.start_date.split('T')[0] : '', end_date: r.end_date ? r.end_date.split('T')[0] : '', image_url: r.image_url || '', video_url: r.video_url || '' })
    setImageFile(null); setVideoFile(null)
    setModal(true)
  }

  const save = async () => {
    if (!form.title.trim()) return toast('Title is required', 'error')
    setSaving(true)
    try {
      // Always use FormData so files can be included
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null) fd.append(k, v) })
      if (imageFile) fd.append('image', imageFile)
      if (videoFile) fd.append('video', videoFile)

      if (editing) {
        await api.put(`/speedoads/campaigns/${editing}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        await api.post('/speedoads/campaigns', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      toast(editing ? 'Campaign updated' : 'Campaign created')
      setModal(false); setImageFile(null); setVideoFile(null)
      load(); onRefresh()
    } catch (e) { toast(e.response?.data?.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  const togglePause = async (id, status) => {
    try {
      await api.post(`/speedoads/campaigns/${id}/toggle`, { status: status === 'active' ? 'paused' : 'active' })
      toast(status === 'active' ? 'Campaign paused' : 'Campaign resumed')
      load()
    } catch { toast('Failed', 'error') }
  }

  const del = async id => {
    if (!confirm('Remove this campaign?')) return
    try { await api.delete(`/speedoads/campaigns/${id}`); toast('Removed'); load() }
    catch { toast('Delete failed', 'error') }
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const cols = [
    { key: 'title', label: 'Campaign', width: '22%', render: r => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <CreativePreview ad={r} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.advertiser_name || '—'}</div>
        </div>
      </div>
    )},
    { key: 'ad_type', label: 'Type', width: '10%', render: r => {
      const tm = TYPE_META[r.ad_type] || {}
      return <Badge label={tm.label || r.ad_type} color={tm.color || 'var(--text3)'} />
    }},
    { key: 'status', label: 'Status', width: '10%', render: r => {
      const sm = STATUS_META[r.status] || {}
      return <Badge label={sm.label || r.status} color={sm.color || 'var(--text3)'} />
    }},
    { key: 'budget', label: 'Budget', width: '10%', render: r => (
      <div>
        <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--gold)' }}>{fmtCur(r.budget)}</div>
        <div style={{ fontSize: 10, color: 'var(--text3)' }}>Spent: {fmtCur(r.spend || 0)}</div>
      </div>
    )},
    { key: 'impressions', label: 'Impressions', width: '9%', render: r => fmtNum(r.impressions || 0) },
    { key: 'clicks', label: 'CTR', width: '7%', render: r => <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: 12 }}>{fmtCTR(r.clicks, r.impressions)}</span> },
    { key: 'end_date', label: 'Ends', width: '10%', render: r => r.end_date ? fmtDate(r.end_date) : 'No end' },
    { key: 'actions', label: '', width: '12%', render: r => (
      <div style={{ display: 'flex', gap: 5 }}>
        {(r.status === 'active' || r.status === 'paused') && (
          <Btn size="sm" variant="ghost" onClick={() => togglePause(r.id || r.campaign_id, r.status)} title={r.status === 'active' ? 'Pause' : 'Resume'}>
            {r.status === 'active' ? <Pause size={12} /> : <Play size={12} />}
          </Btn>
        )}
        <Btn size="sm" variant="ghost"  onClick={() => openEdit(r)}><Edit2 size={12} /></Btn>
        <Btn size="sm" variant="danger" onClick={() => del(r.id || r.campaign_id)}><Trash2 size={12} /></Btn>
      </div>
    )},
  ]

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchBox value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search campaigns…" />
        <FilterSel value={status} onChange={v => { setStatus(v); setPage(1) }}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </FilterSel>
        <FilterSel value={type} onChange={v => { setType(v); setPage(1) }}>
          <option value="">All Types</option>
          {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </FilterSel>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>{total} campaigns</span>
        <Btn onClick={() => { setEditing(null); setForm(EMPTY_CAMPAIGN); setImageFile(null); setVideoFile(null); setModal(true) }}>
          <Plus size={14} /> New Campaign
        </Btn>
      </div>

      <Table cols={cols} rows={rows} loading={loading} empty="No campaigns yet. Create one above." />
      <Pager page={page} pages={Math.ceil(total / LIMIT)} onChange={setPage} />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Campaign' : 'New Campaign'} width={660}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionLabel label="Campaign Details" />
          <Input label="Campaign Title *" value={form.title} onChange={f('title')} placeholder="e.g. Diwali Sale 2024" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Ad Type *</label>
              <select value={form.ad_type} onChange={f('ad_type')} style={sel}>
                {AD_TYPES.map(t => <option key={t} value={t}>{TYPE_META[t]?.label || t}</option>)}
              </select>
            </div>
            <Input label="Duration (seconds)" type="number" value={form.duration_secs} onChange={f('duration_secs')} placeholder="15" />
            <Input label="Total Budget (₹) *" type="number" step="0.01" value={form.budget}     onChange={f('budget')}     placeholder="5000.00" />
            <Input label="CPM (₹ per 1000)"   type="number" step="0.01" value={form.cpm}        onChange={f('cpm')}        placeholder="25.00" />
            <Input label="Start Date" type="date" value={form.start_date} onChange={f('start_date')} />
            <Input label="End Date"   type="date" value={form.end_date}   onChange={f('end_date')} />
          </div>
          <Input label="Click Target URL *" value={form.target_url} onChange={f('target_url')} placeholder="https://your-product.com" />

          <SectionLabel label="Creative Assets (upload file OR paste URL)" />

          {/* Image creative */}
          <FileUploadInput
            label="Banner / Thumbnail Image"
            accept="image/jpeg,image/png,image/webp,image/gif"
            file={imageFile}
            onFile={setImageFile}
            hint="JPG, PNG, WebP, GIF — shown as banner/thumbnail"
            icon={Image}
          />
          {!imageFile && (
            <Input label="Or paste image URL" value={form.image_url} onChange={f('image_url')} placeholder="https://…/banner.jpg" />
          )}
          {(imageFile || form.image_url) && !imageFile && (
            <div style={{ borderRadius: 8, overflow: 'hidden', height: 80, background: 'var(--surface2)' }}>
              <img src={form.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.opacity = 0.2} />
            </div>
          )}

          {/* Video creative (pre-roll / mid-roll) */}
          {(form.ad_type === 'pre_roll' || form.ad_type === 'mid_roll') && (
            <>
              <FileUploadInput
                label="Ad Video File"
                accept="video/mp4,video/webm,video/quicktime"
                file={videoFile}
                onFile={setVideoFile}
                hint="MP4, WebM — shown as video ad in the player"
                icon={Video}
              />
              {!videoFile && (
                <Input label="Or paste video URL" value={form.video_url} onChange={f('video_url')} placeholder="https://…/ad.mp4" />
              )}
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update Campaign' : 'Create Campaign'}</Btn>
        </div>
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ADVERTISERS TAB
// ══════════════════════════════════════════════════════════════════════════════
const EMPTY_ADVERTISER = { name: '', email: '', company: '', website: '' }

function AdvertisersTab({ onRefresh }) {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState(EMPTY_ADVERTISER)
  const [saving,  setSaving]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/speedoads/advertisers', { params: { search } })
      setRows(data || [])
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to load advertisers', 'error')
      setRows([])
    } finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  const toggleVerify = async (id, current) => {
    try { await api.put(`/speedoads/advertisers/${id}`, { is_verified: !current }); toast(current ? 'Unverified' : 'Verified ✓'); load() }
    catch { toast('Failed', 'error') }
  }

  const toggleSuspend = async (id, current) => {
    if (!confirm(current ? 'Reactivate this advertiser?' : 'Suspend this advertiser?')) return
    try { await api.put(`/speedoads/advertisers/${id}`, { is_active: !!current }); toast(current ? 'Reactivated' : 'Suspended'); load() }
    catch { toast('Failed', 'error') }
  }

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) return toast('Name and email are required', 'error')
    setSaving(true)
    try {
      if (editing) await api.put(`/speedoads/advertisers/${editing}`, form)
      else          await api.post('/speedoads/advertisers', form)
      toast(editing ? 'Advertiser updated' : 'Advertiser created')
      setModal(false); load()
    } catch (e) { toast(e.response?.data?.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchBox value={search} onChange={setSearch} placeholder="Search advertisers…" />
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>{rows.length} advertisers</span>
        <Btn onClick={() => { setEditing(null); setForm(EMPTY_ADVERTISER); setModal(true) }}>
          <Plus size={14} /> Add Advertiser
        </Btn>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius)' }} />)}
        </div>
      ) : rows.length === 0 ? (
        <Empty label="No advertisers yet. Add one above." icon={Users} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {rows.map(a => (
            <div key={a.id || a.advertiser_id} style={{
              background: 'var(--surface)', border: `1px solid ${!a.is_active ? 'rgba(255,45,85,0.2)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)', padding: '18px 20px',
              opacity: a.is_active ? 1 : 0.65,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {a.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{a.name}</span>
                      {a.is_verified && <CheckCircle size={13} color="var(--blue)" fill="var(--blue)" />}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{a.email}</div>
                  </div>
                </div>
                {!a.is_active && <Badge label="Suspended" color="var(--accent)" />}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {[
                  ['Campaigns',  a.campaign_count || 0, Megaphone, 'var(--blue)'],
                  ['Total Spend', fmtCur(a.total_spend || 0), DollarSign, 'var(--gold)'],
                  ['Impressions', fmtNum(a.total_impressions || 0), Eye, '#9B59B6'],
                  ['Company',     a.company || '—', Users, 'var(--text3)'],
                ].map(([label, val, Icon, color]) => (
                  <div key={label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                      <Icon size={10} color={color} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <Btn size="sm" variant={a.is_verified ? 'ghost' : 'success'} onClick={() => toggleVerify(a.id || a.advertiser_id, a.is_verified)}>
                  {a.is_verified ? <><ShieldOff size={11} /> Unverify</> : <><Shield size={11} /> Verify</>}
                </Btn>
                <Btn size="sm" variant="ghost" onClick={() => { setEditing(a.id || a.advertiser_id); setForm({ name: a.name, email: a.email, company: a.company || '', website: a.website || '' }); setModal(true) }}>
                  <Edit2 size={11} />
                </Btn>
                <Btn size="sm" variant="danger" onClick={() => toggleSuspend(a.id || a.advertiser_id, !a.is_active)}>
                  {a.is_active ? <><Ban size={11} /> Suspend</> : <><CheckCircle size={11} /> Restore</>}
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Advertiser' : 'Add Advertiser'} width={480}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Full Name / Brand Name *" value={form.name}    onChange={f('name')}    placeholder="e.g. Acme Corp" />
          <Input label="Email *"                  value={form.email}   onChange={f('email')}   placeholder="ads@acme.com" />
          <Input label="Company"                  value={form.company} onChange={f('company')} placeholder="Acme Pvt Ltd" />
          <Input label="Website"                  value={form.website} onChange={f('website')} placeholder="https://acme.com" />
          {!editing && (
            <div style={{ background: 'rgba(45,156,219,0.08)', border: '1px solid rgba(45,156,219,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--blue)' }}>
              💡 After creating, verify and then campaigns by this advertiser will be eligible to serve.
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Add Advertiser'}</Btn>
        </div>
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// REVENUE TAB
// ══════════════════════════════════════════════════════════════════════════════
function RevenueTab({ stats, loading }) {
  const revenueBreakdown = stats?.revenue_breakdown || []
  const payouts          = stats?.creator_payouts   || []
  const monthly          = stats?.monthly_revenue   || []

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 260, borderRadius: 'var(--radius)' }} />)}
    </div>
  )

  const totalRevenue  = stats?.overview?.total_revenue  || 0
  const platformShare = totalRevenue * 0.3
  const creatorShare  = totalRevenue * 0.7

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {[
          { label: 'Total Ad Revenue',     value: fmtCur(totalRevenue),   color: 'var(--gold)',   icon: DollarSign, desc: 'From all campaigns' },
          { label: 'Platform Share (30%)', value: fmtCur(platformShare),  color: 'var(--accent)', icon: Zap,        desc: 'SpeedoAds platform cut' },
          { label: 'Creator Payouts (70%)',value: fmtCur(creatorShare),   color: 'var(--green)',  icon: Star,       desc: 'Distributed to creators' },
        ].map(r => (
          <div key={r.label} style={{ background: 'var(--surface)', border: `1px solid var(--border)`, borderTop: `3px solid ${r.color}`, borderRadius: 'var(--radius)', padding: '20px 22px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: r.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <r.icon size={15} color={r.color} />
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>{r.value}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>{r.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{r.desc}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <h3 style={cardTitle}>Monthly Revenue Trend</h3>
        {monthly.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)', fontSize: 13 }}>No revenue data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gRevR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--gold)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--gold)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'K' : v}`} />
              <Tooltip formatter={v => fmtCur(v)} contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="var(--gold)" fill="url(#gRevR)" strokeWidth={2} dot={{ fill: 'var(--gold)', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={card}>
          <h3 style={cardTitle}>Revenue by Ad Type</h3>
          {revenueBreakdown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)', fontSize: 13 }}>No data.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
              {revenueBreakdown.map((r, i) => {
                const pct = totalRevenue > 0 ? (r.revenue / totalRevenue) * 100 : 0
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{TYPE_META[r.type]?.label || r.type}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)' }}>{fmtCur(r.revenue)}</span>
                    </div>
                    <div style={{ background: 'var(--surface2)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: CHART_COLORS[i % CHART_COLORS.length], borderRadius: 4 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Top Creator Payouts</h3>
          {payouts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)', fontSize: 13 }}>No payout data yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {payouts.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', width: 18, textAlign: 'center' }}>{i + 1}</span>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {p.channel_name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.channel_name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>{fmtNum(p.ad_views)} ad views</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 800, color: 'var(--green)', flexShrink: 0 }}>
                    {fmtCur(p.payout)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Style tokens ───────────────────────────────────────────────────────────────
const card      = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px' }
const cardTitle = { fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--text)' }
const lbl       = { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }
const sel       = { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%', cursor: 'pointer' }