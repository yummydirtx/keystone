import { Paragraph, XStack, YStack, DashboardWidget, DashboardWidgetItem } from '@my/ui'
import { Users, Briefcase } from '@tamagui/lucide-icons'
import React from 'react'
import { useRouter } from 'solito/navigation'
import { useAuth } from '../../../provider/AuthProvider'
import { useSharedCategories } from '../../../utils/queries.optimized'
import { SharedCategory } from '../../../types.d'
import { ProfilePicture } from '../../../components/ProfilePicture'

interface SharedCategoriesWidgetProps {
  refreshKey?: number
  onRefresh?: () => void
}

export const SharedCategoriesWidget = ({
  refreshKey = 0,
  onRefresh,
}: SharedCategoriesWidgetProps) => {
  const router = useRouter()
  const { userProfile } = useAuth()

  const {
    data: sharedCategories = [],
    isLoading: loading,
    error,
    refetch: refetchSharedCategories,
  } = useSharedCategories(
    {},
    {
      enabled: !!userProfile,
    }
  )

  // Limit to 4 most recent categories
  const displayCategories = sharedCategories.slice(0, 4)

  const fetchSharedCategories = async () => {
    await refetchSharedCategories()
  }

  const handleRefresh = () => {
    fetchSharedCategories()
    onRefresh?.() // Notify parent component about the refresh
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return '$blue10'
      case 'editor':
        return '$green10'
      case 'viewer':
        return '$color10'
      case 'reviewer':
        return '$yellow10'
      default:
        return '$color11'
    }
  }

  const handleCategoryPress = (categoryId: number, role: string) => {
    if (role === 'SUBMITTER') {
      router.push(`/submitter/${categoryId}`)
    } else {
      router.push(`/category/${categoryId}`)
    }
  }

  const renderCategoryItems = () => {
    if (displayCategories.length === 0) {
      return null // Let the empty state handle this
    }

    return displayCategories.map((sharedCategory, index) => (
      <DashboardWidgetItem
        key={sharedCategory.category.id}
        onPress={() => handleCategoryPress(sharedCategory.category.id, sharedCategory.role)}
        showSeparator={index < sharedCategories.length - 1}
      >
        <YStack
          gap="$1"
          flex={1}
        >
          <XStack
            gap="$2"
            items="center"
          >
            <Paragraph
              fontWeight="600"
              color="$color12"
            >
              {sharedCategory.category.name}
            </Paragraph>
            <Paragraph
              size="$3"
              color={getRoleColor(sharedCategory.role)}
              fontWeight="500"
            >
              ({sharedCategory.role.charAt(0) + sharedCategory.role.slice(1).toLowerCase()})
            </Paragraph>
          </XStack>
          <XStack
            gap="$2"
            items="center"
          >
            <Briefcase
              size={14}
              color="$color10"
            />
            <Paragraph
              size="$3"
              color="$color10"
            >
              {sharedCategory.category.report.name}
            </Paragraph>
          </XStack>
          {sharedCategory.category.report.owner && (
            <XStack
              gap="$2"
              items="center"
            >
              <ProfilePicture
                avatarUrl={sharedCategory.category.report.owner.avatar_url}
                name={sharedCategory.category.report.owner.name}
                size={20}
                borderRadius="$10"
              />
              <Paragraph
                size="$3"
                color="$color10"
              >
                {sharedCategory.category.report.owner.name}
              </Paragraph>
            </XStack>
          )}
        </YStack>
      </DashboardWidgetItem>
    ))
  }

  return (
    <DashboardWidget
      title="Shared With You"
      icon={Users}
      iconColor="$blue10"
      isLoading={loading && displayCategories.length === 0}
      error={error}
      emptyState={{
        icon: Users,
        title: 'No shared categories',
        description: 'Categories shared with you will appear here',
      }}
      viewAllButton={{
        label: `View All (${sharedCategories.length})`,
        onPress: () => router.push('/shared-categories'),
      }}
    >
      {renderCategoryItems()}
    </DashboardWidget>
  )
}
