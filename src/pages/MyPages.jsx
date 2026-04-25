import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getMyForms, getSessions, getBeers, getFormsForMyBeers } from '../lib/supabase'
import { Spinner, EmptyState, ScoreDisplay, SectionTitle } from '../components/UI'
import TastingFormModal from '../components/TastingFormModal'

// ── Score mini pills ───────────────────────────────────────────
function ScorePill({ label, value }) {
  return (
    <div className="score-pill">
      <span className="score-pill-label">{label}</span>
      <span className="score-pill-value">{value}</span>
    </div>
  )
}

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

  // Geeft de weergavenaam van een bier terug — identifier als kampioenschap nog niet onthuld
  function getBeerDisplayName(f) {
    const sess = getSession(f.session_id)
    const isChamp = sess?.type === 'kampioenschap'
    const revealed = isChamp && sess?.closed && sess?.edit_locked
    if (isChamp && !revealed) {
      const sb = sess?.session_beers?.find(sb => sb.beer_id === f.beer_id)
      return sb?.identifier || '???'
    }
    return f.beer?.naam || '—'
  }

  function isChampUnrevealed(f) {
    const sess = getSession(f.session_id)
    const isChamp = sess?.type === 'kampioenschap'
    const revealed = isChamp && sess?.closed && sess?.edit_locked
    return isChamp && !revealed
  }

  function openForm(f) {
    const sess = getSession(f.session_id)
    const readOnly = sess?.closed || (sess?.edit_locked && profile?.role !== 'superuser')
    setTastingModal({ session: sess, beer: f.beer, existingForm: f, readOnly })
  }

  return (
    <div>
      <div className="page-header">
        <h2>📋 Mijn beoordelingen</h2>
        <p>{forms.length} beoordeling{forms.length !== 1 ? 'en' : ''} ingevuld</p>
      </div>

      {forms.length === 0 ? (
        <EmptyState icon="📝" message="Je hebt nog geen bieren beoordeeld." />
      ) : (
        <>
          {/* ── Desktop tabel ── */}
          <div className="card desktop-only" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table fluid-table">
              <colgroup>
                <col style={{ width: '22%' }} />  {/* Bier */}
                <col className="hide-tablet" style={{ width: '18%' }} />  {/* Sessie */}
                <col className="hide-tablet" style={{ width: '10%' }} />  {/* Type */}
                <col className="hide-tablet" style={{ width: '6%' }} />   {/* Kleur */}
                <col className="hide-tablet" style={{ width: '8%' }} />   {/* Koolzuur */}
                <col className="hide-tablet" style={{ width: '6%' }} />   {/* Geur */}
                <col className="hide-tablet" style={{ width: '7%' }} />   {/* Smaak */}
                <col className="hide-tablet" style={{ width: '9%' }} />   {/* Nasmaak */}
                <col style={{ width: '9%' }} />   {/* Score */}
                <col className="hide-tablet" style={{ width: '10%' }} />  {/* Datum */}
                <col style={{ width: '7%' }} />   {/* Actie */}
              </colgroup>
              <thead>
                <tr>
                  <th>Bier</th>
                  <th className="hide-tablet">Sessie</th>
                  <th className="hide-tablet">Type</th>
                  <th className="hide-tablet">Kleur</th>
                  <th className="hide-tablet">Koolzuur</th>
                  <th className="hide-tablet">Geur</th>
                  <th className="hide-tablet">Smaak</th>
                  <th className="hide-tablet">Nasmaak</th>
                  <th>Score</th>
                  <th className="hide-tablet">Datum</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {forms.map(f => {
                  const sess = getSession(f.session_id)
                  const readOnly = sess?.closed || (sess?.edit_locked && profile?.role !== 'superuser')
                  return (
                    <tr key={f.id}>
                      <td>
                        {isChampUnrevealed(f)
                          ? <span className="champagne-id cell-truncate">{getBeerDisplayName(f)}</span>
                          : <strong className="cell-truncate">{getBeerDisplayName(f)}</strong>}
                        <div className="text-muted hide-tablet-inverse" style={{ fontSize: '0.75rem', marginTop: 2 }}>
                          {f.session?.naam || '—'} · {new Date(f.created_at).toLocaleDateString('nl-NL')}
                        </div>
                      </td>
                      <td className="hide-tablet"><span className="cell-truncate">{f.session?.naam || '—'}</span></td>
                      <td className="hide-tablet">{f.session && <span className="badge badge-amber">{f.session.type}</span>}</td>
                      <td className="hide-tablet">{f.kleur}</td>
                      <td className="hide-tablet">{f.koolzuur}</td>
                      <td className="hide-tablet">{f.geur}</td>
                      <td className="hide-tablet">{f.smaak}</td>
                      <td className="hide-tablet">{f.nasmaak}</td>
                      <td><ScoreDisplay score={f.score} /></td>
                      <td className="hide-tablet"><span className="text-muted">{new Date(f.created_at).toLocaleDateString('nl-NL')}</span></td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => openForm(f)}>
                          {readOnly ? '👁' : '✏️'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobiele kaarten ── */}
          <div className="mobile-only">
            {forms.map(f => {
              const sess = getSession(f.session_id)
              const readOnly = sess?.closed || (sess?.edit_locked && profile?.role !== 'superuser')
              return (
                <div key={f.id} className="form-card" onClick={() => openForm(f)}>
                  <div className="form-card-header">
                    <div>
                      <div className="form-card-name">
                        {isChampUnrevealed(f)
                          ? <span className="champagne-id">{getBeerDisplayName(f)}</span>
                          : getBeerDisplayName(f)}
                      </div>
                      <div className="form-card-session">
                        {f.session?.naam || '—'}
                        {f.session && <span className="badge badge-amber" style={{ marginLeft: 6 }}>{f.session.type}</span>}
                      </div>
                    </div>
                    <div className="form-card-score">
                      <ScoreDisplay score={f.score} />
                    </div>
                  </div>

                  <div className="score-pills">
                    <ScorePill label="Kleur"    value={f.kleur} />
                    <ScorePill label="Koolzuur" value={f.koolzuur} />
                    <ScorePill label="Geur"     value={f.geur} />
                    <ScorePill label="Smaak"    value={f.smaak} />
                    <ScorePill label="Nasmaak"  value={f.nasmaak} />
                  </div>

                  <div className="form-card-footer">
                    <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                      {new Date(f.created_at).toLocaleDateString('nl-NL')}
                    </span>
                    <span className="form-card-action">
                      {readOnly ? '👁 Bekijken' : '✏️ Bewerken'} →
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
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
          getFormsForMyBeers(profile.brewery_name),
          getBeers(),
        ])
        setForms(f)
        // Toon alle bieren van de brouwerij op naam, niet alleen eigen bieren
        setMyBeers(b.filter(b => b.brouwerij === profile.brewery_name))
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

      {myBeers.length === 0 ? (
        <EmptyState icon="🍺" message="Je hebt nog geen bieren toegevoegd." />
      ) : myBeers.map(beer => {
        const beerForms = forms.filter(f => f.beer_id === beer.id)
        const avg = beerForms.length
          ? (beerForms.reduce((s, f) => s + parseFloat(f.score || 0), 0) / beerForms.length).toFixed(2)
          : null
        const isExp = expanded === beer.id

        return (
          <div key={beer.id} className="card mb-2">
            {/* Beer header */}
            <div className="flex-between" style={{ gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 className="card-title truncate">{beer.naam}</h3>
                <div className="card-meta">
                  {beer.biertype} · cat. {beer.categorie}
                  <span className="hide-mobile"> · {beer.abv}% ABV · EBC {beer.ebc} · IBU {beer.ibu}</span>
                </div>
                {/* Mobiele stats */}
                <div className="mobile-only" style={{ marginTop: 6 }}>
                  <div className="score-pills">
                    <ScorePill label="ABV" value={`${beer.abv}%`} />
                    <ScorePill label="EBC" value={beer.ebc} />
                    <ScorePill label="IBU" value={beer.ibu} />
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                {avg != null ? (
                  <>
                    <span className="score-big">{avg}</span>
                    <div className="text-muted" style={{ fontSize: '0.74rem', marginTop: 2 }}>
                      {beerForms.length}×
                    </div>
                  </>
                ) : (
                  <span className="text-muted" style={{ fontSize: '0.82rem' }}>Geen scores</span>
                )}
              </div>
            </div>

            {beerForms.length > 0 && (
              <button className="btn btn-ghost btn-sm mt-1"
                onClick={() => setExpanded(isExp ? null : beer.id)}>
                {isExp ? '▲ Verberg beoordelingen' : `▼ Bekijk ${beerForms.length} beoordeling${beerForms.length !== 1 ? 'en' : ''}`}
              </button>
            )}

            {isExp && (
              <>
                {/* Desktop tabel */}
                <div className="desktop-only" style={{ marginTop: 12 }}>
                  <table className="table fluid-table">
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
                          <td style={{ fontSize: '0.82rem' }}>{f.opmerkingen || <span className="text-muted">—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobiele kaarten */}
                <div className="mobile-only" style={{ marginTop: 12 }}>
                  {beerForms.map(f => (
                    <div key={f.id} className="brewery-review-card">
                      <div className="flex-between mb-1">
                        <div>
                          <strong style={{ fontSize: '0.9rem' }}>{f.user?.username || '—'}</strong>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{f.session?.naam || '—'}</div>
                        </div>
                        <ScoreDisplay score={f.score} />
                      </div>
                      <div className="score-pills">
                        <ScorePill label="Kleur"    value={f.kleur} />
                        <ScorePill label="Koolzuur" value={f.koolzuur} />
                        <ScorePill label="Geur"     value={f.geur} />
                        <ScorePill label="Smaak"    value={f.smaak} />
                        <ScorePill label="Nasmaak"  value={f.nasmaak} />
                      </div>
                      {f.opmerkingen && (
                        <div className="brewery-review-note">
                          💬 {f.opmerkingen}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
