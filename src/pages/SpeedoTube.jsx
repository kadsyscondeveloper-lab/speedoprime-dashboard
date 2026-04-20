import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Play, Plus, Trash2, Edit2, Eye, EyeOff, Star, CheckCircle,
  Flag, MessageSquare, Tv2, BarChart2, Youtube, Users,
  ThumbsUp, Search, X, RefreshCw, AlertTriangle, ShieldCheck,
  ShieldOff, Clock, Globe, Lock, Link2, Hash,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import api from '../api/client'
import { PageHeader, Badge, Btn, Modal, Input, Select, toast } from '../components/UI'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtNum  = n => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(0)}K` : (n || 0)
const fmtSecs = s => { if (!s) return '—'; const m = Math.floor(s/60), sec = s%60; return `${m}:${String(sec).padStart(2,'0')}` }
const fmtDate = d => d ? new Date(d).toLocaleDateString() : '—'
const VIS_COLOR = { public: 'var(--green)', unlisted: 'var(--gold)', private: 'var(--text3)' }
const VIS_ICON  = { public: Globe, unlisted: Link2, private: Lock }
const CHART_COLORS = ['#FF2D55','#FF6B35','#FFB800','#2D9CDB','#27AE60','#9B59B6','#E74C3C']
const CATEGORIES = ['Music','Gaming','Education','Entertainment','News','Sports','Technology','Travel','Food','Comedy','Science','Film','Fashion','Pets','Auto']

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { key: 'analytics', label: 'Analytics',  icon: BarChart2 },
  { key: 'videos',    label: 'Videos',     icon: Play },
  { key: 'channels',  label: 'Channels',   icon: Tv2 },
  { key: 'comments',  label: 'Comments',   icon: MessageSquare },
  { key: 'reports',   label: 'Reports',    icon: Flag },
]

// ─── Thumbnail component ──────────────────────────────────────────────────────
function Thumb({ url, size = 56, radius = 6 }) {
  const [err, setErr] = useState(false)
  return (
    <div style={{ width: size, height: size * 0.5625, borderRadius: radius, overflow: 'hidden', flexShrink: 0, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {url && !err
        ? <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
        : <Play size={size * 0.25} color="var(--text3)" />}
    </div>
  )
}

// ─── Avatar component ─────────────────────────────────────────────────────────
function Avatar({ url, name, size = 36 }) {
  const [err, setErr] = useState(false)
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: '#fff' }}>
      {url && !err
        ? <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
        : (name?.[0]?.toUpperCase() || '?')}
    </div>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color, loading }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: `2px solid ${color}`, borderRadius: 'var(--radius)', padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color={color} />
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800, letterSpacing: '-1px' }}>
        {loading ? '—' : (typeof value === 'number' ? fmtNum(value) : (value ?? '—'))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 3, fontWeight: 600 }}>{label}</div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function SpeedoTube() {
  const [tab, setTab]     = useState('analytics')
  const [analytics, setAnalytics] = useState(null)
  const [aLoading,  setALoading]  = useState(true)

  const loadAnalytics = useCallback(async () => {
    setALoading(true)
    try {
      const { data } = await api.get('/tube/analytics')
      setAnalytics(data)
    } catch { /* no data yet */ }
    finally { setALoading(false) }
  }, [])

  useEffect(() => { loadAnalytics() }, [loadAnalytics])

  const ov = analytics?.overview || {}

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,45,85,0.15)', border: '1px solid rgba(255,45,85,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Play size={20} fill="var(--accent)" color="var(--accent)" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>SpeedoTube</h1>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Video platform management</p>
          </div>
        </div>
        <Btn variant="ghost" onClick={loadAnalytics}><RefreshCw size={14} /> Refresh</Btn>
      </div>

      {/* ── KPI Row ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 28 }}>
        <KpiCard label="Total Videos"   value={ov.total_videos}       icon={Play}          color="var(--accent)" loading={aLoading} />
        <KpiCard label="Total Channels" value={ov.total_channels}     icon={Tv2}           color="var(--blue)"   loading={aLoading} />
        <KpiCard label="Total Views"    value={ov.total_views}        icon={Eye}           color="var(--green)"  loading={aLoading} />
        <KpiCard label="Total Likes"    value={ov.total_likes}        icon={ThumbsUp}      color="var(--gold)"   loading={aLoading} />
        <KpiCard label="Comments"       value={ov.total_comments}     icon={MessageSquare} color="#9B59B6"        loading={aLoading} />
        <KpiCard label="Pending Reports" value={ov.pending_reports}   icon={Flag}          color={ov.pending_reports > 0 ? '#FF6B35' : 'var(--text3)'} loading={aLoading} />
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 28, gap: 4, overflowX: 'auto' }}>
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
            {key === 'reports' && ov.pending_reports > 0 && (
              <span style={{ background: '#FF6B35', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>
                {ov.pending_reports}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'analytics' && <AnalyticsTab analytics={analytics} loading={aLoading} />}
      {tab === 'videos'    && <VideosTab    onRefresh={loadAnalytics} />}
      {tab === 'channels'  && <ChannelsTab  onRefresh={loadAnalytics} />}
      {tab === 'comments'  && <CommentsTab />}
      {tab === 'reports'   && <ReportsTab   onRefresh={loadAnalytics} />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ANALYTICS TAB
// ══════════════════════════════════════════════════════════════════════════════
function AnalyticsTab({ analytics, loading }) {
  if (loading) return (
    <div style={{ display: 'grid', gap: 16 }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 260, borderRadius: 'var(--radius)' }} />)}
    </div>
  )
  if (!analytics) return <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>No data yet. Run the SQL schema first.</div>

  const { top_videos = [], top_channels = [], category_dist = [], recent_activity = [], overview = {} } = analytics

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Category distribution */}
        <div style={cardStyle}>
          <h3 style={cardTitle}>Views by Category</h3>
          {category_dist.length === 0
            ? <Empty />
            : <ResponsiveContainer width="100%" height={240}>
                <BarChart data={category_dist.slice(0,8)} margin={{ top:8, right:8, left:-20, bottom:0 }}>
                  <XAxis dataKey="category" tick={{ fill:'var(--text3)', fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'var(--text3)', fontSize:10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} />
                  <Bar dataKey="total_views" name="Views" radius={[4,4,0,0]}>
                    {category_dist.slice(0,8).map((_,i) => <Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          }
        </div>

        {/* Video count per category pie */}
        <div style={cardStyle}>
          <h3 style={cardTitle}>Video Count by Category</h3>
          {category_dist.length === 0
            ? <Empty />
            : <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={category_dist.slice(0,7)} dataKey="video_count" nameKey="category"
                    cx="50%" cy="50%" outerRadius={90}
                    label={({ category, percent }) => `${category} ${(percent*100).toFixed(0)}%`}
                    fontSize={10}>
                    {category_dist.slice(0,7).map((_,i) => <Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} />
                </PieChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      {/* Top videos */}
      <div style={cardStyle}>
        <h3 style={cardTitle}>Top Videos by Views</h3>
        {top_videos.length === 0
          ? <Empty label="No videos yet." />
          : top_videos.map((v, i) => (
            <div key={v.video_id} style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--text3)', width:22, textAlign:'center', flexShrink:0 }}>{i+1}</span>
              <Thumb url={v.thumbnail_url} size={72} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.title}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{v.channel_name}</div>
              </div>
              <div style={{ display:'flex', gap:16, flexShrink:0 }}>
                <Stat icon={Eye}        val={fmtNum(v.view_count)} />
                <Stat icon={ThumbsUp}   val={fmtNum(v.like_count)} color="var(--green)" />
                <Stat icon={MessageSquare} val={fmtNum(v.comment_count)} color="#9B59B6" />
              </div>
            </div>
          ))
        }
      </div>

      {/* Top channels */}
      <div style={cardStyle}>
        <h3 style={cardTitle}>Top Channels by Subscribers</h3>
        {top_channels.length === 0
          ? <Empty label="No channels yet." />
          : top_channels.map((c, i) => (
            <div key={c.channel_id} style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--text3)', width:22, textAlign:'center', flexShrink:0 }}>{i+1}</span>
              <Avatar url={c.avatar_url} name={c.name} size={40} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontWeight:700, fontSize:13 }}>{c.name}</span>
                  {c.is_verified && <CheckCircle size={13} color="var(--blue)" fill="var(--blue)" />}
                </div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{c.handle ? `@${c.handle}` : '—'} · {c.video_count} videos</div>
              </div>
              <Stat icon={Users} val={fmtNum(c.subscriber_count)} />
            </div>
          ))
        }
      </div>

      {/* Platform summary */}
      <div style={cardStyle}>
        <h3 style={cardTitle}>Platform Summary</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
          {[
            { label:'Public Videos',      value: overview.public_videos },
            { label:'Verified Channels',   value: overview.verified_channels },
            { label:'New Videos (7 days)', value: overview.new_videos_7d },
            { label:'New Channels (30d)',  value: overview.new_channels_30d },
          ].map(r => (
            <div key={r.label} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ fontFamily:'var(--font-head)', fontSize:22, fontWeight:700 }}>{r.value ?? '—'}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:3 }}>{r.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Stat({ icon: Icon = Eye, val, color = 'var(--text3)' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color }}>
      <Icon size={12} /> {val}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// VIDEOS TAB
// ══════════════════════════════════════════════════════════════════════════════
const emptyVideo = {
  channel_id:'', title:'', description:'', thumbnail_url:'',
  video_url:'', video_url_sd:'', video_url_hd:'', video_url_4k:'',
  duration_secs:'', category:'', tags:'', visibility:'public', status:'published',
  is_featured: false, allow_comments: true, age_restricted: false,
}

function VideosTab({ onRefresh }) {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [search,  setSearch]  = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [visFilter, setVisFilter] = useState('')
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState(emptyVideo)
  const [saving,  setSaving]  = useState(false)
  const [channels,setChannels]= useState([])
  const LIMIT = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit:LIMIT, ...(search && { search }), ...(catFilter && { category:catFilter }), ...(visFilter && { visibility:visFilter }) }
      const { data } = await api.get('/tube/videos', { params })
      setRows(data.data || [])
      setTotal(data.total || 0)
    } finally { setLoading(false) }
  }, [page, search, catFilter, visFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    api.get('/tube/channels?limit=200').then(r => setChannels(r.data?.data || []))
  }, [])

  const openCreate = () => { setEditing(null); setForm(emptyVideo); setModal(true) }
  const openEdit = v => {
    setEditing(v.video_id)
    setForm({ channel_id: v.channel_id, title: v.title, description: v.description || '', thumbnail_url: v.thumbnail_url || '', video_url: v.video_url || '', video_url_sd: v.video_url_sd || '', video_url_hd: v.video_url_hd || '', video_url_4k: v.video_url_4k || '', duration_secs: v.duration_secs || '', category: v.category || '', tags: v.tags || '', visibility: v.visibility, status: v.status, is_featured: !!v.is_featured, allow_comments: !!v.allow_comments, age_restricted: !!v.age_restricted })
    setModal(true)
  }

  const save = async () => {
    if (!form.channel_id || !form.title) return toast('Channel and title are required', 'error')
    setSaving(true)
    try {
      if (editing) await api.put(`/tube/videos/${editing}`, form)
      else          await api.post('/tube/videos', form)
      toast(editing ? 'Video updated' : 'Video created')
      setModal(false); load(); onRefresh()
    } catch (e) { toast(e.response?.data?.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  const del = async id => {
    if (!confirm('Remove this video?')) return
    await api.delete(`/tube/videos/${id}`)
    toast('Video removed'); load(); onRefresh()
  }

  const f  = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const fc = k => e => setForm(p => ({ ...p, [k]: e.target.checked }))
  const pages = Math.ceil(total / LIMIT)

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search videos…" />
        <FilterSelect value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1) }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </FilterSelect>
        <FilterSelect value={visFilter} onChange={e => { setVisFilter(e.target.value); setPage(1) }}>
          <option value="">All Visibility</option>
          <option value="public">Public</option>
          <option value="unlisted">Unlisted</option>
          <option value="private">Private</option>
        </FilterSelect>
        <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text3)' }}>{total} videos</span>
        <Btn onClick={openCreate}><Plus size={14} /> Add Video</Btn>
      </div>

      {/* Table */}
      <div style={tableWrap}>
        <table style={tableStyle}>
          <thead><tr>
            {['Video','Channel','Category','Visibility','Views','Likes','Duration','Status',''].map(h => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? Array.from({length:8}).map((_,i) => (
              <tr key={i}>{Array.from({length:9}).map((_,j) => <td key={j} style={td}><div className="skeleton" style={{height:14,width:'70%'}} /></td>)}</tr>
            )) : rows.length === 0 ? (
              <tr><td colSpan={9} style={{...td,textAlign:'center',color:'var(--text3)',padding:'40px 0'}}>No videos yet.</td></tr>
            ) : rows.map(v => {
              const VIcon = VIS_ICON[v.visibility] || Globe
              return (
                <tr key={v.video_id} style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={td}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <Thumb url={v.thumbnail_url} size={72} />
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:160 }}>{v.title}</div>
                        {v.is_featured && <Badge label="Featured" color="var(--gold)" />}
                      </div>
                    </div>
                  </td>
                  <td style={td}>
                    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <Avatar url={v.channel_avatar} name={v.channel_name} size={26} />
                      <span style={{ fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:100 }}>{v.channel_name}</span>
                    </div>
                  </td>
                  <td style={td}><Badge label={v.category || '—'} color="var(--text3)" /></td>
                  <td style={td}>
                    <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color: VIS_COLOR[v.visibility] || 'var(--text3)' }}>
                      <VIcon size={12} /> {v.visibility}
                    </span>
                  </td>
                  <td style={td}><Stat icon={Eye}      val={fmtNum(v.view_count)} /></td>
                  <td style={td}><Stat icon={ThumbsUp} val={fmtNum(v.like_count)} color="var(--green)" /></td>
                  <td style={td}><span style={{ fontSize:12, color:'var(--text3)' }}>{fmtSecs(v.duration_secs)}</span></td>
                  <td style={td}><Badge label={v.status} color={v.status==='published'?'var(--green)':'var(--gold)'} /></td>
                  <td style={td}>
                    <div style={{ display:'flex', gap:5 }}>
                      <Btn size="sm" variant="ghost"  onClick={() => openEdit(v)}><Edit2 size={12} /></Btn>
                      <Btn size="sm" variant="danger" onClick={() => del(v.video_id)}><Trash2 size={12} /></Btn>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {pages > 1 && <Pagination page={page} pages={pages} onChange={setPage} />}

      {/* Video modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Video' : 'Add Video'} width={720}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <SectionLabel label="Channel & Basic" />
          <div style={grid2}>
            <div>
              <label style={lbl}>Channel *</label>
              <select value={form.channel_id} onChange={f('channel_id')} style={selectStyle}>
                <option value="">— Select channel —</option>
                {channels.map(c => <option key={c.channel_id} value={c.channel_id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Category</label>
              <select value={form.category} onChange={f('category')} style={selectStyle}>
                <option value="">— None —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <Input label="Title *" value={form.title} onChange={f('title')} placeholder="Video title" />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={lbl}>Description</label>
              <textarea value={form.description} onChange={f('description')} rows={3} placeholder="Video description…" style={taStyle} />
            </div>
            <Input label="Tags (comma-separated)" value={form.tags} onChange={f('tags')} placeholder="music, indie, 2024" />
            <Input label="Duration (seconds)" type="number" value={form.duration_secs} onChange={f('duration_secs')} placeholder="180" />
          </div>

          <SectionLabel label="URLs" />
          <div style={grid2}>
            <div style={{ gridColumn:'1/-1' }}>
              <Input label="Thumbnail URL" value={form.thumbnail_url} onChange={f('thumbnail_url')} placeholder="https://…/thumb.jpg" />
            </div>
            {form.thumbnail_url && (
              <div style={{ gridColumn:'1/-1', borderRadius:8, overflow:'hidden', height:110, background:'var(--surface2)' }}>
                <img src={form.thumbnail_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => e.target.style.opacity=0.2} />
              </div>
            )}
            <div style={{ gridColumn:'1/-1' }}>
              <Input label="Video URL (main / auto)" value={form.video_url} onChange={f('video_url')} placeholder="https://…/video.mp4" />
            </div>
            <Input label="SD URL"  value={form.video_url_sd}  onChange={f('video_url_sd')}  placeholder="https://…/sd.mp4" />
            <Input label="HD URL"  value={form.video_url_hd}  onChange={f('video_url_hd')}  placeholder="https://…/hd.mp4" />
            <div style={{ gridColumn:'1/-1' }}>
              <Input label="4K URL" value={form.video_url_4k} onChange={f('video_url_4k')} placeholder="https://…/4k.mp4" />
            </div>
          </div>

          <SectionLabel label="Settings" />
          <div style={grid2}>
            <div>
              <label style={lbl}>Visibility</label>
              <select value={form.visibility} onChange={f('visibility')} style={selectStyle}>
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select value={form.status} onChange={f('status')} style={selectStyle}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="processing">Processing</option>
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            {[['is_featured','Featured'], ['allow_comments','Allow Comments'], ['age_restricted','Age Restricted (18+)']].map(([key, label]) => (
              <label key={key} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'var(--text2)' }}>
                <input type="checkbox" checked={!!form[key]} onChange={fc(key)} /> {label}
              </label>
            ))}
          </div>
        </div>
        <ModalFooter onCancel={() => setModal(false)} onSave={save} saving={saving} editing={editing} />
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// CHANNELS TAB
// ══════════════════════════════════════════════════════════════════════════════
const emptyChannel = {
  user_id:'', name:'', handle:'', description:'', banner_url:'', avatar_url:'', country:''
}

function ChannelsTab({ onRefresh }) {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(1)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState(emptyChannel)
  const [saving,  setSaving]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/tube/channels', { params: { page, limit:20, ...(search && { search }) } })
      setRows(data.data || [])
    } finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing(null); setForm(emptyChannel); setModal(true) }
  const openEdit = c => {
    setEditing(c.channel_id)
    setForm({ user_id: c.user_id || '', name: c.name, handle: c.handle || '', description: c.description || '', banner_url: c.banner_url || '', avatar_url: c.avatar_url || '', country: c.country || '' })
    setModal(true)
  }

  const save = async () => {
    if (!form.name) return toast('Name is required', 'error')
    setSaving(true)
    try {
      if (editing) await api.put(`/tube/channels/${editing}`, form)
      else          await api.post('/tube/channels', form)
      toast(editing ? 'Channel updated' : 'Channel created')
      setModal(false); load(); onRefresh()
    } catch (e) { toast(e.response?.data?.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  const del = async id => {
    if (!confirm('Deactivate this channel?')) return
    await api.delete(`/tube/channels/${id}`)
    toast('Channel deactivated'); load(); onRefresh()
  }

  const toggleVerify = async c => {
    await api.put(`/tube/channels/${c.channel_id}`, { is_verified: !c.is_verified })
    toast(c.is_verified ? 'Unverified' : 'Verified ✓'); load()
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div>
      <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search channels…" />
        <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text3)' }}>{rows.length} channels</span>
        <Btn onClick={openCreate}><Plus size={14} /> New Channel</Btn>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
        {loading
          ? Array.from({length:6}).map((_,i) => <div key={i} className="skeleton" style={{ height:180, borderRadius:'var(--radius)' }} />)
          : rows.length === 0
            ? <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'60px 0', color:'var(--text3)' }}>No channels yet.</div>
            : rows.map(c => (
              <div key={c.channel_id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden' }}>
                {/* Banner */}
                <div style={{ height:72, background: c.banner_url ? `url(${c.banner_url}) center/cover` : 'linear-gradient(135deg,var(--surface2),var(--accent)22)', position:'relative' }}>
                  <div style={{ position:'absolute', bottom:-20, left:16 }}>
                    <Avatar url={c.avatar_url} name={c.name} size={40} />
                  </div>
                </div>
                <div style={{ padding:'28px 16px 16px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ fontWeight:700, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</span>
                        {c.is_verified && <CheckCircle size={14} color="var(--blue)" fill="var(--blue)" />}
                      </div>
                      {c.handle && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>@{c.handle}</div>}
                    </div>
                    <Badge label={`${c.video_count} videos`} color="var(--blue)" />
                  </div>
                  <div style={{ display:'flex', gap:12, marginTop:12, fontSize:11, color:'var(--text3)' }}>
                    <Stat icon={Users} val={fmtNum(c.subscriber_count)} />
                    {c.country && <span>{c.country}</span>}
                    {c.owner_name && <span>Owner: {c.owner_name}</span>}
                  </div>
                  <div style={{ display:'flex', gap:6, marginTop:14 }}>
                    <Btn size="sm" variant={c.is_verified ? 'ghost' : 'success'} onClick={() => toggleVerify(c)}>
                      {c.is_verified ? <><ShieldOff size={11} /> Unverify</> : <><ShieldCheck size={11} /> Verify</>}
                    </Btn>
                    <Btn size="sm" variant="ghost"  onClick={() => openEdit(c)}><Edit2 size={12} /></Btn>
                    <Btn size="sm" variant="danger" onClick={() => del(c.channel_id)}><Trash2 size={12} /></Btn>
                  </div>
                </div>
              </div>
            ))
        }
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Channel' : 'New Channel'} width={560}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={grid2}>
            <Input label="Channel Name *" value={form.name}    onChange={f('name')}    placeholder="My Awesome Channel" />
            <Input label="Handle (@)"     value={form.handle}  onChange={f('handle')}  placeholder="mychannel" />
            <Input label="Country"        value={form.country} onChange={f('country')} placeholder="India" />
            <Input label="User ID (link to user)" type="number" value={form.user_id} onChange={f('user_id')} placeholder="optional" />
          </div>
          <div>
            <label style={lbl}>Description</label>
            <textarea value={form.description} onChange={f('description')} rows={3} placeholder="About this channel…" style={taStyle} />
          </div>
          <Input label="Avatar URL"  value={form.avatar_url}  onChange={f('avatar_url')}  placeholder="https://…/avatar.jpg" />
          <Input label="Banner URL"  value={form.banner_url}  onChange={f('banner_url')}  placeholder="https://…/banner.jpg" />
          {form.banner_url && <div style={{ borderRadius:8, overflow:'hidden', height:80, background:'var(--surface2)' }}><img src={form.banner_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.opacity=0.2} /></div>}
        </div>
        <ModalFooter onCancel={() => setModal(false)} onSave={save} saving={saving} editing={editing} />
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// COMMENTS TAB
// ══════════════════════════════════════════════════════════════════════════════
function CommentsTab() {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/tube/comments', { params: { page, limit:30, ...(search && { search }) } })
      setRows(data || [])
    } finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { load() }, [load])

  const del = async id => {
    if (!confirm('Remove this comment?')) return
    await api.delete(`/tube/comments/${id}`)
    toast('Comment removed'); load()
  }

  const pin = async id => {
    await api.post(`/tube/comments/${id}/pin`)
    toast('Pin toggled'); load()
  }

  return (
    <div>
      <div style={{ display:'flex', gap:10, marginBottom:18, alignItems:'center' }}>
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search comments…" />
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {loading
          ? Array.from({length:6}).map((_,i) => <div key={i} className="skeleton" style={{ height:70, borderRadius:10 }} />)
          : rows.length === 0
            ? <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text3)' }}>No comments.</div>
            : rows.map(c => (
              <div key={c.comment_id} style={{ background:'var(--surface)', border:`1px solid ${c.is_active ? 'var(--border)' : 'rgba(255,45,85,0.3)'}`, borderRadius:10, padding:'14px 16px', opacity: c.is_active ? 1 : 0.5 }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,var(--accent),var(--accent2))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
                    {c.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontWeight:600, fontSize:12 }}>{c.username || 'Deleted user'}</span>
                      {c.is_pinned && <Badge label="Pinned" color="var(--gold)" />}
                      {!c.is_active && <Badge label="Removed" color="var(--accent)" />}
                      {c.parent_comment_id && <Badge label="Reply" color="var(--text3)" />}
                      <span style={{ fontSize:11, color:'var(--text3)', marginLeft:'auto' }}>{fmtDate(c.created_at)}</span>
                    </div>
                    <div style={{ fontSize:13, color:'var(--text)', marginBottom:6, wordBreak:'break-word' }}>{c.content}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>On: <span style={{ color:'var(--text2)' }}>{c.video_title || '—'}</span></div>
                  </div>
                  <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                    <Btn size="sm" variant="ghost" onClick={() => pin(c.comment_id)} title="Toggle pin">
                      {c.is_pinned ? '📌' : '📍'}
                    </Btn>
                    {c.is_active && <Btn size="sm" variant="danger" onClick={() => del(c.comment_id)}><Trash2 size={12} /></Btn>}
                  </div>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// REPORTS TAB
// ══════════════════════════════════════════════════════════════════════════════
const REPORT_STATUSES = ['pending','reviewed','dismissed','actioned']
const STATUS_COLOR = { pending:'#FF6B35', reviewed:'var(--blue)', dismissed:'var(--text3)', actioned:'var(--green)' }

function ReportsTab({ onRefresh }) {
  const [rows,      setRows]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [resolving, setResolving] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/tube/reports', { params: { status: statusFilter } })
      setRows(data || [])
    } finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const resolve = async (id, status, action) => {
    setResolving(id)
    try {
      await api.put(`/tube/reports/${id}`, { status, action })
      toast(`Report ${status}`)
      load(); onRefresh()
    } catch (e) { toast(e.response?.data?.message || 'Error', 'error') }
    finally { setResolving(null) }
  }

  return (
    <div>
      <div style={{ display:'flex', gap:10, marginBottom:18, alignItems:'center' }}>
        <div style={{ display:'flex', gap:4 }}>
          {REPORT_STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding:'6px 14px', borderRadius:8, border:'1px solid var(--border)', cursor:'pointer',
              background: statusFilter === s ? STATUS_COLOR[s] + '22' : 'var(--surface2)',
              color: statusFilter === s ? STATUS_COLOR[s] : 'var(--text3)',
              fontSize:12, fontWeight:600, fontFamily:'var(--font-body)',
            }}>{s}</button>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {loading
          ? Array.from({length:5}).map((_,i) => <div key={i} className="skeleton" style={{ height:90, borderRadius:10 }} />)
          : rows.length === 0
            ? <div style={{ textAlign:'center', padding:'60px 0', border:'1px dashed var(--border)', borderRadius:'var(--radius)', color:'var(--text3)' }}>No {statusFilter} reports.</div>
            : rows.map(r => (
              <div key={r.report_id} style={{ background:'var(--surface)', border:`1px solid ${statusFilter==='pending'?'rgba(255,107,53,0.3)':'var(--border)'}`, borderRadius:10, padding:'16px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                  <Thumb url={r.video_thumb} size={80} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13, marginBottom:4 }}>{r.video_title || 'Unknown video'}</div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:6 }}>
                      {r.reason && <Badge label={r.reason} color="#FF6B35" />}
                      <Badge label={r.status} color={STATUS_COLOR[r.status]} />
                    </div>
                    {r.description && <div style={{ fontSize:12, color:'var(--text3)', marginBottom:4 }}>"{r.description}"</div>}
                    <div style={{ fontSize:11, color:'var(--text3)' }}>
                      Reported by <span style={{ color:'var(--text2)' }}>{r.reporter || 'anonymous'}</span> · {fmtDate(r.created_at)}
                    </div>
                  </div>
                  {r.status === 'pending' && (
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      <Btn size="sm" variant="ghost"   onClick={() => resolve(r.report_id, 'dismissed')} disabled={resolving===r.report_id}>Dismiss</Btn>
                      <Btn size="sm" variant="success" onClick={() => resolve(r.report_id, 'reviewed')}  disabled={resolving===r.report_id}>Reviewed</Btn>
                      <Btn size="sm" variant="danger"  onClick={() => resolve(r.report_id, 'actioned', 'remove_video')} disabled={resolving===r.report_id}>Remove Video</Btn>
                    </div>
                  )}
                </div>
              </div>
            ))
        }
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Shared micro-components
// ══════════════════════════════════════════════════════════════════════════════
function SectionLabel({ label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <span style={{ fontSize:11, fontWeight:700, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'0.8px' }}>{label}</span>
      <div style={{ flex:1, height:1, background:'var(--border)' }} />
    </div>
  )
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div style={{ position:'relative' }}>
      <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text3)' }} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px 8px 30px', color:'var(--text)', fontSize:13, outline:'none', width:220 }} />
    </div>
  )
}

function FilterSelect({ value, onChange, children }) {
  return (
    <select value={value} onChange={onChange}
      style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', color:'var(--text)', fontSize:13, outline:'none', cursor:'pointer' }}>
      {children}
    </select>
  )
}

function Pagination({ page, pages, onChange }) {
  return (
    <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:20 }}>
      <Btn size="sm" variant="ghost" disabled={page===1} onClick={() => onChange(p => p-1)}>Prev</Btn>
      <span style={{ padding:'6px 12px', fontSize:13, color:'var(--text2)' }}>{page} / {pages}</span>
      <Btn size="sm" variant="ghost" disabled={page===pages} onClick={() => onChange(p => p+1)}>Next</Btn>
    </div>
  )
}

function ModalFooter({ onCancel, onSave, saving, editing }) {
  return (
    <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:24, paddingTop:20, borderTop:'1px solid var(--border)' }}>
      <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      <Btn onClick={onSave} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</Btn>
    </div>
  )
}

function Empty({ label = 'No data yet.' }) {
  return <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text3)', fontSize:13 }}>{label}</div>
}

// ── Style tokens ───────────────────────────────────────────────────────────────
const cardStyle = { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'20px 24px' }
const cardTitle = { fontFamily:'var(--font-head)', fontSize:15, fontWeight:700, marginBottom:16, color:'var(--text)' }
const tableWrap = { border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden', overflowX:'auto' }
const tableStyle = { width:'100%', borderCollapse:'collapse', tableLayout:'auto' }
const th = { padding:'11px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.8px', background:'var(--surface)', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }
const td = { padding:'12px 14px', color:'var(--text)', fontSize:13, verticalAlign:'middle' }
const lbl = { display:'block', fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }
const grid2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }
const selectStyle = { background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', color:'var(--text)', fontSize:13, outline:'none', width:'100%', cursor:'pointer' }
const taStyle = { background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', color:'var(--text)', fontSize:13, outline:'none', width:'100%', resize:'vertical' }
