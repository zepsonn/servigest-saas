import { useEffect, useState } from 'react'
import Layout, { C } from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const PERIODOS = ['manha', 'tarde', 'noite']
const PERIODO_LABEL = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' }
const fmt = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const inp = (extra = {}) => ({
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid ' + C.border, fontSize: 14,
  background: C.white, color: C.text, ...extra
})
const lbl = { display: 'block', fontSize: 12, color: C.textSoft, fontWeight: 500, marginBottom: 4 }

function FormOS({ form, setForm, tecnicos, onSave, onClose, saving }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: C.white, borderRadius: '16px 16px 0 0', padding: 24, width: '100%', maxWidth: 560, maxHeight: '92vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{form.id ? 'Editar OS' : 'Nova OS'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: C.textSoft }}>×</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Cliente *</label>
            <input style={inp()} value={form.cliente_nome} onChange={e => setForm({ ...form, cliente_nome: e.target.value })} placeholder="Nome do cliente" />
          </div>
          <div>
            <label style={lbl}>Telefone</label>
            <input style={inp()} value={form.cliente_telefone} onChange={e => setForm({ ...form, cliente_telefone: e.target.value })} placeholder="(41) 99999-9999" />
          </div>
          <div>
            <label style={lbl}>Data *</label>
            <input type="date" style={inp()} value={form.data_entrada} onChange={e => setForm({ ...form, data_entrada: e.target.value })} />
          </div>
          <div>
            <label style={lbl}>Produto</label>
            <input style={inp()} value={form.produto} onChange={e => setForm({ ...form, produto: e.target.value })} placeholder="Ex: Geladeira Brastemp" />
          </div>
          <div>
            <label style={lbl}>Serviço</label>
            <input style={inp()} value={form.servico} onChange={e => setForm({ ...form, servico: e.target.value })} placeholder="Ex: Manutenção" />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Endereço</label>
            <input style={inp()} value={form.cliente_endereco} onChange={e => setForm({ ...form, cliente_endereco: e.target.value })} placeholder="Rua, número - Bairro" />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Diagnóstico</label>
            <textarea style={{ ...inp(), minHeight: 60, resize: 'vertical' }} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
          </div>
          <div>
            <label style={lbl}>Valor (R$)</label>
            <input type="number" style={inp()} value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
          </div>
          <div>
            <label style={lbl}>Técnico</label>
            <select style={inp()} value={form.tecnico_id} onChange={e => setForm({ ...form, tecnico_id: e.target.value })}>
              <option value="">Selecione...</option>
              {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Período</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PERIODOS.map(p => (
                <button key={p} onClick={() => setForm({ ...form, periodo: form.periodo === p ? '' : p })}
                  style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid ' + (form.periodo === p ? C.accent : C.border), background: form.periodo === p ? C.accentSoft : C.white, color: form.periodo === p ? C.accent : C.textSoft, fontSize: 13, cursor: 'pointer', fontWeight: form.periodo === p ? 600 : 400 }}>
                  {PERIODO_LABEL[p]}
                </button>
              ))}
            </div>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Observações</label>
            <textarea style={{ ...inp(), minHeight: 50, resize: 'vertical' }} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 8, background: C.bg, border: '1px solid ' + C.border, color: C.textSoft, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={onSave} disabled={saving} style={{ flex: 2, padding: 12, borderRadius: 8, background: C.accent, color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Salvando...' : form.id ? 'Salvar alterações' : 'Criar OS'}
          </button>
        </div>
      </div>
    </div>
  )
}

const FORM_VAZIO = { cliente_nome: '', cliente_telefone: '', cliente_endereco: '', produto: '', servico: '', descricao: '', valor: 0, tecnico_id: '', periodo: '', observacoes: '', data_entrada: new Date().toISOString().split('T')[0] }

export default function OS() {
  const { user } = useAuth()
  const [lista, setLista] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(FORM_VAZIO)
  const [saving, setSaving] = useState(false)
  const [expandido, setExpandido] = useState(null)

  useEffect(() => {
    if (user) { load(); loadTecnicos() }
  }, [user])

  async function load() {
    const q = supabase.from('ordens_servico').select('*,usuarios(nome)').order('criado_em', { ascending: false })
    if (user?.role !== 'gestor') q.eq('tecnico_id', user.id)
    const { data } = await q
    setLista(data || [])
  }

  async function loadTecnicos() {
    const { data } = await supabase.from('usuarios').select('id,nome').eq('ativo', true).neq('role', 'gestor')
    setTecnicos(data || [])
  }

  async function salvar() {
    if (!form.cliente_nome) return alert('Informe o nome do cliente')
    setSaving(true)
    const payload = {
      cliente_nome: form.cliente_nome, cliente_telefone: form.cliente_telefone,
      cliente_endereco: form.cliente_endereco, produto: form.produto, servico: form.servico,
      descricao: form.descricao, valor: Number(form.valor) || 0, tecnico_id: form.tecnico_id || null,
      periodo: form.periodo || null, observacoes: form.observacoes, data_entrada: form.data_entrada, status: 'em_andamento',
    }
    if (form.id) {
      await supabase.from('ordens_servico').update(payload).eq('id', form.id)
    } else {
      await supabase.from('ordens_servico').insert([payload])
    }
    setSaving(false)
    setModal(false)
    setForm(FORM_VAZIO)
    load()
  }

  async function concluir(os) {
    await supabase.from('ordens_servico').update({ status: 'concluida', data_conclusao: new Date().toISOString().split('T')[0], valor: Number(prompt('Valor cobrado (R$):', os.valor || 0)) || os.valor }).eq('id', os.id)
    load()
  }

  async function apagar(id) {
    if (!confirm('Apagar esta OS?')) return
    await supabase.from('ordens_servico').delete().eq('id', id)
    load()
  }

  const filtrados = lista.filter(o => {
    const ok = filtroStatus === 'todos' || o.status === filtroStatus
    const q = busca.toLowerCase()
    return ok && (!q || (o.cliente_nome || '').toLowerCase().includes(q) || (o.produto || '').toLowerCase().includes(q))
  })

  const em = filtrados.filter(o => o.status === 'em_andamento').length
  const conc = filtrados.filter(o => o.status === 'concluida').length

  return (
    <Layout title="Ordens de Serviço">
      {/* HEADER */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input style={{ flex: 1, minWidth: 200, padding: '9px 14px', borderRadius: 8, border: '1px solid ' + C.border, fontSize: 14, background: C.white, color: C.text }} placeholder="Buscar por cliente ou produto..." value={busca} onChange={e => setBusca(e.target.value)} />
        <div style={{ display: 'flex', gap: 6 }}>
          {['todos', 'em_andamento', 'concluida'].map(s => (
            <button key={s} onClick={() => setFiltroStatus(s)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid ' + (filtroStatus === s ? C.accent : C.border), background: filtroStatus === s ? C.accentSoft : C.white, color: filtroStatus === s ? C.accent : C.textSoft, fontSize: 13, cursor: 'pointer', fontWeight: filtroStatus === s ? 600 : 400 }}>
              {s === 'todos' ? 'Todas' : s === 'em_andamento' ? 'Em andamento' : 'Concluídas'}
            </button>
          ))}
        </div>
        {user?.role === 'gestor' && (
          <button onClick={() => { setForm(FORM_VAZIO); setModal(true) }} style={{ padding: '9px 18px', borderRadius: 8, background: C.accent, color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
            + Nova OS
          </button>
        )}
      </div>

      {/* CONTADORES */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {[['Em andamento', em, C.warning], ['Concluídas', conc, C.success]].map(([l, v, c]) => (
          <div key={l} style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: 13, color: C.textSoft }}>{l}</div>
          </div>
        ))}
      </div>

      {/* LISTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtrados.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: C.textSoft, fontSize: 13 }}>Nenhuma OS encontrada.</div>}
        {filtrados.map(o => (
          <div key={o.id} style={{ background: C.white, border: '1px solid ' + (o.status === 'concluida' ? '#BBF7D0' : C.border), borderRadius: 12, overflow: 'hidden' }}>
            {/* LINHA PRINCIPAL */}
            <div onClick={() => setExpandido(expandido === o.id ? null : o.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: C.text, fontSize: 14 }}>{o.cliente_nome || '—'}</div>
                <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>{o.produto || o.servico || '—'}{o.bairro ? ' · ' + o.bairro : ''}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12, color: C.textSoft }}>{o.usuarios?.nome || 'Sem técnico'}</div>
                {o.periodo && <div style={{ fontSize: 11, color: C.textSoft }}>{PERIODO_LABEL[o.periodo]}</div>}
              </div>
              {o.valor > 0 && <div style={{ fontSize: 14, fontWeight: 600, color: C.text, flexShrink: 0 }}>{fmt(o.valor)}</div>}
              <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: o.status === 'concluida' ? '#DCFCE7' : '#FEF3C7', color: o.status === 'concluida' ? C.success : C.warning, flexShrink: 0 }}>
                {o.status === 'concluida' ? 'Concluída' : 'Em andamento'}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textSoft} strokeWidth="2" style={{ transform: expandido === o.id ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}><polyline points="6 9 12 15 18 9" /></svg>
            </div>

            {/* EXPANDIDO */}
            {expandido === o.id && (
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid ' + C.borderSoft }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, color: C.textSoft, marginTop: 12, marginBottom: 12 }}>
                  <div>Data entrada: <strong style={{ color: C.text }}>{o.data_entrada ? new Date(o.data_entrada + 'T12:00').toLocaleDateString('pt-BR') : '—'}</strong></div>
                  {o.data_conclusao && <div>Conclusão: <strong style={{ color: C.text }}>{new Date(o.data_conclusao + 'T12:00').toLocaleDateString('pt-BR')}</strong></div>}
                  {o.cliente_telefone && <div>Telefone: <strong style={{ color: C.text }}>{o.cliente_telefone}</strong></div>}
                  {o.cliente_endereco && <div style={{ gridColumn: '1/-1' }}>Endereço: <strong style={{ color: C.text }}>{o.cliente_endereco}</strong></div>}
                  {o.descricao && <div style={{ gridColumn: '1/-1' }}>Diagnóstico: <strong style={{ color: C.text }}>{o.descricao}</strong></div>}
                  {o.observacoes && <div style={{ gridColumn: '1/-1' }}>Obs: <strong style={{ color: C.text }}>{o.observacoes}</strong></div>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {o.status === 'em_andamento' && (
                    <button onClick={() => concluir(o)} style={{ padding: '7px 14px', borderRadius: 8, background: C.success, color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>✓ Concluir</button>
                  )}
                  {user?.role === 'gestor' && (
                    <>
                      <button onClick={() => { setForm({ ...o, tecnico_id: o.tecnico_id || '' }); setModal(true) }} style={{ padding: '7px 14px', borderRadius: 8, background: C.bg, border: '1px solid ' + C.border, color: C.text, fontSize: 13, cursor: 'pointer' }}>Editar</button>
                      <button onClick={() => apagar(o.id)} style={{ padding: '7px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', color: C.danger, fontSize: 13, cursor: 'pointer' }}>Apagar</button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {modal && <FormOS form={form} setForm={setForm} tecnicos={tecnicos} onSave={salvar} onClose={() => setModal(false)} saving={saving} />}
    </Layout>
  )
}
