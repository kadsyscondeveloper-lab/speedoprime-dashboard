import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Edit2, Star, X, UserPlus, Tv, ChevronDown, ChevronRight, Film, PlayCircle, Clock, Calendar } from 'lucide-react'
import api from '../api/client'
import { PageHeader, Table, Badge, Btn, Modal, Input, Select, SearchBar, toast } from '../components/UI'

const TYPES = ['Movie', 'Series', 'TV Show', 'Documentary', 'Anime']
const QUALITY = ['SD', 'HD', '4K']
const AGE_RATINGS = ['U', 'U/A 7+', 'U/A 13+', 'U/A 16+', 'A', 'PG', 'PG-13', 'R', 'NC-17']

const emptyForm = {
  title: '', description: '', content_type: 'Movie', release_year: '',
  duration_mins: '', language: 'English', quality: 'HD', rating: '',
  thumbnail_url: '', banner_url: '', video_url: '', trailer_url: '',
  is_premium: false, is_featured: false, category_ids: [],
  director: '', studio: '', age_rating: '', country: '',
  cast: [],
}

const emptySeasonForm = { season_num: '', title: '', description: '', thumbnail_url: '', release_year: '' }
const emptyEpisodeForm = { episode_num: '', title: '', description: '', duration_mins: '', thumbnail_url: '', video_url: '', is_free: false, air_date: '' }

// ─── Shared styles ────────────────────────────────────────────────────────────
const lbl = { fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px' }
const inputStyle = { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 12, outline: 'none', width: '100%' }
const rmBtn = { background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.2)', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: 'var(--accent)', display: 'flex', alignItems: 'center' }
const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }

// ─── Section label divider ────────────────────────────────────────────────────
function SectionLabel({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}


// ─── Category picker ──────────────────────────────────────────────────────────
function CategoryPicker({ selected, onChange }) {
  const [cats, setCats] = useState([])

  useEffect(() => {
    api.get('/categories').then(r => {
      setCats(Array.isArray(r.data) ? r.data : (r.data?.data || []))
    }).catch(() => { })
  }, [])

  const toggle = id => {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }

  if (cats.length === 0) return <div style={{ color: 'var(--text3)', fontSize: 12 }}>Loading categories…</div>

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {cats.map(c => {
        const on = selected.includes(c.category_id)
        return (
          <button key={c.category_id} onClick={() => toggle(c.category_id)}
            style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
              background: on ? 'rgba(255,45,85,0.15)' : 'var(--surface2)',
              color: on ? 'var(--accent)' : 'var(--text2)',
              transition: 'all 0.15s',
            }}>
            {c.name}
          </button>
        )
      })}
    </div>
  )
}


// ─── Cast editor ──────────────────────────────────────────────────────────────
function CastEditor({ cast, onChange }) {
  const addRow = () => onChange([...cast, { name: '', role: '', image_url: '' }])
  const removeRow = i => onChange(cast.filter((_, idx) => idx !== i))
  const update = (i, key, val) => onChange(cast.map((c, idx) => idx === i ? { ...c, [key]: val } : c))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <label style={lbl}>Cast & Crew</label>
        <Btn size="sm" variant="ghost" onClick={addRow}><UserPlus size={13} /> Add Person</Btn>
      </div>
      {cast.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 12, padding: '10px 0' }}>No cast added yet.</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cast.map((c, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
            <input value={c.name} placeholder="Name" onChange={e => update(i, 'name', e.target.value)} style={inputStyle} />
            <input value={c.role} placeholder="Role / Character" onChange={e => update(i, 'role', e.target.value)} style={inputStyle} />
            <input value={c.image_url} placeholder="Photo URL" onChange={e => update(i, 'image_url', e.target.value)} style={inputStyle} />
            <button onClick={() => removeRow(i)} style={rmBtn}><X size={13} /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Thumbnail preview ────────────────────────────────────────────────────────
function ThumbnailPreview({ url, label = 'Preview' }) {
  const [err, setErr] = useState(false)
  if (!url || err) return null
  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', height: 120, background: 'var(--surface2)', border: '1px solid var(--border)', position: 'relative' }}>
      <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
      <div style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 10, color: 'rgba(255,255,255,0.6)', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4 }}>{label}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EPISODE FORM MODAL
// ─────────────────────────────────────────────────────────────────────────────
function EpisodeModal({ open, onClose, seasonId, episode, onSaved }) {
  const isEdit = !!episode
  const [form, setForm] = useState(emptyEpisodeForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (episode) {
      setForm({
        episode_num: episode.episode_num || '',
        title: episode.title || '',
        description: episode.description || '',
        duration_mins: episode.duration_mins || '',
        thumbnail_url: episode.thumbnail_url || '',
        video_url: episode.video_url || '',
        is_free: !!episode.is_free,
        air_date: episode.air_date ? episode.air_date.split('T')[0] : '',
      })
    } else {
      setForm(emptyEpisodeForm)
    }
  }, [episode, open])

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const fc = k => e => setForm(p => ({ ...p, [k]: e.target.checked }))

  const save = async () => {
    if (!form.title.trim()) return toast('Title is required', 'error')
    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/episodes/${episode.episode_id}`, form)
      } else {
        await api.post(`/seasons/${seasonId}/episodes`, form)
      }
      toast(isEdit ? 'Episode updated' : 'Episode added')
      onSaved()
      onClose()
    } catch (e) { toast(e.response?.data?.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `Edit Episode` : 'Add Episode'} width={580}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={grid2}>
          <Input label="Episode #" type="number" value={form.episode_num} onChange={f('episode_num')} placeholder="Auto-assigned if blank" />
          <Input label="Air Date" type="date" value={form.air_date} onChange={f('air_date')} />
        </div>
        <Input label="Title" value={form.title} onChange={f('title')} placeholder="Episode title" />
        <div>
          <label style={{ ...lbl, display: 'block', marginBottom: 6 }}>Description</label>
          <textarea value={form.description} onChange={f('description')} rows={3}
            placeholder="Episode synopsis…"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%', resize: 'vertical' }} />
        </div>
        <div style={grid2}>
          <Input label="Duration (mins)" type="number" value={form.duration_mins} onChange={f('duration_mins')} placeholder="45" />
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
              <input type="checkbox" checked={form.is_free} onChange={fc('is_free')} />
              Free episode (no subscription required)
            </label>
          </div>
        </div>
        <Input label="Thumbnail URL" value={form.thumbnail_url} onChange={f('thumbnail_url')} placeholder="https://…/ep-thumb.jpg" />
        {form.thumbnail_url && <ThumbnailPreview url={form.thumbnail_url} label="Episode Thumbnail" />}
        <Input label="Video URL" value={form.video_url} onChange={f('video_url')} placeholder="https://drive.google.com/… or streamtape.com/…" />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Update' : 'Add Episode'}</Btn>
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SEASON FORM MODAL
// ─────────────────────────────────────────────────────────────────────────────
function SeasonModal({ open, onClose, contentId, season, onSaved }) {
  const isEdit = !!season
  const [form, setForm] = useState(emptySeasonForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (season) {
      setForm({
        season_num: season.season_num || '',
        title: season.title || '',
        description: season.description || '',
        thumbnail_url: season.thumbnail_url || '',
        release_year: season.release_year || '',
      })
    } else {
      setForm(emptySeasonForm)
    }
  }, [season, open])

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const save = async () => {
    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/seasons/${season.season_id}`, form)
      } else {
        await api.post(`/content/${contentId}/seasons`, form)
      }
      toast(isEdit ? 'Season updated' : 'Season created')
      onSaved()
      onClose()
    } catch (e) { toast(e.response?.data?.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Season' : 'Add Season'} width={480}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={grid2}>
          <Input label="Season #" type="number" value={form.season_num} onChange={f('season_num')} placeholder="Auto-assigned if blank" />
          <Input label="Year" type="number" value={form.release_year} onChange={f('release_year')} placeholder="2024" />
        </div>
        <Input label="Season Title" value={form.title} onChange={f('title')} placeholder="e.g. Season 1 or The Beginning" />
        <div>
          <label style={{ ...lbl, display: 'block', marginBottom: 6 }}>Description</label>
          <textarea value={form.description} onChange={f('description')} rows={2}
            placeholder="Season overview…"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%', resize: 'vertical' }} />
        </div>
        <Input label="Season Thumbnail URL" value={form.thumbnail_url} onChange={f('thumbnail_url')} placeholder="https://…" />
        {form.thumbnail_url && <ThumbnailPreview url={form.thumbnail_url} label="Season Thumbnail" />}
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Update' : 'Create Season'}</Btn>
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EPISODE LIST (inside an expanded season)
// ─────────────────────────────────────────────────────────────────────────────
function EpisodeList({ season, onDataChanged }) {
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [epModal, setEpModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/seasons/${season.season_id}/episodes`)
      setEpisodes(data)
    } finally { setLoading(false) }
  }, [season.season_id])

  useEffect(() => { load() }, [load])

  const deleteEp = async ep => {
    if (!confirm(`Delete "${ep.title}"?`)) return
    await api.delete(`/episodes/${ep.episode_id}`)
    toast('Episode deleted')
    load()
    onDataChanged()
  }

  const openEdit = ep => { setEditing(ep); setEpModal(true) }
  const openAdd = () => { setEditing(null); setEpModal(true) }

  return (
    <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 16px', marginTop: 4 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          {episodes.length} Episode{episodes.length !== 1 ? 's' : ''}
        </span>
        <Btn size="sm" variant="success" onClick={openAdd}><Plus size={12} /> Add Episode</Btn>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
        </div>
      ) : episodes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: 13 }}>
          No episodes yet. Add the first one!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {episodes.map(ep => (
            <div key={ep.episode_id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '10px 14px',
              opacity: ep.is_active === false || ep.is_active === 0 ? 0.5 : 1,
            }}>
              {/* Thumbnail or placeholder */}
              <div style={{ width: 56, height: 36, borderRadius: 5, overflow: 'hidden', flexShrink: 0, background: 'var(--surface2)', position: 'relative' }}>
                {ep.thumbnail_url
                  ? <img src={ep.thumbnail_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PlayCircle size={16} color="var(--text3)" />
                  </div>
                }
              </div>

              {/* Episode num badge */}
              <div style={{ minWidth: 28, height: 28, background: 'var(--surface2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text3)', flexShrink: 0 }}>
                {ep.episode_num}
              </div>

              {/* Title + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ep.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                  {ep.duration_mins && (
                    <span style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={10} /> {ep.duration_mins}m
                    </span>
                  )}
                  {ep.air_date && (
                    <span style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Calendar size={10} /> {new Date(ep.air_date).toLocaleDateString()}
                    </span>
                  )}
                  {ep.is_free ? <Badge label="Free" color="var(--green)" /> : null}
                  {!ep.video_url && <Badge label="No Video" color="var(--accent)" />}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <Btn size="sm" variant="ghost" onClick={() => openEdit(ep)}><Edit2 size={12} /></Btn>
                <Btn size="sm" variant="danger" onClick={() => deleteEp(ep)}><Trash2 size={12} /></Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      <EpisodeModal
        open={epModal}
        onClose={() => setEpModal(false)}
        seasonId={season.season_id}
        episode={editing}
        onSaved={() => { load(); onDataChanged() }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SERIES MANAGER MODAL
// ─────────────────────────────────────────────────────────────────────────────
function SeriesManagerModal({ open, onClose, content }) {
  const [seasons, setSeasons] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [seasonModal, setSeasonModal] = useState(false)
  const [editingSeason, setEditingSeason] = useState(null)

  const load = useCallback(async () => {
    if (!content) return
    setLoading(true)
    try {
      const { data } = await api.get(`/content/${content.content_id}/seasons`)
      setSeasons(data)
    } finally { setLoading(false) }
  }, [content])

  useEffect(() => { if (open) load() }, [open, load])

  const toggleExpand = id => setExpanded(p => ({ ...p, [id]: !p[id] }))

  const deleteSeason = async s => {
    if (!confirm(`Delete "${s.title}" and all its episodes?`)) return
    await api.delete(`/seasons/${s.season_id}`)
    toast('Season deleted')
    load()
  }

  const openEditSeason = s => { setEditingSeason(s); setSeasonModal(true) }
  const openAddSeason = () => { setEditingSeason(null); setSeasonModal(true) }

  if (!content) return null

  return (
    <Modal open={open} onClose={onClose} title={`Manage Series: ${content.title}`} width={720}>
      {/* Series overview bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
        {content.thumbnail_url && (
          <img src={content.thumbnail_url} style={{ width: 48, height: 68, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
        )}
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700 }}>{content.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
            {seasons.length} Season{seasons.length !== 1 ? 's' : ''}
            {' · '}{seasons.reduce((s, se) => s + (se.actual_episode_count || se.episode_count || 0), 0)} Episodes total
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Btn onClick={openAddSeason}><Plus size={14} /> Add Season</Btn>
        </div>
      </div>

      {/* Season list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 10 }} />)}
        </div>
      ) : seasons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', border: '1px dashed var(--border)', borderRadius: 12 }}>
          <Tv size={36} color="var(--text3)" style={{ marginBottom: 12 }} />
          <div style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 16 }}>No seasons yet</div>
          <Btn onClick={openAddSeason}><Plus size={14} /> Add First Season</Btn>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {seasons.map((s, idx) => {
            const isOpen = !!expanded[s.season_id]
            const epCount = s.actual_episode_count ?? s.episode_count ?? 0
            return (
              <div key={s.season_id} style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                {/* Season header row */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--surface)', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => toggleExpand(s.season_id)}
                >
                  {/* Expand icon */}
                  <div style={{ flexShrink: 0, color: 'var(--text3)' }}>
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>

                  {/* Season thumbnail */}
                  <div style={{ width: 48, height: 34, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: 'var(--surface2)' }}>
                    {s.thumbnail_url
                      ? <img src={s.thumbnail_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Film size={14} color="var(--text3)" />
                      </div>
                    }
                  </div>

                  {/* Season info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{s.title || `Season ${s.season_num}`}</span>
                      <Badge label={`S${s.season_num}`} color="var(--blue)" />
                      {s.release_year && <span style={{ fontSize: 12, color: 'var(--text3)' }}>{s.release_year}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                      {epCount} episode{epCount !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Actions — stop propagation so click doesn't toggle expand */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <Btn size="sm" variant="ghost" onClick={() => openEditSeason(s)}><Edit2 size={12} /></Btn>
                    <Btn size="sm" variant="danger" onClick={() => deleteSeason(s)}>  <Trash2 size={12} /></Btn>
                  </div>
                </div>

                {/* Expanded episode list */}
                {isOpen && (
                  <div style={{ padding: '0 16px 16px', background: 'var(--surface)' }}>
                    <EpisodeList season={s} onDataChanged={load} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <Btn variant="ghost" onClick={onClose}>Close</Btn>
      </div>

      <SeasonModal
        open={seasonModal}
        onClose={() => setSeasonModal(false)}
        contentId={content?.content_id}
        season={editingSeason}
        onSaved={load}
      />
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CONTENT PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Content() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [seriesContent, setSeriesContent] = useState(null)  // content being managed in SeriesManagerModal
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

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModal(true) }

  const openEdit = r => {
    setEditing(r.content_id)
    let parsedCast = []
    if (r.cast) {
      try { parsedCast = typeof r.cast === 'string' ? JSON.parse(r.cast) : r.cast }
      catch { parsedCast = [] }
    }
    setForm({
      title: r.title || '',
      description: r.description || '',
      content_type: r.content_type,
      release_year: r.release_year || '',
      duration_mins: r.duration_mins || '',
      language: r.language || '',
      quality: r.quality || 'HD',
      rating: r.rating || '',
      thumbnail_url: r.thumbnail_url || '',
      banner_url: r.banner_url || '',
      video_url: r.video_url || '',
      trailer_url: r.trailer_url || '',
      is_premium: !!r.is_premium,
      is_featured: !!r.is_featured,
      category_ids: [],
      director: r.director || '',
      studio: r.studio || '',
      age_rating: r.age_rating || '',
      country: r.country || '',
      cast: parsedCast,
    })


    // load existing category_ids for this content
api.get(`/content/${r.content_id}`).then(res => {
  const cats = res.data?.categories || ''
  // categories comes back as comma-separated names, but we need IDs
  // fetch all cats and match by name
  api.get('/categories').then(catRes => {
    const allCats = Array.isArray(catRes.data) ? catRes.data : (catRes.data?.data || [])
    const names = cats.split(',').map(s => s.trim()).filter(Boolean)
    const ids = allCats.filter(c => names.includes(c.name)).map(c => c.category_id)
    setForm(p => ({ ...p, category_ids: ids }))
  })
})

    setModal(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'category_ids') fd.append(k, JSON.stringify(v))
        else if (k === 'cast') fd.append(k, JSON.stringify(v))
        else fd.append(k, v)
      })
      if (editing) await api.put(`/content/${editing}`, fd)
      else await api.post('/content', fd)
      toast(editing ? 'Content updated' : 'Content created')
      setModal(false)
      load()
    } catch (e) { toast(e.response?.data?.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  const del = async id => {
    if (!confirm('Delete this content?')) return
    await api.delete(`/content/${id}`)
    toast('Deleted'); load()
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const typeColor = t => ({
    Movie: 'var(--blue)', Series: 'var(--accent)', 'TV Show': 'var(--gold)',
    Documentary: 'var(--green)', Anime: '#9B59B6',
  })[t] || 'var(--text3)'

  const cols = [
    {
      key: 'title', label: 'Title', width: '26%', render: r => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
      )
    },
    { key: 'content_type', label: 'Type', width: '10%', render: r => <Badge label={r.content_type} color={typeColor(r.content_type)} /> },
    { key: 'release_year', label: 'Year', width: '6%' },
    { key: 'language', label: 'Lang', width: '6%' },
    { key: 'quality', label: 'Quality', width: '7%', render: r => <Badge label={r.quality || 'HD'} color="var(--text3)" /> },
    { key: 'age_rating', label: 'Age', width: '6%', render: r => r.age_rating ? <Badge label={r.age_rating} color="var(--blue)" /> : <span style={{ color: 'var(--text3)' }}>—</span> },
    {
      key: 'rating', label: 'Rating', width: '7%', render: r => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Star size={11} fill="var(--gold)" color="var(--gold)" />
          {r.rating || '—'}
        </span>
      )
    },
    {
      key: 'is_premium', label: 'Access', width: '7%', render: r =>
        r.is_premium ? <Badge label="Premium" color="var(--gold)" /> : <span style={{ color: 'var(--text3)' }}>Free</span>
    },
    { key: 'total_views', label: 'Views', width: '6%', render: r => r.total_views?.toLocaleString() || 0 },
    {
      key: 'actions', label: '', width: '12%', render: r => (
        <div style={{ display: 'flex', gap: 5 }}>
          {/* Show "Seasons" button only for Series */}
          {r.content_type === 'Series' && (
            <Btn size="sm" variant="ghost" onClick={() => setSeriesContent(r)} title="Manage Seasons & Episodes"
              style={{ background: 'rgba(255,45,85,0.1)', color: 'var(--accent)' }}>
              <Tv size={12} />
            </Btn>
          )}
          <Btn size="sm" variant="ghost" onClick={() => openEdit(r)}><Edit2 size={12} /></Btn>
          <Btn size="sm" variant="danger" onClick={() => del(r.content_id)}><Trash2 size={12} /></Btn>
        </div>
      )
    },
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
          <Btn size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Btn>
          <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--text2)' }}>{page} / {pages}</span>
          <Btn size="sm" variant="ghost" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next</Btn>
        </div>
      )}

      {/* ── Content Create / Edit Modal ────────────────────────────────────── */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Content' : 'Add Content'} width={720}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

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
            {/* Hide duration for Series — managed at episode level */}
            {form.content_type !== 'Series' && (
              <Input label="Duration (mins)" type="number" value={form.duration_mins} onChange={f('duration_mins')} placeholder="120" />
            )}
            {form.content_type === 'Series' && (
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,45,85,0.07)', border: '1px solid rgba(255,45,85,0.15)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--text3)', gap: 8 }}>
                <Tv size={14} color="var(--accent)" />
                Duration is set per-episode. After saving, use the <strong style={{ color: 'var(--accent)' }}>TV icon</strong> in the table to manage seasons & episodes.
              </div>
            )}
            <Input label="Language" value={form.language} onChange={f('language')} placeholder="English" />
            <Input label="Rating (0-10)" type="number" step="0.1" value={form.rating} onChange={f('rating')} placeholder="8.5" />
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ ...lbl, display: 'block', marginBottom: 6 }}>Description</label>
              <textarea value={form.description} onChange={f('description')} rows={3} placeholder="Short synopsis…"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%', resize: 'vertical' }} />
            </div>
          </div>

          <SectionLabel label="Media" />
          <div style={grid2}>
            <Input label="Thumbnail URL" value={form.thumbnail_url} onChange={f('thumbnail_url')} placeholder="https://…/poster.jpg" />
            <Input label="Banner / Wide Image" value={form.banner_url} onChange={f('banner_url')} placeholder="https://…/banner.jpg" />
            {form.thumbnail_url && <ThumbnailPreview url={form.thumbnail_url} label="Thumbnail" />}
            {form.banner_url && <ThumbnailPreview url={form.banner_url} label="Banner" />}
            {form.content_type !== 'Series' && (
              <div style={{ gridColumn: '1/-1' }}>
                <Input label="Video URL (main)" value={form.video_url} onChange={f('video_url')} placeholder="https://…" />
              </div>
            )}
            <div style={{ gridColumn: '1/-1' }}>
              <Input label="Trailer URL" value={form.trailer_url} onChange={f('trailer_url')} placeholder="https://youtube.com/watch?v=…" />
            </div>
          </div>

          <SectionLabel label="Production Details" />
          <div style={grid2}>
            <Input label="Director" value={form.director} onChange={f('director')} placeholder="Christopher Nolan" />
            <Input label="Studio" value={form.studio} onChange={f('studio')} placeholder="Warner Bros." />
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

          <SectionLabel label="Cast & Crew" />
          <CastEditor cast={form.cast} onChange={val => setForm(p => ({ ...p, cast: val }))} />

          <div style={{ display: 'flex', gap: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
              <input type="checkbox" checked={form.is_premium} onChange={f('is_premium')} /> Premium
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
              <input type="checkbox" checked={form.is_featured} onChange={f('is_featured')} /> Featured
            </label>
          </div>
        </div>


        <SectionLabel label="Genres" />
        <CategoryPicker
          selected={form.category_ids}
          onChange={val => setForm(p => ({ ...p, category_ids: val }))}
        />

        <div style={{ display: 'flex', gap: 20, justifyContent: 'flex-end', marginTop: 30, paddingTop: 30, borderTop: '1px solid var(--border)' }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</Btn>
        </div>
      </Modal>

      {/* ── Series Manager Modal ──────────────────────────────────────────── */}
      <SeriesManagerModal
        open={!!seriesContent}
        onClose={() => setSeriesContent(null)}
        content={seriesContent}
      />
    </div>
  )
}