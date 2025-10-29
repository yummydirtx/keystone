import { getAuth, getIdToken } from 'firebase/auth'
import { initializeApp, getApps } from 'firebase/app'
import { firebaseConfig } from '../provider/firebase.config'

// Keep track of whether we've attempted to initialize Firebase
let firebaseInitializationAttempted = false

/**
 * Get Firebase ID token for authenticated user (Web version)
 * @param forceRefresh When true, forces Firebase to refresh the ID token
 */
async function getFirebaseIdToken(forceRefresh = false): Promise<string | null> {
  try {
    // Web Firebase SDK
    // Check if Firebase app is already initialized
    let app
    const apps = getApps()
    if (apps.length > 0) {
      // Use the first initialized app
      app = apps[0]
    } else {
      // Only attempt to initialize Firebase once
      if (!firebaseInitializationAttempted) {
        // Initialize Firebase app if not already initialized
        app = initializeApp(firebaseConfig)
        firebaseInitializationAttempted = true
      } else {
        // Firebase initialization was attempted but failed
        console.warn('Firebase app not initialized and initialization already attempted')
        return null
      }
    }

    const auth = getAuth(app)
    const user = auth.currentUser
    if (user) {
      return await getIdToken(user, forceRefresh)
    }
    return null
  } catch (error) {
    console.error('Failed to get Firebase ID token:', error)
    return null
  }
}

export { getFirebaseIdToken }
