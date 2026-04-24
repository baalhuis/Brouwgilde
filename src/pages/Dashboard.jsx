import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getSessions, getBeers, getMyForms } from '../lib/supabase'
import { Spinner } from '../components/UI'

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function load() {
      const [sessions, beers, myForms] = await Promise.all([
        getSessions(),
        getBeers(),
        getMyForms(profile.id),
      ])
      setStats({
        totalBeers: beers.length,
        openSessions: sessions.filter(s => !s.closed),
        myForms: myForms.length,
        mySessions: sessions.filter(s => s.session_participants?.some(p => p.user_id === profile.id)),
      })
    }
    if (profile) load()
  }, [profile])

  if (!stats) return <Spinner />

  const { totalBeers, openSessions, myForms, mySessions } = stats

  return (
    <div>
      <div className="page-header">
        <h2>Welkom, {profile.username}! 🍺</h2>
        <p>Brouwgilde Breda — Digitaal Proefplatform</p>
      </div>

      <div className="form-row-3" style={{ marginBottom: 24 }}>
        {[
          ['🍺', totalBeers, 'Bieren in systeem'],
          ['🎯', openSessions.length, 'Actieve sessies'],
          ['📋', myForms, 'Jouw beoordelingen'],
          ['🏭', mySessions.length, 'Aangemeld voor'],
        ].map(([icon, num, label]) => (
          <div key={label} className="card" style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: '2rem' }}>{icon}</div>
            <div style={{ fontSize: '2rem', fontFamily: "'Playfair Display', serif", color: 'var(--amber-dark)', fontWeight: 700, lineHeight: 1.2 }}>{num}</div>
            <div className="text-muted">{label}</div>
          </div>
        ))}
      </div>

      {openSessions.length > 0 && (
        <>
          <h3 className="section-title">Actieve proefsessies</h3>
          <div className="card-grid">
            {openSessions.map(s => (
              <div key={s.id} className="card">
                <div className="card-title">{s.naam}</div>
                <div className="card-meta">{s.datum} · {s.type}</div>
                <div className="flex-gap mt-1">
                  <span className="badge badge-hop">{s.session_participants?.length || 0} proever(s)</span>
                  <span className="badge badge-amber">{s.session_beers?.length || 0} bier(en)</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
