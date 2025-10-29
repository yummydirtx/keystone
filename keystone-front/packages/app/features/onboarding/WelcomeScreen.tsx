import React, { useRef, useState } from 'react'
import { Button, H1, H2, YStack, XStack, Paragraph, Input, Card, Text, Separator } from '@my/ui'
import { User, Camera, ArrowRight, X } from '@tamagui/lucide-icons'
import { useAuth } from '../../provider/AuthProvider'
import { AvatarUploader } from '../user/components/AvatarUploader'
import { useUpdateCurrentUser } from '../../utils/queries.optimized'

interface WelcomeScreenProps {
  onComplete: () => void
}

/**
 * Welcome screen shown to new users for optional profile setup
 */
export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const { userProfile, refreshUserProfile } = useAuth()
  // Uncontrolled name input to reduce re-renders on Native
  const nameRef = useRef(userProfile?.name || '')
  const [inputResetKey, setInputResetKey] = useState(0)
  const [uiTick, setUiTick] = useState(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestUiUpdate = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setUiTick((t) => t + 1), 120)
  }
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || '')
  const [loading, setLoading] = useState(false)
  const updateUserMutation = useUpdateCurrentUser()

  // Create a modified userProfile that includes the current avatarUrl for display
  const displayUserProfile = userProfile
    ? {
        ...userProfile,
        avatar_url: avatarUrl || userProfile.avatar_url,
        name: nameRef.current || userProfile.name,
      }
    : null

  const handleSaveAndContinue = async () => {
    setLoading(true)
    try {
      // Update if user provided name or avatar
      const name = nameRef.current.trim()
      if (name || avatarUrl) {
        const updateData: any = {}
        if (name) updateData.name = name
        if (avatarUrl) updateData.avatar_url = avatarUrl

        await updateUserMutation.mutateAsync(updateData)
        await refreshUserProfile()
      }
      onComplete()
    } catch (error) {
      console.error('Failed to update profile:', error)
      onComplete()
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  const handleAvatarChange = (url: string) => {
    setAvatarUrl(url)
  }

  return (
    <YStack
      flex={1}
      minH="100vh"
      bg="$background"
    >
      <YStack
        flex={1}
        justify="center"
        items="center"
        gap="$4"
        p="$4"
      >
        <H1
          text="center"
          color="$color12"
        >
          Welcome to Keystone! 🎉
        </H1>
        <Paragraph
          color="$color10"
          text="center"
        >
          Let's set up your profile. Both steps are optional and can be completed later.
        </Paragraph>

        <Card
          p="$4"
          gap="$4"
          width="100%"
          bg="$background"
          borderColor="$borderColor"
        >
          {/* Avatar Section */}
          <YStack
            gap="$3"
            items="center"
          >
            <XStack
              items="center"
              gap="$2"
            >
              <Camera
                size={20}
                color="$color11"
              />
              <H2
                size="$6"
                color="$color12"
              >
                Profile Picture
              </H2>
            </XStack>
            <AvatarUploader
              userProfile={displayUserProfile}
              onAvatarChange={handleAvatarChange}
              isUpdating={loading}
            />
            <Paragraph
              size="$3"
              color="$color10"
              text="center"
            >
              Optional: Upload a profile picture to personalize your account
            </Paragraph>
          </YStack>

          <Separator />

          {/* Name Section */}
          <YStack gap="$3">
            <XStack
              items="center"
              gap="$2"
            >
              <User
                size={20}
                color="$color11"
              />
              <H2
                size="$6"
                color="$color12"
              >
                Display Name
              </H2>
            </XStack>
            <YStack gap="$2">
              <Input
                key={`name-${inputResetKey}`}
                placeholder="Enter your name"
                defaultValue={nameRef.current}
                onChangeText={(text) => {
                  nameRef.current = text
                  requestUiUpdate()
                }}
                size="$4"
                bg="$background"
                borderColor="$borderColor"
              />
              <Paragraph
                size="$3"
                color="$color10"
              >
                Optional: This will be displayed throughout the app
              </Paragraph>
            </YStack>
          </YStack>
        </Card>

        <YStack
          gap="$3"
          width="100%"
        >
          <Button
            size="$5"
            onPress={handleSaveAndContinue}
            disabled={loading}
            bg="$blue9"
            color="white"
          >
            <XStack
              items="center"
              gap="$2"
            >
              {loading ? <Text>Saving...</Text> : <Text>Save & Continue</Text>}
              <ArrowRight size={20} />
            </XStack>
          </Button>

          <Button
            size="$4"
            variant="outlined"
            onPress={handleSkip}
            disabled={loading}
            borderColor="$borderColor"
            color="$color11"
          >
            <XStack
              items="center"
              gap="$2"
            >
              <X size={18} />
              <Text>Skip for now</Text>
            </XStack>
          </Button>
        </YStack>

        <Paragraph
          size="$2"
          color="$color10"
          text="center"
        >
          You can always update your profile later in the settings.
        </Paragraph>
      </YStack>
    </YStack>
  )
}
