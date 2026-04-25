import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useNav } from '../lib/NavContext'
import { getSessions, getBeers, getMyForms } from '../lib/supabase'
import { Spinner } from '../components/UI'

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNav()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function load() {
      const [sessions, beers, myForms] = await Promise.all([
        getSessions(), getBeers(), getMyForms(profile.id),
      ])
      setStats({
        totalBeers: beers.length,
        openSessions: sessions.filter(s => !s.closed),
        myForms: myForms.length,
        mySessions: sessions.filter(s =>
          s.session_participants?.some(p => p.user_id === profile.id)
        ),
      })
    }
    if (profile) load()
  }, [profile])

  if (!stats) return <Spinner />

  const { totalBeers, openSessions, myForms, mySessions } = stats

  const statCards = [
    { icon: '🍺', num: totalBeers,          label: 'Bieren',          page: 'beers',    hint: 'Bekijk alle bieren →' },
    { icon: '🎯', num: openSessions.length, label: 'Actieve sessies', page: 'sessions', hint: 'Naar proefsessies →' },
    { icon: '📋', num: myForms,             label: 'Mijn beoordelingen', page: 'myforms', hint: 'Bekijk jouw scores →' },
    { icon: '🏭', num: mySessions.length,   label: 'Aangemeld voor',  page: 'sessions', hint: 'Naar proefsessies →' },
  ]

  return (
    <div>
      <div className="page-header">
        <h2>Welkom, {profile.username}!</h2>
        <p>Overzicht van het Brouwgilde Breda proefplatform</p>
      </div>

      {/* Klikbare stat kaartjes */}
      <div className="stats-grid" style={{ marginBottom: 32 }}>
        {statCards.map(({ icon, num, label, page, hint }) => (
          <div
            key={label}
            className="stat-card stat-card--clickable"
            onClick={() => navigate(page)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && navigate(page)}
            aria-label={hint}
          >
            <div style={{ fontSize: '1.6rem' }}>{icon}</div>
            <div className="stat-number">{num}</div>
            <div className="stat-label">{label}</div>
            <div className="stat-hint">{hint}</div>
          </div>
        ))}
      </div>

      {/* Actieve sessies */}
      {openSessions.length > 0 && (
        <>
          <h3 className="section-title">🎯 Actieve proefsessies</h3>
          <div className="dashboard-sessions">
            {openSessions.map(s => (
              <div
                key={s.id}
                className="dashboard-session-card"
                onClick={() => navigate('sessions')}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate('sessions')}
              >
                <div className="dashboard-session-left">
                  <div className="dashboard-session-name">{s.naam}</div>
                  <div className="dashboard-session-meta">
                    {s.datum}
                    <span className="badge badge-muted" style={{ marginLeft: 8 }}>
                      {s.type === 'kampioenschap' ? '🏆 Kampioenschap' : '🔄 Beerswap'}
                    </span>
                  </div>
                </div>
                <div className="dashboard-session-right">
                  <div className="flex-gap" style={{ justifyContent: 'flex-end' }}>
                    <span className="badge badge-hop">{s.session_participants?.length || 0} proever(s)</span>
                    <span className="badge badge-amber">{s.session_beers?.length || 0} bier(en)</span>
                  </div>
                  <div className="dashboard-session-arrow">→</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {openSessions.length === 0 && (
        <div
          className="card"
          style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', cursor: 'pointer' }}
          onClick={() => navigate('sessions')}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🍺</div>
          <p>Geen actieve proefsessies op dit moment.</p>
          <p style={{ fontSize: '0.82rem', marginTop: 8 }}>Tik om naar proefsessies te gaan →</p>
        </div>
      )}
    </div>
  )
}
