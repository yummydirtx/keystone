import { H1, Paragraph, YStack, XStack, Button, Text } from '@my/ui'
import type { Category } from '../../../types'
import { ChevronLeft, Edit3, Share, Trash2, Link, Settings } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'
import { Platform } from 'react-native'
import { formatCurrency } from 'app/utils/currency'
import {
  canEditCategory,
  canDeleteCategory,
  canShareCategory,
  canAccessCategoryOptions,
  calculateAllocatedAmount,
} from '../../../utils/categoryPermissions'
import { BackButton } from '../../../components/BackButton'

interface CategoryHeaderProps {
  category: Category | null
  userRole?: string | null
  hasDirectPermission?: boolean
  onEditPress?: () => void
  onDeletePress?: () => void
  onSharePress?: () => void
  onLinksPress?: () => void
  onOptionsPress?: () => void
}

export function CategoryHeader({
  category,
  userRole,
  hasDirectPermission,
  onEditPress,
  onDeletePress,
  onSharePress,
  onLinksPress,
  onOptionsPress,
}: CategoryHeaderProps) {
  const router = useRouter()

  // Convert userRole to the expected type
  const effectiveUserRole = userRole ?? null
  const effectiveHasDirectPermission = hasDirectPermission ?? false

  // Check if we should show sharing controls
  const canShare = onSharePress && canShareCategory(effectiveUserRole)
  const canManageLinks = onLinksPress && canShareCategory(effectiveUserRole)
  const canShowOptions = onOptionsPress && canAccessCategoryOptions(effectiveUserRole)

  return (
    <YStack
      gap="$2"
      flex={1}
    >
      <XStack
        items="center"
        gap="$2"
        justify="space-between"
      >
        {Platform.OS === 'web' ? (
          <BackButton />
        ) : // Native: show Links on the left side (BackButton is a no-op on native)
        canManageLinks ? (
          <Button
            icon={Link}
            size="$3"
            onPress={onLinksPress}
            theme="green"
            aria-label="Manage guest links"
          >
            Links
          </Button>
        ) : (
          <YStack />
        )}

        {(canShare || canManageLinks) && (
          <XStack
            gap="$2"
            items="center"
          >
            {Platform.OS === 'web' ? (
              <>
                {canManageLinks && (
                  <Button
                    icon={Link}
                    size="$3"
                    onPress={onLinksPress}
                    theme="green"
                    aria-label="Manage guest links"
                  >
                    Links
                  </Button>
                )}
                {canShare && (
                  <Button
                    icon={Share}
                    size="$3"
                    onPress={onSharePress}
                    theme="blue"
                    aria-label="Share category"
                  >
                    Share
                  </Button>
                )}
              </>
            ) : (
              // Native: keep Share on the right side only
              <>
                {canShare && (
                  <Button
                    icon={Share}
                    size="$3"
                    onPress={onSharePress}
                    theme="blue"
                    aria-label="Share category"
                  >
                    Share
                  </Button>
                )}
              </>
            )}
          </XStack>
        )}
      </XStack>
      <XStack
        items="center"
        gap="$2"
      >
        <YStack
          gap="$2"
          flex={1}
        >
          <H1>{category?.name}</H1>
          <XStack
            items="center"
            gap="$2"
          >
            {category?.spentAmount !== undefined ? (
              <Paragraph color="$color10">
                {Number.parseFloat((category?.budget ?? 0).toString()) !== 0.0 ? (
                  <>
                    Spent: {formatCurrency(category.spentAmount)} /{' '}
                    {category?.budget
                      ? formatCurrency(Number.parseFloat(category.budget.toString()))
                      : formatCurrency(0)}{' '}
                    <Text
                      color={
                        category.spentPercentage && category.spentPercentage > 100
                          ? '$red10'
                          : '$color10'
                      }
                    >
                      ({category.spentPercentage}%)
                    </Text>
                  </>
                ) : (
                  <>Spent: {formatCurrency(category.spentAmount)}</>
                )}
              </Paragraph>
            ) : (
              Number.parseFloat((category?.budget ?? 0).toString()) !== 0.0 && (
                <Paragraph color="$color10">
                  Budget:{' '}
                  {category?.budget
                    ? formatCurrency(Number.parseFloat(category.budget.toString()))
                    : formatCurrency(0)}
                </Paragraph>
              )
            )}
          </XStack>
          {category && Number.parseFloat((category?.budget ?? 0).toString()) !== 0.0 && (
            <Paragraph color="$color10">
              Allocated: {formatCurrency(calculateAllocatedAmount(category))} /{' '}
              {category?.budget
                ? formatCurrency(Number.parseFloat(category.budget.toString()))
                : formatCurrency(0)}{' '}
              {category?.budget ? (
                <Text
                  color={
                    Math.round(
                      (calculateAllocatedAmount(category) /
                        Number.parseFloat(category.budget.toString())) *
                        100
                    ) > 100
                      ? '$red10'
                      : '$color10'
                  }
                >
                  (
                  {Math.round(
                    (calculateAllocatedAmount(category) /
                      Number.parseFloat(category.budget.toString())) *
                      100
                  )}
                  %)
                </Text>
              ) : (
                ''
              )}
            </Paragraph>
          )}
          {/* Edit, Delete, and Options buttons on their own line */}
          {(onEditPress &&
            canEditCategory(effectiveUserRole, category, effectiveHasDirectPermission)) ||
          (onDeletePress &&
            canDeleteCategory(effectiveUserRole, category, effectiveHasDirectPermission)) ||
          canShowOptions ? (
            <XStack gap="$2">
              {onEditPress &&
                canEditCategory(effectiveUserRole, category, effectiveHasDirectPermission) && (
                  <Button
                    size="$2"
                    variant="outlined"
                    icon={Edit3}
                    onPress={onEditPress}
                    color="$color11"
                    aria-label="Edit category"
                  >
                    Edit
                  </Button>
                )}
              {onDeletePress &&
                canDeleteCategory(effectiveUserRole, category, effectiveHasDirectPermission) && (
                  <Button
                    size="$2"
                    variant="outlined"
                    icon={Trash2}
                    onPress={onDeletePress}
                    color="$red10"
                    aria-label="Delete category"
                  >
                    Delete
                  </Button>
                )}
              {canShowOptions && (
                <Button
                  size="$2"
                  variant="outlined"
                  icon={Settings}
                  onPress={onOptionsPress}
                  color="$color11"
                  aria-label="Category options"
                >
                  Options
                </Button>
              )}
            </XStack>
          ) : null}
        </YStack>
      </XStack>
    </YStack>
  )
}
