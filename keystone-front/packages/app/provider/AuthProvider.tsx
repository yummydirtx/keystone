import type React from 'react'
import { createContext, useContext, type ReactNode, useState } from 'react'
import { usePlatformAuth } from './usePlatformAuth'
import type { UserProfile } from '../types'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCurrentUser, updateCurrentUser } from '../utils/api'
import { queryKeys } from '../utils/queries.optimized'

interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

interface GuestSession {
  token: string
  permissions: string
  categoryId: number
}

export interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithApple: () => Promise<void>
  signInWithEmailPassword: (email: string, password: string) => Promise<void>
  signUpWithEmailPassword: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUserProfile: () => Promise<void>
  firebaseApp?: any
  authInstance?: any
  showWelcomeScreen: boolean
  completeOnboarding: () => void
  getUserDisplayName: () => string
  isGuest: boolean
  guestSession: GuestSession | null
  setGuestSession: (session: GuestSession | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = usePlatformAuth()
  const queryClient = useQueryClient()

  // Prefer React Query for current user profile when available
  const {
    data: currentUserProfile,
    isLoading: currentUserLoading,
    refetch: refetchCurrentUser,
  } = useQuery({
    queryKey: queryKeys.currentUser(),
    queryFn: async ({ signal }) => {
      const response = await getCurrentUser(signal)
      return (response as any).user as UserProfile
    },
    enabled: !!auth.user && !auth.loading,
  })

  // Guest session state
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null)
  const isGuest = Boolean(guestSession)

  // Compute effective profile preferring query (web + when available), fallback to platform profile (native)
  const effectiveUserProfile: UserProfile | null = currentUserProfile ?? auth.userProfile

  // Show welcome screen if user exists but has no name AND no avatar set
  // Prefer query data when available
  const showWelcomeScreen = Boolean(
    auth.user &&
      !auth.loading &&
      effectiveUserProfile &&
      (!effectiveUserProfile.name || effectiveUserProfile.name.trim() === '') &&
      (!effectiveUserProfile.avatar_url || effectiveUserProfile.avatar_url.trim() === '')
  )

  const completeOnboarding = async () => {
    try {
      // When user skips onboarding, we need to mark it as complete
      // We'll set name to empty string to indicate onboarding was completed
      // The backend will store this as null, but it marks the onboarding flow as done
      await updateCurrentUser({ name: 'Keystone User' })
      // Force refresh of user profile cache to hide welcome screen
      await refetchCurrentUser()
      // Also refresh platform profile on native as a fallback
      await auth.refreshUserProfile()
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      // Even if the update fails, refresh profiles
      await refetchCurrentUser().catch(() => {})
      auth.refreshUserProfile()
    }
  }

  const getUserDisplayName = () => {
    if (effectiveUserProfile?.name) {
      return effectiveUserProfile.name
    }
    if (auth.user?.displayName) {
      return auth.user.displayName
    }
    if (auth.user?.email) {
      return auth.user.email.split('@')[0]
    }
    return 'User'
  }

  // Wrap refreshUserProfile to also refetch the React Query cache
  const refreshUserProfile = async () => {
    try {
      if (auth.user && !auth.loading) {
        await refetchCurrentUser()
      }
    } finally {
      // Always attempt platform refresh too (helps native flows)
      await auth.refreshUserProfile()
    }
  }

  // Wrap signOut to ensure React Query cache is fully reset on logout
  const signOut = async () => {
    try {
      // First perform platform sign out (clears Firebase/session)
      await auth.signOut()
    } finally {
      // Then clear all React Query caches to avoid leaking previous user's data
      // Clear removes cached data and observers
      queryClient.clear()
      // As a safety, also reset any ongoing queries' states and cancel inflight
      await queryClient.cancelQueries()
      await queryClient.resetQueries({ predicate: () => true })
    }
  }

  const value: AuthContextType = {
    ...auth,
    signOut,
    showWelcomeScreen,
    completeOnboarding,
    getUserDisplayName,
    isGuest,
    guestSession,
    setGuestSession,
    // Prefer query result for userProfile exposed via context
    userProfile: effectiveUserProfile,
    refreshUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
