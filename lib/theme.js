import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({})

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('auto')
  const [accent, setAccent] = useState('green')
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('sg_theme') || '{}')
    if (saved.mode) setMode(saved.mode)
    if (saved.accent) setAccent(saved.accent)
  }, [])

  useEffect(() => {
    const check = () => {
      if (mode === 'dark') setDark(true)
      else if (mode === 'light') setDark(false)
      else { const h = new Date().getHours(); setDark(h >= 18 || h < 6) }
    }
    check()
    const i = setInterval(check, 60000)
    return () => clearInterval(i)
  }, [mode])

  function save(m, a) {
    const nm = m ?? mode; const na = a ?? accent
    setMode(nm); if (a) setAccent(na)
    localStorage.setItem('sg_theme', JSON.stringify({ mode: nm, accent: na }))
  }

  const ac = accent === 'green' ? '#1D9E75' : '#2563EB'
  const acDark = accent === 'green' ? '#157A5A' : '#1D4ED8'
  const acSoft = accent === 'green' ? (dark ? '#0d2e22' : '#E8F5F0') : (dark ? '#0d1f3e' : '#EEF2FF')

  const t = {
    dark, accent: ac, accentDark: acDark, accentSoft: acSoft,
    bg: dark ? '#0f1117' : '#f5f5f5',
    bgCard: dark ? '#1a1d27' : '#ffffff',
    bgSidebar: dark ? '#13151f' : '#f0f0f0',
    bgInput: dark ? '#1e2130' : '#f9f9f9',
    bgHover: dark ? '#22263a' : '#e8e8e8',
    text: dark ? '#e8e9f0' : '#1a1a2e',
    textSoft: dark ? '#8b8fa8' : '#6b7280',
    border: dark ? '#2a2d3e' : '#e0e0e0',
    borderSoft: dark ? '#1e2130' : '#ebebeb',
    setMode: (m) => save(m, null),
    setAccent: (a) => save(null, a),
    mode,
  }

  return (
    <ThemeContext.Provider value={{ t }}>
      <div style={{ background: t.bg, color: t.text, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', transition: 'background .2s' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() { return useContext(ThemeContext) }
