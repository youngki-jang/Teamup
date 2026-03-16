/** @type {import('@instantdb/react').InstantRules} */
const rules = {
  $default: {
    allow: { $default: 'false' },
  },
  $users: {
    allow: {
      view: 'auth.id != null',
    },
  },
  profiles: {
    allow: {
      view: 'auth.id != null',
      create: 'auth.id != null',
      update: 'auth.id in data.ref("$user.id")',
    },
  },
  roster_lists: {
    allow: {
      view: 'auth.id == data.organizerId',
      create: 'auth.id != null',
      update: 'auth.id == data.organizerId',
      delete: 'auth.id == data.organizerId',
    },
  },
  sessions: {
    allow: {
      view: 'auth.id != null || (ruleParams.publicView == true && ruleParams.sessionId == data.id)',
      create: 'auth.id != null',
      update: 'auth.id in data.ref("organizer.id")',
      delete: 'auth.id in data.ref("organizer.id")',
    },
  },
  attendances: {
    allow: {
      view: 'auth.id != null || (ruleParams.publicView == true && ruleParams.sessionId in data.ref("session.id"))',
      create: 'auth.id != null',
      update: 'auth.id in data.ref("organizer.id") || auth.id in data.ref("user.id")',
      delete: 'auth.id in data.ref("organizer.id")',
    },
  },
  groups: {
    allow: {
      view: 'auth.id != null || (ruleParams.publicView == true && ruleParams.sessionId in data.ref("session.id"))',
      create: 'auth.id in data.ref("session.organizer.id")',
      update: 'auth.id in data.ref("session.organizer.id")',
      delete: 'auth.id in data.ref("session.organizer.id")',
    },
  },
}

export default rules
