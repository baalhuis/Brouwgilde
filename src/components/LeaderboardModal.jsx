import { useEffect, useState } from 'react'
import { Modal, EmptyState, Spinner, CATEGORIES } from './UI'
import { getLeaderboard, getForms } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function LeaderboardModal({ session, onClose }) {
  const { profile } = useAuth()
  const [data, setData] = useState(null)
  const [filterCat, setFilterCat] = useState('')
  const [filterType, setFilterType] = useState('')
  const isAdmin = profile?.role === 'superuser' || session.admin_id === profile?.id

  useEffect(() => {
    async function load() {
      const rows = await getLeaderboard(session.id)
      setData(rows)
    }
    load()
  }, [session.id])

  if (!session.leaderboard_visible && !isAdmin) {
    return (
      <Modal title={`Leaderboard — ${session.naam}`} onClose={onClose}>
        <EmptyState icon="🔒" message="Het leaderboard is nog niet zichtbaar gemaakt door de admin." />
        <button className="btn btn-ghost mt-2" onClick={onClose}>Sluiten</button>
      </Modal>
    )
  }

  const isChamp = session.type === 'kampioenschap'
  const revealed = isChamp && session.closed && session.edit_locked
  const beerTypes = data ? [...new Set(data.map(r => r.biertype))] : []

  const filtered = (data || []).filter(r => {
    if (filterCat && r.categorie !== filterCat) return false
    if (filterType && r.biertype !== filterType) return false
    return true
  })

  const rankColors = ['gold', 'silver', 'bronze']

  function getIdentifier(beerId) {
    return session.session_beers?.find(sb => sb.beer_id === beerId)?.identifier || '???'
  }

  return (
    <Modal title={`🏆 Leaderboard — ${session.naam}`} onClose={onClose} wide>
      <div className="filter-bar mb-2">
        <select className="form-select" style={{ maxWidth: 140 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">Alle categorieën</option>
          {CATEGORIES.map(c => <option key={c} value={c}>Categorie {c}</option>)}
        </select>
        <select className="form-select" style={{ maxWidth: 200 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Alle biertypes</option>
          {beerTypes.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {!data
        ? <Spinner />
        : filtered.length === 0
          ? <EmptyState icon="📊" message="Nog geen scores beschikbaar." />
          : filtered.map((item, i) => (
            <div key={item.beer_id} className="lb-row">
              <div className={`lb-rank ${rankColors[i] || ''}`}>{i + 1}</div>
              <div className="lb-info">
                <div className="lb-name">
                  {isChamp && !revealed
                    ? <span className="champagne-id">{getIdentifier(item.beer_id)}</span>
                    : item.naam}
                </div>
                <div className="lb-meta">
                  {isChamp && revealed && <><span className="champagne-id" style={{ fontSize: '0.7rem', marginRight: 4 }}>{getIdentifier(item.beer_id)}</span></>}
                  {(revealed || !isChamp) && `${item.brouwerij} · `}
                  {item.biertype} · cat. {item.categorie} · {item.num_reviews} beoordeling{item.num_reviews !== 1 ? 'en' : ''}
                </div>
              </div>
              <div className="lb-score">{Number(item.avg_score).toFixed(2)}</div>
            </div>
          ))
      }

      {/* Admin-only: identifier legend for kampioenschap */}
      {isChamp && isAdmin && data && data.length > 0 && (
        <div className="alert alert-info mt-2" style={{ fontSize: '0.82rem' }}>
          <strong>Admin — Identifier overzicht:</strong>
          <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {session.session_beers?.map(sb => (
              <span key={sb.beer_id}>
                <span className="champagne-id">{sb.identifier}</span>
                {' = '}{sb.beer?.naam}
              </span>
            ))}
          </div>
        </div>
      )}

      <button className="btn btn-ghost mt-2" onClick={onClose}>Sluiten</button>
    </Modal>
  )
}
