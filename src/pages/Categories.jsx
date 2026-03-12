import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import api from '../api/client'
import { PageHeader, Table, Badge, Btn, Modal, Input, toast } from '../components/UI'

const empty = { name:'', overlay_color:'#1A1A2E', sort_order:0 }

export default function Categories() {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState(empty)
  const [saving,  setSaving]  = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await api.get('/categories')
    setRows(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(empty); setModal(true) }
  const openEdit   = r => {
    setEditing(r.category_id)
    setForm({ name: r.name, overlay_color: r.overlay_color || '#1A1A2E', sort_order: r.sort_order || 0 })
    setModal(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('overlay_color', form.overlay_color)
      fd.append('sort_order', form.sort_order)
      if (editing) {
        await api.put(`/categories/${editing}`, { ...form, is_active: true })
      } else {
        await api.post('/categories', fd)
      }
      toast(editing ? 'Category updated' : 'Category created')
      setModal(false); load()
    } catch (e) { toast(e.response?.data?.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  const del = async id => {
    if (!confirm('Delete this category?')) return
    await api.delete(`/categories/${id}`)
    toast('Category deleted'); load()
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const cols = [
    { key:'name', label:'Name', width:'25%', render: r => (
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:12, height:12, borderRadius:3, background: r.overlay_color || '#333', flexShrink:0 }} />
        <span style={{ fontWeight:600 }}>{r.name}</span>
      </div>
    )},
    { key:'overlay_color', label:'Color',  width:'12%', render: r => (
      <span style={{ fontFamily:'monospace', fontSize:12, color:'var(--text3)' }}>{r.overlay_color || '—'}</span>
    )},
    { key:'sort_order',   label:'Order',   width:'10%' },
    { key:'content_count',label:'Content', width:'10%', render: r => (
      <Badge label={r.content_count || 0} color="var(--blue)" />
    )},
    { key:'is_active', label:'Status', width:'10%', render: r => (
      <Badge label={r.is_active ? 'Active' : 'Hidden'} color={r.is_active ? 'var(--green)' : 'var(--text3)'} />
    )},
    { key:'actions', label:'', width:'12%', render: r => (
      <div style={{ display:'flex', gap:6 }}>
        <Btn size="sm" variant="ghost"  onClick={() => openEdit(r)}><Edit2 size={13} /></Btn>
        <Btn size="sm" variant="danger" onClick={() => del(r.category_id)}><Trash2 size={13} /></Btn>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Organise your content library."
        action={<Btn onClick={openCreate}><Plus size={15} /> New Category</Btn>}
      />

      <Table cols={cols} rows={rows} loading={loading} empty="No categories yet." />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Category' : 'New Category'} width={440}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Input label="Name" value={form.name} onChange={f('name')} placeholder="e.g. Action" />
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.8px', display:'block', marginBottom:6 }}>Overlay Colour</label>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <input type="color" value={form.overlay_color} onChange={f('overlay_color')}
                style={{ width:44, height:36, borderRadius:8, border:'1px solid var(--border)', background:'none', cursor:'pointer', padding:2 }} />
              <span style={{ fontSize:13, color:'var(--text3)', fontFamily:'monospace' }}>{form.overlay_color}</span>
            </div>
          </div>
          <Input label="Sort Order" type="number" value={form.sort_order} onChange={f('sort_order')} placeholder="0" />
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:24, paddingTop:20, borderTop:'1px solid var(--border)' }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</Btn>
        </div>
      </Modal>
    </div>
  )
}
