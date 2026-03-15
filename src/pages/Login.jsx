import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../lib/db'
import './Login.css'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com'

export default function Login() {
  const navigate = useNavigate()
  const { isLoading, user } = db.useAuth()
  const [tab, setTab] = useState('student')
  const [sentEmail, setSentEmail] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
      navigate(isAdmin ? '/organizer' : '/check-in', { replace: true })
    }
  }, [user, navigate])

  if (isLoading) return <div className="login-page"><p>Loading...</p></div>
  if (user) return <div className="login-page"><p>Redirecting...</p></div>

  const handleSendCode = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setMessage('')
    try {
      await db.auth.sendMagicCode({ email: email.trim() })
      setSentEmail(email.trim())
      if (tab === 'student' && name.trim()) {
        try { localStorage.setItem('pendingDisplayName', name.trim()) } catch (_) {}
      }
      setMessage('Verification code sent to your email. Check and enter it.')
    } catch (err) {
      setMessage(err?.body?.message || err?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setMessage('')
    try {
      await db.auth.signInWithMagicCode({ email: sentEmail, code: code.trim() })
      const isAdmin = sentEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()
      navigate(isAdmin ? '/organizer' : '/check-in')
    } catch (err) {
      setMessage(err?.body?.message || err?.message || 'Invalid code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <h1>TeamUp</h1>
      <p className="subtitle">Dynamic Class Grouper</p>

      <div className="login-tabs">
        <button
          type="button"
          className={tab === 'admin' ? 'active' : ''}
          onClick={() => { setTab('admin'); setEmail(ADMIN_EMAIL) }}
        >
          Organizer
        </button>
        <button
          type="button"
          className={tab === 'student' ? 'active' : ''}
          onClick={() => { setTab('student'); setEmail(''); setName('') }}
        >
          Student
        </button>
      </div>

      <div className="login-form-wrap">
        {tab === 'admin' && (
          <p className="hint">Sign in with organizer email ({ADMIN_EMAIL}).</p>
        )}
        {!sentEmail ? (
          <form onSubmit={handleSendCode} className="login-form">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {tab === 'student' && (
              <input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <button type="submit" disabled={loading}>
              Get verification code
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="login-form">
            <p className="sent-to">Code sent to {sentEmail}.</p>
            <input
              type="text"
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
            />
            <button type="submit" disabled={loading}>
              Sign in
            </button>
            <button
              type="button"
              className="back"
              onClick={() => {
                setSentEmail('')
                setCode('')
                setMessage('')
                try { localStorage.removeItem('pendingDisplayName') } catch (_) {}
              }}
            >
              Enter different email
            </button>
          </form>
        )}
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  )
}
