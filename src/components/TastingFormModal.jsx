import { useState } from 'react'
import { Modal, Alert, SCORING, calcScore } from './UI'
import { upsertForm } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function TastingFormModal({ beer, session, existingForm, readOnly, onDone, onClose }) {
  const { profile } = useAuth()
  const isChamp = session?.type === 'kampioenschap'

  // Find this beer's identifier in the session
  const sbEntry = session?.session_beers?.find(sb => sb.beer_id === beer.id)
  const identifier = sbEntry?.identifier

  const [form, setForm] = useState({
    kleur: existingForm?.kleur ?? 5,
    koolzuur: existingForm?.koolzuur ?? 5,
    geur: existingForm?.geur ?? 5,
    smaak: existingForm?.smaak ?? 5,
    nasmaak: existingForm?.nasmaak ?? 5,
    opmerkingen: existingForm?.opmerkingen ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const score = calcScore(form)

  const canEdit = !readOnly && (
    profile?.role === 'superuser' ||
    (!session?.edit_locked && !session?.closed)
  )

  async function handleSave(e) {
    e.preventDefault()
    if (!canEdit) { onClose(); return }
    setLoading(true); setError('')
    try {
      await upsertForm({
        session_id: session.id,
        beer_id: beer.id,
        user_id: profile.id,
        ...form,
      })
      onDone?.()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  function ScoreSlider({ field, label }) {
    return (
      <div className="score-row">
        <span className="score-label">{label}</span>
        <span className="score-weight">×{SCORING[field]}</span>
        <input className="score-slider" type="range" min="1" max="10" step="1"
          value={form[field]} disabled={!canEdit}
          onChange={e => set(field, parseInt(e.target.value))} />
        <span className="score-val">{form[field]}</span>
      </div>
    )
  }

  return (
    <Modal title={`Proefformulier — ${isChamp ? (identifier || '???') : beer.naam}`} onClose={onClose}>
      {isChamp && (
        <div className="alert alert-info" style={{ marginBottom: 12 }}>
          🏆 Kampioenschap · Bier ID: <strong className="champagne-id">{identifier || '???'}</strong>
        </div>
      )}

      {/* Beer info bar */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, padding: '12px 16px', background: 'var(--parchment)', borderRadius: 8, flexWrap: 'wrap' }}>
        <div>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>Type</span>
          <br /><strong style={{ fontSize: '0.85rem' }}>{beer.biertype}</strong>
        </div>
        {!isChamp && <>
          <div><span className="text-muted" style={{ fontSize: '0.75rem' }}>ABV</span><br /><strong>{beer.abv}%</strong></div>
          <div><span className="text-muted" style={{ fontSize: '0.75rem' }}>EBC</span><br /><strong>{beer.ebc}</strong></div>
          <div><span className="text-muted" style={{ fontSize: '0.75rem' }}>IBU</span><br /><strong>{beer.ibu}</strong></div>
        </>}
        <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>Eindscore</span>
          <br /><span className="score-big">{score ?? '—'}</span>
        </div>
      </div>

      {!canEdit && existingForm && <div className="alert alert-info mb-2">👁 Alleen-lezen — formulier is vergrendeld of sessie is gesloten</div>}
      {error && <Alert type="error">{error}</Alert>}

      <form onSubmit={handleSave}>
        <ScoreSlider field="kleur" label="Kleur" />
        <ScoreSlider field="koolzuur" label="Koolzuur" />
        <ScoreSlider field="geur" label="Geur" />
        <ScoreSlider field="smaak" label="Smaak" />
        <ScoreSlider field="nasmaak" label="Nasmaak" />
        <p className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>
          Gewichten: Kleur ×1 · Koolzuur ×1 · Geur ×3 · Smaak ×3 · Nasmaak ×2 — max 10.00
        </p>
        <div className="form-group mt-1">
          <label className="form-label">Opmerkingen</label>
          <textarea className="form-textarea" value={form.opmerkingen} disabled={!canEdit}
            onChange={e => set('opmerkingen', e.target.value)} placeholder="Vrije notities..." />
        </div>
        <div className="flex-gap mt-2">
          {canEdit && (
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Opslaan...' : '✓ Beoordeling opslaan'}
            </button>
          )}
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            {canEdit ? 'Annuleren' : 'Sluiten'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
