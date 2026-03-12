import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit2, Star } from 'lucide-react'
import api from '../api/client'
import { PageHeader, Table, Badge, Btn, Modal, Input, Select, SearchBar, toast } from '../components/UI'

const TYPES = ['Movie','Series','TV Show','Documentary','Anime']
const QUALITY = ['SD','HD','4K']

const empty = { title:'', description:'', content_type:'Movie', release_year:'', duration_mins:'', language:'English', quality:'HD', rating:'', video_url:'', trailer_url:'', is_premium:false, is_featured:false, category_ids:[] }

export default function Content() {
  const [rows,       setRows]       = useState([])
  const [cats,       setCats]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page,       setPage]       = useState(1)
  const [total,      setTotal]      = useState(0)
  const [modal,      setModal]      = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [form,       setForm]       = useState(empty)
  const [saving,     setSaving]     = useState(false)
  const LIMIT = 15

  const load = async () => {
    setLoading(true)
    try {
      const params = { page, limit: LIMIT, ...(search && { search }), ...(typeFilter && { type: typeFilter }) }
      const { data } = await api.get('/content', { params })
      setRows(data.data || [])
      setTotal(data.total || 0)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, search, typeFilter])
  useEffect(() => { api.get('/categories').then(r => setCats(r.data)) }, [])

  const openCreate = () => { setEditing(null); setForm(empty); setModal(true) }
  const openEdit   = r  => {
    setEditing(r.content_id)
    setForm({
      title: r.title, description: r.description || '', content_type: r.content_type,
      release_year: r.release_year || '', duration_mins: r.duration_mins || '',
      language: r.language || '', quality: r.quality || 'HD',
      rating: r.rating || '', video_url: r.video_url || '',
      trailer_url: r.trailer_url || '', is_premium: !!r.is_premium,
      is_featured: !!r.is_featured, category_ids: [],
    })
    setModal(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'category_ids') fd.append(k, JSON.stringify(v))
        else fd.append(k, v)
      })
      if (editing) await api.put(`/content/${editing}`, fd)
      else          await api.post('/content', fd)
      toast(editing ? 'Content updated' : 'Content created')
      setModal(false); load()
    } catch (e) { toast(e.response?.data?.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  const del = async id => {
    if (!confirm('Delete this content?')) return
    await api.delete(`/content/${id}`)
    toast('Deleted'); load()
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const typeColor = t => ({ Movie:'var(--blue)', Series:'var(--accent)', 'TV Show':'var(--gold)', Documentary:'var(--green)', Anime:'#9B59B6' })[t] || 'var(--text3)'

  const cols = [
    { key:'title', label:'Title', width:'25%', render: r => (
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {r.thumbnail_url
          ? <img src={r.thumbnail_url} style={{ width:36, height:24, borderRadius:4, objectFit:'cover' }} />
          : <div style={{ width:36, height:24, background:'var(--surface2)', borderRadius:4 }} />}
        <span style={{ fontWeight:600 }}>{r.title}</span>
      </div>
    )},
    { key:'content_type', label:'Type', width:'10%', render: r => <Badge label={r.content_type} color={typeColor(r.content_type)} /> },
    { key:'release_year', label:'Year', width:'7%' },
    { key:'language',     label:'Lang', width:'8%' },
    { key:'quality',      label:'Quality', width:'8%', render: r => <Badge label={r.quality || 'HD'} color="var(--text3)" /> },
    { key:'rating',       label:'Rating', width:'8%', render: r => (
      <span style={{ display:'flex', alignItems:'center', gap:4 }}>
        <Star size={11} fill="var(--gold)" color="var(--gold)" />
        {r.rating || '—'}
      </span>
    )},
    { key:'is_premium', label:'Premium', width:'8%', render: r => r.is_premium ? <Badge label="Premium" color="var(--gold)" /> : <span style={{ color:'var(--text3)' }}>Free</span> },
    { key:'total_views', label:'Views', width:'8%', render: r => r.total_views?.toLocaleString() || 0 },
    { key:'actions', label:'', width:'10%', render: r => (
      <div style={{ display:'flex', gap:6 }}>
        <Btn size="sm" variant="ghost" onClick={() => openEdit(r)}><Edit2 size={13} /></Btn>
        <Btn size="sm" variant="danger" onClick={() => del(r.content_id)}><Trash2 size={13} /></Btn>
      </div>
    )},
  ]

  const pages = Math.ceil(total / LIMIT)

  return (
    <div>
      <PageHeader
        title="Content"
        subtitle={`${total} titles in the library`}
        action={<Btn onClick={openCreate}><Plus size={15} /> Add Content</Btn>}
      />

      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search titles..." />
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
          style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 14px', color:'var(--text)', fontSize:13, outline:'none' }}
        >
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <Table cols={cols} rows={rows} loading={loading} empty="No content found." />

      {pages > 1 && (
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:20 }}>
          <Btn size="sm" variant="ghost" disabled={page===1} onClick={() => setPage(p=>p-1)}>Prev</Btn>
          <span style={{ padding:'6px 12px', fontSize:13, color:'var(--text2)' }}>{page} / {pages}</span>
          <Btn size="sm" variant="ghost" disabled={page===pages} onClick={() => setPage(p=>p+1)}>Next</Btn>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Content' : 'Add Content'} width={600}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div style={{ gridColumn:'1/-1' }}>
            <Input label="Title" value={form.title} onChange={f('title')} placeholder="Movie title" />
          </div>
          <Select label="Type" value={form.content_type} onChange={f('content_type')}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </Select>
          <Select label="Quality" value={form.quality} onChange={f('quality')}>
            {QUALITY.map(q => <option key={q}>{q}</option>)}
          </Select>
          <Input label="Release Year" type="number" value={form.release_year} onChange={f('release_year')} placeholder="2024" />
          <Input label="Duration (mins)" type="number" value={form.duration_mins} onChange={f('duration_mins')} placeholder="120" />
          <Input label="Language" value={form.language} onChange={f('language')} placeholder="English" />
          <Input label="Rating (0-10)" type="number" step="0.1" value={form.rating} onChange={f('rating')} placeholder="8.5" />
          <div style={{ gridColumn:'1/-1' }}>
            <Input label="Video URL" value={form.video_url} onChange={f('video_url')} placeholder="https://..." />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <Input label="Trailer URL" value={form.trailer_url} onChange={f('trailer_url')} placeholder="https://..." />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.8px', display:'block', marginBottom:6 }}>Description</label>
            <textarea
              value={form.description} onChange={f('description')}
              rows={3} placeholder="Short description..."
              style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', color:'var(--text)', fontSize:13, outline:'none', width:'100%', resize:'vertical' }}
            />
          </div>
          <div style={{ display:'flex', gap:20, gridColumn:'1/-1' }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'var(--text2)' }}>
              <input type="checkbox" checked={form.is_premium} onChange={f('is_premium')} />
              Premium
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'var(--text2)' }}>
              <input type="checkbox" checked={form.is_featured} onChange={f('is_featured')} />
              Featured
            </label>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:24, paddingTop:20, borderTop:'1px solid var(--border)' }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</Btn>
        </div>
      </Modal>
    </div>
  )
}
