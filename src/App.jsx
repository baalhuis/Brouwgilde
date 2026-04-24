import { useState } from 'react'
import { AuthProvider, useAuth, useRole } from './lib/AuthContext'
import { signOut } from './lib/supabase'
import { Spinner } from './components/UI'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import BeersPage from './pages/BeersPage'
import SessionsPage from './pages/SessionsPage'
import { MyFormsPage, MyBreweryPage } from './pages/MyPages'
import AdminPage from './pages/AdminPage'

const NAV = [
  { key: 'dashboard', label: 'Dashboard',         icon: '🏠' },
  { key: 'beers',     label: 'Bieren',             icon: '🍺', section: 'Bieren' },
  { key: 'sessions',  label: 'Proefsessies',       icon: '🎯', section: 'Sessies' },
  { key: 'myforms',   label: 'Mijn beoordelingen', icon: '📋', section: 'Sessies' },
  { key: 'mybrewery', label: 'Mijn brouwerij',     icon: '🏭', section: 'Brouwerij', roles: ['brouwer','admin','superuser'] },
  { key: 'admin',     label: 'Beheer',             icon: '⚙️', section: 'Admin', roles: ['admin','superuser'] },
]

function AppShell() {
  const { profile, loading } = useAuth()
  const { role } = useRole()
  const [page, setPage] = useState('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ink)' }}>
      <div style={{ textAlign: 'center', color: 'var(--amber-light)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🍺</div>
        <div className="spinner" style={{ borderTopColor: 'var(--amber-light)', borderColor: 'rgba(240,200,106,0.3)' }} />
      </div>
    </div>
  )

  if (!profile) return <LoginPage />

  const visibleNav = NAV.filter(n => !n.roles || n.roles.includes(role))

  const sections = []
  const seen = new Set()
  visibleNav.forEach(n => {
    const sec = n.section || ''
    if (!seen.has(sec)) { seen.add(sec); sections.push(sec) }
  })

  async function handleLogout() {
    await signOut()
    setPage('dashboard')
    setMenuOpen(false)
  }

  function navigate(key) {
    setPage(key)
    setMenuOpen(false)
  }

  function renderPage() {
    switch (page) {
      case 'beers':     return <BeersPage />
      case 'sessions':  return <SessionsPage />
      case 'myforms':   return <MyFormsPage />
      case 'mybrewery': return <MyBreweryPage />
      case 'admin':     return <AdminPage />
      default:          return <Dashboard />
    }
  }

  const currentNav = visibleNav.find(n => n.key === page)

  const sidebarContent = (
    <>
      <div className="sidebar-logo">
        <h1>Brouwgilde</h1>
        <span>Breda</span>
      </div>
      <div className="sidebar-user">
        <strong>{profile.username}</strong>
        <span className="sidebar-badge">{role}</span>
        {profile.brewery_name && (
          <div style={{ marginTop: 3, fontSize: '0.75rem', color: 'rgba(245,239,224,0.45)' }}>
            {profile.brewery_name}
          </div>
        )}
      </div>
      <nav className="nav">
        {sections.map(sec => {
          const items = visibleNav.filter(n => (n.section || '') === sec)
          return (
            <div key={sec}>
              {sec && <div className="nav-section">{sec}</div>}
              {items.map(n => (
                <button
                  key={n.key}
                  className={`nav-item ${page === n.key ? 'active' : ''}`}
                  onClick={() => navigate(n.key)}
                >
                  <span className="icon">{n.icon}</span>
                  {n.label}
                </button>
              ))}
            </div>
          )
        })}
      </nav>
      <div className="sidebar-footer">
        <button className="btn-logout" onClick={handleLogout}>Uitloggen</button>
      </div>
    </>
  )

  return (
    <div className="app-shell">

      {/* ── Desktop sidebar ─────────────────────────── */}
      <aside className="sidebar sidebar-desktop">
        {sidebarContent}
      </aside>

      {/* ── Mobile top bar ──────────────────────────── */}
      <header className="mobile-topbar">
        <div className="mobile-topbar-left">
          <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
          </button>
          <span className="mobile-title">
            {currentNav ? `${currentNav.icon} ${currentNav.label}` : '🍺 Brouwgilde'}
          </span>
        </div>
        <span className="mobile-user">{profile.username}</span>
      </header>

      {/* ── Mobile drawer overlay ────────────────────── */}
      {menuOpen && (
        <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />
      )}

      {/* ── Mobile drawer ───────────────────────────── */}
      <aside className={`sidebar sidebar-mobile ${menuOpen ? 'open' : ''}`}>
        {sidebarContent}
      </aside>

      {/* ── Main content ────────────────────────────── */}
      <main className="main">
        {renderPage()}
      </main>

    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
