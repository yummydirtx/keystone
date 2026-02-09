import React, { useState } from 'react'
import {
  Sheet,
  Button,
  H2,
  Paragraph,
  YStack,
  XStack,
  Checkbox,
  Label,
  useToastController,
} from '@my/ui'
import { X, Settings, Check } from '@tamagui/lucide-icons'
import type { Category } from '../../../types'

interface CategoryOptionsSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
  onSaveOptions?: (options: CategoryOptions) => void
  saving?: boolean
}

export interface CategoryOptions {
  requireReceiptForApproval: boolean
  allowGuestSubmissions: boolean
  allowUserSubmissions: boolean
  enableBudgetNotifications: boolean
}

export function CategoryOptionsSheet({
  isOpen,
  onOpenChange,
  category,
  onSaveOptions,
  saving = false,
}: CategoryOptionsSheetProps) {
  const toast = useToastController()

  // Initialize options based on category data
  const [options, setOptions] = useState<CategoryOptions>({
    requireReceiptForApproval: Boolean(category?.require_receipt),
    allowGuestSubmissions: Boolean(category?.allow_guest_submissions),
    allowUserSubmissions: Boolean(category?.allow_user_submissions),
    enableBudgetNotifications: true,
  })

  // Update options when category changes or when sheet opens
  React.useEffect(() => {
    if (category) {

      const guestSubmissions = Boolean(category.allow_guest_submissions)
      const userSubmissions = Boolean(category.allow_user_submissions)

      setOptions(() => ({
        requireReceiptForApproval: Boolean(category.require_receipt),
        allowGuestSubmissions: guestSubmissions,
        allowUserSubmissions: userSubmissions,
        enableBudgetNotifications: true,
      }))
    }
  }, [category, isOpen])

  const handleOptionChange = (key: keyof CategoryOptions, value: boolean) => {
    setOptions((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSave = async () => {
    try {
      if (onSaveOptions) {
        await onSaveOptions(options)
        toast.show('Category options updated', {
          message: 'Your settings have been saved successfully.',
        })
        onOpenChange(false)
      }
    } catch (error) {
      toast.show('Failed to save options', {
        message: 'Please try again.',
      })
    }
  }

  return (
    <Sheet
      forceRemoveScrollEnabled={isOpen}
      modal={true}
      open={isOpen}
      onOpenChange={onOpenChange}
      snapPoints={[85, 50, 25]}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />
      <Sheet.Handle />
      <Sheet.Frame
        p="$4"
        justify="flex-start"
        gap="$5"
      >
        <Sheet.ScrollView>
          {/* Header */}
          <XStack
            justify="space-between"
            items="center"
          >
            <XStack
              items="center"
              gap="$2"
            >
              <Settings size={20} />
              <H2>Category Options</H2>
            </XStack>
            <Button
              size="$3"
              circular
              icon={X}
              onPress={() => onOpenChange(false)}
              chromeless
            />
          </XStack>

          {category && (
            <Paragraph color="$color10">Configure settings for "{category.name}"</Paragraph>
          )}

          {/* Options List */}
          <YStack
            gap="$4"
            flex={1}
          >
          {/* Receipt Requirement */}
          <XStack
            justify="space-between"
            items="center"
            gap="$3"
          >
            <YStack flex={1}>
              <Label fontWeight="600">Require Receipt</Label>
              <Paragraph
                size="$2"
                color="$color10"
              >
                All expenses by Submitters and guest users must include a receipt to be approved
              </Paragraph>
            </YStack>
            <Checkbox
              checked={options.requireReceiptForApproval}
              onCheckedChange={(checked) =>
                handleOptionChange('requireReceiptForApproval', checked === true)
              }
            >
              <Checkbox.Indicator>
                <Check />
              </Checkbox.Indicator>
            </Checkbox>
          </XStack>

          {/* Guest Submissions */}
          <XStack
            justify="space-between"
            items="center"
            gap="$3"
          >
            <YStack flex={1}>
              <Label fontWeight="600">Allow Guest Submissions</Label>
              <Paragraph
                size="$2"
                color="$color10"
              >
                Enable guests to submit expenses via shared links
              </Paragraph>
            </YStack>
            <Checkbox
              checked={options.allowGuestSubmissions}
              onCheckedChange={(checked) =>
                handleOptionChange('allowGuestSubmissions', checked === true)
              }
            >
              <Checkbox.Indicator>
                <Check />
              </Checkbox.Indicator>
            </Checkbox>
          </XStack>

          {/* User Submissions */}
          <XStack
            justify="space-between"
            items="center"
            gap="$3"
          >
            <YStack flex={1}>
              <Label fontWeight="600">Allow User Submissions</Label>
              <Paragraph
                size="$2"
                color="$color10"
              >
                Enable Submitters to submit expenses to this category
              </Paragraph>
            </YStack>
            <Checkbox
              checked={options.allowUserSubmissions}
              onCheckedChange={(checked) =>
                handleOptionChange('allowUserSubmissions', checked === true)
              }
            >
              <Checkbox.Indicator>
                <Check />
              </Checkbox.Indicator>
            </Checkbox>
          </XStack>

          {/* Budget Notifications (mobile only)
          {Platform.OS === 'web' && (
            <XStack
              justify="space-between"
              items="center"
              gap="$3"
            >
              <YStack flex={1}>
                <Label fontWeight="600">Enable Budget Notifications</Label>
                <Paragraph
                  size="$2"
                  color="$color10"
                >
                  Receive notifications about budget updates and changes
                </Paragraph>
              </YStack>
              <Checkbox
                checked={options.enableBudgetNotifications}
                onCheckedChange={(checked) =>
                  handleOptionChange('enableBudgetNotifications', checked === true)
                }
              >
                <Checkbox.Indicator>
                  <Check />
                </Checkbox.Indicator>
              </Checkbox>
            </XStack>
          )} */}
        </YStack>

        {/* Save Button */}
        <XStack
          justify="flex-end"
          gap="$3"
          pt="$4"
        >
          <Button
            variant="outlined"
            onPress={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            theme="blue"
            onPress={handleSave}
            disabled={saving}
            icon={saving ? undefined : Settings}
          >
            {saving ? 'Saving...' : 'Save Options'}
          </Button>
        </XStack>
        </Sheet.ScrollView>
      </Sheet.Frame>
    </Sheet>
  )
}
