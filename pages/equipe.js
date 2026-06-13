import { useEffect, useState } from 'react'
import Layout, { C } from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const inp = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid ' + C.border, fontSize: 14, background: C.white, color: C.text }
const lbl = { display: 'block', fontSize: 12, color: C.textSoft, fontWeight: 500, marginBottom: 4 }
const FORM_VAZIO = { nome: '', email: '', senha: '', telefone: '', role: 'funcionario', comissao_percentual: 0 }

function Modal({ form, setForm, onSave, onClose, saving }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: C.white, borderRadius: '16px 16px 0 0', padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{form.id ? 'Editar membro' : 'Novo membro'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: C.textSoft }}>×</button>
        </div>
        <div style={{ marginBottom: 12 }}><label style={lbl}>Nome *</label><input style={inp} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
        <div style={{ marginBottom: 12 }}><label style={lbl}>E-mail *</label><input type="email" style={inp} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
        {!form.id && <div style={{ marginBottom: 12 }}><label style={lbl}>Senha *</label><input type="password" style={inp} value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} placeholder="Mínimo 6 caracteres" /></div>}
        <div style={{ marginBottom: 12 }}><label style={lbl}>Telefone</label><input style={inp} value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={lbl}>Papel</label>
            <select style={inp} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="funcionario">Técnico</option>
              <option value="gestor">Gestor</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Comissão (%)</label>
            <input type="number" style={inp} value={form.comissao_percentual} onChange={e => setForm({ ...form, comissao_percentual: e.target.value })} min="0" max="100" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 8, background: C.bg, border: '1px solid ' + C.border, color: C.textSoft, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={onSave} disabled={saving} style={{ flex: 2, padding: 12, borderRadius: 8, background: C.accent, color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Salvando...' : form.id ? 'Salvar' : 'Criar conta'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Equipe() {
  const { user, empresa } = useAuth()
  const [lista, setLista] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(FORM_VAZIO)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const { data } = await supabase.from('usuarios').select('*').order('nome')
    setLista(data || [])
  }

  async function salvar() {
    setErro('')
    if (!form.nome || !form.email) return setErro('Nome e e-mail são obrigatórios')
    setSaving(true)
    try {
      if (form.id) {
        await supabase.from('usuarios').update({
          nome: form.nome, telefone: form.telefone,
          role: form.role, comissao_percentual: Number(form.comissao_percentual) || 0,
        }).eq('id', form.id)
      } else {
        if (!form.senha || form.senha.length < 6) { setErro('Senha precisa ter ao menos 6 caracteres'); setSaving(false); return }
        // Cria via supabase auth
        const resp = await fetch('/api/criar-usuario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: form.nome, email: form.email, senha: form.senha, telefone: form.telefone, role: form.role, comissao_percentual: Number(form.comissao_percentual) || 0, empresa_id: empresa?.id }),
        })
        const data = await resp.json()
        if (!resp.ok) throw new Error(data.erro || 'Erro ao criar usuário')
      }
      setModal(false); setForm(FORM_VAZIO); load()
    } catch (e) {
      setErro(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleAtivo(u) {
    await supabase.from('usuarios').update({ ativo: !u.ativo }).eq('id', u.id)
    load()
  }

  if (user?.role !== 'gestor') return <Layout title="Equipe"><div style={{ color: C.textSoft }}>Acesso restrito.</div></Layout>

  return (
    <Layout title="Equipe">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => { setForm(FORM_VAZIO); setErro(''); setModal(true) }} style={{ padding: '9px 18px', borderRadius: 8, background: C.accent, color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>+ Novo membro</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {lista.map(u => (
          <div key={u.id} style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 12, padding: '16px', display: 'flex', alignItems: 'center', gap: 12, opacity: u.ativo ? 1 : 0.5 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.accentSoft, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
              {u.nome?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: C.text, fontSize: 15 }}>{u.nome}</div>
              <div style={{ fontSize: 12, color: C.textSoft, marginTop: 1 }}>{u.email}</div>
              {u.telefone && <div style={{ fontSize: 12, color: C.textSoft }}>{u.telefone}</div>}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500, background: u.role === 'gestor' ? C.accentSoft : C.bg, color: u.role === 'gestor' ? C.accent : C.textSoft, border: '1px solid ' + (u.role === 'gestor' ? C.accent + '40' : C.border) }}>
                {u.role === 'gestor' ? 'Gestor' : 'Técnico'}
              </span>
              {u.comissao_percentual > 0 && <div style={{ fontSize: 11, color: C.textSoft, marginTop: 4 }}>{u.comissao_percentual}% comissão</div>}
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button onClick={() => { setForm({ ...u, senha: '' }); setErro(''); setModal(true) }} style={{ padding: '6px 12px', borderRadius: 8, background: C.bg, border: '1px solid ' + C.border, fontSize: 13, cursor: 'pointer', color: C.textSoft }}>Editar</button>
              <button onClick={() => toggleAtivo(u)} style={{ padding: '6px 12px', borderRadius: 8, background: u.ativo ? '#FEF2F2' : '#F0FDF4', border: '1px solid ' + (u.ativo ? '#FECACA' : '#BBF7D0'), fontSize: 13, cursor: 'pointer', color: u.ativo ? C.danger : C.success }}>
                {u.ativo ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <>
          <Modal form={form} setForm={setForm} onSave={salvar} onClose={() => setModal(false)} saving={saving} />
          {erro && <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: '#FEF2F2', color: C.danger, padding: '10px 20px', borderRadius: 8, fontSize: 13, zIndex: 400, border: '1px solid #FECACA' }}>{erro}</div>}
        </>
      )}
    </Layout>
  )
}
