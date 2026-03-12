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
          sessions: {
            $: { where: { 'organizer.id': user.id } },
            groups: {},
          },
        }
      : null
  )

  const profile = data?.profiles?.[0]
  const sessions = data?.sessions ?? []
  const isOrganizer = profile?.role === 'organizer'

  const activeSessions = sessions.filter((s) => s.status !== 'ended')
  const pastSessions = sessions.filter((s) => s.status === 'ended')

  const createSession = async () => {
    if (!user || !isOrganizer) return
    for (let i = 0; i < 5; i++) {
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
        return
      } catch (err) {
        if (i === 4) setMessage(err?.message || 'Failed to create session')
      }
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
          <h1>Organizer Console</h1>
          <div>
            <span>{user.email}</span>
            <button type="button" onClick={() => db.auth.signOut()}>
              Sign out
            </button>
          </div>
        </header>

        <main>
          <section>
            <h2>Sessions</h2>
            <button type="button" onClick={createSession}>
              Create session
            </button>
            {activeSessions.length > 0 && (
              <ul className="session-list">
                {activeSessions
                  .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
                  .map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/organizer/sessions/${s.id}`)}
                      >
                        Code {s.code} — {s.status}
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </section>

          {pastSessions.length > 0 && (
            <section>
              <h2>History (past sessions)</h2>
              <ul className="session-list">
                {pastSessions
                  .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
                  .map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/organizer/sessions/${s.id}`)}
                      >
                        Code {s.code} — {new Date(s.createdAt).toLocaleDateString()}
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          )}

          {message && <p className="error-message">{message}</p>}
        </main>
      </div>
    </EnsureProfile>
  )
}
