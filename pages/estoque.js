import { useEffect, useState } from 'react'
import Layout, { C } from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const fmt = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const inp = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid ' + C.border, fontSize: 14, background: C.white, color: C.text }
const lbl = { display: 'block', fontSize: 12, color: C.textSoft, fontWeight: 500, marginBottom: 4 }

const FORM_VAZIO = { nome: '', codigo: '', quantidade: 0, preco_custo: 0, preco_venda: 0 }

function Modal({ form, setForm, onSave, onClose, saving }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: C.white, borderRadius: '16px 16px 0 0', padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{form.id ? 'Editar produto' : 'Novo produto'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: C.textSoft }}>×</button>
        </div>
        <div style={{ marginBottom: 12 }}><label style={lbl}>Nome *</label><input style={inp} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
        <div style={{ marginBottom: 12 }}><label style={lbl}>Código</label><input style={inp} value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div><label style={lbl}>Quantidade</label><input type="number" style={inp} value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} /></div>
          <div><label style={lbl}>Custo (R$)</label><input type="number" style={inp} value={form.preco_custo} onChange={e => setForm({ ...form, preco_custo: e.target.value })} /></div>
          <div><label style={lbl}>Venda (R$)</label><input type="number" style={inp} value={form.preco_venda} onChange={e => setForm({ ...form, preco_venda: e.target.value })} /></div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 8, background: C.bg, border: '1px solid ' + C.border, color: C.textSoft, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={onSave} disabled={saving} style={{ flex: 2, padding: 12, borderRadius: 8, background: C.accent, color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Salvando...' : form.id ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Estoque() {
  const { user } = useAuth()
  const [lista, setLista] = useState([])
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(FORM_VAZIO)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const { data } = await supabase.from('produtos').select('*').order('nome')
    setLista(data || [])
  }

  async function salvar() {
    if (!form.nome) return alert('Informe o nome do produto')
    setSaving(true)
    const payload = { nome: form.nome, codigo: form.codigo, quantidade: Number(form.quantidade) || 0, preco_custo: Number(form.preco_custo) || 0, preco_venda: Number(form.preco_venda) || 0 }
    if (form.id) await supabase.from('produtos').update(payload).eq('id', form.id)
    else await supabase.from('produtos').insert([payload])
    setSaving(false); setModal(false); setForm(FORM_VAZIO); load()
  }

  async function apagar(id) {
    if (!confirm('Apagar este produto?')) return
    await supabase.from('produtos').delete().eq('id', id)
    load()
  }

  const filtrados = lista.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()) || (p.codigo || '').toLowerCase().includes(busca.toLowerCase()))
  const totalItens = lista.reduce((s, p) => s + (p.quantidade || 0), 0)
  const totalInvestido = lista.reduce((s, p) => s + (p.quantidade || 0) * (p.preco_custo || 0), 0)
  const semEstoque = lista.filter(p => !p.quantidade || p.quantidade <= 0).length

  return (
    <Layout title="Estoque">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[['Itens em estoque', totalItens, C.text], ['Valor investido', fmt(totalInvestido), C.accent], ['Sem estoque', semEstoque, semEstoque > 0 ? C.danger : C.success]].map(([l, v, c]) => (
          <div key={l} style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: C.textSoft, marginBottom: 6 }}>{l}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input style={{ flex: 1, padding: '9px 14px', borderRadius: 8, border: '1px solid ' + C.border, fontSize: 14, background: C.white, color: C.text }} placeholder="Buscar por nome ou código..." value={busca} onChange={e => setBusca(e.target.value)} />
        <button onClick={() => { setForm(FORM_VAZIO); setModal(true) }} style={{ padding: '9px 18px', borderRadius: 8, background: C.accent, color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>+ Produto</button>
      </div>

      <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px 90px 80px 80px', gap: 0, padding: '10px 16px', borderBottom: '1px solid ' + C.border, fontSize: 11, fontWeight: 600, color: C.textSoft, textTransform: 'uppercase', letterSpacing: '.04em' }}>
          <div>Produto</div><div style={{ textAlign: 'center' }}>Qtd</div><div style={{ textAlign: 'right' }}>Custo</div><div style={{ textAlign: 'right' }}>Venda</div><div style={{ textAlign: 'right' }}>Lucro/un</div><div />
        </div>
        {filtrados.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: C.textSoft, fontSize: 13 }}>Nenhum produto encontrado.</div>}
        {filtrados.map(p => {
          const lucro = (p.preco_venda || 0) - (p.preco_custo || 0)
          const semEst = !p.quantidade || p.quantidade <= 0
          return (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px 90px 80px 80px', gap: 0, padding: '12px 16px', borderBottom: '1px solid ' + C.borderSoft, alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 500, color: C.text, fontSize: 14 }}>{p.nome}</div>
                {p.codigo && <div style={{ fontSize: 11, color: C.textSoft }}>#{p.codigo}</div>}
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 13, fontWeight: 600, background: semEst ? '#FEF2F2' : C.accentSoft, color: semEst ? C.danger : C.accent }}>{p.quantidade || 0}</span>
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, color: C.textSoft }}>{fmt(p.preco_custo)}</div>
              <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 500, color: C.text }}>{fmt(p.preco_venda)}</div>
              <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: lucro >= 0 ? C.success : C.danger }}>{fmt(lucro)}</div>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                <button onClick={() => { setForm({ ...p }); setModal(true) }} style={{ padding: '4px 8px', borderRadius: 6, background: C.bg, border: '1px solid ' + C.border, fontSize: 12, cursor: 'pointer', color: C.textSoft }}>Editar</button>
                <button onClick={() => apagar(p.id)} style={{ padding: '4px 8px', borderRadius: 6, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 12, cursor: 'pointer', color: C.danger }}>×</button>
              </div>
            </div>
          )
        })}
      </div>

      {modal && <Modal form={form} setForm={setForm} onSave={salvar} onClose={() => setModal(false)} saving={saving} />}
    </Layout>
  )
}
