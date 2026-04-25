import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useRole } from '../lib/AuthContext'
import {
  getSessions, createSession, updateSession, deleteSession,
  addBeerToSession, removeBeerFromSession, updateBeerIdentifier,
  joinSession, leaveSession, setAssignment, getAssignments,
  getAllProfiles, getBeers, getForms,
} from '../lib/supabase'
import { Modal, Alert, EmptyState, Spinner, SectionTitle, CATEGORIES } from '../components/UI'
import TastingFormModal from '../components/TastingFormModal'
import LeaderboardModal from '../components/LeaderboardModal'
import { calcScore } from '../components/UI'

// ── Session form modal ─────────────────────────────────────────
function SessionModal({ session, onSave, onClose }) {
  const { profile } = useAuth()
  const [form, setForm] = useState(session ? {
    naam: session.naam, type: session.type, datum: session.datum,
    beschrijving: session.beschrijving || '',
    closed: session.closed, leaderboard_visible: session.leaderboard_visible,
    edit_locked: session.edit_locked,
  } : {
    naam: '', type: 'beerswap', datum: '', beschrijving: '',
    closed: false, leaderboard_visible: true, edit_locked: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function handleSave(e) {
    e.preventDefault(); setError('')
    if (!form.naam || !form.datum) { setError('Naam en datum zijn verplicht.'); return }
    setLoading(true)
    try { await onSave(form) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title={session ? 'Sessie bewerken' : 'Nieuwe proefsessie'} onClose={onClose}>
      {error && <Alert type="error">{error}</Alert>}
      <form onSubmit={handleSave}>
        <div className="form-group">
          <label className="form-label">Naam sessie <span className="req">*</span></label>
          <input className="form-input" value={form.naam} onChange={e => set('naam', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)} disabled={!!session}>
              <option value="beerswap">🔄 Beerswap</option>
              <option value="kampioenschap">🏆 Kampioenschap</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Datum <span className="req">*</span></label>
            <input className="form-input" type="date" value={form.datum} onChange={e => set('datum', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Beschrijving</label>
          <textarea className="form-textarea" value={form.beschrijving} onChange={e => set('beschrijving', e.target.value)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {[
            ['leaderboard_visible', 'Leaderboard zichtbaar voor deelnemers'],
            ['edit_locked', 'Formulieren vergrendeld (niet bewerkbaar door gebruikers)'],
            ['closed', 'Sessie gesloten (geen nieuwe beoordelingen)'],
          ].map(([key, label]) => (
            <label key={key} className="checkbox-label">
              <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} />
              {label}
            </label>
          ))}
        </div>
        <div className="flex-gap">
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Opslaan...' : 'Opslaan'}</button>
          <button className="btn btn-ghost" type="button" onClick={onClose}>Annuleren</button>
        </div>
      </form>
    </Modal>
  )
}

// ── Manage beers in a session ──────────────────────────────────
function ManageBeersModal({ session, allBeers, onClose, onUpdate }) {
  const [localSession, setLocalSession] = useState(session)
  const [profiles, setProfiles] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)

  const isChamp = session.type === 'kampioenschap'
  const sessBeers = (localSession.session_beers || []).map(sb => ({ ...sb, beer: allBeers.find(b => b.id === sb.beer_id) })).filter(sb => sb.beer)
  const addableBeers = allBeers.filter(b => !localSession.session_beers?.find(sb => sb.beer_id === b.id))

  useEffect(() => {
    if (isChamp) {
      getAllProfiles().then(setProfiles)
      getAssignments(session.id).then(setAssignments)
    }
  }, [])

  async function handleAddBeer(beerId) {
    const identifier = isChamp ? 'ID-' + Math.random().toString(36).slice(2, 6).toUpperCase() : null
    await addBeerToSession(session.id, beerId, identifier)
    await refresh()
  }

  async function handleRemoveBeer(beerId) {
    await removeBeerFromSession(session.id, beerId)
    await refresh()
  }

  async function handleUpdateId(beerId, val) {
    await updateBeerIdentifier(session.id, beerId, val)
    await refresh()
  }

  async function handleAssignment(userId, beerId, checked) {
    await setAssignment(session.id, userId, beerId, checked)
    const updated = await getAssignments(session.id)
    setAssignments(updated)
  }

  async function refresh() {
    const sessions = await getSessions()
    const updated = sessions.find(s => s.id === session.id)
    setLocalSession(updated)
    onUpdate(updated)
  }

  const userAssignedBeers = (userId) => assignments.filter(a => a.user_id === userId).map(a => a.beer_id)

  return (
    <Modal title={`Bieren beheren — ${session.naam}`} onClose={onClose} wide>
      <SectionTitle>Bieren in deze sessie ({sessBeers.length})</SectionTitle>
      {sessBeers.length === 0
        ? <p className="text-muted mb-2">Nog geen bieren toegevoegd.</p>
        : (
          <table className="table mb-2">
            <thead>
              <tr>
                <th>Naam</th><th>Brouwerij</th><th>Type</th>
                {isChamp && <th>Identifier</th>}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sessBeers.map(sb => (
                <tr key={sb.beer_id}>
                  <td><strong>{sb.beer.naam}</strong></td>
                  <td>{sb.beer.brouwerij}</td>
                  <td>{sb.beer.biertype}</td>
                  {isChamp && (
                    <td>
                      <input className="form-input" style={{ padding: '3px 6px', fontSize: '0.8rem', width: 100, fontFamily: 'monospace' }}
                        defaultValue={sb.identifier || ''} onBlur={e => handleUpdateId(sb.beer_id, e.target.value)} />
                    </td>
                  )}
                  <td><button className="btn btn-danger btn-sm" onClick={() => handleRemoveBeer(sb.beer_id)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      <SectionTitle>Bier toevoegen</SectionTitle>
      {addableBeers.length === 0
        ? <p className="text-muted mb-2">Alle bieren zijn al toegevoegd.</p>
        : (
          <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 7 }}>
            {addableBeers.map(b => (
              <div key={b.id} className="flex-between" style={{ padding: '7px 12px', borderBottom: '1px solid #e8dfc8' }}>
                <span style={{ fontSize: '0.85rem' }}>{b.naam} <span className="text-muted">– {b.brouwerij} · {b.biertype}</span></span>
                <button className="btn btn-secondary btn-sm" onClick={() => handleAddBeer(b.id)}>+ Toevoegen</button>
              </div>
            ))}
          </div>
        )}

      {isChamp && sessBeers.length > 0 && (
        <>
          <SectionTitle style={{ marginTop: 20 }}>Toewijzingen per proever</SectionTitle>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {profiles.filter(p => p.role !== 'superuser').map(p => {
              const assigned = userAssignedBeers(p.id)
              return (
                <div key={p.id} style={{ marginBottom: 14, padding: '10px 12px', background: 'var(--parchment)', borderRadius: 8 }}>
                  <strong style={{ fontSize: '0.88rem' }}>{p.username}</strong>
                  <div className="flex-gap mt-1">
                    {sessBeers.map(sb => (
                      <label key={sb.beer_id} style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={assigned.includes(sb.beer_id)}
                          onChange={e => handleAssignment(p.id, sb.beer_id, e.target.checked)} />
                        <span className="champagne-id">{sb.identifier || sb.beer.naam}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <button className="btn btn-ghost mt-2" onClick={onClose}>Sluiten</button>
    </Modal>
  )
}

// ── Main sessions page ─────────────────────────────────────────
export default function SessionsPage() {
  const { profile } = useAuth()
  const { isAdmin, isSuperuser } = useRole()
  const [sessions, setSessions] = useState([])
  const [allBeers, setAllBeers] = useState([])
  // forms: { [sessionId]: Form[] } — bijgehouden los van sessies
  const [formsMap, setFormsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [sessionModal, setSessionModal] = useState(null)
  const [beersModal, setBeersModal] = useState(null)
  const [tastingModal, setTastingModal] = useState(null)
  const [leaderModal, setLeaderModal] = useState(null)
  const [showClosed, setShowClosed] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [s, b] = await Promise.all([getSessions(), getBeers()])
      setSessions(s)
      setAllBeers(b)
      // Laad formulieren voor alle sessies tegelijk
      await loadAllForms(s)
    } finally { setLoading(false) }
  }

  async function loadAllForms(sessionsToLoad) {
    const entries = await Promise.all(
      (sessionsToLoad || sessions).map(async sess => {
        const forms = await getForms(sess.id)
        return [sess.id, forms]
      })
    )
    setFormsMap(Object.fromEntries(entries))
  }

  // Herlaad alleen de formulieren van één sessie — snel na opslaan
  async function refreshFormsForSession(sessionId) {
    const forms = await getForms(sessionId)
    setFormsMap(prev => ({ ...prev, [sessionId]: forms }))
  }

  useEffect(() => { load() }, [])

  async function handleSaveSession(form) {
    if (sessionModal.session) {
      await updateSession(sessionModal.session.id, form)
    } else {
      await createSession({ ...form, admin_id: profile.id })
    }
    setSessionModal(null)
    load()
  }

  async function handleJoin(sessionId) {
    await joinSession(sessionId, profile.id)
    load()
  }

  async function handleLeave(sessionId) {
    await leaveSession(sessionId, profile.id)
    load()
  }

  async function handleDeleteSession(sess) {
    if (!confirm(`Sessie "${sess.naam}" verwijderen? Dit verwijdert ook alle bierformulieren van deze sessie.`)) return
    await deleteSession(sess.id)
    load()
  }

  function isParticipant(sess) {
    return sess.session_participants?.some(p => p.user_id === profile.id)
  }

  function isSessionAdmin(sess) {
    // Check role directly from profile to avoid stale closure
    const role = profile?.role ?? 'brouwer'
    const userIsAdmin = role === 'admin' || role === 'superuser'
    return userIsAdmin || sess.admin_id === profile?.id
  }

  function getBeerList(sess) {
    const beers = (sess.session_beers || []).map(sb => allBeers.find(b => b.id === sb.beer_id)).filter(Boolean)
    if (sess.type === 'kampioenschap') {
      // Only show assigned beers for the current user (unless admin)
      if (!isSessionAdmin(sess)) {
        const assignments = sess.session_assignments || []
        const myAssignments = assignments.filter(a => a.user_id === profile.id).map(a => a.beer_id)
        return beers.filter(b => myAssignments.includes(b.id))
      }
    }
    return beers
  }

  function getMyForm(sess, beerId) {
    const forms = formsMap[sess.id] || []
    return forms.find(f => f.beer_id === beerId && f.user_id === profile.id)
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h2>🎯 Proefsessies</h2>
          <p>Beerswaps en kampioenschappen</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setSessionModal({ session: null })}>
            + Sessie aanmaken
          </button>
        )}
      </div>

      {/* Toggle gesloten sessies */}
      <div style={{ marginBottom: 16 }}>
        <label className="checkbox-label" style={{ cursor: 'pointer', display: 'inline-flex' }}>
          <input type="checkbox" checked={showClosed} onChange={e => setShowClosed(e.target.checked)} />
          Gesloten sessies weergeven
          {sessions.filter(s => s.closed).length > 0 && (
            <span className="badge badge-muted" style={{ marginLeft: 8 }}>
              {sessions.filter(s => s.closed).length} gesloten
            </span>
          )}
        </label>
      </div>

      {sessions.filter(s => showClosed || !s.closed).length === 0
        ? <EmptyState icon="🎪" message="Nog geen proefsessies aangemaakt." />
        : sessions.filter(s => showClosed || !s.closed).map(sess => {
          const joined = isParticipant(sess)
          const sessAdmin = isSessionAdmin(sess)
          const beerList = getBeerList(sess)
          const readOnly = sess.closed || sess.edit_locked

          return (
            <div key={sess.id} className="card mb-2">
              {/* Header */}
              <div className="session-header">
                <div className="session-header-top">
                  <div className="session-title-row">
                    <h3 className="card-title" style={{ display: 'inline', marginRight: 4 }}>{sess.naam}</h3>
                    {sess.closed
                      ? <span className="tag-closed">Gesloten</span>
                      : <span className="tag-open">Open</span>}
                  </div>
                  <span className="badge badge-copper">
                    {sess.type === 'kampioenschap' ? '🏆 Kampioenschap' : '🔄 Beerswap'}
                  </span>
                </div>
                <div className="session-actions">
                  {sessAdmin && (
                    <button className="session-btn" onClick={() => setBeersModal({ session: sess })}>
                      <span className="session-btn-icon">🍺</span>
                      <span className="session-btn-label">Bieren</span>
                    </button>
                  )}
                  {sessAdmin && (
                    <button className="session-btn" onClick={() => setSessionModal({ session: sess })}>
                      <span className="session-btn-icon">⚙️</span>
                      <span className="session-btn-label">Instellingen</span>
                    </button>
                  )}
                  <button className="session-btn session-btn--primary" onClick={() => setLeaderModal({ session: sess })}>
                    <span className="session-btn-icon">📊</span>
                    <span className="session-btn-label">Leaderboard</span>
                  </button>
                  {isSuperuser && (
                    <button className="session-btn session-btn--danger" onClick={() => handleDeleteSession(sess)}>
                      <span className="session-btn-icon">🗑</span>
                      <span className="session-btn-label">Verwijderen</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Meta */}
              <div className="text-muted mb-1">
                {sess.datum} · {sess.session_beers?.length || 0} bier(en) · {sess.session_participants?.length || 0} proever(s)
                {sess.admin && <> · Admin: {sess.admin.username}</>}
              </div>
              {sess.beschrijving && <p style={{ fontSize: '0.85rem', marginBottom: 8, color: '#5a4628' }}>{sess.beschrijving}</p>}

              {/* Join / leave */}
              {!sess.closed && (
                <div className="flex-gap mb-2">
                  {!joined
                    ? <button className="btn btn-success btn-sm" onClick={() => handleJoin(sess.id)}>✓ Aanmelden als proever</button>
                    : <button className="btn btn-ghost btn-sm" onClick={() => handleLeave(sess.id)}>✗ Afmelden</button>}
                </div>
              )}

              {/* Beer cards to rate — alleen tonen als aangemeld of admin */}
              {(joined || sessAdmin) && beerList.length > 0 && (
                <>
                  <hr className="divider" />
                  <SectionTitle>{sess.type === 'kampioenschap' ? 'Jouw toegewezen bieren' : 'Bieren om te beoordelen'}</SectionTitle>
                  <div className="tasting-grid">
                    {beerList.map(beer => {
                      const myForm = getMyForm(sess, beer.id)
                      const sbEntry = sess.session_beers?.find(sb => sb.beer_id === beer.id)
                      const isChamp = sess.type === 'kampioenschap'
                      const scored = !!myForm
                      // Niet-aangemelde gebruikers mogen nooit een nieuw formulier invullen
                      const cardReadOnly = readOnly || (!joined && !sessAdmin)
                      // Onthul echte naam als kampioenschap gesloten én vergrendeld is
                      const revealed = isChamp && sess.closed && sess.edit_locked
                      return (
                        <div key={beer.id}
                          className={`tasting-card ${scored ? 'tasting-card--scored' : ''}`}
                          onClick={() => setTastingModal({ session: sess, beer, existingForm: myForm, readOnly: cardReadOnly })}>
                          <div className="tasting-card-main">
                            <div className="tasting-card-name">
                              {isChamp && !revealed
                                ? <span className="champagne-id">{sbEntry?.identifier || '???'}</span>
                                : beer.naam}
                            </div>
                            <div className="tasting-card-meta">
                              {revealed
                                ? <><span className="champagne-id" style={{ fontSize: '0.7rem', marginRight: 6 }}>{sbEntry?.identifier}</span>{beer.brouwerij} · {beer.biertype}</>
                                : isChamp ? beer.biertype : `${beer.brouwerij} · ${beer.biertype}`}
                            </div>
                          </div>
                          <div className="tasting-card-status">
                            {scored ? (
                              <>
                                <span className="tasting-score">{Number(myForm.score).toFixed(2)}</span>
                                <span className="badge badge-hop" style={{ fontSize: '0.65rem' }}>✓ Klaar</span>
                              </>
                            ) : (
                              <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>
                                {cardReadOnly ? '🔒' : '→ Beoordeel'}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Niet aangemeld maar wel read-only toegang */}
              {!joined && !sessAdmin && beerList.length > 0 && (
                <div className="alert alert-info" style={{ marginTop: 8 }}>
                  Meld je aan als proever om bieren te beoordelen.
                </div>
              )}

              {(joined || sessAdmin) && beerList.length === 0 && (
                <div className="alert alert-info" style={{ marginTop: 8 }}>
                  {sess.type === 'kampioenschap'
                    ? 'Wacht op toewijzingen van de admin.'
                    : 'Er zijn nog geen bieren toegevoegd aan deze sessie.'}
                </div>
              )}
            </div>
          )
        })}

      {sessionModal && (
        <SessionModal session={sessionModal.session} onSave={handleSaveSession} onClose={() => setSessionModal(null)} />
      )}
      {beersModal && (
        <ManageBeersModal
          session={beersModal.session}
          allBeers={allBeers}
          onClose={() => setBeersModal(null)}
          onUpdate={updated => setSessions(prev => prev.map(s => s.id === updated.id ? { ...updated, _forms: s._forms } : s))}
        />
      )}
      {tastingModal && (
        <TastingFormModal
          beer={tastingModal.beer}
          session={tastingModal.session}
          existingForm={tastingModal.existingForm}
          readOnly={tastingModal.readOnly}
          onDone={() => refreshFormsForSession(tastingModal.session.id)}
          onClose={() => setTastingModal(null)}
        />
      )}
      {leaderModal && (
        <LeaderboardModal
          session={leaderModal.session}
          onClose={() => setLeaderModal(null)}
        />
      )}
    </div>
  )
}
