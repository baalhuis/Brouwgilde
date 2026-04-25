import { useEffect, useState } from 'react'
import { Modal, EmptyState, Spinner, ScoreDisplay, CATEGORIES } from './UI'
import { getForms } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function ScoresModal({ session, onClose }) {
  const { profile } = useAuth()
  const [forms, setForms] = useState(null)
  const [filterBeer, setFilterBeer] = useState('')
  const [filterCat, setFilterCat] = useState('')

  const isAdmin = ['admin', 'superuser'].includes(profile?.role)
  const isChamp = session.type === 'kampioenschap'
  const revealed = isChamp && session.closed && session.edit_locked

  useEffect(() => {
    getForms(session.id).then(data => {
      console.log('ScoresModal forms loaded:', data?.length, data)
      setForms(data)
    }).catch(err => {
      console.error('ScoresModal getForms error:', err)
      setForms([])
    })
  }, [session.id])

  if (!forms) return (
    <Modal title={`📋 Scores — ${session.naam}`} onClose={onClose} wide>
      <Spinner />
    </Modal>
  )

  // Bieren in deze sessie
  const sessionBeers = session.session_beers || []
  console.log('ScoresModal session_beers:', sessionBeers.length, sessionBeers)

  // Filter
  const filteredBeers = sessionBeers.filter(sb => {
    const beer = sb.beer
    if (!beer) return false
    if (filterBeer && !beer.naam.toLowerCase().includes(filterBeer.toLowerCase()) &&
        !(sb.identifier || '').toLowerCase().includes(filterBeer.toLowerCase())) return false
    if (filterCat && beer.categorie !== filterCat) return false
    return true
  })

  function getFormsForBeer(beerId) {
    return forms.filter(f => f.beer_id === beerId)
  }

  function getAvg(beerForms, field) {
    if (!beerForms.length) return null
    return (beerForms.reduce((s, f) => s + (f[field] || 0), 0) / beerForms.length).toFixed(1)
  }

  function getBeerName(sb) {
    if (isChamp && !revealed) return sb.identifier || '???'
    return sb.beer?.naam || '—'
  }

  function getBeerMeta(sb) {
    if (isChamp && !revealed) return sb.beer?.biertype || '—'
    return [sb.beer?.brouwerij, sb.beer?.biertype].filter(Boolean).join(' · ')
  }

  return (
    <Modal title={`📋 Scores — ${session.naam}`} onClose={onClose} wide>
      {/* Filters */}
      <div className="filter-bar mb-2">
        <input className="form-input" style={{ maxWidth: 220, flex: 1 }}
          placeholder={isChamp && !revealed ? 'Zoek op ID...' : 'Zoek op biernaam...'}
          value={filterBeer} onChange={e => setFilterBeer(e.target.value)} />
        <select className="form-select" style={{ maxWidth: 140 }}
          value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">Alle categorieën</option>
          {CATEGORIES.map(c => <option key={c} value={c}>Cat. {c}</option>)}
        </select>
      </div>

      {filteredBeers.length === 0
        ? <EmptyState icon="📊" message="Geen bieren gevonden." />
        : filteredBeers.map(sb => {
          const beerForms = getFormsForBeer(sb.beer_id)
          if (beerForms.length === 0) return null

          const avgScore = beerForms.length
            ? (beerForms.reduce((s, f) => s + parseFloat(f.score || 0), 0) / beerForms.length).toFixed(2)
            : null

          return (
            <div key={sb.beer_id} className="scores-beer-block">
              {/* Bier header */}
              <div className="scores-beer-header">
                <div className="scores-beer-title">
                  {isChamp && !revealed
                    ? <span className="champagne-id">{sb.identifier || '???'}</span>
                    : <strong>{sb.beer?.naam}</strong>}
                  {isChamp && revealed && (
                    <span className="champagne-id" style={{ fontSize: '0.75rem', marginLeft: 8 }}>{sb.identifier}</span>
                  )}
                  <span className="text-muted" style={{ fontSize: '0.8rem', marginLeft: 8 }}>
                    {getBeerMeta(sb)}
                  </span>
                  <span className="badge badge-hop" style={{ marginLeft: 8 }}>Cat. {sb.beer?.categorie}</span>
                </div>
                <div className="scores-beer-avg">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gem.</span>
                  <ScoreDisplay score={avgScore} />
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>({beerForms.length}×)</span>
                </div>
              </div>

              {/* Scores tabel */}
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      <th>Proever</th>
                      <th>Kleur ×1</th>
                      <th>Koolzuur ×1</th>
                      <th>Geur ×3</th>
                      <th>Smaak ×3</th>
                      <th>Nasmaak ×2</th>
                      <th>Score</th>
                      <th>Opmerking</th>
                    </tr>
                  </thead>
                  <tbody>
                    {beerForms.map(f => (
                      <tr key={f.id}>
                        <td><strong>{f.user?.username || '—'}</strong></td>
                        <td>{f.kleur}</td>
                        <td>{f.koolzuur}</td>
                        <td>{f.geur}</td>
                        <td>{f.smaak}</td>
                        <td>{f.nasmaak}</td>
                        <td><ScoreDisplay score={f.score} /></td>
                        <td style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {f.opmerkingen || '—'}
                        </td>
                      </tr>
                    ))}
                    {/* Gemiddelde rij */}
                    {beerForms.length > 1 && (
                      <tr style={{ background: 'var(--green-faint)', fontWeight: 600 }}>
                        <td>Gemiddelde</td>
                        <td>{getAvg(beerForms, 'kleur')}</td>
                        <td>{getAvg(beerForms, 'koolzuur')}</td>
                        <td>{getAvg(beerForms, 'geur')}</td>
                        <td>{getAvg(beerForms, 'smaak')}</td>
                        <td>{getAvg(beerForms, 'nasmaak')}</td>
                        <td><ScoreDisplay score={avgScore} /></td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}

      <button className="btn btn-ghost mt-2" onClick={onClose}>Sluiten</button>
    </Modal>
  )
}
