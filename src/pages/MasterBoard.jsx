import { useParams } from 'react-router-dom'
import { db } from '../lib/db'
import './MasterBoard.css'

export default function MasterBoard() {
  const { sessionId } = useParams()

  const { data } = db.useQuery(
    sessionId
      ? {
          sessions: {
            $: { where: { id: sessionId } },
            groups: {},
            attendances: { user: {} },
          },
        }
      : null,
    { ruleParams: { publicView: true, sessionId } }
  )

  const session = data?.sessions?.[0]
  const groups = session?.groups ?? []
  const attendances = session?.attendances ?? []

  const nameMap = Object.fromEntries(
    attendances
      .map((a) => [a.user?.id, a.displayName || a.userEmail || a.user?.email])
      .filter(([id]) => id)
  )

  return (
    <div className="master-board">
      <h1>TeamUp — Group Assignment</h1>
      {!session ? (
        <p>Session not found.</p>
      ) : groups.length === 0 ? (
        <p className="empty-state">Groups have not been assigned yet.</p>
      ) : (
        <div className="groups-grid">
          {groups
            .sort((a, b) => a.groupNumber - b.groupNumber)
            .map((g) => (
              <div key={g.id} className="group-panel">
                <h2>Group {g.groupNumber}</h2>
                <p>
                  {(g.memberIds ?? [])
                    .map((uid) => nameMap[uid] ?? uid)
                    .join(', ')}
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
