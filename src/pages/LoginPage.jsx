import { useState, useEffect } from 'react'
import { signIn, signUp, getBreweries, resolveBreweryName } from '../lib/supabase'
import { Alert } from '../components/UI'
import { LogoGreen, HopsDecoration } from '../components/Logo'

export default function LoginPage() {
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [info, setInfo]     = useState('')
  const [breweries, setBreweries] = useState([])
  const [breweryMode, setBreweryMode] = useState('existing') // 'existing' | 'new'

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm, setRegForm]     = useState({
    email: '', password: '', username: '', breweryName: '', selectedBrewery: ''
  })

  // Load existing breweries for the register form
  useEffect(() => {
    if (tab === 'register') {
      getBreweries().then(setBreweries).catch(() => setBreweries([]))
    }
  }, [tab])

  async function handleLogin(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await signIn(loginForm.email, loginForm.password)
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Ongeldig e-mailadres of wachtwoord.'
        : err.message)
    } finally { setLoading(false) }
  }

  async function handleRegister(e) {
    e.preventDefault(); setError(''); setLoading(true)
    const { email, password, username, breweryName, selectedBrewery } = regForm
    let finalBrewery = breweryMode === 'existing' ? selectedBrewery : breweryName

    if (!email || !password || !username) {
      setError('E-mail, wachtwoord en gebruikersnaam zijn verplicht.'); setLoading(false); return
    }
    if (!finalBrewery) {
      setError('Selecteer of geef een brouwerijnaam op.'); setLoading(false); return
    }
    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens zijn.'); setLoading(false); return
    }
    try {
      // Normaliseer brouwerijnaam — als de naam al bestaat (case-insensitief) gebruik de canonical naam
      finalBrewery = await resolveBreweryName(finalBrewery)
      await signUp(email, password, username, finalBrewery)
      setInfo('Registratie gelukt! Je kunt nu direct inloggen.')
      setTab('login')
      setLoginForm(p => ({ ...p, email }))
    } catch (err) {
      setError(err.message.includes('already registered')
        ? 'Dit e-mailadres is al geregistreerd.'
        : err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-logo">
          <LogoGreen style={{ width: 160, margin: '0 auto 10px' }} />
          <p>Digitaal Proefplatform</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, opacity: 0.25 }}>
          <HopsDecoration style={{ width: 100 }} />
        </div>

        <div className="tabs">
          <div className={`tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); setInfo('') }}>
            Inloggen
          </div>
          <div className={`tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); setInfo('') }}>
            Registreren
          </div>
        </div>

        {error && <Alert type="error">{error}</Alert>}
        {info  && <Alert type="success">{info}</Alert>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">E-mailadres</label>
              <input className="form-input" type="email" autoFocus required
                value={loginForm.email}
                onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Wachtwoord</label>
              <input className="form-input" type="password" required
                value={loginForm.password}
                onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <button className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
              type="submit" disabled={loading}>
              {loading ? 'Bezig...' : 'Inloggen →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Gebruikersnaam <span className="req">*</span></label>
              <input className="form-input" required value={regForm.username}
                onChange={e => setRegForm(p => ({ ...p, username: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">E-mailadres <span className="req">*</span></label>
              <input className="form-input" type="email" required value={regForm.email}
                onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Wachtwoord <span className="req">*</span></label>
              <input className="form-input" type="password" required value={regForm.password}
                onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))} />
            </div>

            {/* Brouwerij — bestaand of nieuw */}
            <div className="form-group">
              <label className="form-label">Brouwerij <span className="req">*</span></label>
              <div className="flex-gap mb-1" style={{ gap: 16 }}>
                <label className="checkbox-label" style={{ cursor: 'pointer' }}>
                  <input type="radio" name="bmode" value="existing"
                    checked={breweryMode === 'existing'}
                    onChange={() => setBreweryMode('existing')} />
                  Bestaande brouwerij
                </label>
                <label className="checkbox-label" style={{ cursor: 'pointer' }}>
                  <input type="radio" name="bmode" value="new"
                    checked={breweryMode === 'new'}
                    onChange={() => setBreweryMode('new')} />
                  Nieuwe brouwerij
                </label>
              </div>

              {breweryMode === 'existing' ? (
                breweries.length > 0 ? (
                  <select className="form-select" value={regForm.selectedBrewery}
                    onChange={e => setRegForm(p => ({ ...p, selectedBrewery: e.target.value }))}>
                    <option value="">— selecteer brouwerij —</option>
                    {breweries.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                ) : (
                  <div className="alert alert-info" style={{ fontSize: '0.82rem' }}>
                    Nog geen brouwerijen geregistreerd. Kies "Nieuwe brouwerij".
                  </div>
                )
              ) : (
                <input className="form-input" required placeholder="Naam van jouw brouwerij"
                  value={regForm.breweryName}
                  onChange={e => setRegForm(p => ({ ...p, breweryName: e.target.value }))} />
              )}
            </div>

            <button className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
              type="submit" disabled={loading}>
              {loading ? 'Bezig...' : 'Account aanmaken →'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
