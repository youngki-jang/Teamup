import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { id } from '@instantdb/react'
import { db } from '../lib/db'
import EnsureProfile from '../components/EnsureProfile'
import './OrganizerConsole.css'

function generateCode() {
  return String(1000 + Math.floor(Math.random() * 9000))
}

function parseRosterText(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  const entries = []
  let emailCol = 0
  let nameCol = 1
  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split(/[,;\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ''))
    if (i === 0 && parts.some((p) => /email|e-mail/i.test(p))) {
      emailCol = parts.findIndex((p) => /email|e-mail/i.test(p))
      nameCol = parts.findIndex((p) => /name|student/i.test(p))
      if (nameCol < 0) nameCol = emailCol + 1
      continue
    }
    const email = (parts[emailCol] || parts[0])?.toLowerCase()
    if (email && email.includes('@')) {
      const name = (parts[nameCol] ?? parts[1] ?? '').trim()
      entries.push({ email, name })
    }
  }
  return entries
}

function handleRosterFile(file, setPaste) {
  const reader = new FileReader()
  reader.onload = (e) => setPaste(e.target?.result ?? '')
  reader.readAsText(file)
}

export default function OrganizerConsole() {
  const navigate = useNavigate()
  const user = db.useUser()
  const [message, setMessage] = useState('')
  const [showNewRoster, setShowNewRoster] = useState(false)
  const [newRosterName, setNewRosterName] = useState('')
  const [newRosterPaste, setNewRosterPaste] = useState('')

  const { data, isLoading } = db.useQuery(
    user
      ? {
          profiles: {
            $: { where: { $user: user.id } },
          },
          sessions: {
            $: { where: { 'organizer.id': user.id } },
            groups: {},
          },
          roster_lists: {
            $: { where: { organizerId: user.id } },
          },
        }
      : null
  )

  const profile = data?.profiles?.[0]
  const sessions = data?.sessions ?? []
  const rosterLists = data?.roster_lists ?? []
  const isOrganizer = profile?.role === 'organizer'

  const activeSessions = sessions.filter((s) => s.status !== 'ended')
  const pastSessions = sessions.filter((s) => s.status === 'ended')

  const saveRosterList = async () => {
    if (!user || !isOrganizer || !newRosterName.trim()) return
    const entries = parseRosterText(newRosterPaste)
    if (entries.length === 0) {
      setMessage('Paste at least one email (one per line, or "email, name")')
      return
    }
    const rid = id()
    try {
      await db.transact(
        db.tx.roster_lists[rid].update({
          name: newRosterName.trim(),
          entries,
          organizerId: user.id,
        })
      )
      setShowNewRoster(false)
      setNewRosterName('')
      setNewRosterPaste('')
      setMessage('')
    } catch (err) {
      setMessage(err?.message || 'Failed to save roster')
    }
  }

  const deleteRosterList = async (rid) => {
    try {
      await db.transact(db.tx.roster_lists[rid].delete())
    } catch (err) {
      setMessage(err?.message || 'Failed to delete')
    }
  }

  const deleteSession = async (s) => {
    if (!confirm(`Delete session ${s.code}? This cannot be undone.`)) return
    try {
      await db.transact(db.tx.sessions[s.id].delete())
      setMessage('')
    } catch (err) {
      setMessage(err?.message || 'Failed to delete session')
    }
  }

  const createSession = async (rosterListId = null) => {
    if (!user || !isOrganizer) return
    const activeCodes = new Set(
      sessions.filter((s) => s.status !== 'ended').map((s) => s.code)
    )
    let code
    for (let i = 0; i < 20; i++) {
      const candidate = generateCode()
      if (!activeCodes.has(candidate)) { code = candidate; break }
    }
    if (!code) {
      setMessage('Could not generate a unique session code. Try again.')
      return
    }
    const sid = id()
    try {
      const rosterList = rosterListId ? rosterLists.find((r) => r.id === rosterListId) : null
      const allowedEmails = rosterList?.entries ?? null
      const links = { organizer: user.id }
      if (rosterListId) links.rosterList = rosterListId
      await db.transact(
        db.tx.sessions[sid]
          .update({ code, status: 'active', createdAt: Date.now(), allowedEmails })
          .link(links)
      )
      navigate(`/organizer/sessions/${sid}`)
      setMessage('')
    } catch (err) {
      setMessage(err?.message || 'Failed to create session')
    }
  }

  useEffect(() => {
    if (profile && !isOrganizer) navigate('/check-in', { replace: true })
  }, [profile, isOrganizer, navigate])

  if (!user || isLoading) return <div className="loading">Loading...</div>
  if (profile && !isOrganizer) return null

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
            <h2>Roster lists</h2>
            <p className="hint">Paste Canvas export (email or "email, name" per line). Use for session whitelist.</p>
            {!showNewRoster ? (
              <button type="button" onClick={() => setShowNewRoster(true)}>
                Add roster list
              </button>
            ) : (
              <div className="roster-form">
                <input
                  type="text"
                  placeholder="List name (e.g. CS101 Fall 2025)"
                  value={newRosterName}
                  onChange={(e) => setNewRosterName(e.target.value)}
                />
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => e.target.files?.[0] && handleRosterFile(e.target.files[0], setNewRosterPaste)}
                />
                <textarea
                  placeholder="Or paste: email or email, name (one per line)"
                  value={newRosterPaste}
                  onChange={(e) => setNewRosterPaste(e.target.value)}
                  rows={6}
                />
                <div>
                  <button type="button" onClick={saveRosterList}>
                    Save
                  </button>
                  <button type="button" onClick={() => { setShowNewRoster(false); setNewRosterName(''); setNewRosterPaste('') }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {rosterLists.length > 0 && (
              <ul className="roster-list">
                {rosterLists.map((r) => (
                  <li key={r.id}>
                    <span>{r.name} ({(r.entries ?? []).length})</span>
                    <button type="button" onClick={() => deleteRosterList(r.id)}>Delete</button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2>Sessions</h2>
            <button type="button" onClick={() => createSession()}>
              Create session (anyone can join)
            </button>
            {rosterLists.length > 0 && (
              <div className="create-with-roster">
                <span>Or create with roster:</span>
                {rosterLists.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => createSession(r.id)}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            )}
            {activeSessions.length > 0 && (
              <ul className="session-list">
                {activeSessions
                  .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
                  .map((s) => (
                    <li key={s.id} className="session-list-item">
                      <button
                        type="button"
                        onClick={() => navigate(`/organizer/sessions/${s.id}`)}
                      >
                        Code {s.code} — {s.status}
                      </button>
                      <button type="button" className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteSession(s) }} title="Delete">×</button>
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
                    <li key={s.id} className="session-list-item">
                      <button
                        type="button"
                        onClick={() => navigate(`/organizer/sessions/${s.id}`)}
                      >
                        Code {s.code} — {new Date(s.createdAt).toLocaleDateString()}
                      </button>
                      <button type="button" className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteSession(s) }} title="Delete">×</button>
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
