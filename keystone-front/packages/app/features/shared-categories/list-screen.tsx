import {
  Button,
  Paragraph,
  YStack,
  XStack,
  Spinner,
  ScrollView,
  H2,
  H3,
  H4,
  Card,
  Separator,
  Input,
  Text,
} from '@my/ui'
import {
  ChevronLeft,
  AlertCircle,
  FolderOpen,
  ChevronRight,
  Search,
  Filter,
  Plus,
  User,
  Briefcase,
} from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'
import { useRef, useState, useCallback } from 'react'
import { useSharedCategories } from '../../utils/queries.optimized'
import type { SharedCategory } from '../../types'
import { useAuth } from '../../provider/AuthProvider'
import { LoginScreen } from '../auth/LoginScreen'
import { NavigationBar } from '../../components/NavigationBar'
import { Footer } from 'app/components/Footer'
import { RefreshableScrollView } from '../../components/RefreshableScrollView'
import { UserMenu } from '../../components/UserMenu'
import { BackButton } from 'app/components/BackButton'
import { useScreenTopPadding } from '../../hooks/useSafeAreaPadding'
import { ProfilePicture } from 'app/components/ProfilePicture'

export function SharedCategoriesListScreen() {
  const router = useRouter()
  const { user, userProfile, loading: authLoading } = useAuth()
  const screenTopPadding = useScreenTopPadding()
  const [menuOpen, setMenuOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  // Uncontrolled search input
  const searchQueryRef = useRef('')
  const [searchUiTick, setSearchUiTick] = useState(0)
  const searchDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestSearchUiUpdate = () => {
    if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current)
    searchDebounceTimer.current = setTimeout(() => setSearchUiTick((t) => t + 1), 120)
  }

  const {
    data: sharedCategories = [],
    isLoading: loading,
    error,
    refetch: refetchSharedCategories,
  } = useSharedCategories(
    {},
    {
      enabled: !!user && !!userProfile && !authLoading,
    }
  )

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refetchSharedCategories()
    } finally {
      setRefreshing(false)
    }
  }, [refetchSharedCategories])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const filteredCategories = sharedCategories.filter(
    (shared) =>
      shared.category.name.toLowerCase().includes(searchQueryRef.current.toLowerCase()) ||
      shared.category.report.name.toLowerCase().includes(searchQueryRef.current.toLowerCase())
  )

  const handleCategoryPress = (shared: SharedCategory) => {
    const { category, role } = shared

    // Navigate based on user role
    if (role === 'SUBMITTER') {
      router.push(`/submitter/${category.id}`)
    } else {
      router.push(`/category/${category.id}`)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'blue'
      case 'reviewer':
        return 'green'
      case 'submitter':
        return 'gray'
      default:
        return 'gray'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'Admin'
      case 'editor':
        return 'Editor'
      case 'viewer':
        return 'Viewer'
      case 'reviewer':
        return 'Reviewer'
      case 'submitter':
        return 'Submitter'
      default:
        return role
    }
  }

  if (authLoading) {
    return (
      <YStack
        flex={1}
        justify="center"
        items="center"
      >
        <Spinner size="large" />
      </YStack>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  const renderCategoryItem = (shared: SharedCategory) => (
    <Card
      key={shared.category.id}
      p="$0"
      mb="$2"
    >
      <XStack
        p="$4"
        justify="space-between"
        items="center"
        pressStyle={{ scale: 0.98 }}
        onPress={() => handleCategoryPress(shared)}
        cursor="pointer"
      >
        <YStack
          gap="$2"
          flex={1}
        >
          <XStack
            items="center"
            gap="$2"
          >
            <Paragraph
              fontWeight="600"
              color="$color12"
              size="$4"
            >
              {shared.category.name}
            </Paragraph>
            <YStack
              bg={getRoleColor(shared.role)}
              px="$2"
              py="$1"
            >
              <Text
                color="white"
                fontSize="$2"
                fontWeight="600"
              >
                {getRoleLabel(shared.role)}
              </Text>
            </YStack>
          </XStack>
          <XStack
            gap="$2"
            items="center"
          >
            <Briefcase
              size={16}
              color="$color10"
            />
            <Paragraph
              size="$3"
              color="$color10"
            >
              {shared.category.report.name}
            </Paragraph>
          </XStack>
          {shared.category.report.owner && (
            <XStack
              gap="$2"
              items="center"
            >
              <ProfilePicture
                avatarUrl={shared.category.report.owner.avatar_url}
                name={shared.category.report.owner.name}
                size={20}
                borderRadius="$10"
              />
              <Paragraph
                size="$3"
                color="$color10"
              >
                {shared.category.report.owner.name}
              </Paragraph>
            </XStack>
          )}
        </YStack>
        <ChevronRight
          size={20}
          color="$color11"
          ml="$3"
        />
      </XStack>
    </Card>
  )

  const renderContent = () => {
    if (loading) {
      return (
        <YStack
          flex={1}
          justify="center"
          items="center"
          p="$4"
        >
          <Spinner size="large" />
          <Paragraph
            mt="$3"
            color="$color11"
          >
            Loading shared categories...
          </Paragraph>
        </YStack>
      )
    }

    if (error) {
      return (
        <YStack
          flex={1}
          justify="center"
          items="center"
          p="$4"
          gap="$3"
        >
          <AlertCircle
            color="$red10"
            size={48}
          />
          <H3 color="$red10">Error Loading Shared Categories</H3>
          <Paragraph
            color="$red10"
            text="center"
          >
            {error?.message || 'Failed to load shared categories'}
          </Paragraph>
          <Button
            onPress={() => refetchSharedCategories()}
            variant="outlined"
          >
            Try Again
          </Button>
        </YStack>
      )
    }

    if (filteredCategories.length === 0) {
      return (
        <YStack
          flex={1}
          justify="center"
          items="center"
          p="$4"
          gap="$3"
        >
          <FolderOpen
            size={64}
            color="$color8"
          />
          <H3 color="$color11">
            {searchQueryRef.current ? 'No matching categories' : 'No shared categories yet'}
          </H3>
          <Paragraph
            color="$color10"
            text="center"
          >
            {searchQueryRef.current
              ? 'Try adjusting your search terms'
              : 'Categories shared with you will appear here'}
          </Paragraph>
        </YStack>
      )
    }

    return <YStack gap="$2">{filteredCategories.map(renderCategoryItem)}</YStack>
  }

  return (
    <>
      <NavigationBar onMenuPress={() => setMenuOpen(!menuOpen)} />

      <RefreshableScrollView
        flex={1}
        p="$4"
        pt={screenTopPadding}
        pb="$-4"
        bg="$background"
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        <YStack
          gap="$4"
          maxW={1200}
          width="100%"
          mx="auto"
          pb="$8"
          minH="84vh"
        >
          {/* Header with Back Button and Info */}
          <XStack
            justify="space-between"
            items="center"
            mb="$4"
          >
            <BackButton />
          </XStack>

          {/* Page Title and Subtitle */}
          <YStack
            gap="$2"
            mb="$4"
          >
            <H2 size="$8">Shared With You</H2>
            <Paragraph
              size="$4"
              color="$color10"
            >
              {sharedCategories.length.toString()} categories shared with you
            </Paragraph>
          </YStack>

          {/* Search Bar */}
          <XStack
            gap="$3"
            mb="$4"
          >
            <Input
              flex={1}
              placeholder="Search categories or workspaces..."
              defaultValue={searchQueryRef.current}
              onChangeText={(text) => {
                searchQueryRef.current = text
                requestSearchUiUpdate()
              }}
              size="$4"
            />
            <Button
              size="$4"
              variant="outlined"
              icon={Search}
            />
          </XStack>

          {/* Content */}
          {renderContent()}
        </YStack>
      </RefreshableScrollView>

      <Footer />

      <UserMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        variant="dropdown"
      />
    </>
  )
}
