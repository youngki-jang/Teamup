import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { id } from '@instantdb/react'
import { db } from '../lib/db'
import EnsureProfile from '../components/EnsureProfile'
import './CheckIn.css'

export default function CheckIn() {
  const navigate = useNavigate()
  const user = db.useUser()
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')

  const { data: sessionData } = db.useQuery(
    code.length === 4
      ? {
          sessions: {
            $: { where: { code, status: 'active' } },
            attendances: { user: {} },
          },
        }
      : null
  )
  const { data: profileData } = db.useQuery(
    user ? { profiles: { $: { where: { '$user.id': user.id } } } } : null
  )

  const session = sessionData?.sessions?.[0]
  const profile = profileData?.profiles?.[0]
  const alreadyCheckedIn =
    session?.attendances?.some((a) => a.user?.id === user?.id) ?? false

  const handleCheckIn = async (e) => {
    e.preventDefault()
    if (!code.trim() || code.length !== 4 || !user) return
    if (!session) {
      setMessage('Invalid or expired session code.')
      return
    }
    if (alreadyCheckedIn) {
      setMessage('Already checked in.')
      navigate(`/my-team/${session.id}`)
      return
    }
    try {
      const attId = id()
      const displayName = profile?.name || user.email
      await db.transact(
        db.tx.attendances[attId]
          .update({
            manuallyAdded: false,
            checkedInAt: Date.now(),
            userEmail: user.email,
            displayName,
          })
          .link({ session: session.id, user: user.id })
      )
      setMessage('Check-in complete!')
      setCode('')
      navigate(`/my-team/${session.id}`)
    } catch (err) {
      setMessage(err?.message || 'Check-in failed')
    }
  }

  if (!user) return null

  return (
    <EnsureProfile>
      <div className="checkin-page">
        <header>
          <h1>Check-in</h1>
          <span>{user.email}</span>
          <button type="button" onClick={() => db.auth.signOut()}>
            Sign out
          </button>
        </header>
        <main>
          <form onSubmit={handleCheckIn}>
            <input
              type="text"
              placeholder="4-digit session code"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, '').slice(0, 4))
              }
              maxLength={4}
            />
            <button type="submit">Check in</button>
          </form>
          {message && (
            <p className={message.includes('complete') ? 'success' : 'error'}>
              {message}
            </p>
          )}
        </main>
      </div>
    </EnsureProfile>
  )
}
