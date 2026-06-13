import { useAuth, logout } from '../lib/auth'
import { useTheme } from '../lib/theme'

export default function Dashboard() {
  const { user, empresa, loading } = useAuth()
  const { t } = useTheme()

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: t.textSoft }}>Carregando...</div>
  if (!user) return null

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 13, color: t.textSoft }}>{empresa?.nome}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: t.text }}>Olá, {user.nome}!</div>
        </div>
        <button onClick={logout} style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: '1px solid ' + t.border, color: t.textSoft, fontSize: 13, cursor: 'pointer' }}>Sair</button>
      </div>

      <div style={{ background: t.bgCard, border: '1px solid ' + t.border, borderRadius: 14, padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 16 }}>Conta criada com sucesso! 🎉</div>
        <div style={{ fontSize: 14, color: t.textSoft, lineHeight: 1.7 }}>
          <div><strong style={{ color: t.text }}>Empresa:</strong> {empresa?.nome}</div>
          <div><strong style={{ color: t.text }}>Identificador:</strong> {empresa?.slug}</div>
          <div><strong style={{ color: t.text }}>Seu papel:</strong> {user.role === 'gestor' ? 'Gestor' : 'Funcionário'}</div>
          <div><strong style={{ color: t.text }}>E-mail:</strong> {user.email}</div>
          <div><strong style={{ color: t.text }}>Plano:</strong> {empresa?.plano || 'free'}</div>
        </div>
        <div style={{ marginTop: 20, padding: 16, borderRadius: 10, background: t.accentSoft, fontSize: 13, color: t.text }}>
          Esta é a base do ServiGest SaaS funcionando com multi-tenant. A partir daqui vamos portar as telas de OS, Clientes, Estoque, Vendas, etc — cada empresa verá apenas os próprios dados.
        </div>
      </div>
    </div>
  )
}
