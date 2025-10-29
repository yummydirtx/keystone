import { useState, useEffect } from 'react'
import {
  getAuth,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
  GoogleAuthProvider,
  AppleAuthProvider,
} from '@react-native-firebase/auth'
import { getApp } from '@react-native-firebase/app'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { appleAuth } from '@invertase/react-native-apple-authentication'
import type { FirebaseAuthTypes } from '@react-native-firebase/auth'
import { syncUser } from '../utils/api'
import type { UserProfile } from '../types'

interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

interface AuthHook {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithApple: () => Promise<void>
  signInWithEmailPassword: (email: string, password: string) => Promise<void>
  signUpWithEmailPassword: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUserProfile: () => Promise<void>
  firebaseApp: any | null
  authInstance: any | null // Expose Firebase auth instance
}

export const usePlatformAuth = (): AuthHook => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Get Firebase app instance for React Native
  const firebaseApp = getApp()
  const [initialized, setInitialized] = useState(false)
  const [authInstance, setAuthInstance] = useState<FirebaseAuthTypes.Module | null>(null)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize Firebase Auth with modular API
        const app = getApp()
        const auth = getAuth(app)
        setAuthInstance(auth)

        // Configure Google Sign-In
        await GoogleSignin.configure({
          webClientId: '178901875479-9r27cpfmqc3o6tl7t2ibeh0i02gmev3q.apps.googleusercontent.com',
          offlineAccess: true,
        })

        setInitialized(true)

        // Subscribe to authentication state changes
        const unsubscribe = onAuthStateChanged(
          auth,
          async (firebaseUser: FirebaseAuthTypes.User | null) => {
            if (firebaseUser) {
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
              })

              // Sync user with backend after authentication and get user profile
              try {
                const response = await syncUser()
                if ((response as any).user) {
                  setUserProfile((response as any).user)
                }
              } catch (error) {
                console.error('Failed to sync user with backend:', error)
                setUserProfile(null)
                // Don't throw here as we don't want to block the authentication flow
              }
            } else {
              setUser(null)
              setUserProfile(null)
            }
            setLoading(false)
          }
        )

        return unsubscribe
      } catch (error) {
        console.error('Failed to configure Google Sign-In:', error)
        setInitialized(true) // Still set to true to avoid blocking
        setLoading(false)
        return undefined
      }
    }

    const cleanup = initializeAuth()
    return () => {
      cleanup.then((unsubscribe) => unsubscribe?.())
    }
  }, [])

  const signInWithGoogle = async () => {
    if (!initialized || !authInstance) {
      throw new Error('Auth not initialized')
    }

    try {
      setLoading(true)

      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })

      // Get the users ID token
      const userInfo = await GoogleSignin.signIn()

      if (!userInfo.data?.idToken) {
        throw new Error('Failed to get Google ID token')
      }

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(userInfo.data.idToken)

      // Sign-in the user with the credential
      await signInWithCredential(authInstance, googleCredential)
    } catch (error) {
      console.error('Google Sign-In Error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithApple = async () => {
    if (!initialized || !authInstance) {
      throw new Error('Auth not initialized')
    }

    try {
      setLoading(true)

      // Start the sign-in request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        // As per the FAQ of react-native-apple-authentication, the name should come first in the following array.
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      })

      // Ensure Apple returned a user identityToken
      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Sign-In failed - no identify token returned')
      }

      // Create a Firebase credential from the response
      const { identityToken, nonce } = appleAuthRequestResponse
      const appleCredential = AppleAuthProvider.credential(identityToken, nonce)

      // Sign the user in with the credential
      await signInWithCredential(authInstance, appleCredential)
    } catch (error) {
      console.error('Apple Sign-In Error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithEmailPassword = async (email: string, password: string) => {
    if (!initialized || !authInstance) {
      throw new Error('Auth not initialized')
    }

    try {
      setLoading(true)
      await authInstance.signInWithEmailAndPassword(email, password)
    } catch (error) {
      console.error('Email Sign-In Error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUpWithEmailPassword = async (email: string, password: string) => {
    if (!initialized || !authInstance) {
      throw new Error('Auth not initialized')
    }

    try {
      setLoading(true)
      await authInstance.createUserWithEmailAndPassword(email, password)
    } catch (error) {
      console.error('Email Sign-Up Error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    if (!authInstance) {
      throw new Error('Auth not initialized')
    }

    try {
      setLoading(true)

      // Sign out from Google
      await GoogleSignin.signOut()

      // Sign out from Firebase
      await signOut(authInstance)
    } catch (error) {
      console.error('Sign Out Error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const refreshUserProfile = async () => {
    if (!user) {
      return
    }

    try {
      const response = await syncUser()
      if ((response as any).user) {
        setUserProfile((response as any).user)
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error)
    }
  }

  return {
    user,
    userProfile,
    loading,
    signInWithGoogle,
    signInWithApple,
    signInWithEmailPassword,
    signUpWithEmailPassword,
    signOut: handleSignOut,
    refreshUserProfile,
    firebaseApp,
    authInstance,
  }
}
