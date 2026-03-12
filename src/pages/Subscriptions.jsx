import { useEffect, useState } from 'react'
import { Plus, Edit2, Monitor, Zap } from 'lucide-react'
import api from '../api/client'
import { PageHeader, Table, Badge, Btn, Modal, Input, toast } from '../components/UI'

const empty = { name:'', price:'', duration_days:30, max_screens:1, has_hd:false, has_4k:false, description:'' }

export default function Subscriptions() {
  const [plans,   setPlans]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState(empty)
  const [saving,  setSaving]  = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await api.get('/subscriptions/plans')
    setPlans(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(empty); setModal(true) }
  const openEdit   = r => {
    setEditing(r.plan_id)
    setForm({ name:r.name, price:r.price, duration_days:r.duration_days, max_screens:r.max_screens, has_hd:!!r.has_hd, has_4k:!!r.has_4k, description:r.description||'' })
    setModal(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = { ...form, price: parseFloat(form.price), duration_days: parseInt(form.duration_days), max_screens: parseInt(form.max_screens), is_active: true }
      if (editing) await api.put(`/subscriptions/plans/${editing}`, payload)
      else          await api.post('/subscriptions/plans', payload)
      toast(editing ? 'Plan updated' : 'Plan created')
      setModal(false); load()
    } catch (e) { toast(e.response?.data?.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  const f  = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const fc = k => e => setForm(p => ({ ...p, [k]: e.target.checked }))

  const planColor = name => ({ Free:'var(--text3)', Standard:'var(--blue)', Premium:'var(--gold)', Ultra:'var(--accent)' })[name] || 'var(--text3)'

  const cols = [
    { key:'name', label:'Plan', width:'15%', render: r => (
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background: planColor(r.name) }} />
        <span style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:15 }}>{r.name}</span>
      </div>
    )},
    { key:'price',        label:'Price / mo', width:'12%', render: r => (
      <span style={{ fontFamily:'var(--font-head)', fontSize:16, fontWeight:700, color:'var(--gold)' }}>
        {r.price === 0 ? 'Free' : `₹${r.price}`}
      </span>
    )},
    { key:'duration_days',label:'Duration',   width:'10%', render: r => `${r.duration_days} days` },
    { key:'max_screens',  label:'Screens',    width:'10%', render: r => (
      <span style={{ display:'flex', alignItems:'center', gap:5 }}><Monitor size={13} color="var(--text3)" />{r.max_screens}</span>
    )},
    { key:'has_hd', label:'HD',   width:'7%', render: r => r.has_hd ? <Badge label="HD"  color="var(--blue)"  /> : <span style={{ color:'var(--text3)' }}>—</span> },
    { key:'has_4k', label:'4K',   width:'7%', render: r => r.has_4k ? <Badge label="4K"  color="var(--gold)"  /> : <span style={{ color:'var(--text3)' }}>—</span> },
    { key:'description', label:'Description', width:'25%', render: r => <span style={{ color:'var(--text2)', fontSize:12 }}>{r.description || '—'}</span> },
    { key:'is_active',   label:'Status',      width:'8%',  render: r => <Badge label={r.is_active ? 'Active' : 'Hidden'} color={r.is_active ? 'var(--green)' : 'var(--text3)'} /> },
    { key:'actions',     label:'',            width:'8%',  render: r => (
      <Btn size="sm" variant="ghost" onClick={() => openEdit(r)}><Edit2 size={13} /></Btn>
    )},
  ]

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        subtitle="Manage pricing plans and tiers."
        action={<Btn onClick={openCreate}><Plus size={15} /> New Plan</Btn>}
      />

      {/* Plan cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:28 }}>
        {loading
          ? Array.from({length:3}).map((_,i) => <div key={i} className="skeleton" style={{ height:130, borderRadius:'var(--radius)' }} />)
          : plans.map(p => (
          <div key={p.plan_id} style={{ background:'var(--surface)', border:`1px solid ${planColor(p.name)}33`, borderRadius:'var(--radius)', padding:'20px 24px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background: planColor(p.name) }} />
            <div style={{ fontFamily:'var(--font-head)', fontSize:13, color: planColor(p.name), textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>{p.name}</div>
            <div style={{ fontFamily:'var(--font-head)', fontSize:30, fontWeight:800, letterSpacing:'-1px' }}>
              {p.price === 0 ? 'Free' : `₹${p.price}`}
            </div>
            <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>per month</div>
            <div style={{ marginTop:14, display:'flex', gap:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, color:'var(--text2)' }}>{p.max_screens} screen{p.max_screens>1?'s':''}</span>
              {p.has_hd && <Badge label="HD" color="var(--blue)" />}
              {p.has_4k && <Badge label="4K" color="var(--gold)" />}
            </div>
          </div>
        ))}
      </div>

      <Table cols={cols} rows={plans} loading={loading} empty="No plans yet." />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Plan' : 'New Plan'} width={480}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <Input label="Plan Name" value={form.name} onChange={f('name')} placeholder="e.g. Premium" />
          <Input label="Price (₹)" type="number" step="0.01" value={form.price} onChange={f('price')} placeholder="199.00" />
          <Input label="Duration (days)" type="number" value={form.duration_days} onChange={f('duration_days')} />
          <Input label="Max Screens" type="number" value={form.max_screens} onChange={f('max_screens')} />
          <div style={{ gridColumn:'1/-1' }}>
            <Input label="Description" value={form.description} onChange={f('description')} placeholder="Plan description" />
          </div>
          <div style={{ display:'flex', gap:24, gridColumn:'1/-1' }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'var(--text2)' }}>
              <input type="checkbox" checked={form.has_hd} onChange={fc('has_hd')} />
              HD Streaming
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'var(--text2)' }}>
              <input type="checkbox" checked={form.has_4k} onChange={fc('has_4k')} />
              4K Streaming
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
