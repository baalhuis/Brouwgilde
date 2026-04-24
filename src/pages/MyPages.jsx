import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getMyForms, getSessions, getBeers, upsertForm, getFormsForMyBeers } from '../lib/supabase'
import { Spinner, EmptyState, ScoreDisplay, SectionTitle } from '../components/UI'
import TastingFormModal from '../components/TastingFormModal'

// ── My Forms Page ──────────────────────────────────────────────
export function MyFormsPage() {
  const { profile } = useAuth()
  const [forms, setForms] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [tastingModal, setTastingModal] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const [f, s] = await Promise.all([getMyForms(profile.id), getSessions()])
      setForms(f)
      setSessions(s)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) return <Spinner />

  function getSession(id) { return sessions.find(s => s.id === id) }

  return (
    <div>
      <div className="page-header">
        <h2>📋 Mijn beoordelingen</h2>
        <p>{forms.length} beoordeling{forms.length !== 1 ? 'en' : ''} ingevuld</p>
      </div>

      {forms.length === 0
        ? <EmptyState icon="📝" message="Je hebt nog geen bieren beoordeeld." />
        : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Bier</th><th>Sessie</th><th>Type</th>
                  <th>Kleur</th><th>Koolzuur</th><th>Geur</th><th>Smaak</th><th>Nasmaak</th>
                  <th>Score</th><th>Datum</th><th></th>
                </tr>
              </thead>
              <tbody>
                {forms.map(f => {
                  const sess = getSession(f.session_id)
                  const readOnly = sess?.closed || (sess?.edit_locked && profile?.role !== 'superuser')
                  return (
                    <tr key={f.id}>
                      <td><strong>{f.beer?.naam || '—'}</strong></td>
                      <td>{f.session?.naam || '—'}</td>
                      <td>{f.session && <span className="badge badge-amber">{f.session.type}</span>}</td>
                      <td>{f.kleur}</td><td>{f.koolzuur}</td><td>{f.geur}</td>
                      <td>{f.smaak}</td><td>{f.nasmaak}</td>
                      <td><ScoreDisplay score={f.score} /></td>
                      <td><span className="text-muted">{new Date(f.created_at).toLocaleDateString('nl-NL')}</span></td>
                      <td>
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => setTastingModal({ session: sess, beer: f.beer, existingForm: f, readOnly })}>
                          {readOnly ? '👁 Bekijken' : '✏️ Bewerken'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

      {tastingModal && tastingModal.beer && (
        <TastingFormModal
          beer={tastingModal.beer}
          session={tastingModal.session}
          existingForm={tastingModal.existingForm}
          readOnly={tastingModal.readOnly}
          onDone={load}
          onClose={() => setTastingModal(null)}
        />
      )}
    </div>
  )
}

// ── My Brewery Page ─────────────────────────────────────────────
export function MyBreweryPage() {
  const { profile } = useAuth()
  const [forms, setForms] = useState([])
  const [myBeers, setMyBeers] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [f, b] = await Promise.all([
          getFormsForMyBeers(profile.id),
          getBeers(),
        ])
        setForms(f)
        setMyBeers(b.filter(b => b.owner_id === profile.id))
      } finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <h2>🏭 Mijn Brouwerij</h2>
        <p>{profile.brewery_name} — beoordelingen op jouw bieren</p>
      </div>

      {myBeers.length === 0
        ? <EmptyState icon="🍺" message="Je hebt nog geen bieren toegevoegd." />
        : myBeers.map(beer => {
          const beerForms = forms.filter(f => f.beer_id === beer.id)
          const avg = beerForms.length
            ? (beerForms.reduce((s, f) => s + parseFloat(f.score || 0), 0) / beerForms.length).toFixed(2)
            : null
          const isExp = expanded === beer.id

          return (
            <div key={beer.id} className="card mb-2">
              <div className="flex-between">
                <div>
                  <h3 className="card-title">{beer.naam}</h3>
                  <div className="card-meta">{beer.biertype} · cat. {beer.categorie} · {beer.abv}% ABV · EBC {beer.ebc} · IBU {beer.ibu}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  {avg != null ? (
                    <>
                      <span className="score-big">{avg}</span>
                      <br />
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {beerForms.length} beoordeling{beerForms.length !== 1 ? 'en' : ''}
                      </span>
                    </>
                  ) : <span className="text-muted">Geen scores</span>}
                </div>
              </div>

              {beerForms.length > 0 && (
                <button className="btn btn-ghost btn-sm mt-1"
                  onClick={() => setExpanded(isExp ? null : beer.id)}>
                  {isExp ? '▲ Verberg' : '▼ Bekijk alle beoordelingen'}
                </button>
              )}

              {isExp && (
                <div style={{ marginTop: 12, overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Proever</th><th>Sessie</th>
                        <th>Kleur</th><th>Koolzuur</th><th>Geur</th><th>Smaak</th><th>Nasmaak</th>
                        <th>Score</th><th>Opmerking</th>
                      </tr>
                    </thead>
                    <tbody>
                      {beerForms.map(f => (
                        <tr key={f.id}>
                          <td>{f.user?.username || '—'}</td>
                          <td>{f.session?.naam || '—'}</td>
                          <td>{f.kleur}</td><td>{f.koolzuur}</td><td>{f.geur}</td>
                          <td>{f.smaak}</td><td>{f.nasmaak}</td>
                          <td><ScoreDisplay score={f.score} /></td>
                          <td style={{ maxWidth: 200, fontSize: '0.8rem', color: '#5a4628' }}>
                            {f.opmerkingen || <span className="text-muted">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
    </div>
  )
}
