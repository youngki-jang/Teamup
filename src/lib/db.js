import { init } from '@instantdb/react'
import schema from '../../instant.schema.js'

const appId = import.meta.env.VITE_INSTANT_APP_ID
if (!appId) {
  console.warn('VITE_INSTANT_APP_ID not set. Run: npx instant-cli init')
}

/**
 * InstantDB client — queries, transactions, auth, real-time
 * @see https://instantdb.com/docs
 */
export const db = init({
  appId: appId || '00000000-0000-0000-0000-000000000000',
  schema,
  useDateObjects: false,
})
