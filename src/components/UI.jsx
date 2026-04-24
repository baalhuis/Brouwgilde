// ── Shared UI components ──────────────────────────────────────

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={wide ? { maxWidth: 780 } : {}}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Spinner() {
  return <div className="loading-center"><div className="spinner" /></div>
}

export function Alert({ type = 'info', children }) {
  return <div className={`alert alert-${type}`}>{children}</div>
}

export function ScoreDisplay({ score }) {
  if (score == null) return <span className="text-muted">—</span>
  const n = parseFloat(score)
  const color = n >= 8 ? '#2e7d32' : n >= 6 ? '#c8862a' : n >= 4 ? '#b5651d' : '#c0392b'
  return (
    <span style={{ color, fontWeight: 700, fontFamily: "'Playfair Display', serif", fontSize: '1.1rem' }}>
      {Number(score).toFixed(2)}
    </span>
  )
}

export function SectionTitle({ children }) {
  return <div className="section-title">{children}</div>
}

export function EmptyState({ icon = '🍺', message }) {
  return (
    <div className="empty-state">
      <div className="icon">{icon}</div>
      <p>{message}</p>
    </div>
  )
}

// Score calculation (same formula as DB generated column)
export const SCORING = { kleur: 1, koolzuur: 1, geur: 3, smaak: 3, nasmaak: 2 }
export const TOTAL_WEIGHT = 10

export function calcScore({ kleur, koolzuur, geur, smaak, nasmaak }) {
  if ([kleur, koolzuur, geur, smaak, nasmaak].some(v => v == null || v === ''))
    return null
  return ((kleur * 1 + koolzuur * 1 + geur * 3 + smaak * 3 + nasmaak * 2) / 10).toFixed(2)
}

export const BEER_TYPES = [
  'American Lager','Czech Lager','Munich Helles','Pilsner','Märzen / Oktoberfest',
  'Bock','Doppelbock','Eisbock','Schwarzbier','Dunkel','Vienna Lager',
  'American IPA','Double IPA','Session IPA','New England IPA','West Coast IPA',
  'Belgian IPA','English Bitter','English Pale Ale','American Pale Ale',
  'Blonde Ale','Kölsch','Cream Ale','American Ale',
  'Porter','Robust Porter','Baltic Porter','Stout','Irish Stout',
  'Imperial Stout','Milk Stout','Oatmeal Stout','Foreign Extra Stout',
  'Belgian Golden Strong','Belgian Tripel','Belgian Dubbel','Belgian Quad',
  'Witbier','Saison','Farmhouse Ale','Bière de Garde','Lambic','Gueuze',
  'Flanders Red Ale','Oud Bruin','Berliner Weisse','Gose',
  'Hefeweizen','Dunkelweizen','Weizenbock','Roggenbier',
  'Rauchbier','Scottish Ale','Wee Heavy','Barleywine','Old Ale','Winter Warmer',
  'Fruit Beer','Spiced Beer','Herb / Vegetable Beer','Smoked Beer',
  'Wood-Aged Beer','Brett Beer','Mixed-Fermentation Sour','Wild Ale',
  'Altbier','Kellerbier','Dortmunder Export','Mead','Cider','Other',
]

export const CATEGORIES = ['A', 'B', 'C', 'D', 'V']
