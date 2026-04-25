import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getAllProfiles, updateProfile, getBeers, getSessions } from '../lib/supabase'
import { Spinner, Alert, SectionTitle } from '../components/UI'

export default function AdminPage() {
  const { profile } = useAuth()
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [u, b, s] = await Promise.all([getAllProfiles(), getBeers(), getSessions()])
      setUsers(u)
      setStats({ users: u.length, beers: b.length, sessions: s.length })
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function changeRole(userId, role) {
    setSaving(userId); setError('')
    try {
      await updateProfile(userId, { role })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    } catch (err) { setError(err.message) }
    finally { setSaving(null) }
  }

  if (loading) return <Spinner />

  const ROLE_OPTIONS = profile?.role === 'superuser'
    ? ['brouwer', 'admin', 'superuser']
    : ['brouwer', 'admin']

  const roleBadge = (role) => {
    const cls = role === 'superuser' ? 'badge-red' : role === 'admin' ? 'badge-copper' : 'badge-hop'
    return <span className={`badge ${cls}`}>{role}</span>
  }

  return (
    <div>
      <div className="page-header">
        <h2>⚙️ Beheer</h2>
        <p>Gebruikersbeheer en systeeminstellingen</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Stats */}
      {stats && (
        <>
          <SectionTitle>Statistieken</SectionTitle>
          <div className="stats-grid mb-3">
            {[['👤', stats.users, 'Gebruikers'], ['🍺', stats.beers, 'Bieren'], ['🎯', stats.sessions, 'Sessies']].map(([icon, num, label]) => (
              <div key={label} className="stat-card">
                <div style={{ fontSize: '1.6rem' }}>{icon}</div>
                <div className="stat-number">{num}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <SectionTitle>Gebruikers</SectionTitle>

      {/* Desktop tabel */}
      <div className="card desktop-only" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table fluid-table">
          <thead>
            <tr>
              <th>Gebruikersnaam</th>
              <th>Brouwerij</th>
              <th>Rol</th>
              <th>Wijzigen</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <strong>{u.username}</strong>
                  {u.id === profile.id && <span className="badge badge-amber" style={{ marginLeft: 6 }}>Jij</span>}
                </td>
                <td>{u.brewery_name || <span className="text-muted">—</span>}</td>
                <td>{roleBadge(u.role)}</td>
                <td>
                  {(u.id !== profile.id || profile.role === 'superuser') ? (
                    <select className="form-select" style={{ padding: '4px 8px', fontSize: '0.82rem', width: 'auto' }}
                      value={u.role}
                      disabled={saving === u.id || (u.role === 'superuser' && profile.role !== 'superuser')}
                      onChange={e => changeRole(u.id, e.target.value)}>
                      {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : <span className="text-muted" style={{ fontSize: '0.82rem' }}>Eigen account</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobiele kaarten */}
      <div className="mobile-only">
        {users.map(u => (
          <div key={u.id} className="admin-user-card">
            <div className="admin-user-header">
              <div>
                <div className="admin-user-name">
                  {u.username}
                  {u.id === profile.id && <span className="badge badge-amber" style={{ marginLeft: 6 }}>Jij</span>}
                </div>
                <div className="admin-user-brewery">{u.brewery_name || <span className="text-muted">Geen brouwerij</span>}</div>
              </div>
              {roleBadge(u.role)}
            </div>
            {(u.id !== profile.id || profile.role === 'superuser') && !(u.role === 'superuser' && profile.role !== 'superuser') && (
              <div className="admin-user-role-select">
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Rol wijzigen</label>
                <select className="form-select" value={u.role}
                  disabled={saving === u.id}
                  onChange={e => changeRole(u.id, e.target.value)}>
                  {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="alert alert-info mt-2" style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
        <div><strong>brouwer</strong> — bieren toevoegen en beoordelingen invullen</div>
        <div><strong>admin</strong> — ook proefsessies aanmaken en beheren</div>
        <div><strong>superuser</strong> — volledige toegang, altijd alles bewerken</div>
      </div>
    </div>
  )
}
