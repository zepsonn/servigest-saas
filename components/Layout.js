import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth, logout } from '../lib/auth'

// Paleta clara e limpa (Stripe/Notion-inspired)
const C = {
  bg: '#F7F8FA',
  sidebar: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E5E7EB',
  borderSoft: '#F0F1F3',
  text: '#111827',
  textSoft: '#6B7280',
  textXSoft: '#9CA3AF',
  accent: '#4F46E5', // indigo — distinto do verde do projeto pai
  accentSoft: '#EEF2FF',
  accentDark: '#3730A3',
  danger: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
  white: '#FFFFFF',
}

const NAV_GESTOR = [
  { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { href: '/os', icon: 'os', label: 'Ordens de Serviço' },
  { href: '/clientes', icon: 'clientes', label: 'Clientes' },
  { href: '/estoque', icon: 'estoque', label: 'Estoque' },
  { href: '/vendas', icon: 'vendas', label: 'Vendas' },
  { href: '/despesas', icon: 'despesas', label: 'Despesas' },
  { href: '/equipe', icon: 'equipe', label: 'Equipe' },
  { href: '/configuracoes', icon: 'config', label: 'Configurações' },
]

const NAV_FUNC = [
  { href: '/dashboard', icon: 'dashboard', label: 'Meus Serviços' },
  { href: '/os', icon: 'os', label: 'Ordens de Serviço' },
]

const ICONS = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  os: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  clientes: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  estoque: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  vendas: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  despesas: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  equipe: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  config: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  chevron: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
}

function useIsMobile() {
  const [m, setM] = useState(false)
  useEffect(() => {
    const c = () => setM(window.innerWidth < 768)
    c(); window.addEventListener('resize', c)
    return () => window.removeEventListener('resize', c)
  }, [])
  return m
}

export default function Layout({ children, title }) {
  const { user, empresa, loading } = useAuth()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sg_sidebar')
    if (saved !== null) setCollapsed(saved === 'true')
  }, [])

  function toggleSidebar() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sg_sidebar', String(next))
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{ width: 32, height: 32, border: '3px solid ' + C.border, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
  if (!user) return null

  const nav = user.role === 'gestor' ? NAV_GESTOR : NAV_FUNC
  const sidebarW = collapsed ? 64 : 240

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo + toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', padding: collapsed ? '20px 0' : '20px 16px', borderBottom: '1px solid ' + C.border }}>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '-0.3px' }}>ServiGest</div>
            <div style={{ fontSize: 11, color: C.textSoft, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{empresa?.nome}</div>
          </div>
        )}
        {!isMobile && (
          <button onClick={toggleSidebar} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid ' + C.border, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textSoft, flexShrink: 0 }}>
            <div style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform .2s', display: 'flex' }}>{ICONS.chevron}</div>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {nav.map(item => {
          const active = router.pathname === item.href || router.pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '10px 0' : '9px 10px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 8, marginBottom: 2, textDecoration: 'none',
              background: active ? C.accentSoft : 'transparent',
              color: active ? C.accent : C.textSoft,
              fontWeight: active ? 600 : 400, fontSize: 14,
              transition: 'background .15s, color .15s',
            }}>
              <span style={{ flexShrink: 0 }}>{ICONS[item.icon]}</span>
              {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User + sair */}
      <div style={{ padding: collapsed ? '12px 0' : '12px 8px', borderTop: '1px solid ' + C.border }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.accentSoft, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {user.nome?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.nome}</div>
              <div style={{ fontSize: 11, color: C.textSoft }}>{user.role === 'gestor' ? 'Gestor' : 'Técnico'}</div>
            </div>
          </div>
        )}
        <button onClick={logout} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 8, padding: collapsed ? '8px 0' : '8px 10px', borderRadius: 8,
          background: 'transparent', border: 'none', color: C.textSoft, fontSize: 13, cursor: 'pointer',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          {!collapsed && 'Sair'}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: 'Inter, DM Sans, sans-serif' }}>
      {/* DESKTOP SIDEBAR */}
      {!isMobile && (
        <aside style={{ width: sidebarW, flexShrink: 0, background: C.sidebar, borderRight: '1px solid ' + C.border, position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', transition: 'width .2s ease' }}>
          <SidebarContent />
        </aside>
      )}

      {/* MOBILE OVERLAY */}
      {isMobile && mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)' }} onClick={() => setMobileOpen(false)} />
          <aside style={{ width: 260, background: C.sidebar, position: 'relative', zIndex: 1, height: '100vh', overflow: 'hidden' }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* MAIN */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* TOPBAR */}
        <header style={{ height: 56, background: C.white, borderBottom: '1px solid ' + C.border, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, position: 'sticky', top: 0, zIndex: 100 }}>
          {isMobile && (
            <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textSoft, display: 'flex', padding: 4 }}>
              {ICONS.menu}
            </button>
          )}
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{title}</div>
          {isMobile && <div style={{ marginLeft: 'auto', fontSize: 13, color: C.textSoft }}>{empresa?.nome}</div>}
        </header>

        {/* CONTENT */}
        <main style={{ flex: 1, padding: isMobile ? '16px' : '24px 28px', maxWidth: 1200 }}>
          {children}
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        a { text-decoration: none; }
        button { font-family: inherit; }
        input, textarea, select { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 99px; }
      `}</style>
    </div>
  )
}

// Exportar as cores para usar nas páginas
export { C }
