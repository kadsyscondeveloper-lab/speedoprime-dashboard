import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit2, Eye, MousePointer } from 'lucide-react'
import api from '../api/client'
import { PageHeader, Table, Badge, Btn, Modal, Input, Select, toast } from '../components/UI'

const PLACEMENTS = ['home_top','home_mid','home_bottom','search']
const TYPES = ['banner','interstitial','pre_roll']
const empty = { title:'', ad_type:'banner', target_url:'', placement:'home_top', duration_secs:15, start_date:'', end_date:'' }

export default function Ads() {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState(empty)
  const [saving,  setSaving]  = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await api.get('/ads/admin/all')
    setRows(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(empty); setModal(true) }
  const openEdit   = r => {
    setEditing(r.ad_id)
    setForm({
      title: r.title, ad_type: r.ad_type, target_url: r.target_url || '',
      placement: r.placement || 'home_top', duration_secs: r.duration_secs || 15,
      start_date: r.start_date ? r.start_date.split('T')[0] : '',
      end_date:   r.end_date   ? r.end_date.split('T')[0]   : '',
    })
    setModal(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      if (editing) await api.put(`/ads/${editing}`, form)
      else {
        const fd = new FormData()
        Object.entries(form).forEach(([k,v]) => v && fd.append(k, v))
        await api.post('/ads', fd)
      }
      toast(editing ? 'Ad updated' : 'Ad created')
      setModal(false); load()
    } catch (e) { toast(e.response?.data?.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  const del = async id => {
    if (!confirm('Delete this ad?')) return
    await api.delete(`/ads/${id}`)
    toast('Ad deleted'); load()
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const ctr = r => r.impressions ? ((r.clicks / r.impressions) * 100).toFixed(2) + '%' : '—'

  const cols = [
    { key:'title',     label:'Title',     width:'20%', render: r => <span style={{ fontWeight:600 }}>{r.title}</span> },
    { key:'ad_type',   label:'Type',      width:'10%', render: r => <Badge label={r.ad_type} color="var(--blue)" /> },
    { key:'placement', label:'Placement', width:'12%', render: r => <Badge label={r.placement || '—'} color="var(--text3)" /> },
    { key:'impressions',label:'Impressions', width:'10%', render: r => (
      <span style={{ display:'flex', alignItems:'center', gap:5 }}><Eye size={12} color="var(--text3)" />{r.impressions?.toLocaleString()}</span>
    )},
    { key:'clicks', label:'Clicks', width:'8%', render: r => (
      <span style={{ display:'flex', alignItems:'center', gap:5 }}><MousePointer size={12} color="var(--text3)" />{r.clicks?.toLocaleString()}</span>
    )},
    { key:'ctr',    label:'CTR',    width:'7%', render: r => <span style={{ color:'var(--gold)' }}>{ctr(r)}</span> },
    { key:'is_active', label:'Status', width:'8%', render: r => (
      <Badge label={r.is_active ? 'Active' : 'Paused'} color={r.is_active ? 'var(--green)' : 'var(--text3)'} />
    )},
    { key:'end_date', label:'Expires', width:'10%', render: r => r.end_date ? new Date(r.end_date).toLocaleDateString() : 'No end' },
    { key:'actions',  label:'',        width:'9%', render: r => (
      <div style={{ display:'flex', gap:6 }}>
        <Btn size="sm" variant="ghost"  onClick={() => openEdit(r)}><Edit2 size={13} /></Btn>
        <Btn size="sm" variant="danger" onClick={() => del(r.ad_id)}><Trash2 size={13} /></Btn>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader
        title="Ads"
        subtitle="Manage ad placements and track performance."
        action={<Btn onClick={openCreate}><Plus size={15} /> New Ad</Btn>}
      />

      {/* Summary bar */}
      <div style={{ display:'flex', gap:16, marginBottom:24, flexWrap:'wrap' }}>
        {[
          { label:'Total Ads',   value: rows.length },
          { label:'Active',      value: rows.filter(r => r.is_active).length },
          { label:'Impressions', value: rows.reduce((s,r) => s + (r.impressions||0), 0).toLocaleString() },
          { label:'Total Clicks',value: rows.reduce((s,r) => s + (r.clicks||0), 0).toLocaleString() },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 20px', minWidth:130 }}>
            <div style={{ fontFamily:'var(--font-head)', fontSize:22, fontWeight:700 }}>{loading ? '—' : s.value}</div>
            <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.8px', marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <Table cols={cols} rows={rows} loading={loading} empty="No ads yet." />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Ad' : 'New Ad'} width={520}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div style={{ gridColumn:'1/-1' }}>
            <Input label="Title" value={form.title} onChange={f('title')} placeholder="Ad campaign name" />
          </div>
          <Select label="Type" value={form.ad_type} onChange={f('ad_type')}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </Select>
          <Select label="Placement" value={form.placement} onChange={f('placement')}>
            {PLACEMENTS.map(p => <option key={p}>{p}</option>)}
          </Select>
          <div style={{ gridColumn:'1/-1' }}>
            <Input label="Target URL" value={form.target_url} onChange={f('target_url')} placeholder="https://..." />
          </div>
          <Input label="Duration (secs)" type="number" value={form.duration_secs} onChange={f('duration_secs')} />
          <div />
          <Input label="Start Date" type="date" value={form.start_date} onChange={f('start_date')} />
          <Input label="End Date"   type="date" value={form.end_date}   onChange={f('end_date')} />
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:24, paddingTop:20, borderTop:'1px solid var(--border)' }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</Btn>
        </div>
      </Modal>
    </div>
  )
}
