import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit2, Star, X, UserPlus } from 'lucide-react'
import api from '../api/client'
import { PageHeader, Table, Badge, Btn, Modal, Input, Select, SearchBar, toast } from '../components/UI'

const TYPES   = ['Movie','Series','TV Show','Documentary','Anime']
const QUALITY = ['SD','HD','4K']
const AGE_RATINGS = ['U','U/A 7+','U/A 13+','U/A 16+','A','PG','PG-13','R','NC-17']

const emptyForm = {
  title: '', description: '', content_type: 'Movie', release_year: '',
  duration_mins: '', language: 'English', quality: 'HD', rating: '',
  thumbnail_url: '', banner_url: '', video_url: '', trailer_url: '',
  is_premium: false, is_featured: false, category_ids: [],
  director: '', studio: '', age_rating: '', country: '',
  cast: [],   // [{ name, role, image_url }]
}

// ─── CAST EDITOR ─────────────────────────────────────────────────────────────
function CastEditor({ cast, onChange }) {
  const addRow    = () => onChange([...cast, { name: '', role: '', image_url: '' }])
  const removeRow = i  => onChange(cast.filter((_, idx) => idx !== i))
  const update    = (i, key, val) => {
    const next = cast.map((c, idx) => idx === i ? { ...c, [key]: val } : c)
    onChange(next)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <label style={lbl}>Cast & Crew</label>
        <Btn size="sm" variant="ghost" onClick={addRow}>
          <UserPlus size={13} /> Add Person
        </Btn>
      </div>

      {cast.length === 0 && (
        <div style={{ color: 'var(--text3)', fontSize: 12, padding: '10px 0' }}>
          No cast added yet. Click "Add Person" to start.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cast.map((c, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
            <input
              value={c.name} placeholder="Actor / Director name"
              onChange={e => update(i, 'name', e.target.value)}
              style={inputStyle}
            />
            <input
              value={c.role} placeholder="Role / Character"
              onChange={e => update(i, 'role', e.target.value)}
              style={inputStyle}
            />
            <input
              value={c.image_url} placeholder="Photo URL (optional)"
              onChange={e => update(i, 'image_url', e.target.value)}
              style={inputStyle}
            />
            <button onClick={() => removeRow(i)} style={rmBtn}>
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const lbl       = { fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px' }
const inputStyle = { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 12, outline: 'none', width: '100%' }
const rmBtn     = { background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.2)', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: 'var(--accent)', display: 'flex', alignItems: 'center' }

// ─── THUMBNAIL PREVIEW ────────────────────────────────────────────────────────
function ThumbnailPreview({ url, label = 'Preview' }) {
  const [err, setErr] = useState(false)
  if (!url || err) return null
  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', height: 120, background: 'var(--surface2)', border: '1px solid var(--border)', position: 'relative' }}>
      <img
        src={url} alt={label}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={() => setErr(true)}
      />
      <div style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 10, color: 'rgba(255,255,255,0.6)', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4 }}>
        {label}
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
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
  const [form,       setForm]       = useState(emptyForm)
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

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModal(true) }

  const openEdit = r => {
    setEditing(r.content_id)
    let parsedCast = []
    if (r.cast) {
      try { parsedCast = typeof r.cast === 'string' ? JSON.parse(r.cast) : r.cast }
      catch { parsedCast = [] }
    }
    setForm({
      title:         r.title         || '',
      description:   r.description   || '',
      content_type:  r.content_type,
      release_year:  r.release_year  || '',
      duration_mins: r.duration_mins || '',
      language:      r.language      || '',
      quality:       r.quality       || 'HD',
      rating:        r.rating        || '',
      thumbnail_url: r.thumbnail_url || '',
      banner_url:    r.banner_url    || '',
      video_url:     r.video_url     || '',
      trailer_url:   r.trailer_url   || '',
      is_premium:    !!r.is_premium,
      is_featured:   !!r.is_featured,
      category_ids:  [],
      director:      r.director      || '',
      studio:        r.studio        || '',
      age_rating:    r.age_rating    || '',
      country:       r.country       || '',
      cast:          parsedCast,
    })
    setModal(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'category_ids') fd.append(k, JSON.stringify(v))
        else if (k === 'cast')    fd.append(k, JSON.stringify(v))
        else                       fd.append(k, v)
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

  const f  = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const typeColor = t => ({
    Movie: 'var(--blue)', Series: 'var(--accent)', 'TV Show': 'var(--gold)',
    Documentary: 'var(--green)', Anime: '#9B59B6',
  })[t] || 'var(--text3)'

  const cols = [
    { key: 'title', label: 'Title', width: '28%', render: r => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Thumbnail */}
        <div style={{ width: 48, height: 34, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: 'var(--surface2)' }}>
          {r.thumbnail_url
            ? <img src={r.thumbnail_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 8, color: 'var(--text3)', fontWeight: 700 }}>NO IMG</span>
              </div>
          }
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
          {r.director && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Dir: {r.director}</div>}
        </div>
      </div>
    )},
    { key: 'content_type', label: 'Type',    width: '10%', render: r => <Badge label={r.content_type} color={typeColor(r.content_type)} /> },
    { key: 'release_year', label: 'Year',    width: '7%' },
    { key: 'language',     label: 'Lang',    width: '7%' },
    { key: 'quality',      label: 'Quality', width: '7%', render: r => <Badge label={r.quality || 'HD'} color="var(--text3)" /> },
    { key: 'age_rating',   label: 'Age',     width: '7%', render: r => r.age_rating
        ? <Badge label={r.age_rating} color="var(--blue)" />
        : <span style={{ color: 'var(--text3)' }}>—</span>
    },
    { key: 'rating', label: 'Rating', width: '8%', render: r => (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Star size={11} fill="var(--gold)" color="var(--gold)" />
        {r.rating || '—'}
      </span>
    )},
    { key: 'is_premium', label: 'Premium', width: '7%', render: r =>
        r.is_premium ? <Badge label="Premium" color="var(--gold)" /> : <span style={{ color: 'var(--text3)' }}>Free</span>
    },
    { key: 'total_views', label: 'Views', width: '7%', render: r => r.total_views?.toLocaleString() || 0 },
    { key: 'actions', label: '', width: '8%', render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn size="sm" variant="ghost"  onClick={() => openEdit(r)}><Edit2  size={13} /></Btn>
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

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search titles..." />
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', color: 'var(--text)', fontSize: 13, outline: 'none' }}
        >
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <Table cols={cols} rows={rows} loading={loading} empty="No content found." />

      {pages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          <Btn size="sm" variant="ghost" disabled={page === 1}     onClick={() => setPage(p => p - 1)}>Prev</Btn>
          <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--text2)' }}>{page} / {pages}</span>
          <Btn size="sm" variant="ghost" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next</Btn>
        </div>
      )}

      {/* ── EDIT / CREATE MODAL ────────────────────────────────────────────── */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Content' : 'Add Content'} width={720}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Section: Basic Info ────────────────────────────────────────── */}
          <SectionLabel label="Basic Info" />
          <div style={grid2}>
            <div style={{ gridColumn: '1/-1' }}>
              <Input label="Title" value={form.title} onChange={f('title')} placeholder="Movie / Show title" />
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
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ ...lbl, display: 'block', marginBottom: 6 }}>Description</label>
              <textarea
                value={form.description} onChange={f('description')}
                rows={3} placeholder="Short synopsis..."
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%', resize: 'vertical' }}
              />
            </div>
          </div>

          {/* ── Section: Media URLs ────────────────────────────────────────── */}
          <SectionLabel label="Media" />
          <div style={grid2}>
            <div>
              <Input label="Thumbnail URL" value={form.thumbnail_url} onChange={f('thumbnail_url')} placeholder="https://…/poster.jpg" />
            </div>
            <div>
              <Input label="Banner / Wide Image URL" value={form.banner_url} onChange={f('banner_url')} placeholder="https://…/banner.jpg" />
            </div>
            {/* Live previews */}
            {form.thumbnail_url && <ThumbnailPreview url={form.thumbnail_url} label="Thumbnail" />}
            {form.banner_url    && <ThumbnailPreview url={form.banner_url}    label="Banner" />}
            <div style={{ gridColumn: '1/-1' }}>
              <Input label="Video URL (main)" value={form.video_url} onChange={f('video_url')} placeholder="https://drive.google.com/… or streamtape.com/…" />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Input label="Trailer URL" value={form.trailer_url} onChange={f('trailer_url')} placeholder="https://youtube.com/watch?v=… or direct link" />
            </div>
          </div>

          {/* ── Section: Production Details ────────────────────────────────── */}
          <SectionLabel label="Production Details" />
          <div style={grid2}>
            <Input label="Director" value={form.director} onChange={f('director')} placeholder="Christopher Nolan" />
            <Input label="Studio / Production House" value={form.studio} onChange={f('studio')} placeholder="Warner Bros." />
            <Input label="Country" value={form.country} onChange={f('country')} placeholder="USA" />
            <div>
              <label style={{ ...lbl, display: 'block', marginBottom: 6 }}>Age Rating</label>
              <select value={form.age_rating} onChange={f('age_rating')}
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%' }}>
                <option value="">— Select —</option>
                {AGE_RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* ── Section: Cast & Crew ───────────────────────────────────────── */}
          <SectionLabel label="Cast & Crew" />
          <CastEditor cast={form.cast} onChange={val => setForm(p => ({ ...p, cast: val }))} />

          {/* ── Section: Flags ─────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
              <input type="checkbox" checked={form.is_premium} onChange={f('is_premium')} />
              Premium
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
              <input type="checkbox" checked={form.is_featured} onChange={f('is_featured')} />
              Featured
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</Btn>
        </div>
      </Modal>
    </div>
  )
}

function SectionLabel({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }