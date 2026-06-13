import { useEffect, useState } from 'react'
import Layout, { C } from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const fmt = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const inp = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid ' + C.border, fontSize: 14, background: C.white, color: C.text }
const lbl = { display: 'block', fontSize: 12, color: C.textSoft, fontWeight: 500, marginBottom: 4 }
const FORM_VAZIO = { descricao: '', categoria: '', valor: 0, data: new Date().toISOString().split('T')[0], observacoes: '' }

export default function Despesas() {
  const { user } = useAuth()
  const [lista, setLista] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(FORM_VAZIO)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const { data } = await supabase.from('despesas').select('*').order('data', { ascending: false })
    setLista(data || [])
  }

  async function salvar() {
    if (!form.descricao) return alert('Informe a descrição')
    setSaving(true)
    await supabase.from('despesas').insert([{ descricao: form.descricao, categoria: form.categoria, valor: Number(form.valor) || 0, data: form.data, observacoes: form.observacoes }])
    setSaving(false); setModal(false); setForm(FORM_VAZIO); load()
  }

  async function apagar(id) {
    if (!confirm('Apagar esta despesa?')) return
    await supabase.from('despesas').delete().eq('id', id)
    load()
  }

  const total = lista.reduce((s, d) => s + Number(d.valor || 0), 0)

  return (
    <Layout title="Despesas">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 10, padding: '12px 20px' }}>
          <div style={{ fontSize: 11, color: C.textSoft, marginBottom: 4 }}>Total de despesas</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.danger }}>{fmt(total)}</div>
        </div>
        <button onClick={() => { setForm(FORM_VAZIO); setModal(true) }} style={{ padding: '9px 18px', borderRadius: 8, background: C.accent, color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>+ Despesa</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {lista.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: C.textSoft, fontSize: 13 }}>Nenhuma despesa registrada.</div>}
        {lista.map(d => (
          <div key={d.id} style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, color: C.text, fontSize: 14 }}>{d.descricao}</div>
              <div style={{ fontSize: 12, color: C.textSoft, marginTop: 1 }}>{d.data ? new Date(d.data + 'T12:00').toLocaleDateString('pt-BR') : '—'}{d.categoria ? ' · ' + d.categoria : ''}</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.danger, flexShrink: 0 }}>{fmt(d.valor)}</div>
            <button onClick={() => apagar(d.id)} style={{ padding: '5px 10px', borderRadius: 6, background: '#FEF2F2', border: '1px solid #FECACA', color: C.danger, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>×</button>
          </div>
        ))}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: C.white, borderRadius: '16px 16px 0 0', padding: 24, width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Nova despesa</div>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: C.textSoft }}>×</button>
            </div>
            <div style={{ marginBottom: 12 }}><label style={lbl}>Descrição *</label><input style={inp} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={lbl}>Categoria</label><input style={inp} value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} placeholder="Ex: Peças, Combustível" /></div>
              <div><label style={lbl}>Data</label><input type="date" style={inp} value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></div>
            </div>
            <div style={{ marginBottom: 16 }}><label style={lbl}>Valor (R$)</label><input type="number" style={inp} value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setModal(false)} style={{ flex: 1, padding: 12, borderRadius: 8, background: C.bg, border: '1px solid ' + C.border, color: C.textSoft, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={salvar} disabled={saving} style={{ flex: 2, padding: 12, borderRadius: 8, background: C.accent, color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
