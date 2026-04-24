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
      setStats({ users: u.length, beers: b.length, sessions: s.length, forms: s.reduce((t, x) => t + (x.session_beers?.length || 0), 0) })
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

  return (
    <div>
      <div className="page-header">
        <h2>⚙️ Beheer</h2>
        <p>Gebruikersbeheer en systeeminstellingen</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {stats && (
        <>
          <SectionTitle>Statistieken</SectionTitle>
          <div className="form-row-3 mb-3">
            {[
              ['👤', stats.users, 'Gebruikers'],
              ['🍺', stats.beers, 'Bieren'],
              ['🎯', stats.sessions, 'Sessies'],
            ].map(([icon, num, label]) => (
              <div key={label} className="card" style={{ textAlign: 'center', padding: 16 }}>
                <div style={{ fontSize: '1.8rem' }}>{icon}</div>
                <div style={{ fontSize: '1.8rem', fontFamily: "'Playfair Display', serif", color: 'var(--amber-dark)', fontWeight: 700 }}>{num}</div>
                <div className="text-muted">{label}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <SectionTitle>Gebruikers</SectionTitle>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Gebruikersnaam</th>
              <th>Brouwerij</th>
              <th>Huidige rol</th>
              <th>Rol wijzigen</th>
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
                <td>
                  <span className={`badge ${u.role === 'superuser' ? 'badge-red' : u.role === 'admin' ? 'badge-copper' : 'badge-hop'}`}>
                    {u.role}
                  </span>
                </td>
                <td>
                  {u.id !== profile.id || profile.role === 'superuser' ? (
                    <select
                      className="form-select"
                      style={{ padding: '4px 8px', fontSize: '0.82rem', width: 'auto' }}
                      value={u.role}
                      disabled={saving === u.id || (u.role === 'superuser' && profile.role !== 'superuser')}
                      onChange={e => changeRole(u.id, e.target.value)}
                    >
                      {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : (
                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>Eigen account</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="alert alert-info mt-2" style={{ fontSize: '0.85rem' }}>
        <strong>Rollen uitleg:</strong><br />
        <strong>brouwer</strong> — kan bieren toevoegen en beoordelingen invullen<br />
        <strong>admin</strong> — kan ook proefsessies aanmaken en beheren<br />
        <strong>superuser</strong> — volledige toegang, kan altijd alles bewerken
      </div>
    </div>
  )
}
