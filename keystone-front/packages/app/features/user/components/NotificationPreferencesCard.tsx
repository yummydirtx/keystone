import React from 'react'
import { YStack, XStack, Text, Card, Spinner, Button, H4, Paragraph } from '@my/ui'
import { Switch } from 'react-native'
import { useToastController } from '@my/ui'
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '../../../utils/queries.optimized'
import type { NotificationPreferences } from '../../../utils/api'

interface NotificationPreferencesCardProps {
  isUpdating?: boolean
}

const notificationLabels = {
  expense_created: {
    title: 'New Expenses',
    description: 'When new expenses are submitted to workspaces you manage',
  },
  expense_approved: {
    title: 'Expense Approved',
    description: 'When your submitted expenses are approved',
  },
  expense_denied: {
    title: 'Expense Denied',
    description: 'When your submitted expenses are denied',
  },
  category_shared: {
    title: 'Category Shared',
    description: 'When you are granted access to new categories',
  },
}

export function NotificationPreferencesCard({
  isUpdating: externalUpdating,
}: NotificationPreferencesCardProps) {
  const toast = useToastController()

  const { data: preferences, isLoading: loading, error, refetch } = useNotificationPreferences()

  const updatePreferencesMutation = useUpdateNotificationPreferences()

  const isDisabled = loading || updatePreferencesMutation.isPending || externalUpdating

  const handleToggle = async (event: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return

    try {
      const updatedPreference = {
        push: value,
      }

      await updatePreferencesMutation.mutateAsync({
        [event]: updatedPreference,
      })

      toast.show('Settings Updated', {
        message: 'Notification preferences saved successfully',
      })
    } catch (err) {
      console.error('Failed to update notification preferences:', err)
      toast.show('Error', {
        message: 'Failed to update notification preferences',
      })
    }
  }

  if (loading) {
    return (
      <Card p="$4">
        <YStack
          gap="$3"
          items="center"
        >
          <Spinner size="small" />
          <Text color="$color11">Loading notification preferences...</Text>
        </YStack>
      </Card>
    )
  }

  if (error || !preferences) {
    return (
      <Card p="$4">
        <YStack gap="$3">
          <Text color="$red10">
            {(error as Error)?.message || 'Failed to load notification preferences'}
          </Text>
          <Button
            onPress={() => refetch()}
            size="$3"
          >
            Retry
          </Button>
        </YStack>
      </Card>
    )
  }

  return (
    <Card p="$4">
      <YStack gap="$4">
        <YStack gap="$2">
          <H4 color="$color12">Notifications</H4>
          <Paragraph
            color="$color11"
            size="$3"
          >
            Choose which notifications you want to receive
          </Paragraph>
        </YStack>

        <YStack gap="$4">
          {Object.entries(notificationLabels).map(([event, labels]) => {
            const eventKey = event as keyof NotificationPreferences
            // Provide default values if preference doesn't exist
            const pref = preferences[eventKey] || { push: true }

            return (
              <YStack
                key={event}
                gap="$2"
                opacity={isDisabled ? 0.6 : 1}
              >
                <XStack
                  items="center"
                  justify="space-between"
                  mr="$2"
                >
                  <Text
                    fontSize="$4"
                    fontWeight="600"
                    color="$color12"
                  >
                    {labels.title}
                  </Text>
                  <Switch
                    value={pref.push}
                    onValueChange={(value) => handleToggle(eventKey, value)}
                    disabled={isDisabled}
                  />
                </XStack>
                <Text
                  fontSize="$3"
                  color="$color11"
                  pl="$1"
                >
                  {labels.description}
                </Text>
              </YStack>
            )
          })}
        </YStack>
      </YStack>
    </Card>
  )
}
