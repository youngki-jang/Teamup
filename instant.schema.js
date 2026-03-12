import { i } from '@instantdb/react'

const schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
    }),
    profiles: i.entity({
      role: i.string(), // 'organizer' | 'student'
      name: i.string().optional(), // display name for students
    }),
    sessions: i.entity({
      code: i.string().unique().indexed(),
      status: i.string(), // 'active' | 'grouped' | 'ended'
      createdAt: i.number(),
    }),
    attendances: i.entity({
      manuallyAdded: i.boolean(),
      checkedInAt: i.number(),
      userEmail: i.string().optional(), // denormalized for display
      displayName: i.string().optional(), // name for group display (preferred over email)
    }),
    groups: i.entity({
      groupNumber: i.number(),
      memberIds: i.json(), // string[] (user ids)
    }),
  },
  links: {
    profileUser: {
      forward: { on: 'profiles', has: 'one', label: '$user' },
      reverse: { on: '$users', has: 'one', label: 'profile' },
    },
    sessionOrganizer: {
      forward: { on: 'sessions', has: 'one', label: 'organizer' },
      reverse: { on: '$users', has: 'many', label: 'sessions' },
    },
    attendanceSession: {
      forward: { on: 'attendances', has: 'one', label: 'session' },
      reverse: { on: 'sessions', has: 'many', label: 'attendances' },
    },
    attendanceUser: {
      forward: { on: 'attendances', has: 'one', label: 'user' },
      reverse: { on: '$users', has: 'many', label: 'attendances' },
    },
    groupSession: {
      forward: { on: 'groups', has: 'one', label: 'session' },
      reverse: { on: 'sessions', has: 'many', label: 'groups' },
    },
  },
})

export default schema
