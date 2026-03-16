import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../lib/db'
import EnsureProfile from '../components/EnsureProfile'
import './MyTeam.css'

export default function MyTeam() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const user = db.useUser()

  const { data, isLoading } = db.useQuery(
    user && sessionId
      ? {
          sessions: {
            $: { where: { id: sessionId } },
            attendances: { user: {} },
            groups: {},
          },
        }
      : null
  )

  if (isLoading) return <div className="loading">Loading...</div>

  const session = data?.sessions?.[0]
  const attendances = session?.attendances ?? []
  const groups = session?.groups ?? []

  const myAttendance = attendances.find((a) => a.user?.id === user?.id)
  const myGroup = myAttendance
    ? groups.find((g) => g.memberIds?.includes(user?.id))
    : null
  const teammateIds =
    myGroup?.memberIds?.filter((id) => id !== user?.id) ?? []
  const teammates = teammateIds.map((uid) => {
    const att = attendances.find((a) => a.user?.id === uid)
    return att ? { id: att.user?.id, name: att.displayName || att.userEmail || att.user?.email } : null
  }).filter(Boolean)

  if (!user) return null

  return (
    <EnsureProfile>
      <div className="my-team-page">
        <header>
          <h1>My Team</h1>
          <span>{user.email}</span>
          <button type="button" onClick={() => navigate('/check-in')}>
            Check in to another session
          </button>
          <button type="button" onClick={() => db.auth.signOut()}>
            Sign out
          </button>
        </header>

        <main>
          {!session ? (
            <p className="error">Session not found.</p>
          ) : !myAttendance ? (
            <p className="error">
              You are not checked in to this session. Please check in first.
            </p>
          ) : !myGroup ? (
            <p className="waiting">Groups have not been assigned yet.</p>
          ) : (
            <>
              <p className="group-badge">
                You are in Group {myGroup.groupNumber}
              </p>
              <div className="teammates">
                <h2>Teammates</h2>
                {teammates.length === 0 ? (
                  <p>No teammates. (Solo group)</p>
                ) : (
                  <ul>
                    {teammates.map((t) => (
                      <li key={t.id}>{t.name}</li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </EnsureProfile>
  )
}
