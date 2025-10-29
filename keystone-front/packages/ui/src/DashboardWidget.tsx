import * as React from 'react'
import {
  Card,
  H2,
  XStack,
  YStack,
  Button,
  Paragraph,
  Spinner,
  Separator,
  type SizeTokens,
} from 'tamagui'
import { AlertCircle, ChevronRight } from '@tamagui/lucide-icons'
import type { IconProps as TamaguiIconProps } from '@tamagui/helpers-icon'

export interface DashboardWidgetProps {
  /**
   * The title of the widget
   */
  title: string
  /**
   * Icon component to display next to the title
   */
  icon?: React.ComponentType<TamaguiIconProps>
  /**
   * Color for the icon
   */
  iconColor?: string
  /**
   * The main content of the widget
   */
  children: React.ReactNode
  /**
   * Optional action buttons to display in the header
   */
  headerActions?: React.ReactNode
  /**
   * Optional "View All" button configuration
   */
  viewAllButton?: {
    label?: string
    onPress: () => void
  }
  /**
   * Loading state
   */
  isLoading?: boolean
  /**
   * Error state
   */
  error?: string | Error | null
  /**
   * Empty state configuration
   */
  emptyState?: {
    icon?: React.ComponentType<TamaguiIconProps>
    title: string
    description?: string
  }
  /**
   * Additional props for the outer card
   */
  cardProps?: Record<string, any>
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  icon: Icon,
  iconColor = '$blue10',
  children,
  headerActions,
  viewAllButton,
  isLoading = false,
  error,
  emptyState,
  cardProps = {},
}) => {
  const renderContent = () => {
    if (isLoading) {
      return <Spinner p="$4" />
    }

    if (error) {
      const errorMessage = typeof error === 'string' ? error : error?.message || 'An error occurred'
      return (
        <XStack
          p="$3"
          items="center"
          gap="$3"
        >
          <AlertCircle color="$red10" />
          <Paragraph color="$red10">{errorMessage}</Paragraph>
        </XStack>
      )
    }

    if (emptyState && React.Children.count(children) === 0) {
      const EmptyIcon = emptyState.icon
      return (
        <YStack
          gap="$2"
          items="center"
          justify="center"
          flex={1}
        >
          {EmptyIcon && (
            <EmptyIcon
              size={32}
              color="$color8"
            />
          )}
          <Paragraph color="$color11">{emptyState.title}</Paragraph>
          {emptyState.description && (
            <Paragraph
              color="$color10"
              size="$3"
            >
              {emptyState.description}
            </Paragraph>
          )}
        </YStack>
      )
    }

    return children
  }

  return (
    <Card
      p="$4"
      gap="$3"
      $md={{ minH: 550 }}
      {...cardProps}
    >
      <YStack
        flex={1}
        gap="$3"
      >
        {/* Header */}
        <XStack
          gap="$2"
          items="center"
          justify="space-between"
        >
          <XStack
            gap="$2"
            items="center"
          >
            {Icon && (
              <Icon
                size={24}
                color={iconColor as any}
              />
            )}
            <H2 size="$6">{title}</H2>
          </XStack>
          {headerActions && (
            <XStack
              gap="$2"
              items="center"
            >
              {headerActions}
            </XStack>
          )}
        </XStack>

        {/* Content */}
        <Card flex={1}>{renderContent()}</Card>

        {/* View All Button */}
        {viewAllButton && (
          <XStack
            justify="center"
            mt="auto"
          >
            <Button
              size="$3"
              variant="outlined"
              onPress={viewAllButton.onPress}
            >
              <Paragraph
                size="$3"
                color="$color11"
              >
                {viewAllButton.label || 'View All'}
              </Paragraph>
            </Button>
          </XStack>
        )}
      </YStack>
    </Card>
  )
}

export interface DashboardWidgetItemProps {
  /**
   * The main content of the item
   */
  children: React.ReactNode
  /**
   * Handler for when the item is pressed
   */
  onPress?: () => void
  /**
   * Whether to show a separator below this item
   */
  showSeparator?: boolean
  /**
   * Whether to show a chevron right icon
   */
  showChevron?: boolean
}

/**
 * A standardized item component for use within dashboard widgets
 */
export const DashboardWidgetItem: React.FC<DashboardWidgetItemProps> = ({
  children,
  onPress,
  showSeparator = false,
  showChevron = true,
}) => {
  return (
    <>
      <XStack
        p="$3"
        justify="space-between"
        items="center"
        pressStyle={{ scale: 0.98 }}
        onPress={onPress}
        cursor={onPress ? 'pointer' : undefined}
      >
        {children}
        {showChevron && onPress && (
          <ChevronRight
            size={16}
            color="$color11"
            ml="$3"
          />
        )}
      </XStack>
      {showSeparator && <Separator />}
    </>
  )
}

/**
 * Utility component for responsive action buttons (icon-only on mobile, icon+text on desktop)
 */
export interface ResponsiveActionButtonProps {
  /**
   * Icon component
   */
  icon: React.ComponentType<TamaguiIconProps>
  /**
   * Button text (shown on desktop only)
   */
  text?: string
  /**
   * Icon color
   */
  iconColor?: string
  /**
   * Text color
   */
  textColor?: string
  /**
   * Button size
   */
  size?: SizeTokens
  /**
   * Button variant
   */
  variant?: 'outlined'
  /**
   * Press handler
   */
  onPress: (event?: any) => void
  /**
   * Accessible label for screen readers
   */
  'aria-label': string
  /**
   * Additional button props
   */
  buttonProps?: Record<string, any>
}

/**
 * Adaptive action button that switches between icon+text and icon-only based on available space
 */
export interface AdaptiveActionButtonProps {
  /**
   * Icon component
   */
  icon: React.ComponentType<TamaguiIconProps>
  /**
   * Button text (shown when space allows)
   */
  text?: string
  /**
   * Icon color
   */
  iconColor?: string
  /**
   * Text color
   */
  textColor?: string
  /**
   * Button size
   */
  size?: SizeTokens
  /**
   * Button variant
   */
  variant?: 'outlined'
  /**
   * Press handler
   */
  onPress: (event?: any) => void
  /**
   * Accessible label for screen readers
   */
  'aria-label': string
  /**
   * Additional button props
   */
  buttonProps?: Record<string, any>
}

export const AdaptiveActionButton: React.FC<AdaptiveActionButtonProps> = ({
  icon: Icon,
  text,
  iconColor = '$color11',
  textColor = '$color11',
  size = '$3',
  variant = 'outlined',
  onPress,
  'aria-label': ariaLabel,
  buttonProps = {},
}) => {
  return (
    <>
      {/* Small screens - icon only */}
      <Button
        size={size}
        variant={variant}
        onPress={onPress}
        icon={
          <Icon
            size={16}
            color={iconColor as any}
          />
        }
        pressStyle={{ scale: 0.95 }}
        display="flex"
        $lg={{ display: 'none' }}
        aria-label={ariaLabel}
        {...buttonProps}
      />

      {/* Large screens - full button with text */}
      {text && (
        <Button
          size={size}
          variant={variant}
          onPress={onPress}
          icon={
            <Icon
              size={16}
              color={iconColor as any}
            />
          }
          pressStyle={{ scale: 0.95 }}
          px="$3"
          display="none"
          $lg={{ display: 'flex' }}
          {...buttonProps}
        >
          <Paragraph
            size="$3"
            color={textColor as any}
          >
            {text}
          </Paragraph>
        </Button>
      )}
    </>
  )
}

export const ResponsiveActionButton: React.FC<ResponsiveActionButtonProps> = ({
  icon: Icon,
  text,
  iconColor = '$color11',
  textColor = '$color11',
  size = '$3',
  variant = 'outlined',
  onPress,
  'aria-label': ariaLabel,
  buttonProps = {},
}) => {
  return (
    <>
      {/* Mobile button - icon only */}
      <Button
        size={size}
        variant={variant}
        onPress={onPress}
        icon={
          <Icon
            size={16}
            color={iconColor as any}
          />
        }
        pressStyle={{ scale: 0.95 }}
        display="flex"
        $md={{ display: 'none' }}
        aria-label={ariaLabel}
        {...buttonProps}
      />

      {/* Desktop button - icon + text */}
      {text && (
        <Button
          size={size}
          variant={variant}
          onPress={onPress}
          icon={
            <Icon
              size={16}
              color={iconColor as any}
            />
          }
          pressStyle={{ scale: 0.95 }}
          px="$3"
          display="none"
          $md={{ display: 'flex' }}
          {...buttonProps}
        >
          <Paragraph
            size="$3"
            color={textColor as any}
          >
            {text}
          </Paragraph>
        </Button>
      )}
    </>
  )
}
