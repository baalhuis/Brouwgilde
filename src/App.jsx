import { useState } from 'react'
import { AuthProvider, useAuth, useRole } from './lib/AuthContext'
import { NavContext } from './lib/NavContext'
import { signOut } from './lib/supabase'
import { Spinner } from './components/UI'
import { LogoWhite, HopsDecoration } from './components/Logo'
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
      <div style={{ textAlign: 'center' }}>
        <LogoWhite style={{ width: 140, margin: '0 auto 28px' }} />
        <div className="spinner" style={{ margin: '0 auto', borderTopColor: 'var(--green)', borderColor: 'rgba(145,179,77,0.2)' }} />
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

  function navigate(key) {
    setPage(key)
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleLogout() {
    await signOut()
    setPage('dashboard')
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
        <LogoWhite style={{ width: 130, marginBottom: 6, display: 'block', margin: '0 auto 6px' }} />
        <span className="sidebar-logo-sub">Proefplatform</span>
      </div>
      <div className="sidebar-user">
        <strong>{profile.username}</strong>
        <span className="sidebar-badge">{role}</span>
        {profile.brewery_name && (
          <div className="brewery-name" style={{ marginTop: 3, fontSize: '0.74rem', color: 'rgba(255,255,255,0.38)' }}>
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
        <HopsDecoration style={{ width: 80, opacity: 0.15, margin: '0 auto 12px' }} />
        <button className="btn-logout" onClick={handleLogout}>Uitloggen</button>
      </div>
    </>
  )

  return (
    <NavContext.Provider value={navigate}>
      <div className="app-shell">
        <aside className="sidebar sidebar-desktop">{sidebarContent}</aside>

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

        {menuOpen && <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />}
        <aside className={`sidebar sidebar-mobile ${menuOpen ? 'open' : ''}`}>{sidebarContent}</aside>

        <main className="main">{renderPage()}</main>
      </div>
    </NavContext.Provider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
