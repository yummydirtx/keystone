import { useState, useEffect } from 'react'
import { useToastController } from '@my/ui'
import { useAuth } from '../../../provider/AuthProvider'
import { deleteCurrentUser } from '../../../utils/api'
import { useCurrentUser, useUpdateCurrentUser } from '../../../utils/queries.optimized'
import { useRouter } from 'solito/navigation'
import type { UserProfile } from '../../../types'

/**
 * Custom hook for managing settings screen state and user profile operations.
 * This hook provides comprehensive functionality for user profile management,
 * including profile updates, avatar changes, authentication status, and
 * platform-specific user profile handling.
 *
 * @returns {object} Settings screen state and handlers.
 * @returns {object} returns.firebaseUser - The current Firebase user object.
 * @returns {UserProfile | null} returns.effectiveUserProfile - The effective user profile (platform-specific).
 * @returns {boolean} returns.loading - Whether initial data is loading.
 * @returns {boolean} returns.updating - Whether a profile update is in progress.
 * @returns {'checking' | 'synced' | 'not-synced'} returns.syncStatus - The synchronization status between Firebase and backend.
 * @returns {string} returns.nameInput - The current value of the name input field.
 * @returns {boolean} returns.authLoading - Whether authentication is loading.
 * @returns {function} returns.setNameInput - Function to update the name input value.
 * @returns {function} returns.handleUpdateName - Async function to update the user's name.
 * @returns {function} returns.handleAvatarChange - Async function to update the user's avatar.
 * @returns {function} returns.refreshLocalStatus - Function to refresh local synchronization status.
 * @returns {function} returns.handleSignOut - Async function to sign out the user.
 * @returns {function} returns.loadUserProfile - Async function to reload the user profile.
 *
 * @example
 * // Basic usage in a settings screen
 * function SettingsScreen() {
 *   const {
 *     effectiveUserProfile,
 *     nameInput,
 *     setNameInput,
 *     handleUpdateName,
 *     updating
 *   } = useSettingsScreen()
 *
 *   return (
 *     <YStack>
 *       <Input value={nameInput} onChangeText={setNameInput} />
 *       <Button onPress={handleUpdateName} disabled={updating}>
 *         Update Name
 *       </Button>
 *     </YStack>
 *   )
 * }
 *
 * @example
 * // Using sync status for UI feedback
 * function SettingsScreen() {
 *   const { syncStatus, refreshLocalStatus } = useSettingsScreen()
 *
 *   return (
 *     <YStack>
 *       <Text>Status: {syncStatus}</Text>
 *       {syncStatus === 'not-synced' && (
 *         <Button onPress={refreshLocalStatus}>Refresh</Button>
 *       )}
 *     </YStack>
 *   )
 * }
 */
export function useSettingsScreen(): {
  firebaseUser: any
  effectiveUserProfile: UserProfile | null
  loading: boolean
  updating: boolean
  syncStatus: 'checking' | 'synced' | 'not-synced'
  nameInput: string
  authLoading: boolean
  setNameInput: (value: string) => void
  handleUpdateName: () => Promise<void>
  handleAvatarChange: (url: string) => Promise<void>
  refreshLocalStatus: () => void
  handleSignOut: () => Promise<void>
  handleDeleteAccount: () => Promise<void>
  loadUserProfile: () => Promise<void>
} {
  const {
    user: firebaseUser,
    userProfile: authUserProfile,
    signOut,
    loading: authLoading,
    refreshUserProfile,
  } = useAuth()
  const toast = useToastController()
  const router = useRouter()

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'checking' | 'synced' | 'not-synced'>('checking')
  const [nameInput, setNameInput] = useState('')

  // For mobile, use AuthProvider's userProfile. For web, manage our own.
  const isWeb = typeof window !== 'undefined'
  const effectiveUserProfile = isWeb ? userProfile : authUserProfile

  // Initialize nameInput when userProfile is available
  useEffect(() => {
    if (effectiveUserProfile?.name) {
      setNameInput(effectiveUserProfile.name)
    }
  }, [effectiveUserProfile])

  // Use TanStack Query for user profile (web version)
  const {
    data: queryUserProfile,
    isLoading: queryLoading,
    error: queryError,
    refetch: refetchUserProfile,
  } = useCurrentUser({
    enabled: isWeb && !!firebaseUser && !authLoading,
    retry: false,
  })

  // Mutation for updating current user (name or avatar)
  const updateUserMutation = useUpdateCurrentUser()

  // Load user profile (web version) - now using TanStack Query
  const loadUserProfile = async () => {
    if (!firebaseUser || authLoading) {
      return
    }
    await refetchUserProfile()
  }

  // Update sync status and loading based on TanStack Query state
  useEffect(() => {
    if (isWeb) {
      if (queryLoading) {
        setSyncStatus('checking')
        setLoading(true)
      } else if (queryError) {
        setSyncStatus('not-synced')
        setLoading(false)
      } else if (queryUserProfile) {
        setSyncStatus('synced')
        setUserProfile(queryUserProfile)
        setNameInput(queryUserProfile.name || '')
        setLoading(false)
      }
    } else {
      // Mobile: use AuthProvider's userProfile
      if (!authLoading) {
        if (authUserProfile) {
          setSyncStatus('synced')
          setLoading(false)
        } else {
          setSyncStatus('not-synced')
          setLoading(false)
        }
      }
    }
  }, [queryLoading, queryError, queryUserProfile, authLoading, authUserProfile, isWeb])

  // Handle navigation for unauthenticated users
  useEffect(() => {
    if (!authLoading && !firebaseUser && isWeb) {
      router.push('/')
    }
  }, [authLoading, firebaseUser, isWeb, router])

  const handleUpdateName = async () => {
    if (!nameInput.trim()) {
      toast.show('Validation Error', {
        message: 'Name cannot be empty',
      })
      return
    }

    try {
      setUpdating(true)

      const response = await updateUserMutation.mutateAsync({
        name: nameInput.trim(),
      })

      if ((response as any)?.user) {
        if (!isWeb) {
          // Mobile: refresh the user profile in AuthProvider
          await refreshUserProfile?.()
        }
        toast.show('Success', {
          message: 'Name updated successfully!',
        })
      }
    } catch (error) {
      console.error('Failed to update name:', error)
      toast.show('Error', {
        message: 'Failed to update name. Please try again.',
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleAvatarChange = async (url: string) => {
    try {
      setUpdating(true)
      const response = await updateUserMutation.mutateAsync({ avatar_url: url })
      if ((response as any)?.user) {
        if (!isWeb) {
          await refreshUserProfile?.()
        }
        toast.show('Success', {
          message: 'Avatar updated successfully!',
        })
      }
    } catch (error) {
      console.error('Failed to update avatar:', error)
      toast.show('Error', {
        message: 'Failed to update avatar. Please try again.',
      })
    } finally {
      setUpdating(false)
    }
  }

  const refreshLocalStatus = () => {
    if (isWeb) {
      loadUserProfile()
    } else {
      // Mobile: brief loading state for feedback
      setLoading(true)
      setTimeout(() => {
        setLoading(false)
        if (authUserProfile) {
          setSyncStatus('synced')
        } else {
          setSyncStatus('not-synced')
        }
      }, 500)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.show('Signed Out', {
        message: 'You have been signed out.',
      })
      if (isWeb) {
        router.push('/')
      }
      // Mobile sign out is handled by useEffect
    } catch (error) {
      console.error('Sign out failed:', error)
      toast.show('Error', {
        message: 'Failed to sign out',
      })
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setUpdating(true)

      const response = await deleteCurrentUser()

      toast.show('Account Deleted', {
        message: 'Your account and all associated data have been deleted.',
      })

      // Sign out and redirect after successful deletion
      await signOut()
      if (isWeb) {
        router.push('/')
      }
    } catch (error) {
      console.error('Failed to delete account:', error)
      toast.show('Error', {
        message: 'Failed to delete account. Please try again.',
      })
    } finally {
      setUpdating(false)
    }
  }

  return {
    // State
    firebaseUser,
    effectiveUserProfile,
    loading,
    updating,
    syncStatus,
    nameInput,
    authLoading,

    // Actions
    setNameInput,
    handleUpdateName,
    handleAvatarChange,
    refreshLocalStatus,
    handleSignOut,
    handleDeleteAccount,
    loadUserProfile,
  }
}
