// packages/app/features/submitter/category-screen.tsx
import {
  Button,
  Paragraph,
  YStack,
  XStack,
  Spinner,
  H1,
  H2,
  H3,
  Separator,
  ScrollView,
  Card,
  Text,
} from '@my/ui'
import { ChevronLeft, FolderOpen, User, ChevronRight } from '@tamagui/lucide-icons'
import { useRouter, useSearchParams } from 'solito/navigation'
import React, { useState, useEffect, useCallback } from 'react'
import { NavigationBar } from '../../components/NavigationBar'
import { UserMenu } from '../../components/UserMenu'
import { Footer } from 'app/components/Footer'
import { RefreshableScrollView } from '../../components/RefreshableScrollView'
import { LoginScreen } from '../auth/LoginScreen'
import { useAuth } from '../../provider/AuthProvider'
import { getCategory, validateGuestToken, getGuestData } from '../../utils/api'
import { Category } from '../../types'
import { useToastController } from '@my/ui'
import { CreateExpenseSheet } from '../expense/CreateExpenseSheet'
import { useSubmitterCategoryQuery } from './useSubmitterCategoryQuery'
import { BackButton } from 'app/components/BackButton'
import { useScreenTopPadding } from '../../hooks/useSafeAreaPadding'
import { ProfilePicture } from '../../components/ProfilePicture'

interface CategorySubmitterScreenProps {
  id: string
}

export function CategorySubmitterScreen({ id }: CategorySubmitterScreenProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userProfile, loading: authLoading, isGuest, setGuestSession } = useAuth()
  const toast = useToastController()
  const { category, loading, error, refetch } = useSubmitterCategoryQuery(id)
  const screenTopPadding = useScreenTopPadding()

  // State for category details
  const [menuOpen, setMenuOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // UI state for expense creation sheet
  const [createExpenseOpen, setCreateExpenseOpen] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }, [refetch])

  useEffect(() => {
    const guestToken = searchParams?.get('guestToken')

    const authenticateGuest = async (token: string) => {
      try {
        const response = await validateGuestToken(token)
        let permissionLevel = null

        if (response.data) {
          const guestSessionData = {
            token: token,
            permissions: response.data.permission_level,
            categoryId: response.data.category_id,
          }
          setGuestSession(guestSessionData)
          permissionLevel = response.data.permission_level
        } else {
          // Check if the data is directly in the response
          if (response.permission_level && response.category_id) {
            const guestSessionData = {
              token: token,
              permissions: response.permission_level,
              categoryId: response.category_id,
            }
            setGuestSession(guestSessionData)
            permissionLevel = response.permission_level
          }
        }

        // Redirect REVIEW_ONLY users to the category detail page
        if (permissionLevel === 'REVIEW_ONLY') {
          router.push(`/category/${id}?guestToken=${token}`)
        }
      } catch (error) {
        console.error('Guest token validation failed', error)
      }
    }

    if (guestToken) {
      authenticateGuest(guestToken)
    }
  }, [id, searchParams, setGuestSession, router])

  const fetchCategory = async () => {
    // Refetching logic can be added to the hook if needed
  }

  const handleCreateExpense = () => {
    setCreateExpenseOpen(true)
  }

  const handleBackNavigation = () => {
    const guestToken = searchParams?.get('guestToken')

    if (guestToken && category?.parentCategory) {
      // For guest users with a parent category, navigate to the parent with the token
      router.push(`/submitter/${category.parentCategory.id}?guestToken=${guestToken}`)
    } else {
      // For authenticated users or when no parent exists, use browser back
      router.back()
    }
  }

  const handleSubcategoryPress = (subcategoryId: number) => {
    const guestToken = searchParams?.get('guestToken')
    if (guestToken) {
      // For guest users, preserve the guest token in the URL
      router.push(`/submitter/${subcategoryId}?guestToken=${guestToken}`)
    } else {
      // For authenticated users, navigate normally
      router.push(`/submitter/${subcategoryId}`)
    }
  }

  const handleExpenseCreated = () => {
    setCreateExpenseOpen(false)
    // Don't show toast here - CreateExpenseSheet handles its own success message
  }

  const handleParentCategoryNavigation = () => {
    const guestToken = searchParams?.get('guestToken')

    if (category?.parentCategory) {
      if (guestToken) {
        router.push(`/submitter/${category.parentCategory.id}?guestToken=${guestToken}`)
      } else {
        router.push(`/submitter/${category.parentCategory.id}`)
      }
    }
  }

  if (authLoading || loading) {
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

  if (!userProfile && !isGuest) {
    return <LoginScreen />
  }

  if (error) {
    return (
      <>
        <NavigationBar onMenuPress={() => setMenuOpen(!menuOpen)} />
        <YStack
          flex={1}
          justify="center"
          items="center"
          gap="$4"
        >
          <Paragraph color="$red10">{error}</Paragraph>
          <Button onPress={fetchCategory}>Try Again</Button>
        </YStack>
      </>
    )
  }

  if (!category) {
    return (
      <>
        <NavigationBar onMenuPress={() => setMenuOpen(!menuOpen)} />
        <YStack
          flex={1}
          justify="center"
          items="center"
          gap="$4"
        >
          <Paragraph color="$color11">Category not found</Paragraph>
          {(!isGuest || (typeof window !== 'undefined' && window.history.length > 1)) && (
            <Button
              icon={ChevronLeft}
              onPress={handleBackNavigation}
            >
              Go Back
            </Button>
          )}
        </YStack>
      </>
    )
  }

  const subcategories =
    category.children && category.children.length > 0
      ? category.children
      : category.child_categories || []

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
              justify={'space-between'}
              mb="$4"
            >
              <XStack
                justify="space-between"
                items="center"
              >
                <BackButton />
              </XStack>
              <XStack
                gap="$2"
                items="center"
              >
                <H1>Submit Expense</H1>
              </XStack>
              <Paragraph color="$color11">Submit an expense for this category</Paragraph>
            </YStack>

            <Separator />

            {/* Category Info */}
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
                <YStack gap="$1">
                  <H2 size="$6">{category.name}</H2>
                  {category.parentCategory && (
                    <Text
                      fontSize="$3"
                      color="$color10"
                    >
                      in {category.parentCategory.name}
                    </Text>
                  )}
                </YStack>
              </XStack>

              {category.report && (
                <Paragraph
                  color="$color10"
                  size="$3"
                >
                  Workspace: {category.report.name}
                </Paragraph>
              )}

              {/* Workspace Owner */}
              {category.report?.owner && (
                <Card
                  p="$3"
                  bg="$color2"
                >
                  <XStack
                    gap="$3"
                    items="center"
                  >
                    <ProfilePicture
                      avatarUrl={category.report.owner.avatar_url}
                      name={category.report.owner.name || category.report.owner.email}
                      size={48}
                      borderRadius="$10"
                    />
                    <YStack gap="$1">
                      <Text
                        fontSize="$4"
                        fontWeight="600"
                      >
                        {category.report.owner.name || 'Workspace Owner'}
                      </Text>
                      <Text
                        fontSize="$3"
                        color="$color10"
                      >
                        {category.report.owner.email}
                      </Text>
                    </YStack>
                  </XStack>
                </Card>
              )}

              {/* Show submit button only if submissions are allowed for this user type */}
              {(isGuest
                ? category.allow_guest_submissions !== false
                : category.allow_user_submissions !== false) && (
                <Button
                  size="$4"
                  onPress={handleCreateExpense}
                  mt="$3"
                >
                  Create New Expense
                </Button>
              )}

              {/* Show message if submissions are disabled */}
              {(isGuest
                ? category.allow_guest_submissions === false
                : category.allow_user_submissions === false) && (
                <Card
                  p="$3"
                  mt="$3"
                  bg="$color3"
                  items="center"
                >
                  <Text
                    color="$color11"
                    fontWeight="600"
                  >
                    {isGuest
                      ? 'Guest submissions are disabled for this category'
                      : 'User submissions are disabled for this category'}
                  </Text>
                </Card>
              )}
            </Card>

            {/* Subcategories */}
            {subcategories.length > 0 && (
              <Card
                p="$4"
                gap="$3"
              >
                <H3 size="$5">Subcategories</H3>
                <Paragraph
                  color="$color10"
                  size="$3"
                >
                  Select a subcategory to submit expenses
                </Paragraph>

                <YStack gap="$2">
                  {subcategories.map((subcategory) => (
                    <Card
                      key={subcategory.id}
                      p="$3"
                      pressStyle={{ scale: 0.98 }}
                      onPress={() => handleSubcategoryPress(subcategory.id)}
                      cursor="pointer"
                    >
                      <XStack
                        justify="space-between"
                        items="center"
                      >
                        <XStack
                          gap="$2"
                          items="center"
                          flex={1}
                        >
                          <FolderOpen
                            size={20}
                            color="$color10"
                          />
                          <Text fontSize="$4">{subcategory.name}</Text>
                        </XStack>
                        <ChevronRight
                          size={20}
                          color="$color10"
                        />
                      </XStack>
                    </Card>
                  ))}
                </YStack>
              </Card>
            )}
          </YStack>
        </RefreshableScrollView>
        <Footer />
      </YStack>

      <UserMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      {/* Expense Creation Sheet */}
      <CreateExpenseSheet
        isOpen={createExpenseOpen}
        onClose={() => setCreateExpenseOpen(false)}
        categoryId={category?.id}
        categoryData={category}
        userRole="SUBMITTER"
        onExpenseCreated={handleExpenseCreated}
      />
    </>
  )
}
