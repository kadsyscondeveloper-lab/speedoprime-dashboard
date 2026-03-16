import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Edit2, CreditCard, TrendingUp, Users, AlertTriangle,
  DollarSign, Gift, Ban, ChevronDown, ChevronUp, Search,
  Monitor, Zap, Cast, Shield, RefreshCw, Clock
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import api from '../api/client'
import { PageHeader, Table, Badge, Btn, Modal, Input, toast } from '../components/UI'

// ── Color palette ─────────────────────────────────────────────────────────────
const PLAN_COLORS = ['#5A5B60', '#2D9CDB', '#FF6B35', '#FFB800', '#FF2D55']
const planColor = name => ({
  Free: '#5A5B60', Standard: '#2D9CDB', Premium: '#FF6B35', Ultra: '#FFB800'
})[name] || '#9B59B6'

const emptyPlan = {
  name: '', price: '', duration_days: 30, max_screens: 1,
  has_hd: false, has_4k: false, allow_casting: false, description: ''
}

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'analytics',    label: 'Analytics',    icon: TrendingUp },
  { key: 'plans',        label: 'Plans',        icon: CreditCard },
  { key: 'subscribers',  label: 'Subscribers',  icon: Users },
  { key: 'expiring',     label: 'Expiring Soon',icon: AlertTriangle },
]

export default function Subscriptions() {
  const [tab, setTab] = useState('analytics')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get('/subscriptions/stats')
      setStats(data)
    } catch (e) {
      console.error('Stats load error', e)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        subtitle="Revenue, plans, and subscriber management."
        action={<Btn onClick={loadStats} variant="ghost"><RefreshCw size={14} /> Refresh</Btn>}
      />

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div style={s.kpiGrid}>
        {[
          {
            label: 'Active Subscribers', icon: Users, color: 'var(--green)',
            value: stats?.overview?.active_subscribers,
          },
          {
            label: 'MRR', icon: DollarSign, color: 'var(--gold)',
            value: stats?.overview?.mrr != null ? `₹${Number(stats.overview.mrr).toLocaleString()}` : null,
          },
          {
            label: 'ARR', icon: TrendingUp, color: 'var(--blue)',
            value: stats?.overview?.arr != null ? `₹${Number(stats.overview.arr).toLocaleString()}` : null,
          },
          {
            label: 'New (30 days)', icon: Plus, color: 'var(--accent)',
            value: stats?.overview?.new_last_30d,
            delta: stats?.overview?.new_last_7d ? `+${stats.overview.new_last_7d} this week` : null,
          },
          {
            label: 'Expiring (7 days)', icon: AlertTriangle, color: stats?.overview?.expiring_7d > 0 ? '#FF6B35' : 'var(--text3)',
            value: stats?.overview?.expiring_7d,
          },
        ].map(({ label, icon: Icon, color, value, delta }) => (
          <div key={label} style={{ ...s.kpiCard, borderTop: `2px solid ${color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} />
              </div>
              {delta && <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>{delta}</span>}
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: 'var(--text)' }}>
              {loading ? '—' : (value ?? '—')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 4, fontWeight: 600 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div style={s.tabs}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            ...s.tab,
            background:   tab === key ? 'var(--surface2)' : 'transparent',
            color:        tab === key ? 'var(--text)'     : 'var(--text3)',
            borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
          }}>
            <Icon size={14} />{label}
            {key === 'expiring' && stats?.overview?.expiring_7d > 0 && (
              <span style={{ background: '#FF6B35', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 6px', marginLeft: 4 }}>
                {stats.overview.expiring_7d}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'analytics'   && <AnalyticsTab   stats={stats} loading={loading} />}
      {tab === 'plans'       && <PlansTab        onPlansChanged={loadStats} />}
      {tab === 'subscribers' && <SubscribersTab  stats={stats} />}
      {tab === 'expiring'    && <ExpiringTab     rows={stats?.expiring_soon || []} loading={loading} />}
    </div>
  )
}

// ── ANALYTICS TAB ─────────────────────────────────────────────────────────────
function AnalyticsTab({ stats, loading }) {
  if (loading) return (
    <div style={{ display: 'grid', gap: 16 }}>
      {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 260, borderRadius: 'var(--radius)' }} />)}
    </div>
  )

  const growth  = stats?.monthly_growth   || []
  const planDist = stats?.plan_distribution || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Growth chart */}
      <div style={s.card}>
        <h3 style={s.cardTitle}>Subscriber Growth (12 Months)</h3>
        {growth.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: 13 }}>No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={growth} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--green)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="new_subscribers" name="New Subscribers"
                stroke="var(--green)" fill="url(#gGreen)" strokeWidth={2}
                dot={{ fill: 'var(--green)', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Plan distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Pie */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>Plan Distribution</h3>
          {planDist.filter(p => p.subscriber_count > 0).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: 13 }}>No subscribers yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={planDist.filter(p => p.subscriber_count > 0)}
                  dataKey="subscriber_count"
                  nameKey="plan_name"
                  cx="50%" cy="50%"
                  outerRadius={80}
                  label={({ plan_name, percent }) => `${plan_name} ${(percent * 100).toFixed(0)}%`}
                  fontSize={11}
                >
                  {planDist.map((p, i) => (
                    <Cell key={i} fill={planColor(p.plan_name)} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar — subscriber count per plan */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>Subscribers per Plan</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={planDist} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="plan_name" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="subscriber_count" name="Subscribers" radius={[4, 4, 0, 0]}>
                {planDist.map((p, i) => <Cell key={i} fill={planColor(p.plan_name)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Plan feature matrix */}
      <div style={s.card}>
        <h3 style={s.cardTitle}>Plan Features Matrix</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Plan', 'Price/mo', 'Duration', 'Screens', 'HD', '4K', 'Casting', 'Subscribers'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {planDist.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: planColor(p.plan_name) }} />
                      <span style={{ fontWeight: 700 }}>{p.plan_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, color: 'var(--gold)' }}>
                    {p.price === 0 ? 'Free' : `₹${p.price}`}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>{p.duration_days || 30}d</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Monitor size={13} color="var(--text3)" /> {p.max_screens}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>{p.has_hd ? <Tick /> : <Cross />}</td>
                  <td style={{ padding: '12px 14px' }}>{p.has_4k ? <Tick /> : <Cross />}</td>
                  <td style={{ padding: '12px 14px' }}>{p.allow_casting ? <Tick /> : <Cross />}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-head)', fontWeight: 700 }}>{p.subscriber_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Tick() {
  return <span style={{ background: 'rgba(39,174,96,0.15)', color: 'var(--green)', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>✓ Yes</span>
}
function Cross() {
  return <span style={{ background: 'rgba(90,91,96,0.15)', color: 'var(--text3)', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>— No</span>
}

// ── PLANS TAB ─────────────────────────────────────────────────────────────────
function PlansTab({ onPlansChanged }) {
  const [plans,   setPlans]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState(emptyPlan)
  const [saving,  setSaving]  = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await api.get('/subscriptions/plans')
    setPlans(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(emptyPlan); setModal(true) }
  const openEdit = r => {
    setEditing(r.plan_id)
    setForm({
      name: r.name, price: r.price, duration_days: r.duration_days,
      max_screens: r.max_screens, has_hd: !!r.has_hd, has_4k: !!r.has_4k,
      allow_casting: !!r.allow_casting, description: r.description || ''
    })
    setModal(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        duration_days: parseInt(form.duration_days),
        max_screens: parseInt(form.max_screens),
        is_active: true,
      }
      if (editing) await api.put(`/subscriptions/plans/${editing}`, payload)
      else          await api.post('/subscriptions/plans', payload)
      toast(editing ? 'Plan updated' : 'Plan created')
      setModal(false); load(); onPlansChanged()
    } catch (e) { toast(e.response?.data?.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  const f  = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const fc = k => e => setForm(p => ({ ...p, [k]: e.target.checked }))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <Btn onClick={openCreate}><Plus size={15} /> New Plan</Btn>
      </div>

      {/* Plan cards */}
      {loading ? (
        <div style={s.planGrid}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 220, borderRadius: 'var(--radius)' }} />)}
        </div>
      ) : (
        <div style={s.planGrid}>
          {plans.map(p => (
            <div key={p.plan_id} style={{ ...s.planCard, borderTop: `3px solid ${planColor(p.name)}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 12, color: planColor(p.name), textTransform: 'uppercase', letterSpacing: '1px' }}>{p.name}</div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 800, letterSpacing: '-1px', marginTop: 4 }}>
                    {p.price === 0 ? 'Free' : `₹${p.price}`}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.duration_days} days</div>
                </div>
                <Btn size="sm" variant="ghost" onClick={() => openEdit(p)}><Edit2 size={13} /></Btn>
              </div>

              {p.description && (
                <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 10, lineHeight: 1.5 }}>{p.description}</p>
              )}

              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <FeatureRow icon={Monitor} label={`${p.max_screens} screen${p.max_screens > 1 ? 's' : ''}`} active />
                <FeatureRow icon={Zap}     label="HD Streaming"  active={!!p.has_hd} />
                <FeatureRow icon={Shield}  label="4K Streaming"  active={!!p.has_4k} />
                <FeatureRow icon={Cast}    label="Casting"       active={!!p.allow_casting} />
              </div>

              <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <Badge
                  label={p.is_active ? 'Active' : 'Hidden'}
                  color={p.is_active ? 'var(--green)' : 'var(--text3)'}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Plan' : 'New Plan'} width={520}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input label="Plan Name"      value={form.name}          onChange={f('name')}          placeholder="e.g. Premium" />
          <Input label="Price (₹/mo)"  type="number" step="0.01" value={form.price} onChange={f('price')} placeholder="199.00" />
          <Input label="Duration (days)" type="number" value={form.duration_days} onChange={f('duration_days')} />
          <Input label="Max Screens"   type="number" value={form.max_screens} onChange={f('max_screens')} />
          <div style={{ gridColumn: '1/-1' }}>
            <Input label="Description" value={form.description} onChange={f('description')} placeholder="Short plan summary" />
          </div>
          {/* Feature toggles */}
          <div style={{ gridColumn: '1/-1' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>Features</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { key: 'has_hd',        label: 'HD Streaming',        icon: Zap },
                { key: 'has_4k',        label: '4K Streaming',        icon: Shield },
                { key: 'allow_casting', label: 'Casting / DLNA',      icon: Cast },
              ].map(({ key, label, icon: Icon }) => (
                <label key={key} style={{
                  display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                  background: form[key] ? 'rgba(39,174,96,0.08)' : 'var(--surface2)',
                  border: `1px solid ${form[key] ? 'rgba(39,174,96,0.3)' : 'var(--border)'}`,
                  borderRadius: 8, padding: '10px 14px', transition: 'all 0.15s',
                }}>
                  <input type="checkbox" checked={!!form[key]} onChange={fc(key)} style={{ accentColor: 'var(--green)' }} />
                  <Icon size={14} color={form[key] ? 'var(--green)' : 'var(--text3)'} />
                  <span style={{ fontSize: 13, color: form[key] ? 'var(--text)' : 'var(--text3)', fontWeight: 500 }}>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div style={s.modalFooter}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</Btn>
        </div>
      </Modal>
    </div>
  )
}

function FeatureRow({ icon: Icon, label, active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 20, height: 20, borderRadius: 4, background: active ? 'rgba(39,174,96,0.15)' : 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={11} color={active ? 'var(--green)' : 'var(--text3)'} />
      </div>
      <span style={{ fontSize: 12, color: active ? 'var(--text2)' : 'var(--text3)', textDecoration: active ? 'none' : 'line-through', opacity: active ? 1 : 0.5 }}>{label}</span>
    </div>
  )
}

// ── SUBSCRIBERS TAB ───────────────────────────────────────────────────────────
function SubscribersTab() {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [plan,    setPlan]    = useState('')
  const [status,  setStatus]  = useState('active')
  const [page,    setPage]    = useState(1)
  const [total,   setTotal]   = useState(0)
  const [plans,   setPlans]   = useState([])
  const [grantModal, setGrantModal] = useState(null)
  const LIMIT = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: LIMIT, status, ...(search && { search }), ...(plan && { plan }) }
      const { data } = await api.get('/subscriptions/all', { params })
      setRows(data.data || [])
      setTotal(data.total || 0)
    } finally { setLoading(false) }
  }, [page, search, plan, status])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    api.get('/subscriptions/plans').then(r => setPlans(r.data))
  }, [])

  const revoke = async userId => {
    if (!confirm('Revoke this subscription?')) return
    await api.delete(`/subscriptions/admin/revoke/${userId}`)
    toast('Subscription revoked'); load()
  }

  const cols = [
    { key: 'username', label: 'User', width: '20%', render: r => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {r.username?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.username}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.email}</div>
        </div>
      </div>
    )},
    { key: 'plan_name', label: 'Plan', width: '12%', render: r => (
      <Badge label={r.plan_name} color={planColor(r.plan_name)} />
    )},
    { key: 'price', label: 'Price', width: '8%', render: r => (
      <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--gold)' }}>
        {r.price === 0 ? 'Free' : `₹${r.price}`}
      </span>
    )},
    { key: 'start_date', label: 'Started', width: '12%', render: r => r.start_date ? new Date(r.start_date).toLocaleDateString() : '—' },
    { key: 'end_date',   label: 'Expires',  width: '12%', render: r => (
      <div>
        <div>{r.end_date ? new Date(r.end_date).toLocaleDateString() : '—'}</div>
        {r.days_remaining != null && r.days_remaining >= 0 && (
          <div style={{ fontSize: 11, color: r.days_remaining <= 7 ? '#FF6B35' : 'var(--text3)', marginTop: 2 }}>
            {r.days_remaining === 0 ? 'Expires today' : `${r.days_remaining}d left`}
          </div>
        )}
      </div>
    )},
    { key: 'is_active', label: 'Status', width: '10%', render: r => {
      const expired = r.days_remaining != null && r.days_remaining < 0
      return <Badge label={expired ? 'Expired' : r.is_active ? 'Active' : 'Cancelled'} color={expired ? 'var(--accent)' : r.is_active ? 'var(--green)' : 'var(--text3)'} />
    }},
    { key: 'actions', label: '', width: '14%', render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn size="sm" variant="success" onClick={() => setGrantModal({ user_id: r.user_id, username: r.username })} title="Grant / Extend">
          <Gift size={12} />
        </Btn>
        <Btn size="sm" variant="danger" onClick={() => revoke(r.user_id)} title="Revoke">
          <Ban size={12} />
        </Btn>
      </div>
    )},
  ]

  const pages = Math.ceil(total / LIMIT)

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search name or email…"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px 9px 36px', color: 'var(--text)', fontSize: 13, outline: 'none', width: 220 }}
          />
        </div>
        <select value={plan} onChange={e => { setPlan(e.target.value); setPage(1) }}
          style={s.filterSelect}>
          <option value="">All Plans</option>
          {plans.map(p => <option key={p.plan_id} value={p.plan_id}>{p.name}</option>)}
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
          style={s.filterSelect}>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="">All</option>
        </select>
        <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 'auto' }}>{total} results</span>
      </div>

      <Table cols={cols} rows={rows} loading={loading} empty="No subscribers found." />

      {pages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          <Btn size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Btn>
          <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--text2)' }}>{page} / {pages}</span>
          <Btn size="sm" variant="ghost" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next</Btn>
        </div>
      )}

      {grantModal && (
        <GrantModal
          user={grantModal}
          plans={plans}
          onClose={() => setGrantModal(null)}
          onGranted={() => { setGrantModal(null); load() }}
        />
      )}
    </div>
  )
}

// ── GRANT MODAL ───────────────────────────────────────────────────────────────
function GrantModal({ user, plans, onClose, onGranted }) {
  const [form, setForm] = useState({ plan_id: plans[0]?.plan_id || '', duration_days: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await api.post('/subscriptions/admin/grant', {
        user_id: user.user_id,
        plan_id: parseInt(form.plan_id),
        duration_days: form.duration_days ? parseInt(form.duration_days) : undefined,
        notes: form.notes || undefined,
      })
      toast(`Subscription granted to ${user.username}`)
      onGranted()
    } catch (e) { toast(e.response?.data?.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <Modal open onClose={onClose} title={`Grant Subscription — ${user.username}`} width={440}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }}>Plan</label>
          <select value={form.plan_id} onChange={f('plan_id')}
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%' }}>
            {plans.map(p => <option key={p.plan_id} value={p.plan_id}>{p.name} — {p.price === 0 ? 'Free' : `₹${p.price}`}</option>)}
          </select>
        </div>
        <Input label="Duration Override (days, blank = plan default)" type="number" value={form.duration_days} onChange={f('duration_days')} placeholder="Leave blank to use plan default" />
        <Input label="Notes (internal)" value={form.notes} onChange={f('notes')} placeholder="e.g. Compensation, test account, promo" />
        <div style={{ background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--green)' }}>
          ⚡ This will immediately replace any existing subscription.
        </div>
      </div>
      <div style={s.modalFooter}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="success" onClick={save} disabled={saving}>{saving ? 'Granting…' : 'Grant Subscription'}</Btn>
      </div>
    </Modal>
  )
}

// ── EXPIRING SOON TAB ─────────────────────────────────────────────────────────
function ExpiringTab({ rows, loading }) {
  if (loading) return <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius)' }} />

  if (rows.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
        <Clock size={36} color="var(--text3)" style={{ marginBottom: 12 }} />
        <div style={{ color: 'var(--text3)', fontSize: 14 }}>No subscriptions expiring in the next 14 days.</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>
        {rows.length} subscription{rows.length !== 1 ? 's' : ''} expiring within 14 days.
      </p>
      {rows.map((r, i) => {
        const urgent = r.days_remaining <= 3
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: 'var(--surface)', border: `1px solid ${urgent ? 'rgba(255,107,53,0.3)' : 'var(--border)'}`,
            borderRadius: 10, padding: '14px 16px',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: urgent ? 'rgba(255,107,53,0.15)' : 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={16} color={urgent ? '#FF6B35' : 'var(--text3)'} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{r.username}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{r.email}</div>
            </div>
            <Badge label={r.plan_name} color={planColor(r.plan_name)} />
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: urgent ? '#FF6B35' : 'var(--text)' }}>
                {r.days_remaining === 0 ? 'Expires today' : `${r.days_remaining} day${r.days_remaining !== 1 ? 's' : ''} left`}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date(r.end_date).toLocaleDateString()}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 },
  kpiCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 20px 18px' },
  tabs: { display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 28, gap: 4 },
  tab:  { display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.15s' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 0 },
  cardTitle: { fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 20, color: 'var(--text)' },
  planGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 },
  planCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 22px' },
  filterSelect: { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' },
  modalFooter: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' },
}