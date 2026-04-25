import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useRole } from '../lib/AuthContext'
import { getBeers, createBeer, updateBeer, deleteBeer } from '../lib/supabase'
import { Modal, Alert, EmptyState, Spinner, BKG_GROUPS, CATEGORIES } from '../components/UI'

// ── Beer form modal ────────────────────────────────────────────
function BeerModal({ beer, onSave, onClose }) {
  const { profile } = useAuth()
  const [form, setForm] = useState(beer ? {
    naam: beer.naam, categorie: beer.categorie, biertype: beer.biertype,
    brouwerij: beer.brouwerij, beschrijving: beer.beschrijving || '',
    ebc: beer.ebc || '', ibu: beer.ibu || '', abv: beer.abv || '',
    untappd_url: beer.untappd_url || '', brewfather_url: beer.brewfather_url || '',
  } : {
    naam: '', categorie: 'A', biertype: '', brouwerij: profile?.brewery_name || '',
    beschrijving: '', ebc: '', ibu: '', abv: '', untappd_url: '', brewfather_url: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function handleSave(e) {
    e.preventDefault(); setError('')
    if (!form.naam || !form.biertype || !form.brouwerij || form.ebc === '' || form.ibu === '' || form.abv === '') {
      setError('Vul alle verplichte velden in.'); return
    }
    setLoading(true)
    try { await onSave(form) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title={beer ? 'Bier bewerken' : 'Nieuw bier toevoegen'} onClose={onClose}>
      {error && <Alert type="error">{error}</Alert>}
      <form onSubmit={handleSave}>
        <div className="form-group">
          <label className="form-label">Naam bier <span className="req">*</span></label>
          <input className="form-input" value={form.naam} onChange={e => set('naam', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Categorie <span className="req">*</span></label>
            <select className="form-select" value={form.categorie} onChange={e => set('categorie', e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Brouwerij <span className="req">*</span></label>
            <input className="form-input" value={form.brouwerij} onChange={e => set('brouwerij', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Biertype <span className="req">*</span></label>
          <select className="form-select" value={form.biertype} onChange={e => set('biertype', e.target.value)}>
            <option value="">— selecteer BKG biertype —</option>
            {BKG_GROUPS.map(g => (
              <optgroup key={g.label} label={g.label}>
                {g.types.map(t => <option key={t}>{t}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="form-row-3">
          <div className="form-group">
            <label className="form-label">EBC <span className="req">*</span></label>
            <input className="form-input" type="number" min="1" value={form.ebc} onChange={e => set('ebc', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">IBU <span className="req">*</span></label>
            <input className="form-input" type="number" min="0" value={form.ibu} onChange={e => set('ibu', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">ABV% <span className="req">*</span></label>
            <input className="form-input" type="number" step="0.1" min="0" value={form.abv} onChange={e => set('abv', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Beschrijving</label>
          <textarea className="form-textarea" value={form.beschrijving} onChange={e => set('beschrijving', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Untappd link</label>
            <input className="form-input" value={form.untappd_url} onChange={e => set('untappd_url', e.target.value)} placeholder="https://untappd.com/..." />
          </div>
          <div className="form-group">
            <label className="form-label">Brewfather recept</label>
            <input className="form-input" value={form.brewfather_url} onChange={e => set('brewfather_url', e.target.value)} placeholder="https://web.brewfather.app/..." />
          </div>
        </div>
        <div className="flex-gap mt-2">
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Opslaan...' : 'Opslaan'}</button>
          <button className="btn btn-ghost" type="button" onClick={onClose}>Annuleren</button>
        </div>
      </form>
    </Modal>
  )
}

// ── Beer card (mobile) ─────────────────────────────────────────
function BeerCard({ beer, canEdit, canDelete, onEdit, onDelete }) {
  return (
    <div className="beer-card">
      <div className="beer-card-header">
        <div className="beer-card-title">
          <strong>{beer.naam}</strong>
          <span className="beer-card-brewery">{beer.brouwerij}</span>
        </div>
        <div className="flex-gap">
          <span className="badge badge-hop">Cat. {beer.categorie}</span>
        </div>
      </div>

      <div className="beer-card-type">
        <span className="badge badge-muted">{beer.biertype}</span>
      </div>

      <div className="beer-card-stats">
        <div className="beer-stat">
          <span className="beer-stat-label">ABV</span>
          <span className="beer-stat-value">{beer.abv}%</span>
        </div>
        <div className="beer-stat">
          <span className="beer-stat-label">EBC</span>
          <span className="beer-stat-value">{beer.ebc}</span>
        </div>
        <div className="beer-stat">
          <span className="beer-stat-label">IBU</span>
          <span className="beer-stat-value">{beer.ibu}</span>
        </div>
      </div>

      {(beer.untappd_url || beer.brewfather_url) && (
        <div className="flex-gap" style={{ marginTop: 8 }}>
          {beer.untappd_url && (
            <a href={beer.untappd_url} target="_blank" rel="noreferrer" className="beer-link">
              Untappd ↗
            </a>
          )}
          {beer.brewfather_url && (
            <a href={beer.brewfather_url} target="_blank" rel="noreferrer" className="beer-link brewfather">
              Brewfather ↗
            </a>
          )}
        </div>
      )}

      {(canEdit || canDelete) && (
        <div className="beer-card-actions">
          {canEdit  && <button className="btn btn-ghost btn-sm" onClick={onEdit}>✏️ Bewerken</button>}
          {canDelete && <button className="btn btn-danger btn-sm" onClick={onDelete}>🗑 Verwijderen</button>}
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────
export default function BeersPage() {
  const { profile } = useAuth()
  const { isSuperuser } = useRole()
  const [beers, setBeers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [filterQ, setFilterQ] = useState('')
  const [filterCat, setFilterCat] = useState('')

  async function load() {
    setLoading(true)
    try {
      const data = await getBeers()
      setBeers(data ?? [])
    } catch (err) {
      console.error('Fout bij ophalen bieren:', err)
      setError('Kon bieren niet laden: ' + err.message)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const canAdd    = ['superuser', 'admin', 'brouwer'].includes(profile?.role)
  const canEdit   = (b) => isSuperuser || b.owner_id === profile?.id
  const canDelete = (b) => isSuperuser

  async function handleSave(form) {
    if (modal.beer) {
      await updateBeer(modal.beer.id, form)
    } else {
      await createBeer({ ...form, owner_id: profile.id })
    }
    setModal(null)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Bier verwijderen? Dit verwijdert ook alle gekoppelde proefformulieren.')) return
    await deleteBeer(id)
    load()
  }

  const filtered = beers.filter(b => {
    const q = filterQ.toLowerCase()
    const matchQ = !q || b.naam.toLowerCase().includes(q) || b.biertype.toLowerCase().includes(q) || b.brouwerij.toLowerCase().includes(q)
    const matchCat = !filterCat || b.categorie === filterCat
    return matchQ && matchCat
  })

  if (loading) return <Spinner />
  if (error) return (
    <div className="alert alert-error" style={{ margin: 20 }}>
      {error}
      <br />
      <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={load}>Opnieuw proberen</button>
    </div>
  )

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h2>🍺 Bieren</h2>
          <p>{beers.length} bier{beers.length !== 1 ? 'en' : ''} in de database</p>
        </div>
        {canAdd && (
          <button className="btn btn-primary" onClick={() => setModal({ beer: null })}>
            + Bier toevoegen
          </button>
        )}
      </div>

      <div className="filter-bar">
        <input className="form-input" style={{ maxWidth: 260, flex: 1 }}
          placeholder="Zoek op naam, type, brouwerij..."
          value={filterQ} onChange={e => setFilterQ(e.target.value)} />
        <select className="form-select" style={{ maxWidth: 160 }}
          value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">Alle categorieën</option>
          {CATEGORIES.map(c => <option key={c} value={c}>Categorie {c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🍶" message="Geen bieren gevonden." />
      ) : (
        <>
          {/* ── Desktop tabel ── */}
          <div className="card desktop-only" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="table" style={{ minWidth: 640 }}>
              <thead>
                <tr>
                  <th>Naam</th>
                  <th className="hide-tablet">Brouwerij</th>
                  <th>Type</th>
                  <th>Cat.</th>
                  <th>ABV</th>
                  <th className="hide-tablet">EBC</th>
                  <th className="hide-tablet">IBU</th>
                  <th className="hide-tablet">Links</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id}>
                    <td>
                      <strong>{b.naam}</strong>
                      <div className="text-muted hide-tablet-inverse" style={{ fontSize: '0.75rem', marginTop: 2 }}>{b.brouwerij}</div>
                    </td>
                    <td className="hide-tablet">{b.brouwerij}</td>
                    <td><span className="badge badge-muted">{b.biertype}</span></td>
                    <td><span className="badge badge-hop">Cat. {b.categorie}</span></td>
                    <td>{b.abv}%</td>
                    <td className="hide-tablet">{b.ebc}</td>
                    <td className="hide-tablet">{b.ibu}</td>
                    <td className="hide-tablet">
                      <div className="flex-gap">
                        {b.untappd_url    && <a href={b.untappd_url}    target="_blank" rel="noreferrer" className="beer-link">Untappd ↗</a>}
                        {b.brewfather_url && <a href={b.brewfather_url} target="_blank" rel="noreferrer" className="beer-link brewfather">Brewfather ↗</a>}
                      </div>
                    </td>
                    <td>
                      <div className="flex-gap">
                        {canEdit(b)   && <button className="btn btn-ghost btn-sm"  onClick={() => setModal({ beer: b })}>✏️</button>}
                        {canDelete(b) && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)}>🗑</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* ── Mobiele kaarten ── */}
          <div className="mobile-only beer-card-list">
            {filtered.map(b => (
              <BeerCard
                key={b.id}
                beer={b}
                canEdit={canEdit(b)}
                canDelete={canDelete(b)}
                onEdit={() => setModal({ beer: b })}
                onDelete={() => handleDelete(b.id)}
              />
            ))}
          </div>
        </>
      )}

      {modal && <BeerModal beer={modal.beer} onSave={handleSave} onClose={() => setModal(null)} />}
    </div>
  )
}
