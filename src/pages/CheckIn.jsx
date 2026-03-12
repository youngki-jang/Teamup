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

  const { data } = db.useQuery(
    code.length === 4
      ? {
          sessions: {
            $: { where: { code, status: 'active' } },
            attendances: { user: {} },
          },
        }
      : null
  )

  const session = data?.sessions?.[0]
  const alreadyCheckedIn =
    session?.attendances?.some((a) => a.user?.id === user?.id) ?? false

  const handleCheckIn = async (e) => {
    e.preventDefault()
    if (!code.trim() || code.length !== 4 || !user) return
    if (!session) {
      setMessage('세션 코드가 올바르지 않거나 만료되었습니다.')
      return
    }
    if (alreadyCheckedIn) {
      setMessage('이미 체크인되었습니다.')
      navigate(`/my-team/${session.id}`)
      return
    }
    try {
      const attId = id()
      await db.transact(
        db.tx.attendances[attId]
          .update({
            manuallyAdded: false,
            checkedInAt: Date.now(),
            userEmail: user.email,
          })
          .link({ session: session.id, user: user.id })
      )
      setMessage('체크인 완료!')
      setCode('')
      navigate(`/my-team/${session.id}`)
    } catch (err) {
      setMessage(err?.message || '체크인 실패')
    }
  }

  if (!user) return null

  return (
    <EnsureProfile>
      <div className="checkin-page">
        <header>
          <h1>체크인</h1>
          <span>{user.email}</span>
          <button type="button" onClick={() => db.auth.signOut()}>
            로그아웃
          </button>
        </header>
        <main>
          <form onSubmit={handleCheckIn}>
            <input
              type="text"
              placeholder="4자리 세션 코드"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, '').slice(0, 4))
              }
              maxLength={4}
            />
            <button type="submit">체크인</button>
          </form>
          {message && (
            <p className={message.includes('완료') ? 'success' : 'error'}>
              {message}
            </p>
          )}
        </main>
      </div>
    </EnsureProfile>
  )
}
