import React, { useState } from 'react'
import {
  Button,
  H1,
  YStack,
  XStack,
  Paragraph,
  useToastController,
  Spinner,
  ScrollView,
  Text,
  Card,
  Separator,
} from '@my/ui'
import { SwitchThemeButton } from '@my/ui'
import { ChevronLeft } from '@tamagui/lucide-icons'
import { NavigationBar } from '../../components/NavigationBar'
import { Footer } from '../../components/Footer'
import { UserMenu } from '../../components/UserMenu'
import { LoginScreen } from '../auth/LoginScreen'
import { useSettingsScreen } from './hooks/useSettingsScreen'
import { useCurrentUser } from '../../utils/queries.optimized'
import { UserProfileSection } from './components/SettingsComponents'
import { AvatarUploader } from './components/AvatarUploader'
import { DeleteAccountDialog } from './components/DeleteAccountDialog'
import { useScreenTopPadding } from '../../hooks/useSafeAreaPadding'

export function SettingsScreen() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
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

  // Also subscribe to the React Query cache directly on web for immediate UI updates
  const { data: currentUser, isLoading: userQueryLoading } = useCurrentUser({
    enabled: !!firebaseUser && !authLoading,
  })

  const displayUserProfile = currentUser ?? effectiveUserProfile

  // Show loading state while auth is initializing
  if (authLoading || userQueryLoading) {
    return (
      <>
        <NavigationBar onMenuPress={() => setMenuOpen(!menuOpen)} />
        <YStack
          flex={1}
          justify="center"
          items="center"
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
    <>
      <NavigationBar onMenuPress={() => setMenuOpen(!menuOpen)} />

      <ScrollView
        flex={1}
        p="$4"
        pt={screenTopPadding}
        pb="$8"
      >
        <YStack
          gap="$6"
          maxW={800}
          width="100%"
          mx="auto"
        >
          {/* Header with Back Button */}
          <XStack
            items="center"
            gap="$3"
            mb="$2"
          >
            <Button
              size="$4"
              circular
              icon={ChevronLeft}
              onPress={() => {
                if (typeof window !== 'undefined' && window.history) {
                  window.history.back()
                }
              }}
              variant="outlined"
              chromeless
              aria-label="Go back to previous page"
            />
            <H1
              flex={1}
              text="center"
              color="$color12"
            >
              Settings
            </H1>
            {/* Spacer to balance the back button */}
            <YStack width="$4" />
          </XStack>

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
                userProfile={displayUserProfile}
                onAvatarChange={handleAvatarChange}
                isUpdating={updating}
              />

              <UserProfileSection
                loading={loading || userQueryLoading}
                syncStatus={syncStatus}
                userProfile={displayUserProfile}
                nameInput={nameInput}
                updating={updating}
                onNameInputChange={setNameInput}
                onUpdateName={handleUpdateName}
                onRetry={refreshLocalStatus}
              />
            </YStack>
          </Card>

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
      </ScrollView>

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
  )
}
