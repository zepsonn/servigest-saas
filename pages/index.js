import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'
import Link from 'next/link'

export default function Login() {
  const { t } = useTheme()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    // se ja esta logado, vai pro dashboard
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push('/dashboard')
    })
  }, [])

  async function entrar() {
    setErro(''); setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) throw error
      router.push('/dashboard')
    } catch (e) {
      setErro('E-mail ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  const inp = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid ' + t.border, fontSize: 15, background: t.bgInput, color: t.text, marginBottom: 12 }
  const lbl = { display: 'block', fontSize: 12, color: t.textSoft, fontWeight: 500, marginBottom: 4 }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400, background: t.bgCard, borderRadius: 18, padding: 32, border: '1px solid ' + t.border }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: t.text }}>ServiGest</div>
          <div style={{ fontSize: 14, color: t.textSoft, marginTop: 2 }}>Gestão de serviços para sua empresa</div>
        </div>

        <label style={lbl}>E-mail</label>
        <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@empresa.com" onKeyDown={e => e.key === 'Enter' && entrar()} />
        <label style={lbl}>Senha</label>
        <input style={inp} type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Sua senha" onKeyDown={e => e.key === 'Enter' && entrar()} />

        <button onClick={entrar} disabled={loading} style={{ width: '100%', padding: 14, borderRadius: 10, background: t.accent, color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        {erro && <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 8, background: '#FCEBEB', color: '#A32D2D', fontSize: 13 }}>{erro}</div>}

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: t.textSoft }}>
          Não tem conta? <Link href="/cadastro" style={{ color: t.accent, fontWeight: 500 }}>Cadastre sua empresa</Link>
        </div>
      </div>
    </div>
  )
}
