import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'
import Link from 'next/link'

export default function Cadastro() {
  const { t } = useTheme()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    empresa: '', cnpj: '', telefone: '',
    nome: '', email: '', senha: '', senha2: '',
  })

  function slugify(s) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  }

  async function cadastrar() {
    setErro('')
    if (form.senha !== form.senha2) { setErro('As senhas não conferem'); return }
    if (form.senha.length < 6) { setErro('A senha precisa ter ao menos 6 caracteres'); return }
    setLoading(true)
    try {
      // 1. cria o usuario no auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email, password: form.senha,
      })
      if (authErr) throw authErr
      const authId = authData.user?.id
      if (!authId) throw new Error('Não foi possível criar o usuário')

      // 2. cria a empresa
      let slug = slugify(form.empresa)
      let emp = null
      const primeira = await supabase.from('empresas')
        .insert([{ nome: form.empresa, slug, cnpj: form.cnpj, telefone: form.telefone, email: form.email }])
        .select().single()
      if (primeira.error) {
        // slug duplicado? tenta com sufixo
        if (primeira.error.code === '23505') {
          slug = slug + '-' + Math.random().toString(36).slice(2, 6)
          const retry = await supabase.from('empresas')
            .insert([{ nome: form.empresa, slug, cnpj: form.cnpj, telefone: form.telefone, email: form.email }])
            .select().single()
          if (retry.error) throw retry.error
          emp = retry.data
        } else throw primeira.error
      } else {
        emp = primeira.data
      }

      // 3. cria o usuario gestor vinculado
      const { error: uErr } = await supabase.from('usuarios').insert([{
        auth_id: authId, empresa_id: emp.id, nome: form.nome,
        email: form.email, role: 'gestor',
      }])
      if (uErr) throw uErr

      router.push('/dashboard')
    } catch (e) {
      setErro(e.message || 'Erro ao cadastrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const inp = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid ' + t.border, fontSize: 15, background: t.bgInput, color: t.text, marginBottom: 12 }
  const lbl = { display: 'block', fontSize: 12, color: t.textSoft, fontWeight: 500, marginBottom: 4 }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440, background: t.bgCard, borderRadius: 18, padding: 32, border: '1px solid ' + t.border }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: t.text }}>ServiGest</div>
          <div style={{ fontSize: 14, color: t.textSoft, marginTop: 2 }}>Crie a conta da sua empresa</div>
        </div>

        {/* indicador de passo */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {[1, 2].map(n => (
            <div key={n} style={{ flex: 1, height: 4, borderRadius: 99, background: step >= n ? t.accent : t.border }} />
          ))}
        </div>

        {step === 1 ? (
          <>
            <label style={lbl}>Nome da empresa</label>
            <input style={inp} value={form.empresa} onChange={e => setForm({ ...form, empresa: e.target.value })} placeholder="Ex: Top Eletro" />
            <label style={lbl}>CNPJ (opcional)</label>
            <input style={inp} value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
            <label style={lbl}>Telefone</label>
            <input style={inp} value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} placeholder="(41) 99999-9999" />
            <button onClick={() => { if (form.empresa) setStep(2); else setErro('Informe o nome da empresa') }}
              style={{ width: '100%', padding: 14, borderRadius: 10, background: t.accent, color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
              Continuar
            </button>
          </>
        ) : (
          <>
            <label style={lbl}>Seu nome</label>
            <input style={inp} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Nome do gestor" />
            <label style={lbl}>E-mail</label>
            <input style={inp} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="voce@empresa.com" />
            <label style={lbl}>Senha</label>
            <input style={inp} type="password" value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} placeholder="Mínimo 6 caracteres" />
            <label style={lbl}>Confirmar senha</label>
            <input style={inp} type="password" value={form.senha2} onChange={e => setForm({ ...form, senha2: e.target.value })} placeholder="Repita a senha" />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: 14, borderRadius: 10, background: 'transparent', color: t.textSoft, border: '1px solid ' + t.border, fontSize: 15, cursor: 'pointer' }}>Voltar</button>
              <button onClick={cadastrar} disabled={loading} style={{ flex: 2, padding: 14, borderRadius: 10, background: t.accent, color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Criando...' : 'Criar conta'}
              </button>
            </div>
          </>
        )}

        {erro && <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 8, background: '#FCEBEB', color: '#A32D2D', fontSize: 13 }}>{erro}</div>}

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: t.textSoft }}>
          Já tem conta? <Link href="/" style={{ color: t.accent, fontWeight: 500 }}>Entrar</Link>
        </div>
      </div>
    </div>
  )
}
