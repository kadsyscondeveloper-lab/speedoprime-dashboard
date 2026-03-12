import { useEffect, useState } from 'react'
import { UserX, ShieldCheck } from 'lucide-react'
import api from '../api/client'
import { PageHeader, Table, Badge, Btn, SearchBar, toast } from '../components/UI'

export default function Users() {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(1)
  const LIMIT = 20

  const load = async () => {
    setLoading(true)
    try {
      const params = { page, limit: LIMIT, ...(search && { search }) }
      const { data } = await api.get('/users', { params })
      setRows(data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, search])

  const deactivate = async id => {
    if (!confirm('Deactivate this user?')) return
    await api.delete(`/users/${id}`)
    toast('User deactivated'); load()
  }

  const makeAdmin = async id => {
    if (!confirm('Grant admin role to this user?')) return
    await api.put(`/users/${id}`, { role: 'admin', is_active: true })
    toast('Role updated'); load()
  }

  const cols = [
    { key:'username',   label:'Name',     width:'18%', render: r => (
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,var(--accent),var(--accent2))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
          {r.username?.[0]?.toUpperCase()}
        </div>
        <span style={{ fontWeight:600 }}>{r.username}</span>
      </div>
    )},
    { key:'email',    label:'Email',    width:'22%' },
    { key:'mobile',   label:'Mobile',   width:'13%' },
    { key:'role',     label:'Role',     width:'8%',  render: r => <Badge label={r.role} color={r.role === 'admin' ? 'var(--accent)' : 'var(--blue)'} /> },
    { key:'subscription_plan', label:'Plan', width:'10%', render: r => r.subscription_plan
      ? <Badge label={r.subscription_plan} color="var(--gold)" />
      : <span style={{ color:'var(--text3)', fontSize:12 }}>None</span>
    },
    { key:'subscription_end', label:'Sub Ends', width:'12%', render: r => r.subscription_end
      ? new Date(r.subscription_end).toLocaleDateString()
      : '—'
    },
    { key:'is_active', label:'Status', width:'9%', render: r => (
      <Badge label={r.is_active ? 'Active' : 'Inactive'} color={r.is_active ? 'var(--green)' : 'var(--text3)'} />
    )},
    { key:'created_at', label:'Joined', width:'10%', render: r => new Date(r.created_at).toLocaleDateString() },
    { key:'actions',    label:'',       width:'10%', render: r => (
      <div style={{ display:'flex', gap:6 }}>
        {r.role !== 'admin' && (
          <Btn size="sm" variant="success" onClick={() => makeAdmin(r.user_id)} title="Make Admin">
            <ShieldCheck size={13} />
          </Btn>
        )}
        {r.is_active && (
          <Btn size="sm" variant="danger" onClick={() => deactivate(r.user_id)} title="Deactivate">
            <UserX size={13} />
          </Btn>
        )}
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage registered users and roles." />

      <div style={{ marginBottom:20 }}>
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search by name or email…" />
      </div>

      <Table cols={cols} rows={rows} loading={loading} empty="No users found." />

      <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:20 }}>
        <Btn size="sm" variant="ghost" disabled={page===1} onClick={() => setPage(p=>p-1)}>Prev</Btn>
        <span style={{ padding:'6px 12px', fontSize:13, color:'var(--text2)' }}>Page {page}</span>
        <Btn size="sm" variant="ghost" disabled={rows.length < LIMIT} onClick={() => setPage(p=>p+1)}>Next</Btn>
      </div>
    </div>
  )
}
