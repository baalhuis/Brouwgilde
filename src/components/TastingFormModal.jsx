import { useState, useEffect, useRef, useCallback } from 'react'
import { Alert, SCORING, calcScore } from './UI'
import { upsertForm, deleteForm } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

// TouchSlider — pure DOM implementatie buiten React's event systeem
// React registreert events op root als passive:true, waardoor preventDefault niet werkt.
// Door de slider als pure DOM te bouwen via useEffect omzeilen we dit volledig.
function TouchSlider({ value, onChange, disabled }) {
  const containerRef = useRef(null)
  const onChangeRef  = useRef(onChange)
  const valueRef     = useRef(value)

  // Houd refs synchroon met props
  useEffect(() => { onChangeRef.current = onChange })
  useEffect(() => { valueRef.current = value })

  // Bouw de slider één keer als pure DOM — nooit opnieuw
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Maak DOM structuur
    container.style.cssText = `
      position: relative; height: 44px; border-radius: 22px;
      background: #dde8c0; user-select: none; -webkit-user-select: none;
      touch-action: none; cursor: pointer;
    `

    const fill = document.createElement('div')
    fill.style.cssText = `
      position: absolute; left: 0; top: 50%; transform: translateY(-50%);
      height: 8px; background: #91B34D; border-radius: 4px; pointer-events: none;
      transition: width 0.05s;
    `

    const thumb = document.createElement('div')
    thumb.style.cssText = `
      position: absolute; top: 50%; transform: translate(-50%, -50%);
      width: 36px; height: 36px; background: #91B34D;
      border: 3px solid white; border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3); pointer-events: none;
      transition: left 0.05s;
    `

    container.appendChild(fill)
    container.appendChild(thumb)

    // Render huidige waarde
    function render(v) {
      const pct = ((v - 1) / 9 * 100) + '%'
      fill.style.width = pct
      thumb.style.left = pct
    }
    render(valueRef.current)

    // Sla render op zodat React re-renders de DOM bijwerken
    container._sliderRender = render

    function getVal(clientX) {
      const rect = container.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      return Math.round(ratio * 9 + 1)
    }

    let dragging = false

    function onTouchStart(e) {
      if (container._disabled) return
      dragging = true
      e.preventDefault()
      e.stopPropagation()
      const v = getVal(e.touches[0].clientX)
      render(v)
      onChangeRef.current(v)
    }

    function onTouchMove(e) {
      if (!dragging) return
      e.preventDefault()
      e.stopPropagation()
      const v = getVal(e.touches[0].clientX)
      render(v)
      onChangeRef.current(v)
    }

    function onTouchEnd() { dragging = false }

    function onMouseDown(e) {
      if (container._disabled) return
      dragging = true
      const v = getVal(e.clientX)
      render(v)
      onChangeRef.current(v)
    }

    function onMouseMove(e) {
      if (!dragging) return
      const v = getVal(e.clientX)
      render(v)
      onChangeRef.current(v)
    }

    function onMouseUp() { dragging = false }

    // Registreer direct op DOM element — NIET via React — met passive:false
    container.addEventListener('touchstart', onTouchStart, { passive: false })
    container.addEventListener('touchmove',  onTouchMove,  { passive: false })
    container.addEventListener('touchend',   onTouchEnd,   { passive: true })
    container.addEventListener('mousedown',  onMouseDown)
    document.addEventListener('mousemove',   onMouseMove)
    document.addEventListener('mouseup',     onMouseUp)

    return () => {
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove',  onTouchMove)
      container.removeEventListener('touchend',   onTouchEnd)
      container.removeEventListener('mousedown',  onMouseDown)
      document.removeEventListener('mousemove',   onMouseMove)
      document.removeEventListener('mouseup',     onMouseUp)
    }
  }, []) // éénmalig — slider leeft in pure DOM

  // Sync React state → DOM render zonder re-mount
  useEffect(() => {
    if (containerRef.current?._sliderRender) {
      containerRef.current._sliderRender(value)
    }
  }, [value])

  // Sync disabled
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current._disabled = disabled
      containerRef.current.style.opacity = disabled ? '0.5' : '1'
      containerRef.current.style.cursor  = disabled ? 'not-allowed' : 'pointer'
    }
  }, [disabled])

  return <div ref={containerRef} />
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
