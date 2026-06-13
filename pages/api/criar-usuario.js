import { createClient } from '@supabase/supabase-js'

// Esta rota usa a service role key para criar usuarios no auth
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const { nome, email, senha, telefone, role, comissao_percentual, empresa_id } = req.body

  try {
    // 1. Cria no Auth
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email, password: senha, email_confirm: true,
    })
    if (authErr) throw authErr

    // 2. Cria na tabela usuarios
    const { error: uErr } = await supabaseAdmin.from('usuarios').insert([{
      auth_id: authData.user.id, empresa_id, nome, email,
      telefone, role, comissao_percentual: comissao_percentual || 0,
    }])
    if (uErr) throw uErr

    res.status(200).json({ ok: true })
  } catch (e) {
    res.status(400).json({ erro: e.message || 'Erro ao criar usuário' })
  }
}
