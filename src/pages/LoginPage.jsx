import { useState } from 'react'
import { signIn, signUp } from '../lib/supabase'
import { Alert } from '../components/UI'
import { LogoGreen } from '../components/Logo'

export default function LoginPage() {
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm, setRegForm] = useState({ email: '', password: '', username: '', breweryName: '' })

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
    const { email, password, username, breweryName } = regForm
    if (!email || !password || !username || !breweryName) {
      setError('Alle velden zijn verplicht.'); setLoading(false); return
    }
    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens zijn.'); setLoading(false); return
    }
    try {
      await signUp(email, password, username, breweryName)
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
          <LogoGreen style={{ maxWidth: 220, margin: '0 auto 16px' }} />
          <p>Digitaal Proefplatform</p>
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
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
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
            <div className="form-group">
              <label className="form-label">Naam brouwerij <span className="req">*</span></label>
              <input className="form-input" required placeholder="Jouw brouwerijnaam"
                value={regForm.breweryName}
                onChange={e => setRegForm(p => ({ ...p, breweryName: e.target.value }))} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
              type="submit" disabled={loading}>
              {loading ? 'Bezig...' : 'Account aanmaken →'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
