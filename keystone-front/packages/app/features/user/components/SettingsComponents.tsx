import React from 'react'
import { Button, YStack, XStack, Paragraph, Input, Spinner, Card } from '@my/ui'
import type { UserProfile } from '../../../types'

interface FirebaseUserInfoProps {
  firebaseUser: any
}

interface UserProfileSectionProps {
  loading: boolean
  syncStatus: 'checking' | 'synced' | 'not-synced'
  userProfile: UserProfile | null
  nameInput: string
  updating: boolean
  onNameInputChange: (value: string) => void
  onUpdateName: () => void
  onRetry: () => void
}

export function UserProfileSection({
  loading,
  syncStatus,
  userProfile,
  nameInput,
  updating,
  onNameInputChange,
  onUpdateName,
  onRetry,
}: UserProfileSectionProps) {
  if (loading) {
    return (
      <Card p="$4">
        <YStack
          items="center"
          gap="$2"
        >
          <Spinner size="large" />
          <Paragraph>Loading user profile...</Paragraph>
        </YStack>
      </Card>
    )
  }

  if (syncStatus === 'not-synced') {
    return (
      <Card
        p="$4"
        bg="$color3"
      >
        <YStack gap="$3">
          <Paragraph
            color="orange"
            fontWeight="bold"
          >
            User not synced with backend
          </Paragraph>
          <Paragraph color="$color11">
            Please sign out and sign back in to sync your account with the backend.
          </Paragraph>
        </YStack>
      </Card>
    )
  }

  if (!userProfile) {
    return (
      <Card
        p="$4"
        bg="$color3"
      >
        <YStack gap="$3">
          <Paragraph
            color="$red10"
            fontWeight="bold"
          >
            Failed to load user profile
          </Paragraph>
          <Button
            onPress={onRetry}
            size="$3"
          >
            Retry
          </Button>
        </YStack>
      </Card>
    )
  }

  return (
    <YStack gap="$4">
      <Card p="$4">
        <YStack gap="$3">
          <Paragraph
            fontWeight="bold"
            color="$color12"
          >
            User Profile
          </Paragraph>
          <Paragraph color="$color11">Email: {userProfile.email}</Paragraph>
          <Paragraph color="$color11">Current Name: {userProfile.name || 'Not set'}</Paragraph>
          <Paragraph color="$color11">
            Created: {new Date(userProfile.createdAt).toLocaleDateString()}
          </Paragraph>
          <Paragraph color="$color11">
            Updated: {new Date(userProfile.updatedAt).toLocaleDateString()}
          </Paragraph>
        </YStack>
      </Card>

      {/* Name Update Form */}
      <Card
        p="$4"
        bg="$color3"
      >
        <YStack gap="$3">
          <Paragraph
            fontWeight="bold"
            color="$color12"
          >
            Update Your Name
          </Paragraph>
          <Input
            value={nameInput}
            onChangeText={onNameInputChange}
            placeholder="Enter your name"
            disabled={updating}
            size="$4"
          />
          <Button
            onPress={onUpdateName}
            disabled={updating || !nameInput.trim() || nameInput.trim() === userProfile.name}
            size="$4"
            theme="blue"
          >
            {updating ? (
              <XStack
                items="center"
                gap="$2"
              >
                <Spinner
                  size="small"
                  color="white"
                />
                <Paragraph color="white">Updating...</Paragraph>
              </XStack>
            ) : (
              'Update Name'
            )}
          </Button>
        </YStack>
      </Card>
    </YStack>
  )
}
