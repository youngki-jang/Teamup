import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../lib/db'
import './Login.css'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com'

export default function Login() {
  const navigate = useNavigate()
  const { isLoading, user } = db.useAuth()
  const [tab, setTab] = useState('admin')
  const [sentEmail, setSentEmail] = useState('')
  const [email, setEmail] = useState(ADMIN_EMAIL)
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
      navigate(isAdmin ? '/organizer' : '/check-in', { replace: true })
    }
  }, [user, navigate])

  if (isLoading) return <div className="login-page"><p>로딩 중...</p></div>
  if (user) return <div className="login-page"><p>리다이렉트 중...</p></div>

  const handleSendCode = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setMessage('')
    try {
      await db.auth.sendMagicCode({ email: email.trim() })
      setSentEmail(email.trim())
      setMessage('이메일로 인증 코드를 보냈습니다. 확인 후 입력하세요.')
    } catch (err) {
      setMessage(err?.body?.message || err?.message || '실패')
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
      setMessage(err?.body?.message || err?.message || '코드가 올바르지 않습니다.')
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
          onClick={() => setTab('admin')}
        >
          관리자
        </button>
        <button
          type="button"
          className={tab === 'student' ? 'active' : ''}
          onClick={() => setTab('student')}
        >
          학생
        </button>
      </div>

      <div className="login-form-wrap">
        {tab === 'admin' && (
          <p className="hint">관리자 이메일({ADMIN_EMAIL})로 로그인합니다.</p>
        )}
        {!sentEmail ? (
          <form onSubmit={handleSendCode} className="login-form">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              인증 코드 받기
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="login-form">
            <p className="sent-to">{sentEmail}로 코드를 보냈습니다.</p>
            <input
              type="text"
              placeholder="6자리 코드"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
            />
            <button type="submit" disabled={loading}>
              로그인
            </button>
            <button
              type="button"
              className="back"
              onClick={() => {
                setSentEmail('')
                setCode('')
                setMessage('')
              }}
            >
              이메일 다시 입력
            </button>
          </form>
        )}
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  )
}
