import { getAuth, getIdToken } from '@react-native-firebase/auth'

/**
 * Get Firebase ID token for authenticated user (Native)
 * @param forceRefresh When true, forces Firebase to refresh the ID token
 */
async function getFirebaseIdToken(forceRefresh = false): Promise<string | null> {
  try {
    // React Native Firebase SDK
    const auth = getAuth()
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
