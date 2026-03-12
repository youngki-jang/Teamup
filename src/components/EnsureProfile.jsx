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
    const role =
      user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'organizer' : 'student'

    if (profiles.length > 0) {
      // If student profile exists but has no name, try to set from localStorage (from login)
      const profile = profiles[0]
      if (role === 'student' && !profile.name) {
        try {
          const pending = localStorage.getItem('pendingDisplayName')
          if (pending) {
            localStorage.removeItem('pendingDisplayName')
            db.transact(db.tx.profiles[profile.id].update({ name: pending }))
          }
        } catch (_) {}
      }
      return
    }

    let name = null
    if (role === 'student') {
      try {
        name = localStorage.getItem('pendingDisplayName')
        if (name) localStorage.removeItem('pendingDisplayName')
      } catch (_) {}
    }
    const profileId = id()
    db.transact(
      db.tx.profiles[profileId]
        .update(name ? { role, name } : { role })
        .link({ $user: user.id })
    )
  }, [user, data])

  return children
}
