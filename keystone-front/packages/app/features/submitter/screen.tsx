// packages/app/features/submitter/screen.tsx
import {
  Button,
  Paragraph,
  YStack,
  XStack,
  Spinner,
  H1,
  H2,
  Separator,
  ScrollView,
  Text,
  Card,
} from '@my/ui'
import { BackButton } from 'app/components/BackButton'
import { FolderOpen, Briefcase, ChevronRight, ChevronDown, Plus } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'
import React, { useState, useEffect, useCallback } from 'react'
import { NavigationBar } from '../../components/NavigationBar'
import { UserMenu } from '../../components/UserMenu'
import { Footer } from 'app/components/Footer'
import { RefreshableScrollView } from '../../components/RefreshableScrollView'
import { LoginScreen } from '../auth/LoginScreen'
import { useAuth } from '../../provider/AuthProvider'
import type { SharedCategory } from '../../types'
import { useSubmitterCategories } from '../../utils/queries.optimized'
import { useToastController } from '@my/ui'
import { CreateExpenseSheet } from '../expense/CreateExpenseSheet'
import { useScreenTopPadding } from '../../hooks/useSafeAreaPadding'

export function SubmitterScreen() {
  const router = useRouter()
  const { userProfile, loading: authLoading } = useAuth()
  const toast = useToastController()
  const screenTopPadding = useScreenTopPadding()

  // State for UI
  const [menuOpen, setMenuOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // UI state for expense creation sheet
  const [createExpenseOpen, setCreateExpenseOpen] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)

  // Use TanStack Query hook for submitter categories
  const {
    data: submitterCategoriesData = [],
    isLoading,
    isError,
    error: queryError,
    refetch,
  } = useSubmitterCategories({
    enabled: !!userProfile,
  })

  // API already returns submitter+ categories (flat). We'll build a parent->children map for expansion.
  const submitterCategories = submitterCategoriesData

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }, [refetch])

  const childrenByParent = React.useMemo(() => {
    const map = new Map<number, SharedCategory[]>()
    for (const sc of submitterCategories) {
      const parentId = sc.category.parent_category_id ?? 0
      if (parentId) {
        const arr = map.get(parentId) || []
        arr.push(sc)
        map.set(parentId, arr)
      }
    }
    return map
  }, [submitterCategories])

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Simple mobile detection (web only). Native apps will adapt via layout.
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    // Only run on web platforms where window exists
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      const check = () => setIsMobile(window.innerWidth <= 768)
      check()
      window.addEventListener('resize', check)
      return () => window.removeEventListener('resize', check)
    }
    // On native, assume mobile layout
    setIsMobile(true)
  }, [])

  const renderCategoryRow = (shared: SharedCategory, level = 0): React.ReactNode => {
    const children = childrenByParent.get(shared.category.id) || []
    const isExpanded = expandedIds.has(shared.category.id)

    const roleBg =
      shared.role === 'OWNER'
        ? '$color3'
        : shared.role === 'ADMIN'
          ? '$green3'
          : shared.role === 'REVIEWER'
            ? '$yellow3'
            : '$blue3'
    const roleColor =
      shared.role === 'OWNER'
        ? '$color10'
        : shared.role === 'ADMIN'
          ? '$green10'
          : shared.role === 'REVIEWER'
            ? '$yellow10'
            : '$blue10'

    return (
      <React.Fragment key={`${shared.category.id}-${level}`}>
        <XStack
          p="$3"
          justify="space-between"
          items="center"
          minH="$6"
          gap="$3"
          pressStyle={{ scale: 0.98 }}
          onPress={() => handleCategoryPress(shared.category.id, shared.role)}
          cursor="pointer"
          hoverStyle={{ bg: '$color2' }}
          ml={level * 12}
        >
          <YStack
            flex={1}
            gap="$1"
          >
            <XStack
              gap="$2"
              items="center"
            >
              <Paragraph
                fontWeight="600"
                color="$color12"
              >
                {shared.category.name}
              </Paragraph>
              {children.length > 0 && (
                <Button
                  size="$2"
                  circular
                  variant="outlined"
                  onPress={(e) => {
                    e.stopPropagation()
                    toggleExpanded(shared.category.id)
                  }}
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </Button>
              )}
            </XStack>
            <XStack
              items="center"
              gap="$1"
            >
              <Briefcase
                size={14}
                color="$color10"
              />
              <Text
                color="$color10"
                fontSize="$3"
              >
                {shared.category.report.name}
              </Text>
            </XStack>
            <XStack>
              <YStack
                bg={roleBg}
                px="$2"
                py="$1"
              >
                <Text
                  fontSize="$2"
                  color={roleColor}
                >
                  {shared.role}
                </Text>
              </YStack>
            </XStack>
          </YStack>
          {/* Only show submit button if user submissions are allowed */}
          {shared.category.allow_user_submissions !== false ? (
            <Button
              size={isMobile ? '$2' : '$3'}
              variant="outlined"
              onPress={(e) => {
                e.stopPropagation()
                handleCategoryPress(shared.category.id, shared.role)
              }}
            >
              {isMobile ? <Plus size={16} /> : 'Submit Expense'}
            </Button>
          ) : (
            <Text
              fontSize="$2"
              color="$color9"
            >
              Submissions disabled
            </Text>
          )}
        </XStack>

        {children.length > 0 && isExpanded && (
          <YStack>
            {children
              .sort((a, b) => a.category.name.localeCompare(b.category.name))
              .map((child) => renderCategoryRow(child, level + 1))}
          </YStack>
        )}
      </React.Fragment>
    )
  }

  const handleCategoryPress = (categoryId: number, role: string) => {
    // For all roles, go to the submitter page for that category
    router.push(`/submitter/${categoryId}`)
  }

  const handleExpenseCreated = () => {
    setCreateExpenseOpen(false)
    setSelectedCategoryId(null)
    // Don't show toast here - CreateExpenseSheet handles its own success message
  }

  if (authLoading || isLoading) {
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

  if (!userProfile) {
    return <LoginScreen />
  }

  if (isError) {
    return (
      <>
        <NavigationBar onMenuPress={() => setMenuOpen(!menuOpen)} />
        <YStack
          flex={1}
          justify="center"
          items="center"
          gap="$4"
        >
          <Paragraph color="$red10">
            {queryError?.message || "Couldn't load categories. Please try again."}
          </Paragraph>
          <Button onPress={() => refetch()}>Try Again</Button>
        </YStack>
      </>
    )
  }

  return (
    <>
      <NavigationBar onMenuPress={() => setMenuOpen(!menuOpen)} />
      <YStack flex={1}>
        <RefreshableScrollView
          flex={1}
          p="$4"
          pb="$-4"
          pt={screenTopPadding}
          bg="$background"
          refreshing={refreshing}
          onRefresh={handleRefresh}
        >
          <YStack
            gap="$4"
            pb="$8"
            minH="84vh"
            maxW={1200}
            width="100%"
            mx="auto"
          >
            {/* Header */}
            <YStack
              gap="$2"
              mb="$4"
            >
              <XStack
                justify="space-between"
                items="center"
              >
                <BackButton />
              </XStack>
              <H1>Submit Expenses</H1>
              <Paragraph color="$color11">
                Click on any category below to submit an expense directly.
              </Paragraph>
            </YStack>

            <Separator />

            {/* Available Categories */}
            <Card
              p="$4"
              gap="$3"
            >
              <XStack
                gap="$2"
                items="center"
              >
                <FolderOpen
                  size={24}
                  color="$blue10"
                />
                <H2 size="$6">Available Categories</H2>
              </XStack>

              <Paragraph
                color="$color11"
                size="$3"
              >
                Select a category to submit an expense
              </Paragraph>

              <YStack
                gap="$2"
                mt="$2"
              >
                {submitterCategories.length === 0 ? (
                  <YStack
                    gap="$2"
                    items="center"
                    py="$4"
                  >
                    <Briefcase
                      size={32}
                      color="$color8"
                    />
                    <Paragraph color="$color11">No categories available</Paragraph>
                    <Paragraph
                      color="$color10"
                      size="$3"
                    >
                      You don't have submitter access to any categories yet.{'\n'}
                      Contact an admin to get access.
                    </Paragraph>
                  </YStack>
                ) : (
                  submitterCategories
                    .filter((shared) => !shared.category.parent_category_id)
                    .sort((a, b) => a.category.name.localeCompare(b.category.name))
                    .map((shared, index) => (
                      <React.Fragment key={shared.category.id}>
                        {index > 0 && <Separator />}
                        {renderCategoryRow(shared, 0)}
                      </React.Fragment>
                    ))
                )}
              </YStack>
            </Card>
          </YStack>
        </RefreshableScrollView>
        <Footer />
      </YStack>

      <UserMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      {/* Expense Creation Sheet */}
      {selectedCategoryId && (
        <CreateExpenseSheet
          isOpen={createExpenseOpen}
          onClose={() => {
            setCreateExpenseOpen(false)
            setSelectedCategoryId(null)
          }}
          categoryId={selectedCategoryId}
          onExpenseCreated={handleExpenseCreated}
        />
      )}
    </>
  )
}
