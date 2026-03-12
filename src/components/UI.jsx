// ── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color = 'var(--accent)', delta, loading }) {
  if (loading) return <div className="skeleton" style={{ height: 110, borderRadius: 'var(--radius)' }} />
  return (
    <div style={sc.card}>
      <div style={sc.top}>
        <div style={{ ...sc.iconWrap, background: color + '1A', border: `1px solid ${color}33` }}>
          <Icon size={18} color={color} strokeWidth={1.8} />
        </div>
        {delta !== undefined && (
          <span style={{ ...sc.delta, color: delta >= 0 ? 'var(--green)' : 'var(--accent)' }}>
            {delta >= 0 ? '+' : ''}{delta}
          </span>
        )}
      </div>
      <div style={sc.value}>{value?.toLocaleString() ?? '—'}</div>
      <div style={sc.label}>{label}</div>
    </div>
  )
}
const sc = {
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '20px 24px',
  },
  top: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  iconWrap: { width: 40, height: 40, borderRadius: 10, display:'flex', alignItems:'center', justifyContent:'center' },
  value: { fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 700, color: 'var(--text)', letterSpacing: '-1px' },
  label: { fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 4, fontWeight: 600 },
  delta: { fontSize: 12, fontWeight: 600 },
}

// ── Page Header ──────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={ph.wrap}>
      <div>
        <h1 style={ph.title}>{title}</h1>
        {subtitle && <p style={ph.sub}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
const ph = {
  wrap: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom: 32, flexWrap:'wrap', gap:16 },
  title: { fontFamily:'var(--font-head)', fontSize:28, fontWeight:800, color:'var(--text)', letterSpacing:'-0.5px' },
  sub: { fontSize:13, color:'var(--text3)', marginTop:4 },
}

// ── Table ────────────────────────────────────────────────────────────────────
export function Table({ cols, rows, loading, empty = 'No data found.' }) {
  return (
    <div style={tb.wrap}>
      <table style={tb.table}>
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c.key} style={{ ...tb.th, width: c.width }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                {cols.map(c => (
                  <td key={c.key} style={tb.td}>
                    <div className="skeleton" style={{ height: 14, width: '70%' }} />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={cols.length} style={{ ...tb.td, textAlign:'center', color:'var(--text3)', padding:'48px 0' }}>
                {empty}
              </td>
            </tr>
          ) : rows.map((row, i) => (
            <tr key={i} style={tb.tr}>
              {cols.map(c => (
                <td key={c.key} style={tb.td}>
                  {c.render ? c.render(row) : row[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
const tb = {
  wrap: { border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden' },
  table: { width:'100%', borderCollapse:'collapse', tableLayout:'fixed' },
  th: {
    padding:'12px 16px', textAlign:'left',
    fontSize:11, fontWeight:700, color:'var(--text3)',
    textTransform:'uppercase', letterSpacing:'0.8px',
    background:'var(--surface)', borderBottom:'1px solid var(--border)',
    whiteSpace:'nowrap', overflow:'hidden',
  },
  tr: { transition:'background 0.1s', cursor:'default' },
  td: { padding:'13px 16px', borderBottom:'1px solid var(--border)', verticalAlign:'middle', color:'var(--text)', fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ label, color = 'var(--text3)' }) {
  return (
    <span style={{
      background: color + '20', color, border: `1px solid ${color}40`,
      borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace:'nowrap',
    }}>{label}</span>
  )
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, style: extra = {} }) {
  const base = {
    display:'inline-flex', alignItems:'center', gap:6,
    border:'none', cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily:'var(--font-body)', fontWeight:600, borderRadius:8,
    transition:'opacity 0.15s, transform 0.1s',
    opacity: disabled ? 0.5 : 1,
    padding: size === 'sm' ? '6px 12px' : '10px 18px',
    fontSize: size === 'sm' ? 12 : 14,
    ...(variant === 'primary'  ? { background:'var(--accent)', color:'#fff' } : {}),
    ...(variant === 'ghost'    ? { background:'var(--surface2)', color:'var(--text2)' } : {}),
    ...(variant === 'danger'   ? { background:'rgba(255,45,85,0.1)', color:'var(--accent)' } : {}),
    ...(variant === 'success'  ? { background:'rgba(39,174,96,0.1)', color:'var(--green)' } : {}),
    ...extra,
  }
  return <button style={base} onClick={onClick} disabled={disabled}>{children}</button>
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {label && <label style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.8px' }}>{label}</label>}
      <input style={{
        background:'var(--surface2)', border:'1px solid var(--border)',
        borderRadius:8, padding:'10px 14px', color:'var(--text)', fontSize:13,
        outline:'none', width:'100%',
      }} {...props} />
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ label, children, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {label && <label style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.8px' }}>{label}</label>}
      <select style={{
        background:'var(--surface2)', border:'1px solid var(--border)',
        borderRadius:8, padding:'10px 14px', color:'var(--text)', fontSize:13,
        outline:'none', width:'100%', cursor:'pointer',
      }} {...props}>{children}</select>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null
  return (
    <div style={mo.overlay} onClick={e => { if(e.target === e.currentTarget) onClose() }}>
      <div style={{ ...mo.box, width }}>
        <div style={mo.header}>
          <h3 style={mo.title}>{title}</h3>
          <button style={mo.close} onClick={onClose}>✕</button>
        </div>
        <div style={mo.body}>{children}</div>
      </div>
    </div>
  )
}
const mo = {
  overlay: {
    position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
    display:'flex', alignItems:'center', justifyContent:'center',
    zIndex:1000, backdropFilter:'blur(4px)', padding:20,
  },
  box: {
    background:'var(--surface)', border:'1px solid var(--border2)',
    borderRadius:16, boxShadow:'var(--shadow-lg)', maxHeight:'90vh',
    display:'flex', flexDirection:'column',
  },
  header: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'20px 24px 16px', borderBottom:'1px solid var(--border)',
  },
  title: { fontFamily:'var(--font-head)', fontSize:18, fontWeight:700 },
  close: {
    background:'none', border:'none', color:'var(--text3)',
    cursor:'pointer', fontSize:16, padding:4,
  },
  body: { padding:'24px', overflow:'auto' },
}

// ── Search Bar ────────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background:'var(--surface2)', border:'1px solid var(--border)',
        borderRadius:8, padding:'9px 14px', color:'var(--text)', fontSize:13,
        outline:'none', width:260,
      }}
    />
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export function toast(msg, type = 'success') {
  const el = document.createElement('div')
  el.textContent = msg
  Object.assign(el.style, {
    position:'fixed', bottom:24, right:24, zIndex:9999,
    background: type === 'error' ? 'rgba(255,45,85,0.15)' : 'rgba(39,174,96,0.15)',
    border: `1px solid ${type === 'error' ? 'rgba(255,45,85,0.4)' : 'rgba(39,174,96,0.4)'}`,
    color: type === 'error' ? '#FF6B8A' : '#5ECC8B',
    borderRadius:10, padding:'12px 20px', fontSize:14, fontWeight:600,
    boxShadow:'0 8px 32px rgba(0,0,0,0.4)', fontFamily:'var(--font-body)',
  })
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3000)
}
