import React, { useState, useEffect, useCallback } from 'react'
import {
  Button,
  H1,
  YStack,
  Paragraph,
  Spinner,
  ScrollView,
  XStack,
  Text,
  Card,
  Separator,
} from '@my/ui'
import { SwitchThemeButton } from '@my/ui'
import { NavigationBar } from '../../components/NavigationBar'
import { Footer } from '../../components/Footer'
import { RefreshableScrollView } from '../../components/RefreshableScrollView'
import { UserMenu } from '../../components/UserMenu'
import { LoginScreen } from '../auth/LoginScreen'
import { KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'solito/navigation'
import { useSettingsScreen } from './hooks/useSettingsScreen'
import { UserProfileSection } from './components/SettingsComponents'
import { AvatarUploader } from './components/AvatarUploader'
import { DeleteAccountDialog } from './components/DeleteAccountDialog'
import { NotificationPreferencesCard } from './components/NotificationPreferencesCard'
import { useScreenTopPadding } from '../../hooks/useSafeAreaPadding'

export function SettingsScreen() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const screenTopPadding = useScreenTopPadding()

  const {
    firebaseUser,
    effectiveUserProfile,
    loading,
    updating,
    syncStatus,
    nameInput,
    authLoading,
    setNameInput,
    handleUpdateName,
    handleAvatarChange,
    refreshLocalStatus,
    handleSignOut,
    handleDeleteAccount,
  } = useSettingsScreen()

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refreshLocalStatus()
    } finally {
      setRefreshing(false)
    }
  }, [refreshLocalStatus])

  // Handle mobile navigation when user is not authenticated
  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.replace('/')
    }
  }, [authLoading, firebaseUser, router])

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <>
        <NavigationBar onMenuPress={() => setMenuOpen(!menuOpen)} />
        <YStack
          flex={1}
          justify="center"
          items="center"
          bg="$background"
        >
          <Spinner size="large" />
          <Paragraph
            mt="$4"
            color="$color11"
          >
            Initializing...
          </Paragraph>
        </YStack>
        <Footer />
        <UserMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          variant="dropdown"
        />
      </>
    )
  }

  // Show login screen if not authenticated
  if (!firebaseUser) {
    return <LoginScreen />
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <>
        <NavigationBar onMenuPress={() => setMenuOpen(!menuOpen)} />

        <RefreshableScrollView
          flex={1}
          p="$4"
          pt={screenTopPadding}
          bg="$background"
          refreshing={refreshing}
          onRefresh={handleRefresh}
        >
          <YStack
            gap="$6"
            maxW={800}
            width="100%"
            mx="auto"
          >
            {/* Profile Section */}
            <Card
              p="$4"
              elevation="$2"
              bg="$background"
            >
              <YStack gap="$4">
                <Text
                  fontSize="$5"
                  fontWeight="bold"
                  color="$color12"
                  mb="$2"
                >
                  Profile
                </Text>

                <AvatarUploader
                  userProfile={effectiveUserProfile}
                  onAvatarChange={handleAvatarChange}
                  isUpdating={updating}
                />

                <UserProfileSection
                  loading={loading}
                  syncStatus={syncStatus}
                  userProfile={effectiveUserProfile}
                  nameInput={nameInput}
                  updating={updating}
                  onNameInputChange={setNameInput}
                  onUpdateName={handleUpdateName}
                  onRetry={refreshLocalStatus}
                />
              </YStack>
            </Card>

            {/* Notification Preferences - Only show on native platforms */}
            {Platform.OS !== 'web' && <NotificationPreferencesCard isUpdating={updating} />}

            {/* Appearance Settings */}
            <Card
              p="$4"
              elevation="$2"
              bg="$background"
            >
              <YStack gap="$4">
                <Text
                  fontSize="$5"
                  fontWeight="bold"
                  color="$color12"
                >
                  Appearance
                </Text>
                <XStack
                  items="center"
                  justify="space-between"
                >
                  <Text
                    fontSize="$4"
                    color="$color11"
                  >
                    Theme
                  </Text>
                  <SwitchThemeButton />
                </XStack>
              </YStack>
            </Card>

            {/* Account Actions */}
            <Card
              p="$4"
              elevation="$2"
              bg="$background"
              mb="$6"
            >
              <YStack gap="$4">
                <Text
                  fontSize="$5"
                  fontWeight="bold"
                  color="$color12"
                >
                  Account
                </Text>

                <Separator />

                <YStack gap="$3">
                  <Button
                    onPress={handleSignOut}
                    size="$4"
                    theme="red"
                    variant="outlined"
                  >
                    Sign Out
                  </Button>

                  <Button
                    onPress={() => setDeleteDialogOpen(true)}
                    size="$4"
                    variant="outlined"
                    theme="red"
                  >
                    Delete Account
                  </Button>
                </YStack>
              </YStack>
            </Card>
          </YStack>
        </RefreshableScrollView>

        <Footer />
        <UserMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          variant="dropdown"
        />

        <DeleteAccountDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteAccount}
          isDeleting={updating}
        />
      </>
    </KeyboardAvoidingView>
  )
}
