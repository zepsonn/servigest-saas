import { useEffect, useState } from 'react'
import Layout, { C } from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import Link from 'next/link'

function Card({ label, value, sub, color }) {
  return (
    <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 12, padding: '20px 22px' }}>
      <div style={{ fontSize: 13, color: C.textSoft, fontWeight: 500, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || C.text, letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.textSoft, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

const PERIODOS = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' }
const fmt = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function OSRow({ os, destaque }) {
  const data = os.data_entrada ? new Date(os.data_entrada + 'T12:00') : null
  const dias = data ? Math.round((data - new Date().setHours(0,0,0,0)) / 86400000) : null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, marginBottom: 6, background: destaque ? C.accentSoft : C.bg, border: '1px solid ' + (destaque ? C.accent + '40' : C.border) }}>
      <div style={{ textAlign: 'center', flexShrink: 0, width: 36 }}>
        <div style={{ fontSize: destaque ? 18 : 15, fontWeight: 700, color: destaque ? C.accent : C.textSoft, lineHeight: 1 }}>{data ? data.getDate() : '—'}</div>
        <div style={{ fontSize: 9, color: C.textSoft, textTransform: 'uppercase' }}>{data ? data.toLocaleDateString('pt-BR', { month: 'short' }) : ''}</div>
      </div>
      <div style={{ width: 2, height: 30, background: destaque ? C.accent : C.border, borderRadius: 99, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: C.text, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{os.cliente_nome || '—'}</div>
        <div style={{ fontSize: 11, color: C.textSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{os.produto || os.servico || '—'}{os.bairro ? ' · ' + os.bairro : ''}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {os.periodo && <div style={{ fontSize: 11, color: destaque ? C.accent : C.textSoft, fontWeight: 500 }}>{PERIODOS[os.periodo] || os.periodo}</div>}
        <div style={{ fontSize: 11, color: C.textSoft }}>{os.usuarios?.nome || 'Sem técnico'}</div>
      </div>
      {dias !== null && dias > 0 && <div style={{ background: C.bg, border: '1px solid ' + C.border, borderRadius: 6, padding: '2px 8px', fontSize: 11, color: C.textSoft, flexShrink: 0 }}>em {dias}d</div>}
      {destaque && <div style={{ background: C.accent, color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>HOJE</div>}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ fat: 0, desp: 0, andamento: 0, concluidas: 0, clientes: 0, hoje: 0 })
  const [osHoje, setOsHoje] = useState([])
  const [osFuturas, setOsFuturas] = useState([])
  const [meses, setMeses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const hoje = new Date().toISOString().split('T')[0]
    const em7 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    const [{ count: cl }, { data: os }, { data: desp }, { data: prox }] = await Promise.all([
      supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('ativo', true),
      supabase.from('ordens_servico').select('valor,status,data_entrada,data_conclusao'),
      supabase.from('despesas').select('valor'),
      supabase.from('ordens_servico')
        .select('id,cliente_nome,bairro,produto,servico,periodo,status,data_entrada,valor,tecnico_id,usuarios(nome)')
        .eq('status', 'em_andamento').lte('data_entrada', em7).order('data_entrada'),
    ])
    const concl = (os || []).filter(o => o.status === 'concluida')
    const fat = concl.reduce((s, o) => s + Number(o.valor || 0), 0)
    const desp2 = (desp || []).reduce((s, d) => s + Number(d.valor || 0), 0)
    const pm = {}
    concl.forEach(o => { const m = (o.data_conclusao || o.data_entrada)?.slice(0, 7); if (m) pm[m] = (pm[m] || 0) + Number(o.valor || 0) })
    const todosProx = prox || []
    setOsHoje(todosProx.filter(o => o.data_entrada === hoje))
    setOsFuturas(todosProx.filter(o => o.data_entrada > hoje))
    setMeses(Object.entries(pm).sort().slice(-6))
    setStats({ fat, desp: desp2, clientes: cl || 0, andamento: (os || []).filter(o => o.status === 'em_andamento').length, concluidas: concl.length, hoje: todosProx.filter(o => o.data_entrada === hoje).length })
    setLoading(false)
  }

  const isGestor = user?.role === 'gestor'
  const lucro = stats.fat - stats.desp
  const maxVal = Math.max(...meses.map(([, v]) => v), 1)

  if (loading) return <Layout title="Dashboard"><div style={{ color: C.textSoft }}>Carregando...</div></Layout>

  return (
    <Layout title={isGestor ? 'Dashboard' : 'Meus Serviços'}>
      {isGestor ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
            <Card label="Faturamento" value={fmt(stats.fat)} sub="OS concluídas" />
            <Card label="Despesas" value={fmt(stats.desp)} color={C.danger} />
            <Card label="Lucro" value={fmt(lucro)} color={lucro >= 0 ? C.success : C.danger} sub="fat − despesas" />
            <Card label="Ticket médio" value={fmt(stats.concluidas ? stats.fat / stats.concluidas : 0)} />
            <Card label="Em andamento" value={stats.andamento} color={C.warning} />
            <Card label="Concluídas" value={stats.concluidas} color={C.success} />
            <Card label="Clientes" value={stats.clientes} />
            <Card label="Hoje" value={stats.hoje} sub="serviços" color={stats.hoje > 0 ? C.accent : undefined} />
          </div>

          {/* AGENDA */}
          <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 12, marginBottom: 16 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + C.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Agenda de serviços</div>
              <Link href="/os" style={{ fontSize: 13, color: C.accent, fontWeight: 500 }}>Ver todas →</Link>
            </div>
            <div style={{ padding: '12px 16px' }}>
              {osHoje.length === 0 && osFuturas.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: C.textSoft, fontSize: 13 }}>Nenhum serviço agendado.</div>}
              {osHoje.length > 0 && <>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: C.accent, letterSpacing: '.06em', marginBottom: 8 }}>Hoje — {osHoje.length} serviço{osHoje.length > 1 ? 's' : ''}</div>
                {osHoje.map(o => <OSRow key={o.id} os={o} destaque />)}
              </>}
              {osFuturas.length > 0 && <>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: C.textSoft, letterSpacing: '.06em', margin: '12px 0 8px' }}>Próximos dias</div>
                {osFuturas.map(o => <OSRow key={o.id} os={o} />)}
              </>}
            </div>
          </div>

          {/* GRAFICO */}
          <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 12 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + C.border }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Receita por mês</div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {meses.length === 0 && <div style={{ fontSize: 13, color: C.textSoft }}>Sem dados ainda.</div>}
              {meses.map(([mes, val]) => {
                const nm = new Date(mes + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
                return (
                  <div key={mes} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, fontSize: 13 }}>
                    <span style={{ width: 56, color: C.textSoft, textTransform: 'capitalize', flexShrink: 0 }}>{nm}</span>
                    <div style={{ flex: 1, height: 8, background: C.bg, borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: C.accent, borderRadius: 99, width: Math.round(val / maxVal * 100) + '%' }} />
                    </div>
                    <span style={{ width: 100, textAlign: 'right', fontWeight: 600, color: C.text }}>{fmt(val)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
            <Card label="Hoje" value={osHoje.length} color={osHoje.length > 0 ? C.accent : undefined} />
            <Card label="Esta semana" value={osFuturas.length} />
            <Card label="Total" value={stats.andamento} />
          </div>
          {osHoje.length > 0 && <div style={{ fontSize: 12, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Hoje</div>}
          {osHoje.map(o => (
            <div key={o.id} style={{ background: C.white, border: '1px solid ' + C.accent, borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontWeight: 600, color: C.text, fontSize: 14 }}>{o.cliente_nome}</div>
                <span style={{ background: C.accentSoft, color: C.accent, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>HOJE</span>
              </div>
              <div style={{ fontSize: 12, color: C.textSoft }}>{o.produto || o.servico || '—'}{o.bairro ? ' · ' + o.bairro : ''}</div>
              {o.periodo && <div style={{ fontSize: 11, color: C.accent, marginTop: 4 }}>{PERIODOS[o.periodo]}</div>}
            </div>
          ))}
          {osFuturas.map(o => (
            <div key={o.id} style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
              <div style={{ fontWeight: 500, color: C.text, fontSize: 14, marginBottom: 2 }}>{o.cliente_nome}</div>
              <div style={{ fontSize: 12, color: C.textSoft }}>{o.produto || o.servico || '—'} · {o.data_entrada ? new Date(o.data_entrada + 'T12:00').toLocaleDateString('pt-BR') : ''}</div>
            </div>
          ))}
          {osHoje.length === 0 && osFuturas.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: C.textSoft, fontSize: 13 }}>Nenhum serviço agendado.</div>}
        </>
      )}
    </Layout>
  )
}
