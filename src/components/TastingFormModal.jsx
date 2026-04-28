import { useState, useEffect, useRef, useCallback } from 'react'
import { Alert, SCORING, calcScore } from './UI'
import { upsertForm, deleteForm } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

// Custom slider — werkt op iOS touch via stabiele refs
function TouchSlider({ value, onChange, disabled }) {
  const trackRef   = useRef(null)
  const dragging   = useRef(false)
  // Gebruik een ref voor onChange zodat useEffect nooit opnieuw loopt
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    function getVal(clientX) {
      const rect = track.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      return Math.round(ratio * 9 + 1)
    }

    function onTouchStart(e) {
      if (disabled) return
      dragging.current = true
      e.preventDefault()
      onChangeRef.current(getVal(e.touches[0].clientX))
    }

    function onTouchMove(e) {
      if (!dragging.current) return
      e.preventDefault()
      onChangeRef.current(getVal(e.touches[0].clientX))
    }

    function onTouchEnd() {
      dragging.current = false
    }

    function onMouseDown(e) {
      if (disabled) return
      dragging.current = true
      onChangeRef.current(getVal(e.clientX))
    }

    function onMouseMove(e) {
      if (!dragging.current) return
      onChangeRef.current(getVal(e.clientX))
    }

    function onMouseUp() {
      dragging.current = false
    }

    // passive: false op BEIDE start en move zodat preventDefault werkt op iOS
    track.addEventListener('touchstart', onTouchStart, { passive: false })
    track.addEventListener('touchmove',  onTouchMove,  { passive: false })
    track.addEventListener('touchend',   onTouchEnd,   { passive: true  })
    track.addEventListener('mousedown',  onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup',   onMouseUp)

    return () => {
      track.removeEventListener('touchstart', onTouchStart)
      track.removeEventListener('touchmove',  onTouchMove)
      track.removeEventListener('touchend',   onTouchEnd)
      track.removeEventListener('mousedown',  onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup',   onMouseUp)
    }
  }, []) // lege deps — loopt precies één keer

  const pct = `${(value - 1) / 9 * 100}%`

  return (
    <div ref={trackRef} className="ts-track" style={{ userSelect: 'none', touchAction: 'none' }}>
      <div className="ts-fill" style={{ width: pct }} />
      <div className="ts-thumb" style={{ left: pct }} />
    </div>
  )
}

export default function TastingFormModal({ beer, session, existingForm, readOnly, onDone, onClose }) {
  const { profile } = useAuth()
  const isChamp = session?.type === 'kampioenschap'
  const revealed = isChamp && session?.closed && session?.edit_locked
  const sbEntry = session?.session_beers?.find(sb => sb.beer_id === beer.id)
  const identifier = sbEntry?.identifier

  const [form, setForm] = useState({
    kleur:      existingForm?.kleur     ?? 5,
    koolzuur:   existingForm?.koolzuur  ?? 5,
    geur:       existingForm?.geur      ?? 5,
    smaak:      existingForm?.smaak     ?? 5,
    nasmaak:    existingForm?.nasmaak   ?? 5,
    opmerkingen: existingForm?.opmerkingen ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = useCallback((k, v) => setForm(p => ({ ...p, [k]: v })), [])
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
        beer_id: beer.id || existingForm?.beer_id,
        user_id: profile.id,
        ...form,
      })
      onDone?.()
      onClose()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  function Row({ field, label }) {
    const onChange = useCallback(v => set(field, v), [field])
    return (
      <div className="score-row">
        <span className="score-label">{label}</span>
        <span className="score-weight">×{SCORING[field]}</span>
        <TouchSlider value={form[field]} onChange={onChange} disabled={!canEdit} />
        <span className="score-val">{form[field]}</span>
      </div>
    )
  }

  return (
    <div className="tf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tf-modal">
        <div className="modal-header">
          <h3 className="modal-title" style={{ fontSize: '1rem' }}>
            {isChamp && !revealed ? (identifier || '???') : beer.naam}
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {isChamp && !revealed && (
          <div className="alert alert-info" style={{ marginBottom: 10, fontSize: '0.82rem' }}>
            🏆 Kampioenschap · ID: <strong className="champagne-id">{identifier || '???'}</strong>
          </div>
        )}
        {isChamp && revealed && (
          <div className="alert alert-success" style={{ marginBottom: 10, fontSize: '0.82rem' }}>
            🏆 ID: <strong className="champagne-id">{identifier}</strong> = <strong>{beer.naam}</strong> — {beer.brouwerij}
          </div>
        )}

        {/* Beer info */}
        <div className="tf-info">
          <div><div className="tf-info-label">Type</div><strong>{beer.biertype}</strong></div>
          {(!isChamp || revealed) && <>
            <div><div className="tf-info-label">ABV</div><strong>{beer.abv}%</strong></div>
            <div><div className="tf-info-label">EBC</div><strong>{beer.ebc}</strong></div>
            <div><div className="tf-info-label">IBU</div><strong>{beer.ibu}</strong></div>
          </>}
          <div style={{ marginLeft: 'auto' }}>
            <div className="tf-info-label">Score</div>
            <strong style={{ fontSize: '1.1rem', color: 'var(--green-dark)', fontFamily: "'Fraunces', serif" }}>{score ?? '—'}</strong>
          </div>
        </div>

        {!canEdit && existingForm && (
          <div className="alert alert-info" style={{ marginBottom: 10, fontSize: '0.82rem' }}>
            👁 Alleen-lezen — formulier is vergrendeld of sessie is gesloten
          </div>
        )}
        {error && <Alert type="error">{error}</Alert>}

        <form onSubmit={handleSave}>
          <Row field="kleur"    label="Kleur" />
          <Row field="koolzuur" label="Koolzuur" />
          <Row field="geur"     label="Geur" />
          <Row field="smaak"    label="Smaak" />
          <Row field="nasmaak"  label="Nasmaak" />

          <p className="text-muted" style={{ fontSize: '0.72rem', margin: '4px 0 10px' }}>
            Kleur ×1 · Koolzuur ×1 · Geur ×3 · Smaak ×3 · Nasmaak ×2
          </p>

          <div className="form-group">
            <label className="form-label">Opmerkingen</label>
            <textarea className="form-textarea" value={form.opmerkingen} disabled={!canEdit}
              onChange={e => set('opmerkingen', e.target.value)} rows={2}
              placeholder="Vrije notities..." />
          </div>

          <div className="flex-gap mt-2">
            {canEdit && (
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? 'Opslaan...' : '✓ Opslaan'}
              </button>
            )}
            <button className="btn btn-ghost" type="button" onClick={onClose}>
              {canEdit ? 'Annuleren' : 'Sluiten'}
            </button>
            {canEdit && existingForm && (
              <button className="btn btn-danger" type="button" disabled={loading}
                style={{ marginLeft: 'auto' }}
                onClick={async () => {
                  if (!confirm('Beoordeling resetten?')) return
                  setLoading(true)
                  try {
                    await deleteForm(session.id, beer.id || existingForm.beer_id, profile.id || existingForm.user_id)
                    onDone?.(); onClose()
                  } catch (err) { setError(err.message) }
                  finally { setLoading(false) }
                }}>
                🗑 Reset
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
