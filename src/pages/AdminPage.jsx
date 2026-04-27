import { useEffect, useState } from 'react'
import { useAuth, useRole } from '../lib/AuthContext'
import { getAllProfiles, updateProfile, deleteProfile, getBreweries, getBreweriesTable, createBrewery, updateBrewery, deleteBrewery, getBeers, getSessions } from '../lib/supabase'
import { Spinner, Alert, SectionTitle, Modal } from '../components/UI'

// ── Edit user modal ────────────────────────────────────────────
function EditUserModal({ user, breweries, onSave, onClose }) {
  const [form, setForm] = useState({
    username:     user.username     || '',
    brewery_name: user.brewery_name || '',
    role:         user.role         || 'brouwer',
  })
  const [breweryMode, setBreweryMode] = useState('existing') // 'existing' | 'new'
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function handleSave(e) {
    e.preventDefault(); setError('')
    if (!form.username) { setError('Gebruikersnaam is verplicht.'); return }
    setLoading(true)
    try { await onSave(user.id, form) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title={`Gebruiker bewerken — ${user.username}`} onClose={onClose}>
      {error && <Alert type="error">{error}</Alert>}
      <form onSubmit={handleSave}>

        <div className="form-group">
          <label className="form-label">Gebruikersnaam <span className="req">*</span></label>
          <input className="form-input" value={form.username}
            onChange={e => set('username', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Rol</label>
          <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="brouwer">brouwer</option>
            <option value="admin">admin</option>
            <option value="superuser">superuser</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Brouwerij</label>
          <div className="flex-gap mb-1" style={{ gap: 12 }}>
            <label className="checkbox-label" style={{ cursor: 'pointer' }}>
              <input type="radio" name="breweryMode" value="existing"
                checked={breweryMode === 'existing'}
                onChange={() => setBreweryMode('existing')} />
              Bestaande brouwerij
            </label>
            <label className="checkbox-label" style={{ cursor: 'pointer' }}>
              <input type="radio" name="breweryMode" value="new"
                checked={breweryMode === 'new'}
                onChange={() => setBreweryMode('new')} />
              Nieuwe brouwerij
            </label>
          </div>

          {breweryMode === 'existing' ? (
            <select className="form-select" value={form.brewery_name}
              onChange={e => set('brewery_name', e.target.value)}>
              <option value="">— geen brouwerij —</option>
              {breweries.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          ) : (
            <input className="form-input" placeholder="Naam nieuwe brouwerij"
              value={form.brewery_name} onChange={e => set('brewery_name', e.target.value)} />
          )}
        </div>

        <div className="flex-gap mt-2">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Opslaan...' : 'Opslaan'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onClose}>Annuleren</button>
        </div>
      </form>
    </Modal>
  )
}


// ── Brewery modal ──────────────────────────────────────────────
function BreweryModal({ brewery, onSave, onClose }) {
  const [naam, setNaam] = useState(brewery?.naam || '')
  const [beschrijving, setBeschrijving] = useState(brewery?.beschrijving || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e) {
    e.preventDefault(); setError('')
    if (!naam.trim()) { setError('Naam is verplicht.'); return }
    setLoading(true)
    try { await onSave({ naam: naam.trim(), beschrijving }) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title={brewery ? `Brouwerij bewerken — ${brewery.naam}` : 'Nieuwe brouwerij'} onClose={onClose}>
      {error && <Alert type="error">{error}</Alert>}
      <form onSubmit={handleSave}>
        <div className="form-group">
          <label className="form-label">Naam <span className="req">*</span></label>
          <input className="form-input" value={naam} onChange={e => setNaam(e.target.value)} autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Beschrijving</label>
          <input className="form-input" value={beschrijving} onChange={e => setBeschrijving(e.target.value)}
            placeholder="Optioneel" />
        </div>
        <div className="flex-gap mt-2">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Opslaan...' : 'Opslaan'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onClose}>Annuleren</button>
        </div>
      </form>
    </Modal>
  )
}

// ── Main admin page ────────────────────────────────────────────
export default function AdminPage() {
  const { profile } = useAuth()
  const { isSuperuser } = useRole()
  const [users, setUsers]         = useState([])
  const [breweries, setBreweries] = useState([])
  const [breweriesTable, setBreweriesTable] = useState([])
  const [breweryModal, setBreweryModal] = useState(null) // null | {} | {brewery}
  const [stats, setStats]         = useState(null)
  const [loading, setLoading]     = useState(true)
  const [editModal, setEditModal] = useState(null)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')

  async function load() {
    setLoading(true)
    try {
      const [u, b, bt, beers, sessions] = await Promise.all([
        getAllProfiles(), getBreweries(), getBreweriesTable(), getBeers(), getSessions()
      ])
      setUsers(u)
      setBreweries(b)
      setBreweriesTable(bt)
      setStats({ users: u.length, beers: beers.length, sessions: sessions.length })
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleSaveBrewery(form) {
    if (breweryModal?.brewery) {
      await updateBrewery(breweryModal.brewery.id, form)
    } else {
      await createBrewery(form.naam, form.beschrijving)
    }
    setBreweryModal(null)
    load()
  }

  async function handleDeleteBrewery(brewery) {
    const usersInBrewery = users.filter(u => u.brewery_name === brewery.naam)
    if (usersInBrewery.length > 0) {
      if (!confirm(`Brouwerij "${brewery.naam}" verwijderen?\n\nLet op: ${usersInBrewery.length} gebruiker(s) zijn nog gekoppeld aan deze brouwerij.`)) return
    } else {
      if (!confirm(`Brouwerij "${brewery.naam}" verwijderen?`)) return
    }
    await deleteBrewery(brewery.id)
    load()
  }

  async function handleSave(userId, form) {
    await updateProfile(userId, {
      username:     form.username,
      brewery_name: form.brewery_name || null,
      role:         form.role,
    })
    setSuccess(`Gebruiker "${form.username}" bijgewerkt.`)
    setEditModal(null)
    load()
    setTimeout(() => setSuccess(''), 3000)
  }

  async function handleDelete(user) {
    if (!confirm(`Gebruiker "${user.username}" verwijderen?\n\nLet op: alle bieren en beoordelingen van deze gebruiker blijven bestaan maar zijn niet meer gekoppeld aan een account.`)) return
    setError('')
    try {
      await deleteProfile(user.id)
      setSuccess(`Gebruiker "${user.username}" verwijderd.`)
      load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <Spinner />

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

      {error   && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

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

      <SectionTitle>Gebruikers ({users.length})</SectionTitle>

      {/* Desktop tabel */}
      <div className="card desktop-only" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table fluid-table">
          <colgroup>
            <col style={{ width: '22%' }} />
            <col style={{ width: '24%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '22%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Gebruikersnaam</th>
              <th>Brouwerij</th>
              <th>E-mail</th>
              <th>Rol</th>
              <th>Acties</th>
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
                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <span className="cell-truncate">{u.email || '—'}</span>
                </td>
                <td>{roleBadge(u.role)}</td>
                <td>
                  <div className="flex-gap">
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => setEditModal(u)}>
                      ✏️ Bewerken
                    </button>
                    {u.id !== profile.id && (
                      <button className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(u)}>
                        🗑
                      </button>
                    )}
                  </div>
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
                {u.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{u.email}</div>}
              </div>
              {roleBadge(u.role)}
            </div>
            <div className="flex-gap mt-1">
              <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setEditModal(u)}>
                ✏️ Bewerken
              </button>
              {u.id !== profile.id && (
                <button className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(u)}>
                  🗑
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Brouwerijen sectie — alleen superuser */}
      {isSuperuser && (
        <>
          <div className="flex-between mt-3 mb-1">
            <SectionTitle style={{ marginBottom: 0 }}>Brouwerijen ({breweriesTable.length})</SectionTitle>
            <button className="btn btn-primary btn-sm" onClick={() => setBreweryModal({})}>
              + Nieuwe brouwerij
            </button>
          </div>

          {/* Desktop tabel */}
          <div className="card desktop-only" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table fluid-table">
              <colgroup>
                <col style={{ width: '35%' }} />
                <col style={{ width: '40%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '15%' }} />
              </colgroup>
              <thead>
                <tr><th>Naam</th><th>Beschrijving</th><th>Leden</th><th>Acties</th></tr>
              </thead>
              <tbody>
                {breweriesTable.map(b => (
                  <tr key={b.id}>
                    <td><strong>{b.naam}</strong></td>
                    <td className="text-muted">{b.beschrijving || '—'}</td>
                    <td>{users.filter(u => u.brewery_name === b.naam).length}</td>
                    <td>
                      <div className="flex-gap">
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => setBreweryModal({ brewery: b })}>✏️</button>
                        <button className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteBrewery(b)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobiele kaarten */}
          <div className="mobile-only">
            {breweriesTable.map(b => (
              <div key={b.id} className="admin-user-card">
                <div className="admin-user-header">
                  <div>
                    <div className="admin-user-name">{b.naam}</div>
                    {b.beschrijving && <div className="admin-user-brewery">{b.beschrijving}</div>}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {users.filter(u => u.brewery_name === b.naam).length} leden
                    </div>
                  </div>
                </div>
                <div className="flex-gap mt-1">
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setBreweryModal({ brewery: b })}>✏️ Bewerken</button>
                  <button className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteBrewery(b)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="alert alert-info mt-2" style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
        <div><strong>brouwer</strong> — bieren toevoegen en beoordelingen invullen</div>
        <div><strong>admin</strong> — ook proefsessies aanmaken en beheren</div>
        <div><strong>superuser</strong> — volledige toegang, altijd alles bewerken</div>
      </div>

      {breweryModal !== null && (
        <BreweryModal
          brewery={breweryModal.brewery}
          onSave={handleSaveBrewery}
          onClose={() => setBreweryModal(null)}
        />
      )}
      {editModal && (
        <EditUserModal
          user={editModal}
          breweries={breweries}
          onSave={handleSave}
          onClose={() => setEditModal(null)}
        />
      )}
    </div>
  )
}
