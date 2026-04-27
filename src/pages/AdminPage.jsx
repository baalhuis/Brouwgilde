import { useEffect, useState } from 'react'
import { useAuth, useRole } from '../lib/AuthContext'
import { getAllProfiles, updateProfile, deleteProfile, getBreweries, getBreweriesTable, createBrewery, updateBrewery, deleteBrewery, getBeers, getSessions, signUp } from '../lib/supabase'
import { Spinner, Alert, SectionTitle, Modal } from '../components/UI'

// ── Add user modal ─────────────────────────────────────────────
function AddUserModal({ breweries, onSave, onClose }) {
  const [form, setForm] = useState({
    email: '', password: '', username: '', brewery_name: '', role: 'brouwer'
  })
  const [breweryMode, setBreweryMode] = useState('existing')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function handleSave(e) {
    e.preventDefault(); setError('')
    if (!form.email || !form.password || !form.username) {
      setError('E-mail, wachtwoord en gebruikersnaam zijn verplicht.'); return
    }
    if (form.password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens zijn.'); return
    }
    setLoading(true)
    try { await onSave(form) }
    catch (err) { setError(err.message.includes('already registered') ? 'Dit e-mailadres is al geregistreerd.' : err.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title="Nieuwe gebruiker toevoegen" onClose={onClose}>
      {error && <Alert type="error">{error}</Alert>}
      <form onSubmit={handleSave}>
        <div className="form-group">
          <label className="form-label">Gebruikersnaam <span className="req">*</span></label>
          <input className="form-input" value={form.username} onChange={e => set('username', e.target.value)} autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">E-mailadres <span className="req">*</span></label>
          <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Wachtwoord <span className="req">*</span></label>
          <input className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} />
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
              <input type="radio" name="addBMode" value="existing"
                checked={breweryMode === 'existing'} onChange={() => setBreweryMode('existing')} />
              Bestaande
            </label>
            <label className="checkbox-label" style={{ cursor: 'pointer' }}>
              <input type="radio" name="addBMode" value="new"
                checked={breweryMode === 'new'} onChange={() => setBreweryMode('new')} />
              Nieuwe
            </label>
            <label className="checkbox-label" style={{ cursor: 'pointer' }}>
              <input type="radio" name="addBMode" value="none"
                checked={breweryMode === 'none'} onChange={() => { setBreweryMode('none'); set('brewery_name', '') }} />
              Geen
            </label>
          </div>
          {breweryMode === 'existing' && (
            <select className="form-select" value={form.brewery_name} onChange={e => set('brewery_name', e.target.value)}>
              <option value="">— selecteer brouwerij —</option>
              {breweries.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          )}
          {breweryMode === 'new' && (
            <input className="form-input" placeholder="Naam nieuwe brouwerij"
              value={form.brewery_name} onChange={e => set('brewery_name', e.target.value)} />
          )}
        </div>
        <div className="flex-gap mt-2">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Bezig...' : '+ Gebruiker toevoegen'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onClose}>Annuleren</button>
        </div>
      </form>
    </Modal>
  )
}

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
function BreweryModal({ brewery, users, breweries, onSave, onMoveUser, onClose }) {
  const [naam, setNaam] = useState(brewery?.naam || '')
  const [beschrijving, setBeschrijving] = useState(brewery?.beschrijving || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [moveTarget, setMoveTarget] = useState({}) // { userId: targetBrewery }
  const [moveLoading, setMoveLoading] = useState({})

  const members = brewery ? users.filter(u => u.brewery_name === brewery.naam) : []
  const otherBreweries = breweries.filter(b => b !== brewery?.naam)

  async function handleSave(e) {
    e.preventDefault(); setError('')
    if (!naam.trim()) { setError('Naam is verplicht.'); return }
    setLoading(true)
    try { await onSave({ naam: naam.trim(), beschrijving }) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleMove(userId, username) {
    const target = moveTarget[userId]
    if (!target && target !== '') return
    if (!confirm(`${username} verplaatsen naar "${target || 'geen brouwerij'}"?`)) return
    setMoveLoading(p => ({ ...p, [userId]: true }))
    try { await onMoveUser(userId, target || null) }
    finally { setMoveLoading(p => ({ ...p, [userId]: false })) }
  }

  return (
    <Modal title={brewery ? `Brouwerij — ${brewery.naam}` : 'Nieuwe brouwerij'} onClose={onClose} wide>
      {error && <Alert type="error">{error}</Alert>}

      {/* Naam en beschrijving */}
      <form onSubmit={handleSave}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Naam <span className="req">*</span></label>
            <input className="form-input" value={naam} onChange={e => setNaam(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Beschrijving</label>
            <input className="form-input" value={beschrijving} onChange={e => setBeschrijving(e.target.value)}
              placeholder="Optioneel" />
          </div>
        </div>
        <div className="flex-gap">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Opslaan...' : 'Naam/beschrijving opslaan'}
          </button>
        </div>
      </form>

      {/* Leden */}
      {brewery && (
        <>
          <hr className="divider" style={{ margin: '18px 0' }} />
          <SectionTitle>Leden ({members.length})</SectionTitle>

          {members.length === 0 ? (
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Geen gebruikers gekoppeld aan deze brouwerij.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map(u => (
                <div key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                  padding: '10px 12px', background: 'var(--surface)',
                  border: '1px solid var(--border-light)', borderRadius: 'var(--radius)'
                }}>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <strong>{u.username}</strong>
                    <span className="badge badge-muted" style={{ marginLeft: 8, fontSize: '0.7rem' }}>{u.role}</span>
                    {u.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>}
                  </div>
                  <select className="form-select" style={{ maxWidth: 200 }}
                    value={moveTarget[u.id] ?? u.brewery_name ?? ''}
                    onChange={e => setMoveTarget(p => ({ ...p, [u.id]: e.target.value }))}>
                    <option value="">— geen brouwerij —</option>
                    {breweries.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <button className="btn btn-secondary btn-sm"
                    disabled={moveLoading[u.id] || (moveTarget[u.id] === undefined)}
                    onClick={() => handleMove(u.id, u.username)}>
                    {moveLoading[u.id] ? '...' : 'Verplaatsen'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <button className="btn btn-ghost mt-2" type="button" onClick={onClose}>Sluiten</button>
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
  const [addUserModal, setAddUserModal] = useState(false)
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

  async function handleAddUser(form) {
    await signUp(form.email, form.password, form.username, form.brewery_name || null)
    // Update role if not default brouwer
    if (form.role !== 'brouwer') {
      // Find the new profile and update role
      await new Promise(r => setTimeout(r, 800)) // wait for trigger
      const profiles = await getAllProfiles()
      const newUser = profiles.find(p => p.email === form.email)
      if (newUser) await updateProfile(newUser.id, { role: form.role })
    }
    setAddUserModal(false)
    setSuccess(`Gebruiker "${form.username}" aangemaakt.`)
    load()
    setTimeout(() => setSuccess(''), 3000)
  }

  async function handleMoveUser(userId, newBrewery) {
    await updateProfile(userId, { brewery_name: newBrewery })
    setSuccess('Gebruiker verplaatst.')
    load()
    setTimeout(() => setSuccess(''), 3000)
  }

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

      <div className="flex-between mb-1">
        <SectionTitle style={{ marginBottom: 0 }}>Gebruikers ({users.length})</SectionTitle>
        {isSuperuser && (
          <button className="btn btn-primary btn-sm" onClick={() => setAddUserModal(true)}>
            + Gebruiker toevoegen
          </button>
        )}
      </div>

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

      {addUserModal && (
        <AddUserModal
          breweries={breweries}
          onSave={handleAddUser}
          onClose={() => setAddUserModal(false)}
        />
      )}
      {breweryModal !== null && (
        <BreweryModal
          brewery={breweryModal.brewery}
          users={users}
          breweries={breweries}
          onSave={handleSaveBrewery}
          onMoveUser={handleMoveUser}
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
