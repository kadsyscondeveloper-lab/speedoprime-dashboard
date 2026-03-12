import { useEffect, useState } from 'react'
import {
  Plus, Trash2, Edit2, GripVertical, Eye, EyeOff,
  Image, LayoutList, Layers, ChevronUp, ChevronDown
} from 'lucide-react'
import api from '../api/client'
import { PageHeader, Badge, Btn, Modal, Input, Select, toast } from '../components/UI'

const TABS = [
  { key: 'sections', label: 'Sections',     icon: LayoutList },
  { key: 'banners',  label: 'Hero Banners', icon: Image },
]

const FILTER_TYPES  = ['trending', 'new', 'category', 'manual', 'continue']
const SECTION_TYPES = ['hero_banner', 'content_row', 'ad_banner']
const PLACEMENTS    = ['home_top', 'home_mid', 'home_bottom', 'search']

export default function HomeScreen() {
  const [tab, setTab] = useState('sections')
  return (
    <div>
      <PageHeader title="Home Screen" subtitle="Control what users see on the home screen." />
      <div style={s.tabs}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            ...s.tab,
            background:   tab === key ? 'var(--surface2)' : 'transparent',
            color:        tab === key ? 'var(--text)'     : 'var(--text3)',
            borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
          }}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>
      {tab === 'sections' && <SectionsTab />}
      {tab === 'banners'  && <BannersTab />}
    </div>
  )
}

// ── SECTIONS TAB ─────────────────────────────────────────────────────────────
function SectionsTab() {
  const [sections,    setSections]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [modal,       setModal]       = useState(false)
  const [editing,     setEditing]     = useState(null)
  const [form,        setForm]        = useState({
    title: '', section_type: 'content_row', filter_type: 'trending',
    filter_value: '', max_items: 10, is_active: true,
  })
  const [saving,      setSaving]      = useState(false)
  const [itemsModal,  setItemsModal]  = useState(null)

  const load = async () => {
    setLoading(true)
    const { data } = await api.get('/home/sections')
    setSections(data.sort((a, b) => a.sort_order - b.sort_order))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openEdit = sec => {
    setEditing(sec.section_id)
    setForm({
      title:        sec.title,
      section_type: sec.section_type,
      filter_type:  sec.filter_type  || 'trending',
      filter_value: sec.filter_value || '',
      max_items:    sec.max_items    || 10,
      is_active:    !!sec.is_active,
    })
    setModal(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      await api.put(`/home/sections/${editing}`, form)
      toast('Section updated')
      setModal(false); load()
    } catch (e) { toast(e.response?.data?.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  const toggleActive = async sec => {
    await api.put(`/home/sections/${sec.section_id}`, { is_active: !sec.is_active })
    toast(sec.is_active ? 'Section hidden' : 'Section shown')
    load()
  }

  const move = async (sec, dir) => {
    const idx   = sections.findIndex(s => s.section_id === sec.section_id)
    const other = sections[idx + dir]
    if (!other) return
    await api.put('/home/sections/reorder', {
      order: [
        { section_id: sec.section_id,   sort_order: other.sort_order },
        { section_id: other.section_id, sort_order: sec.sort_order   },
      ]
    })
    load()
  }

  const f  = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const fc = k => e => setForm(p => ({ ...p, [k]: e.target.checked }))

  const typeColor   = t => ({ hero_banner: 'var(--gold)', content_row: 'var(--blue)', ad_banner: 'var(--accent)' })[t] || 'var(--text3)'
  const filterColor = t => ({ trending: 'var(--accent)', new: 'var(--green)', category: 'var(--blue)', manual: 'var(--gold)', continue: '#9B59B6' })[t] || 'var(--text3)'

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
          Use ↑ ↓ to reorder · Toggle eye to show/hide
        </span>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Hero Banner', color: 'var(--gold)' },
          { label: 'Content Row', color: 'var(--blue)' },
          { label: 'Ad Banner',   color: 'var(--accent)' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius)', marginBottom: 8 }} />
        ))
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sections.map((sec, idx) => (
            <div key={sec.section_id} style={{
              ...s.secRow,
              opacity:    sec.is_active ? 1 : 0.45,
              borderLeft: `3px solid ${typeColor(sec.section_type)}`,
            }}>
              <div style={s.secOrder}>
                <GripVertical size={14} color="var(--text3)" />
                <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700 }}>{idx + 1}</span>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{sec.title}</span>
                  <Badge label={sec.section_type.replace('_', ' ')} color={typeColor(sec.section_type)} />
                  {sec.section_type === 'ad_banner' && sec.filter_value && (
                    <Badge label={`placement: ${sec.filter_value}`} color="var(--accent)" />
                  )}
                  {sec.section_type === 'content_row' && sec.filter_type && (
                    <Badge label={sec.filter_type} color={filterColor(sec.filter_type)} />
                  )}
                  {!sec.is_active && <Badge label="Hidden" color="var(--text3)" />}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                  {sec.section_type === 'ad_banner'
                    ? `Serves ads with placement = "${sec.filter_value || 'any'}"`
                    : `Max items: ${sec.max_items}${sec.filter_value ? ` · Filter: ${sec.filter_value}` : ''}`
                  }
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                {sec.filter_type === 'manual' && (
                  <Btn size="sm" variant="ghost" onClick={() => setItemsModal(sec)}>
                    <Layers size={13} /> Items
                  </Btn>
                )}
                <Btn size="sm" variant="ghost" onClick={() => move(sec, -1)} disabled={idx === 0}>
                  <ChevronUp size={13} />
                </Btn>
                <Btn size="sm" variant="ghost" onClick={() => move(sec, 1)} disabled={idx === sections.length - 1}>
                  <ChevronDown size={13} />
                </Btn>
                <Btn size="sm" variant="ghost" onClick={() => toggleActive(sec)}>
                  {sec.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
                </Btn>
                <Btn size="sm" variant="ghost" onClick={() => openEdit(sec)}>
                  <Edit2 size={13} />
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Edit Section" width={480}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Display Title" value={form.title} onChange={f('title')} placeholder="e.g. Trending Now" />
          <Select label="Section Type" value={form.section_type} onChange={f('section_type')}>
            {SECTION_TYPES.map(t => <option key={t}>{t}</option>)}
          </Select>

          {/* AD BANNER: show placement picker */}
          {form.section_type === 'ad_banner' && (
            <div>
              <Select label="Ad Placement (matches ads with this placement)" value={form.filter_value} onChange={f('filter_value')}>
                <option value="">— Any active ad —</option>
                {PLACEMENTS.map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                This section will serve ads where <code style={{ background: 'var(--surface2)', padding: '1px 5px', borderRadius: 3 }}>placement</code> matches the value above.
                Make sure your ads in the Ads page have a matching placement set.
              </p>
            </div>
          )}

          {/* CONTENT ROW: show filter type */}
          {form.section_type === 'content_row' && (
            <Select label="Filter Type" value={form.filter_type} onChange={f('filter_type')}>
              {FILTER_TYPES.map(t => <option key={t}>{t}</option>)}
            </Select>
          )}

          {/* CATEGORY filter value */}
          {form.section_type === 'content_row' && form.filter_type === 'category' && (
            <Input label="Category ID" value={form.filter_value} onChange={f('filter_value')} placeholder="e.g. 1" />
          )}

          {form.section_type !== 'ad_banner' && (
            <Input label="Max Items" type="number" value={form.max_items} onChange={f('max_items')} />
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
            <input type="checkbox" checked={form.is_active} onChange={fc('is_active')} />
            Visible on home screen
          </label>
        </div>
        <div style={s.modalFooter}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Update'}</Btn>
        </div>
      </Modal>

      {itemsModal && (
        <ManualItemsModal section={itemsModal} onClose={() => { setItemsModal(null); load() }} />
      )}
    </div>
  )
}

// ── MANUAL ITEMS MODAL ───────────────────────────────────────────────────────
function ManualItemsModal({ section, onClose }) {
  const [items,   setItems]   = useState([])
  const [results, setResults] = useState([])
  const [search,  setSearch]  = useState('')
  const [loading, setLoading] = useState(false)
  const [adding,  setAdding]  = useState(null)

  const loadItems = async () => {
    const { data } = await api.get('/home')
    const sec = data.sections.find(s => s.section_id === section.section_id)
    setItems(sec?.items || [])
  }

  useEffect(() => { loadItems() }, [])

  const searchContent = async () => {
    if (!search.trim()) return
    setLoading(true)
    const { data } = await api.get('/content', { params: { search, limit: 10 } })
    setResults(data.data || [])
    setLoading(false)
  }

  const addItem = async content => {
    setAdding(content.content_id)
    try {
      await api.post(`/home/sections/${section.section_id}/items`, {
        content_id: content.content_id, sort_order: items.length + 1
      })
      toast(`"${content.title}" added`)
      loadItems()
    } catch (e) {
      toast(e.response?.data?.message || 'Error', 'error')
    } finally { setAdding(null) }
  }

  const removeItem = async content_id => {
    await api.delete(`/home/sections/${section.section_id}/items/${content_id}`)
    toast('Item removed')
    loadItems()
  }

  return (
    <Modal open onClose={onClose} title={`"${section.title}" — Manual Items`} width={560}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
          Current Items ({items.length})
        </div>
        {items.length === 0 ? (
          <div style={{ color: 'var(--text3)', fontSize: 13, padding: '16px 0' }}>No items added yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflow: 'auto' }}>
            {items.map((item, i) => (
              <div key={item.content_id} style={s.itemRow}>
                <span style={{ fontSize: 12, color: 'var(--text3)', width: 20 }}>{i + 1}</span>
                {item.thumbnail_url
                  ? <img src={item.thumbnail_url} style={{ width: 40, height: 26, borderRadius: 4, objectFit: 'cover' }} />
                  : <div style={{ width: 40, height: 26, background: 'var(--surface2)', borderRadius: 4 }} />}
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{item.title}</span>
                <Badge label={item.content_type} color="var(--blue)" />
                <Btn size="sm" variant="danger" onClick={() => removeItem(item.content_id)}><Trash2 size={12} /></Btn>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
          Add Content
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchContent()}
            placeholder="Search content by title…"
            style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', color: 'var(--text)', fontSize: 13, outline: 'none' }}
          />
          <Btn onClick={searchContent}>Search</Btn>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflow: 'auto' }}>
          {results.map(r => {
            const alreadyAdded = items.some(i => i.content_id === r.content_id)
            return (
              <div key={r.content_id} style={s.itemRow}>
                {r.thumbnail_url
                  ? <img src={r.thumbnail_url} style={{ width: 40, height: 26, borderRadius: 4, objectFit: 'cover' }} />
                  : <div style={{ width: 40, height: 26, background: 'var(--surface2)', borderRadius: 4 }} />}
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{r.title}</span>
                <Badge label={r.content_type} color="var(--blue)" />
                <Btn size="sm" variant={alreadyAdded ? 'ghost' : 'success'}
                  disabled={alreadyAdded || adding === r.content_id}
                  onClick={() => !alreadyAdded && addItem(r)}>
                  {alreadyAdded ? 'Added' : adding === r.content_id ? '…' : <><Plus size={12} /> Add</>}
                </Btn>
              </div>
            )
          })}
        </div>
      </div>
      <div style={s.modalFooter}><Btn onClick={onClose}>Done</Btn></div>
    </Modal>
  )
}

// ── HERO BANNERS TAB ─────────────────────────────────────────────────────────
function BannersTab() {
  const [banners,  setBanners]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [form,     setForm]     = useState({ content_id: '', image_url: '', title: '', subtitle: '', cta_text: 'Watch Now', sort_order: 0 })
  const [saving,   setSaving]   = useState(false)
  const [content,  setContent]  = useState([])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/home')
      const heroSec = data.sections.find(s => s.section_type === 'hero_banner')
      setBanners(heroSec?.items || [])
    } finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    api.get('/content?limit=100').then(r => setContent(r.data.data || []))
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ content_id: '', image_url: '', title: '', subtitle: '', cta_text: 'Watch Now', sort_order: banners.length + 1 })
    setModal(true)
  }

  const openEdit = b => {
    setEditing(b.banner_id)
    setForm({ content_id: b.content_id || '', image_url: b.image_url || '', title: b.title || '', subtitle: b.subtitle || '', cta_text: b.cta_text || 'Watch Now', sort_order: b.sort_order || 0 })
    setModal(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = { ...form, content_id: form.content_id ? parseInt(form.content_id) : null, sort_order: parseInt(form.sort_order), is_active: true }
      if (editing) await api.put(`/home/banners/${editing}`, payload)
      else          await api.post('/home/banners', payload)
      toast(editing ? 'Banner updated' : 'Banner created')
      setModal(false); load()
    } catch (e) { toast(e.response?.data?.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  const del = async id => {
    if (!confirm('Delete this banner?')) return
    try { await api.delete(`/home/banners/${id}`); toast('Banner deleted'); load() }
    catch { toast('Delete failed', 'error') }
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: 'var(--text3)' }}>These appear in the hero slider at the top of the home screen.</p>
        <Btn onClick={openCreate}><Plus size={15} /> Add Banner</Btn>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 'var(--radius)' }} />)}
        </div>
      ) : banners.length === 0 ? (
        <div style={s.empty}><Image size={40} color="var(--text3)" /><p style={{ color: 'var(--text3)', marginTop: 12 }}>No hero banners yet.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {banners.map(b => (
            <div key={b.banner_id} style={s.bannerCard}>
              <div style={s.bannerImg}>
                {b.image_url
                  ? <img src={b.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                  : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)' }}><Image size={32} /></div>}
                <div style={s.bannerOverlay}>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: '#fff' }}>{b.title}</div>
                  {b.subtitle && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{b.subtitle}</div>}
                  <div style={{ marginTop: 8 }}><Badge label={b.cta_text || 'Watch Now'} color="var(--accent)" /></div>
                </div>
              </div>
              <div style={s.bannerFooter}>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>Order: {b.sort_order}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn size="sm" variant="ghost" onClick={() => openEdit(b)}><Edit2 size={13} /></Btn>
                  <Btn size="sm" variant="danger" onClick={() => del(b.banner_id)}><Trash2 size={13} /></Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Banner' : 'New Banner'} width={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }}>Link to Content (optional)</label>
            <select value={form.content_id} onChange={f('content_id')}
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%' }}>
              <option value="">— None —</option>
              {content.map(c => <option key={c.content_id} value={c.content_id}>{c.title}</option>)}
            </select>
          </div>
          <Input label="Banner Image URL" value={form.image_url} onChange={f('image_url')} placeholder="https://example.com/banner.jpg" />
          {form.image_url && (
            <div style={{ borderRadius: 8, overflow: 'hidden', height: 120, background: 'var(--surface2)' }}>
              <img src={form.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
            </div>
          )}
          <Input label="Title"    value={form.title}    onChange={f('title')}    placeholder="e.g. New Blockbuster" />
          <Input label="Subtitle" value={form.subtitle} onChange={f('subtitle')} placeholder="e.g. Watch now in 4K" />
          <Input label="CTA Button Text" value={form.cta_text} onChange={f('cta_text')} placeholder="Watch Now" />
          <Input label="Sort Order" type="number" value={form.sort_order} onChange={f('sort_order')} />
        </div>
        <div style={s.modalFooter}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</Btn>
        </div>
      </Modal>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  tabs: { display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 28, gap: 4 },
  tab: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.15s' },
  secRow: { display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', transition: 'opacity 0.2s' },
  secOrder: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 },
  itemRow: { display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px' },
  modalFooter: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' },
  bannerCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' },
  bannerImg: { height: 160, background: 'var(--surface2)', position: 'relative', overflow: 'hidden' },
  bannerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', padding: '24px 14px 14px' },
  bannerFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' },
}