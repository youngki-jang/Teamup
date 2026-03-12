import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { id } from '@instantdb/react'
import { db } from '../lib/db'
import EnsureProfile from '../components/EnsureProfile'
import './OrganizerConsole.css'

function generateCode() {
  return String(1000 + Math.floor(Math.random() * 9000))
}

export default function OrganizerConsole() {
  const navigate = useNavigate()
  const user = db.useUser()
  const [message, setMessage] = useState('')

  const { data } = db.useQuery(
    user
      ? {
          profiles: {
            $: { where: { $user: user.id } },
          },
        }
      : null
  )

  const profile = data?.profiles?.[0]
  const isOrganizer = profile?.role === 'organizer'

  const createSession = async () => {
    if (!user || !isOrganizer) return
    const code = generateCode()
    const sid = id()
    try {
      await db.transact(
        db.tx.sessions[sid]
          .update({
            code,
            status: 'active',
            createdAt: Date.now(),
          })
          .link({ organizer: user.id })
      )
      navigate(`/organizer/sessions/${sid}`)
      setMessage('')
    } catch (err) {
      setMessage(err?.message || '세션 생성 실패')
    }
  }

  if (!user) return null
  if (profile && !isOrganizer) {
    navigate('/check-in')
    return null
  }

  return (
    <EnsureProfile>
      <div className="organizer-console">
        <header>
          <h1>관리자 콘솔</h1>
          <div>
            <span>{user.email}</span>
            <button type="button" onClick={() => db.auth.signOut()}>
              로그아웃
            </button>
          </div>
        </header>

        <main>
          <section>
            <h2>세션</h2>
            <button type="button" onClick={createSession}>
              세션 생성
            </button>
          </section>

          {message && <p className="error-message">{message}</p>}
        </main>
      </div>
    </EnsureProfile>
  )
}
