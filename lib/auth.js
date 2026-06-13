import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from './supabase'

// Hook que garante usuario logado e retorna {user, empresa, loading}
export function useAuth(redirect = true) {
  const [user, setUser] = useState(null)
  const [empresa, setEmpresa] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let ativo = true
    async function load() {
      const { data: sess } = await supabase.auth.getSession()
      if (!sess.session) {
        if (redirect) router.push('/')
        setLoading(false)
        return
      }
      const authId = sess.session.user.id
      // busca o usuario na tabela usuarios
      const { data: u } = await supabase.from('usuarios')
        .select('*, empresas(*)').eq('auth_id', authId).single()
      if (ativo) {
        setUser(u)
        setEmpresa(u?.empresas || null)
        setLoading(false)
      }
    }
    load()
    return () => { ativo = false }
  }, [])

  return { user, empresa, loading }
}

export async function logout() {
  await supabase.auth.signOut()
  window.location.href = '/'
}
