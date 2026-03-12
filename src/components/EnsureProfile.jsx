import { useEffect } from 'react'
import { id } from '@instantdb/react'
import { db } from '../lib/db'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com'

/**
 * 로그인한 사용자의 profile이 없으면 생성 (organizer/student 역할)
 */
export default function EnsureProfile({ children }) {
  const user = db.useUser()
  const { data } = db.useQuery(
    user
      ? {
          profiles: {
            $: {
              where: { '$user.id': user.id },
            },
          },
        }
      : null
  )

  useEffect(() => {
    if (!user || !data) return
    const profiles = data?.profiles ?? []
    if (profiles.length > 0) return

    const role =
      user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'organizer' : 'student'
    const profileId = id()
    db.transact(
      db.tx.profiles[profileId].update({ role }).link({ $user: user.id })
    )
  }, [user, data])

  return children
}
