import { useEffect, useState } from 'react'
import Layout, { C } from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const inp = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid ' + C.border, fontSize: 14, background: C.white, color: C.text, marginBottom: 12 }
const lbl = { display: 'block', fontSize: 12, color: C.textSoft, fontWeight: 500, marginBottom: 4 }

export default function Configuracoes() {
  const { user, empresa } = useAuth()
  const [form, setForm] = useState({ nome: '', cnpj: '', telefone: '', email: '', endereco: '' })
  const [saving, setSaving] = useState(false)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    if (empresa) setForm({ nome: empresa.nome || '', cnpj: empresa.cnpj || '', telefone: empresa.telefone || '', email: empresa.email || '', endereco: empresa.endereco || '' })
  }, [empresa])

  async function salvar() {
    setSaving(true)
    await supabase.from('empresas').update({ nome: form.nome, cnpj: form.cnpj, telefone: form.telefone, email: form.email, endereco: form.endereco }).eq('id', empresa.id)
    setSaving(false); setOk(true)
    setTimeout(() => setOk(false), 3000)
  }

  if (user?.role !== 'gestor') return <Layout title="Configurações"><div style={{ color: C.textSoft }}>Acesso restrito.</div></Layout>

  return (
    <Layout title="Configurações">
      <div style={{ maxWidth: 560 }}>
        <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 14, padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 20 }}>Dados da empresa</div>
          <label style={lbl}>Nome da empresa</label>
          <input style={inp} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
          <label style={lbl}>CNPJ</label>
          <input style={inp} value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
          <label style={lbl}>Telefone</label>
          <input style={inp} value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
          <label style={lbl}>E-mail</label>
          <input style={inp} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <label style={lbl}>Endereço</label>
          <input style={inp} value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} />
          <button onClick={salvar} disabled={saving} style={{ padding: '10px 24px', borderRadius: 8, background: C.accent, color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer', fontWeight: 500, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
          {ok && <span style={{ marginLeft: 12, fontSize: 13, color: C.success, fontWeight: 500 }}>✓ Salvo!</span>}
        </div>

        <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 14, padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>Informações da conta</div>
          <div style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.8 }}>
            <div>Identificador: <strong style={{ color: C.text }}>{empresa?.slug}</strong></div>
            <div>Plano: <strong style={{ color: C.text }}>{empresa?.plano || 'free'}</strong></div>
            <div>Membro desde: <strong style={{ color: C.text }}>{empresa?.criado_em ? new Date(empresa.criado_em).toLocaleDateString('pt-BR') : '—'}</strong></div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
