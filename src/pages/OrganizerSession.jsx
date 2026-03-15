import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { id } from '@instantdb/react'
import { db } from '../lib/db'
import { createBalancedGroups } from '../utils/grouping'
import EnsureProfile from '../components/EnsureProfile'
import './OrganizerConsole.css'

function generateCode() {
  return String(1000 + Math.floor(Math.random() * 9000))
}

export default function OrganizerSession() {
  const { id: sessionId } = useParams()
  const navigate = useNavigate()
  const user = db.useUser()
  const [groupMode, setGroupMode] = useState('perGroup')
  const [groupValue, setGroupValue] = useState(4)
  const [manualEmail, setManualEmail] = useState('')
  const [message, setMessage] = useState('')

  const { data } = db.useQuery(
    user && sessionId
      ? {
          profiles: { $: { where: { $user: user.id } } },
          sessions: {
            $: { where: { id: sessionId } },
            organizer: {},
            attendances: { user: {} },
            groups: {},
          },
        }
      : null
  )

  const profile = data?.profiles?.[0]
  const session = data?.sessions?.[0]
  const attendances = session?.attendances ?? []
  const groups = session?.groups ?? []

  const isOrganizer = profile?.role === 'organizer'

  const removeAttendance = async (attId) => {
    try {
      await db.transact(db.tx.attendances[attId].delete())
      setMessage('')
    } catch (err) {
      setMessage(err?.message || 'Failed to remove')
    }
  }

  const endSession = async () => {
    if (!session) return
    try {
      await db.transact(db.tx.sessions[session.id].update({ status: 'ended' }))
      setMessage('')
    } catch (err) {
      setMessage(err?.message || 'Failed to end session')
    }
  }

  const shuffle = async () => {
    if (!session || attendances.length === 0) {
      setMessage('No attendees yet.')
      return
    }
    const attendeeIds = attendances.map((a) => a.user?.id).filter(Boolean)
    if (attendeeIds.length === 0) {
      setMessage('Could not get attendee IDs.')
      return
    }
    const newGroups = createBalancedGroups(attendeeIds, groupMode, groupValue)
    try {
      const deleteTxs = groups.map((g) => db.tx.groups[g.id].delete())
      const createTxs = newGroups.map((g) => {
        const gid = id()
        return db.tx.groups[gid]
          .update({ groupNumber: g.groupNumber, memberIds: g.memberIds })
          .link({ session: session.id })
      })
      await db.transact([...deleteTxs, ...createTxs])
      await db.transact(db.tx.sessions[session.id].update({ status: 'grouped' }))
      setMessage('')
    } catch (err) {
      setMessage(err?.message || 'Shuffle failed')
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
            <button type="button" onClick={() => navigate('/organizer')}>
              New session
            </button>
          </div>
        </header>

        <main>
          {session ? (
            <>
              <section>
                <h2>Session</h2>
                <p className="session-code">
                  Session code: <strong>{session.code}</strong>
                  {session.allowedEmails?.length > 0 && (
                    <span className="badge roster">Roster: {session.allowedEmails.length}</span>
                  )}
                  {session.status === 'ended' && (
                    <span className="badge ended">Ended</span>
                  )}
                  {session.status !== 'ended' && (
                    <button
                      type="button"
                      className="end-session-btn"
                      onClick={endSession}
                    >
                      End session
                    </button>
                  )}
                </p>
              </section>
              <section>
                <h2>Attendance ({attendances.length})</h2>
                <div className="attendance-list">
                  {attendances.length === 0 ? (
                    <p>No attendees</p>
                  ) : (
                    attendances.map((a) => (
                      <div key={a.id} className="attendance-item">
                        <span>{a.displayName || a.userEmail || a.user?.email || '?'}</span>
                        {a.manuallyAdded && <span className="badge">Manual</span>}
                        <button
                          type="button"
                          onClick={() => removeAttendance(a.id)}
                          disabled={session.status === 'ended'}
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>
              <section>
                <h2>Group assignment</h2>
                {session.status === 'ended' ? (
                  <p className="session-ended-hint">This session has ended. View only.</p>
                ) : null}
                <div className="group-controls">
                  <select
                    value={groupMode}
                    onChange={(e) => setGroupMode(e.target.value)}
                  >
                    <option value="perGroup">Members per group</option>
                    <option value="totalGroups">Total groups</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={groupValue}
                    onChange={(e) => setGroupValue(Number(e.target.value))}
                  />
                  <button
                    type="button"
                    onClick={shuffle}
                    disabled={session.status === 'ended'}
                  >
                    Shuffle
                  </button>
                </div>
                <div className="groups-preview">
                  {groups.length === 0 ? (
                    <p>Groups will appear after you run Shuffle.</p>
                  ) : (
                    groups
                      .sort((a, b) => a.groupNumber - b.groupNumber)
                      .map((g) => (
                        <div key={g.id} className="group-card">
                          <strong>Group {g.groupNumber}</strong>
                          <p>
                            {g.memberIds
                              ?.map(
                                (uid) => {
                                  const att = attendances.find((a) => a.user?.id === uid)
                                  return att?.displayName || att?.userEmail || att?.user?.email || uid
                                }
                              )
                              .join(', ')}
                          </p>
                        </div>
                      ))
                  )}
                </div>
                {groups.length > 0 && (
                  <button
                    type="button"
                    className="broadcast-btn"
                    onClick={() =>
                      window.open(`/master/${session.id}`, '_blank')
                    }
                  >
                    Open Master Board
                  </button>
                )}
              </section>
            </>
          ) : (
            <p>Session not found.</p>
          )}
          {message && <p className="error-message">{message}</p>}
        </main>
      </div>
    </EnsureProfile>
  )
}
