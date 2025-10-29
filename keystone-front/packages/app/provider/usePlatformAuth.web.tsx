import { useState, useEffect } from 'react'
import { firebaseConfig } from './firebase.config'
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
  firebaseApp: any | null // Expose Firebase app instance
  authInstance: any | null // Expose Firebase auth instance
}

export const usePlatformAuth = (): AuthHook => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authInstance, setAuthInstance] = useState<any>(null)
  const [firebaseApp, setFirebaseApp] = useState<any>(null)

  useEffect(() => {
    const initWebAuth = async () => {
      try {
        // Dynamically import Firebase web SDK
        const { initializeApp } = await import('firebase/app')
        const { getAuth, onAuthStateChanged } = await import('firebase/auth')

        // Initialize Firebase
        const app = initializeApp(firebaseConfig)
        const auth = getAuth(app)
        setAuthInstance(auth)
        setFirebaseApp(app) // Store the Firebase app instance

        // Initialize Firebase App Check (only if reCAPTCHA key is available)
        const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_API_KEY
        if (recaptchaKey) {
          try {
            const { initializeAppCheck, ReCaptchaV3Provider } = await import('firebase/app-check')
            const appCheck = initializeAppCheck(app, {
              provider: new ReCaptchaV3Provider(recaptchaKey),
              isTokenAutoRefreshEnabled: true, // Enables automatic token refresh for Firebase App Check.
            })
            // Firebase App Check initialized successfully
          } catch (appCheckError) {
            console.error('Failed to initialize App Check:', appCheckError)
          }
        } else {
          console.warn(
            'App Check not initialized: NEXT_PUBLIC_RECAPTCHA_API_KEY environment variable not set'
          )
        }

        // Subscribe to auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
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
        })

        return unsubscribe
      } catch (error) {
        console.error('Failed to initialize web auth:', error)
        setLoading(false)
      }
    }

    const cleanup = initWebAuth()
    return () => {
      cleanup.then((unsubscribe) => unsubscribe?.())
    }
  }, [])

  const signInWithGoogle = async () => {
    if (!authInstance) {
      throw new Error('Auth not initialized')
    }

    try {
      setLoading(true)
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth')

      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')

      await signInWithPopup(authInstance, provider)
    } catch (error) {
      console.error('Google Sign-In Error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithApple = async () => {
    if (!authInstance) {
      throw new Error('Auth not initialized')
    }

    try {
      setLoading(true)
      const { signInWithPopup, OAuthProvider } = await import('firebase/auth')

      const provider = new OAuthProvider('apple.com')
      provider.addScope('email')
      provider.addScope('name')

      await signInWithPopup(authInstance, provider)
    } catch (error) {
      console.error('Apple Sign-In Error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithEmailPassword = async (email: string, password: string) => {
    if (!authInstance) {
      throw new Error('Auth not initialized')
    }

    try {
      setLoading(true)
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      await signInWithEmailAndPassword(authInstance, email, password)
    } catch (error) {
      console.error('Email Sign-In Error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUpWithEmailPassword = async (email: string, password: string) => {
    if (!authInstance) {
      throw new Error('Auth not initialized')
    }

    try {
      setLoading(true)
      const { createUserWithEmailAndPassword } = await import('firebase/auth')
      await createUserWithEmailAndPassword(authInstance, email, password)
    } catch (error) {
      console.error('Email Sign-Up Error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (!authInstance) {
      throw new Error('Auth not initialized')
    }

    try {
      setLoading(true)
      const firebaseAuth = await import('firebase/auth')
      await firebaseAuth.signOut(authInstance)
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
    signOut,
    refreshUserProfile,
    firebaseApp,
    authInstance,
  }
}
