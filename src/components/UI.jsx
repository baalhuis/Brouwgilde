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
  const color = n >= 8 ? '#4a7c2f' : n >= 6 ? '#6a8a2e' : n >= 4 ? '#c17f24' : '#c0392b'
  return (
    <span style={{ color, fontWeight: 700, fontFamily: "'Fraunces', serif", fontSize: '1.1rem' }}>
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
  // ── Klasse A — licht van kleur, begin SG < 1060 ──────────────
  'American Pale Ale',
  'Berliner Weisse',
  'Bitter Blond',
  'Brettanomyces Blond',
  'California Steam',
  'Dortmunder Export',
  'Faro',
  'Gose',
  'Irish Red Ale',
  'Kölsch',
  'Kuit',
  'Münchener Helles',
  'New England IPA (NEIPA)',
  'Oktoberfest',
  'Ordinary & Best Bitter',
  'Oude Geuze Lambiek',
  'Pale Ale (GB)',
  'Pilsener',
  'Pilsener (Urtyp)',
  'Saison',
  'Session India Pale Ale',
  'Speciale Belge (Belgische Pale Ale)',
  'Weizen',
  'Witbier',
  // ── Klasse B — donker van kleur, begin SG < 1060 ─────────────
  'Alt',
  'American Amber-Red',
  'Bohemian / Czech Dark Lager',
  'Brown Ale',
  'Dunkelweizen',
  'Fruit / Framboise Lambiek',
  'Irish Dry Stout',
  'Kriek Lambiek (Oude)',
  'Mild Ale (Dark)',
  'Milk (Sweet) Stout',
  'Münchener Dunkles',
  'Oatmeal Stout',
  'Oud Bruin (NL)',
  'Porter',
  'Schwarzbier',
  'Vlaams (Oud) Bruin',
  'Vlaams Rood',
  // ── Klasse C — licht van kleur, begin SG ≥ 1060 ──────────────
  'Barley Wine Engels & Amerikaans',
  'Blond(e)',
  'Brut (Méthode Champenoise)',
  'Dortmunder Strong',
  'Double / Imperial IPA',
  'India Pale Ale (GB)',
  'India Pale Ale (USA)',
  'Lichte Dubbelbo(c)k',
  'Meibo(c)k',
  'Sterk (Dubbel) Witbier',
  'Sterke Blonde',
  'Sterke Saison',
  'Tripel',
  'Weizenbock (Hell)',
  // ── Klasse D — donker van kleur, begin SG ≥ 1060 ─────────────
  'Baltic Porter',
  'Barley Wine (Klasse D)',
  'Bière de Garde (Ambrée)',
  'Black IPA (BIPA)',
  'Bo(c)kbier',
  'Dubbel',
  'Dubbelbock',
  'Export Stout',
  'Imperial Red Ale',
  'Old Ale',
  'Quadrupel',
  'Russian Imperial Stout',
  'Scotch Ale',
  'Sterke Vlaamse Bruine',
  'Weizen(doppel)bock',
  // ── Vrije Klasse ──────────────────────────────────────────────
  'Vrije Klasse',
]


export const BKG_GROUPS = [
  {
    label: 'Klasse A — licht, begin SG < 1060',
    types: [
      'American Pale Ale', 'Berliner Weisse', 'Bitter Blond', 'Brettanomyces Blond',
      'California Steam', 'Dortmunder Export', 'Faro', 'Gose', 'Irish Red Ale',
      'Kölsch', 'Kuit', 'Münchener Helles', 'New England IPA (NEIPA)', 'Oktoberfest',
      'Ordinary & Best Bitter', 'Oude Geuze Lambiek', 'Pale Ale (GB)', 'Pilsener',
      'Pilsener (Urtyp)', 'Saison', 'Session India Pale Ale',
      'Speciale Belge (Belgische Pale Ale)', 'Weizen', 'Witbier',
    ],
  },
  {
    label: 'Klasse B — donker, begin SG < 1060',
    types: [
      'Alt', 'American Amber-Red', 'Bohemian / Czech Dark Lager', 'Brown Ale',
      'Dunkelweizen', 'Fruit / Framboise Lambiek', 'Irish Dry Stout',
      'Kriek Lambiek (Oude)', 'Mild Ale (Dark)', 'Milk (Sweet) Stout',
      'Münchener Dunkles', 'Oatmeal Stout', 'Oud Bruin (NL)', 'Porter',
      'Schwarzbier', 'Vlaams (Oud) Bruin', 'Vlaams Rood',
    ],
  },
  {
    label: 'Klasse C — licht, begin SG ≥ 1060',
    types: [
      'Barley Wine Engels & Amerikaans', 'Blond(e)', 'Brut (Méthode Champenoise)',
      'Dortmunder Strong', 'Double / Imperial IPA', 'India Pale Ale (GB)',
      'India Pale Ale (USA)', 'Lichte Dubbelbo(c)k', 'Meibo(c)k',
      'Sterk (Dubbel) Witbier', 'Sterke Blonde', 'Sterke Saison', 'Tripel',
      'Weizenbock (Hell)',
    ],
  },
  {
    label: 'Klasse D — donker, begin SG ≥ 1060',
    types: [
      'Baltic Porter', 'Barley Wine (Klasse D)', 'Bière de Garde (Ambrée)',
      'Black IPA (BIPA)', 'Bo(c)kbier', 'Dubbel', 'Dubbelbock', 'Export Stout',
      'Imperial Red Ale', 'Old Ale', 'Quadrupel', 'Russian Imperial Stout',
      'Scotch Ale', 'Sterke Vlaamse Bruine', 'Weizen(doppel)bock',
    ],
  },
  {
    label: 'Vrije Klasse',
    types: ['Vrije Klasse'],
  },
]

export const CATEGORIES = ['A', 'B', 'C', 'D', 'V']
