import { useEffect, useState } from 'react'
import Layout, { C } from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useRouter } from 'next/router'

const fmt = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = d => d ? new Date(d + 'T12:00').toLocaleDateString('pt-BR') : '—'

export default function Clientes() {
  const { user } = useAuth()
  const router = useRouter()
  const [clientes, setClientes] = useState([])
  const [busca, setBusca] = useState('')
  const [selecionado, setSelecionado] = useState(null)
  const [osCliente, setOsCliente] = useState([])

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const { data: os } = await supabase.from('ordens_servico')
      .select('id,numero,cliente_nome,cliente_telefone,cliente_endereco,bairro,produto,servico,valor,status,data_entrada,data_conclusao,periodo,usuarios(nome)')
      .order('criado_em', { ascending: false })

    if (!os) return
    const mapa = {}
    os.forEach(o => {
      const key = (o.cliente_nome || '').toLowerCase().trim() + '|' + (o.cliente_telefone || '').replace(/\D/g, '')
      if (!mapa[key]) mapa[key] = { nome: o.cliente_nome || 'Sem nome', telefone: o.cliente_telefone || '', total_os: 0, os: [] }
      mapa[key].total_os++
      mapa[key].os.push(o)
    })
    setClientes(Object.values(mapa).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')))
  }

  const filtrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone.includes(busca)
  )

  if (selecionado) return (
    <Layout title="Clientes">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => setSelecionado(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textSoft, fontSize: 22, display: 'flex' }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{selecionado.nome}</div>
          <div style={{ fontSize: 13, color: C.textSoft }}>{selecionado.telefone}</div>
        </div>
        <button onClick={() => router.push('/os')} style={{ padding: '8px 16px', borderRadius: 8, background: C.accent, color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>+ Nova OS</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          ['Total de OS', selecionado.os.length, C.text],
          ['Total gasto', fmt(selecionado.os.filter(o => o.status === 'concluida').reduce((s, o) => s + Number(o.valor || 0), 0)), C.accent],
          ['Em andamento', selecionado.os.filter(o => o.status === 'em_andamento').length, C.warning],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: C.textSoft, marginBottom: 6 }}>{l}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 12 }}>Histórico de serviços</div>
      {selecionado.os.map(o => (
        <div key={o.id} style={{ background: C.white, border: '1px solid ' + (o.status === 'concluida' ? '#BBF7D0' : C.border), borderRadius: 12, padding: '14px 16px', marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 600, color: C.text, fontSize: 14 }}>OS #{o.numero}</div>
              <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>{o.produto || '—'}{o.servico ? ' · ' + o.servico : ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: o.status === 'concluida' ? '#DCFCE7' : '#FEF3C7', color: o.status === 'concluida' ? C.success : C.warning }}>{o.status === 'concluida' ? 'Concluída' : 'Em andamento'}</span>
              {o.valor > 0 && <div style={{ fontSize: 15, fontWeight: 700, color: C.accent, marginTop: 4 }}>{fmt(o.valor)}</div>}
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.textSoft, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <div>Data: {fmtDate(o.data_entrada)}</div>
            <div>Técnico: {o.usuarios?.nome || '—'}</div>
            {o.data_conclusao && <div>Conclusão: {fmtDate(o.data_conclusao)}</div>}
          </div>
        </div>
      ))}
    </Layout>
  )

  return (
    <Layout title="Clientes">
      <div style={{ marginBottom: 16 }}>
        <input style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid ' + C.border, fontSize: 14, background: C.white, color: C.text }} placeholder="Buscar por nome ou telefone..." value={busca} onChange={e => setBusca(e.target.value)} />
      </div>
      <div style={{ fontSize: 12, color: C.textSoft, marginBottom: 12 }}>{filtrados.length} cliente{filtrados.length !== 1 ? 's' : ''}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtrados.map((c, i) => (
          <div key={i} onClick={() => setSelecionado(c)} style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.accentSoft, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
              {c.nome.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: C.text, fontSize: 14 }}>{c.nome}</div>
              <div style={{ fontSize: 12, color: C.textSoft, marginTop: 1 }}>{c.telefone || 'Sem telefone'}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: c.total_os >= 2 ? C.accent : C.textSoft }}>{c.total_os} OS</div>
              {c.total_os >= 2 && <div style={{ fontSize: 10, color: C.accent, fontWeight: 500 }}>Cliente fixo</div>}
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textSoft} strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </div>
        ))}
        {filtrados.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: C.textSoft, fontSize: 13 }}>Nenhum cliente encontrado.</div>}
      </div>
    </Layout>
  )
}
