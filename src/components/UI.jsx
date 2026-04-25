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

export const BIERTYPE_CATEGORIE = {
  'American Pale Ale': 'A', 'Berliner Weisse': 'A', 'Bitter Blond': 'A',
  'Brettanomyces Blond': 'A', 'California Steam': 'A', 'Dortmunder Export': 'A',
  'Faro': 'A', 'Gose': 'A', 'Irish Red Ale': 'A', 'Kölsch': 'A', 'Kuit': 'A',
  'Münchener Helles': 'A', 'New England IPA (NEIPA)': 'A', 'Oktoberfest': 'A',
  'Ordinary & Best Bitter': 'A', 'Oude Geuze Lambiek': 'A', 'Pale Ale (GB)': 'A',
  'Pilsener': 'A', 'Pilsener (Urtyp)': 'A', 'Saison': 'A',
  'Session India Pale Ale': 'A', 'Speciale Belge (Belgische Pale Ale)': 'A',
  'Weizen': 'A', 'Witbier': 'A',
  'Alt': 'B', 'American Amber-Red': 'B', 'Bohemian / Czech Dark Lager': 'B',
  'Brown Ale': 'B', 'Dunkelweizen': 'B', 'Fruit / Framboise Lambiek': 'B',
  'Irish Dry Stout': 'B', 'Kriek Lambiek (Oude)': 'B', 'Mild Ale (Dark)': 'B',
  'Milk (Sweet) Stout': 'B', 'Münchener Dunkles': 'B', 'Oatmeal Stout': 'B',
  'Oud Bruin (NL)': 'B', 'Porter': 'B', 'Schwarzbier': 'B',
  'Vlaams (Oud) Bruin': 'B', 'Vlaams Rood': 'B',
  'Barley Wine Engels & Amerikaans': 'C', 'Blond(e)': 'C',
  'Brut (Méthode Champenoise)': 'C', 'Dortmunder Strong': 'C',
  'Double / Imperial IPA': 'C', 'India Pale Ale (GB)': 'C',
  'India Pale Ale (USA)': 'C', 'Lichte Dubbelbo(c)k': 'C', 'Meibo(c)k': 'C',
  'Sterk (Dubbel) Witbier': 'C', 'Sterke Blonde': 'C', 'Sterke Saison': 'C',
  'Tripel': 'C', 'Weizenbock (Hell)': 'C',
  'Baltic Porter': 'D', 'Barley Wine (Klasse D)': 'D',
  'Bière de Garde (Ambrée)': 'D', 'Black IPA (BIPA)': 'D', 'Bo(c)kbier': 'D',
  'Dubbel': 'D', 'Dubbelbock': 'D', 'Export Stout': 'D', 'Imperial Red Ale': 'D',
  'Old Ale': 'D', 'Quadrupel': 'D', 'Russian Imperial Stout': 'D',
  'Scotch Ale': 'D', 'Sterke Vlaamse Bruine': 'D', 'Weizen(doppel)bock': 'D',
  'Vrije Klasse': 'V',
}

