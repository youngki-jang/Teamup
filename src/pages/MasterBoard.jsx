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

  const emailMap = Object.fromEntries(
    attendances
      .map((a) => [a.user?.id, a.userEmail || a.user?.email])
      .filter(([id]) => id)
  )

  return (
    <div className="master-board">
      <h1>TeamUp — 그룹 배정</h1>
      {!session ? (
        <p>세션을 찾을 수 없습니다.</p>
      ) : groups.length === 0 ? (
        <p className="empty-state">그룹이 아직 배정되지 않았습니다.</p>
      ) : (
        <div className="groups-grid">
          {groups
            .sort((a, b) => a.groupNumber - b.groupNumber)
            .map((g) => (
              <div key={g.id} className="group-panel">
                <h2>Group {g.groupNumber}</h2>
                <p>
                  {(g.memberIds ?? [])
                    .map((uid) => emailMap[uid] ?? uid)
                    .join(', ')}
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
