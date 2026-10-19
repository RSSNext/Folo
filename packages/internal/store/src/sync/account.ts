import { SyncMetaService } from "@follow/database/services/sync-meta"

/**
 * Which account the local data belongs to, and which account the credentials of the requests
 * belong to.
 *
 * The local database holds one account's data, the transaction queue's outbox included. The
 * credentials can change under it: a session ends without a sign-out, for instance because it
 * was revoked, and the next sign-in is to another account. Queued changes are sent only while
 * both name the same account, so a change made as one account never goes out with another
 * account's session.
 *
 * The session endpoint is the only source for the credentials' account. Until it answered for
 * the current credentials, at launch or after they changed, it is unknown.
 */

const LOCAL_DATA_OWNER_KEY = "localDataOwner"

export interface AnotherAccountEvent {
  /** The account the local data belongs to. */
  ownerUserId: string
  /** The account the current session belongs to. */
  sessionUserId: string
}

type SessionUserListener = (userId: string | null) => void
type AnotherAccountListener = (event: AnotherAccountEvent) => void

let localDataOwner: string | null = null
/**
 * Whether the owner recorded with the local data was read. A launch can get the session's
 * answer before that; the account it names then stands in as the owner until the recorded
 * one is known, and is compared with it then.
 */
let ownerLoaded = false
/** `undefined`: the session endpoint has not answered for the current credentials yet. */
let sessionUserId: string | null | undefined
/** Bumped when the credentials change, so answers to checks started before are ignored. */
let credentialsGeneration = 0
let pendingCheck: Promise<void> | null = null
let verifier: (() => Promise<unknown>) | null = null
const sessionUserListeners = new Set<SessionUserListener>()
const anotherAccountListeners = new Set<AnotherAccountListener>()

const persistOwner = (userId: string) =>
  SyncMetaService.set(LOCAL_DATA_OWNER_KEY, userId).catch((error) => {
    console.error("[account] failed to persist the owner of the local data", error)
  })

const reportAnotherAccount = (event: AnotherAccountEvent) => {
  for (const listener of anotherAccountListeners) {
    try {
      listener(event)
    } catch (error) {
      console.error("[account] another-account listener threw", error)
    }
  }
}

/**
 * Read the owner of the local data. A database from before owners were recorded belongs to
 * the account it was last signed in as, which is all the hydrated stores know at this point.
 */
export const loadLocalDataOwner = async (lastSignedInUserId: string | null | undefined) => {
  const stored = await SyncMetaService.get(LOCAL_DATA_OWNER_KEY).catch((error) => {
    console.error("[account] failed to read the owner of the local data", error)
    return null
  })
  // A session confirmed before the recorded owner was read only stood in for it. The recorded
  // one decides, so a session of another account, whose answer a launch can get first, is not
  // given the data and the changes the account before queued.
  const standIn = localDataOwner
  ownerLoaded = true
  localDataOwner = stored ?? lastSignedInUserId ?? standIn ?? null
  if (localDataOwner && localDataOwner !== stored) {
    await persistOwner(localDataOwner)
  }
  if (localDataOwner && sessionUserId && sessionUserId !== localDataOwner) {
    reportAnotherAccount({ ownerUserId: localDataOwner, sessionUserId })
  }
}

/** The account the local data belongs to, or `null` before any account claimed it. */
export const getLocalDataOwner = () => localDataOwner

/** The account of the current credentials: `null` when signed out, `undefined` when unknown. */
export const getSessionUserId = () => sessionUserId

const confirmSessionUser = (userId: string | null) => {
  sessionUserId = userId
  if (userId) {
    if (!localDataOwner) {
      localDataOwner = userId
      // Before the recorded owner was read this only stands in for it (see `loadLocalDataOwner`).
      if (ownerLoaded) void persistOwner(userId)
    } else if (localDataOwner !== userId) {
      reportAnotherAccount({ ownerUserId: localDataOwner, sessionUserId: userId })
    }
  }
  for (const listener of sessionUserListeners) {
    try {
      listener(userId)
    } catch (error) {
      console.error("[account] session listener threw", error)
    }
  }
}

/**
 * Wrap a request to the session endpoint. Its answer names the account of the credentials it
 * was sent with, so it is dropped when they changed while it was on its way.
 */
export const startSessionCheck = () => {
  const startedIn = credentialsGeneration
  let settle: () => void = () => {}
  const settled = new Promise<void>((resolve) => {
    settle = resolve
  })
  pendingCheck = settled
  const finish = () => {
    if (pendingCheck === settled) pendingCheck = null
    settle()
  }
  return {
    /** The endpoint answered: the credentials belong to this account, or to none. */
    confirm(userId: string | null) {
      if (startedIn === credentialsGeneration) confirmSessionUser(userId)
      finish()
    },
    /** The check is over. Without a confirmation before, nothing was learned. */
    end() {
      finish()
    },
  }
}

/** The credentials changed: their account is unknown until the session endpoint answers. */
export const invalidateSessionUser = () => {
  credentialsGeneration += 1
  sessionUserId = undefined
}

/** Ask the session endpoint who the credentials belong to, through the registered verifier. */
export const registerSessionVerifier = (verify: () => Promise<unknown>) => {
  verifier = verify
}

/**
 * Make sure the account of the credentials is known, asking the session endpoint when nobody
 * did yet. Resolves without an answer when the endpoint could not be reached.
 */
export const verifySessionUser = async (): Promise<string | null | undefined> => {
  if (sessionUserId !== undefined) return sessionUserId
  if (pendingCheck) {
    await pendingCheck
    if (sessionUserId !== undefined) return sessionUserId
  }
  if (!verifier) return sessionUserId
  try {
    await verifier()
  } catch {
    // Unreachable, or the check itself failed: still unknown.
  }
  return sessionUserId
}

/** Called whenever the session endpoint names the account of the current credentials. */
export const onSessionUserConfirmed = (listener: SessionUserListener) => {
  sessionUserListeners.add(listener)
  return () => {
    sessionUserListeners.delete(listener)
  }
}

/**
 * Called when a session for another account than the owner of the local data is confirmed.
 * The app then has to start over with an empty database: the data on screen and the changes
 * still queued belong to the account that was signed in before.
 */
export const onLocalDataOfAnotherAccount = (listener: AnotherAccountListener) => {
  anotherAccountListeners.add(listener)
  return () => {
    anotherAccountListeners.delete(listener)
  }
}

/** Forget everything in memory. The database is reset by the sync meta service. */
export const clearAccountInSession = () => {
  localDataOwner = null
  ownerLoaded = false
  sessionUserId = undefined
  credentialsGeneration += 1
  pendingCheck = null
}
