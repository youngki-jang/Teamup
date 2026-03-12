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
      setMessage(err?.message || '제거 실패')
    }
  }

  const shuffle = async () => {
    if (!session || attendances.length === 0) {
      setMessage('출석자가 없습니다.')
      return
    }
    const attendeeIds = attendances.map((a) => a.user?.id).filter(Boolean)
    if (attendeeIds.length === 0) {
      setMessage('출석자 ID를 가져올 수 없습니다.')
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
      setMessage(err?.message || 'Shuffle 실패')
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
            <button type="button" onClick={() => navigate('/organizer')}>
              새 세션
            </button>
          </div>
        </header>

        <main>
          {session ? (
            <>
              <section>
                <h2>세션</h2>
                <p className="session-code">
                  세션 코드: <strong>{session.code}</strong>
                </p>
              </section>
              <section>
                <h2>출석 목록 ({attendances.length}명)</h2>
                <div className="attendance-list">
                  {attendances.length === 0 ? (
                    <p>출석자 없음</p>
                  ) : (
                    attendances.map((a) => (
                      <div key={a.id} className="attendance-item">
                        <span>{a.userEmail || a.user?.email || '?'}</span>
                        {a.manuallyAdded && <span className="badge">수동</span>}
                        <button
                          type="button"
                          onClick={() => removeAttendance(a.id)}
                        >
                          제거
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>
              <section>
                <h2>그룹 배정</h2>
                <div className="group-controls">
                  <select
                    value={groupMode}
                    onChange={(e) => setGroupMode(e.target.value)}
                  >
                    <option value="perGroup">그룹당 인원</option>
                    <option value="totalGroups">총 그룹 수</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={groupValue}
                    onChange={(e) => setGroupValue(Number(e.target.value))}
                  />
                  <button type="button" onClick={shuffle}>
                    Shuffle
                  </button>
                </div>
                <div className="groups-preview">
                  {groups.length === 0 ? (
                    <p>Shuffle 실행 후 그룹이 표시됩니다.</p>
                  ) : (
                    groups
                      .sort((a, b) => a.groupNumber - b.groupNumber)
                      .map((g) => (
                        <div key={g.id} className="group-card">
                          <strong>Group {g.groupNumber}</strong>
                          <p>
                            {g.memberIds
                              ?.map(
                                (uid) =>
                                    attendances.find((a) => a.user?.id === uid)
                                      ?.userEmail ||
                                    attendances.find((a) => a.user?.id === uid)
                                      ?.user?.email ||
                                    uid
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
                    마스터 보드 열기
                  </button>
                )}
              </section>
            </>
          ) : (
            <p>세션을 찾을 수 없습니다.</p>
          )}
          {message && <p className="error-message">{message}</p>}
        </main>
      </div>
    </EnsureProfile>
  )
}
