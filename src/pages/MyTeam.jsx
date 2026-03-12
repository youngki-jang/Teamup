import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../lib/db'
import EnsureProfile from '../components/EnsureProfile'
import './MyTeam.css'

export default function MyTeam() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const user = db.useUser()

  const { data } = db.useQuery(
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
    return att ? { id: att.user?.id, email: att.userEmail || att.user?.email } : null
  }).filter(Boolean)

  if (!user) return null

  return (
    <EnsureProfile>
      <div className="my-team-page">
        <header>
          <h1>My Team</h1>
          <span>{user.email}</span>
          <button type="button" onClick={() => navigate('/check-in')}>
            다른 세션 체크인
          </button>
          <button type="button" onClick={() => db.auth.signOut()}>
            로그아웃
          </button>
        </header>

        <main>
          {!session ? (
            <p className="error">세션을 찾을 수 없습니다.</p>
          ) : !myAttendance ? (
            <p className="error">
              이 세션에 체크인되어 있지 않습니다. 먼저 체크인해 주세요.
            </p>
          ) : !myGroup ? (
            <p className="waiting">그룹이 아직 배정되지 않았습니다.</p>
          ) : (
            <>
              <p className="group-badge">
                You are in Group {myGroup.groupNumber}
              </p>
              <div className="teammates">
                <h2>팀원</h2>
                {teammates.length === 0 ? (
                  <p>팀원이 없습니다. (혼자인 그룹)</p>
                ) : (
                  <ul>
                    {teammates.map((t) => (
                      <li key={t.id}>{t.email}</li>
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
