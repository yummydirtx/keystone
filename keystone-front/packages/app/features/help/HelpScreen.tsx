import React, { useState, useCallback } from 'react'
import { ScrollView, YStack, XStack, H1, H2, H3, Paragraph, Card, Separator } from '@my/ui'
import { NavigationBar } from '../../components/NavigationBar'
import { Footer } from '../../components/Footer'
import { RefreshableScrollView } from '../../components/RefreshableScrollView'
import { useScreenTopPadding } from '../../hooks/useSafeAreaPadding'
import { AlexProfilePicture } from './components/AlexProfilePicture'
import {
  Briefcase,
  FolderOpen,
  Receipt,
  Share,
  Plus,
  CheckCircle,
  Link,
} from '@tamagui/lucide-icons'
import { Platform } from 'react-native'

export function HelpScreen() {
  const [refreshing, setRefreshing] = useState(false)

  const screenTopPadding = useScreenTopPadding()

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      // For static content like help screen, we don't need to fetch new data
      // Just simulate a brief refresh to provide user feedback
      await new Promise(resolve => setTimeout(resolve, 500))
    } finally {
      setRefreshing(false)
    }
  }, [])

  return (
    <>
      <NavigationBar onMenuPress={() => {}} />
      <RefreshableScrollView
        flex={1}
        bg="$background"
        p="$4"
        pt={screenTopPadding}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        <YStack
          gap="$6"
          maxW={1000}
          width="100%"
          mx="auto"
        >
          <YStack
            gap="$2"
            items="center"
            mt="$4"
          >
            <H1 color="$color12">Help & Information</H1>
            <Paragraph
              color="$color11"
              text="center"
              maxW={800}
            >
              Learn more about Keystone:
            </Paragraph>
          </YStack>

          {/* How Keystone works */}
          <YStack gap="$4">
            <YStack
              gap="$2"
              items="center"
            >
              <H2>How Keystone Works</H2>
              <Paragraph
                color="$color11"
                text="center"
                maxW={800}
              >
                Keystone helps you organize spending using Workspaces and Categories, submit
                Expenses, and collaborate via Shared Categories.
              </Paragraph>
            </YStack>

            {/* Concept cards */}
            <XStack
              gap="$4"
              flexWrap="wrap"
              justify="center"
            >
              <Card
                p="$5"
                bordered
                width={340}
                bg="$background"
                elevation="$1"
              >
                <YStack gap="$3">
                  <XStack
                    gap="$2"
                    items="center"
                  >
                    <Briefcase size={22} />
                    <H3>Workspaces</H3>
                  </XStack>
                  <Paragraph color="$color11">
                    A workspace is your top-level container for a project or budget. It holds all
                    related Categories and Expenses.
                  </Paragraph>
                  <Paragraph color="$color10">
                    Tip: Create a workspace for each team, event, or personal budget.
                  </Paragraph>
                </YStack>
              </Card>

              <Card
                p="$5"
                bordered
                width={340}
                bg="$background"
                elevation="$1"
              >
                <YStack gap="$3">
                  <XStack
                    gap="$2"
                    items="center"
                  >
                    <FolderOpen size={22} />
                    <H3>Categories</H3>
                  </XStack>
                  <Paragraph color="$color11">
                    Categories live inside a workspace and help group expenses (e.g., Travel,
                    Meals). You can create subcategories to organize further.
                  </Paragraph>
                  <Paragraph color="$color10">
                    Tip: Use subcategories for detailed budgets like "Travel → Flights".
                  </Paragraph>
                </YStack>
              </Card>

              <Card
                p="$5"
                bordered
                width={340}
                bg="$background"
                elevation="$1"
              >
                <YStack gap="$3">
                  <XStack
                    gap="$2"
                    items="center"
                  >
                    <Receipt size={22} />
                    <H3>Expenses</H3>
                  </XStack>
                  <Paragraph color="$color11">
                    An expense is a record with amount, date, optional receipt, and notes. Expenses
                    are added to a specific category.
                  </Paragraph>
                  <Paragraph color="$color10">
                    Tip: Upload a receipt photo to enable itemization and faster review.
                  </Paragraph>
                </YStack>
              </Card>

              <Card
                p="$5"
                bordered
                width={340}
                bg="$background"
                elevation="$1"
              >
                <YStack gap="$3">
                  <XStack
                    gap="$2"
                    items="center"
                  >
                    <Share size={22} />
                    <H3>Shared Categories</H3>
                  </XStack>
                  <Paragraph color="$color11">
                    Share a category with others to submit or review expenses together. The permissions system allows flexible collaboration.
                  </Paragraph>
                  <Paragraph color="$color10">
                    Roles: Submitter (add expenses), Reviewer (approve/deny), Admin (manage and
                    share).
                  </Paragraph>
                </YStack>
              </Card>

              <Card
                p="$5"
                bordered
                width={340}
                bg="$background"
                elevation="$1"
              >
                <YStack gap="$3">
                  <XStack
                    gap="$2"
                    items="center"
                  >
                    <Link size={22} />
                    <H3>Guest Links</H3>
                  </XStack>
                  <Paragraph color="$color11">
                    Invite people without accounts using a secure link limited to a single category.
                  </Paragraph>
                  <Paragraph color="$color10">
                    Permissions: Submitter (upload expenses) or Reviewer (view and review). Links
                    can expire or be revoked anytime.
                  </Paragraph>
                </YStack>
              </Card>
            </XStack>
          </YStack>

          {/* Quick start steps */}
          <YStack
            gap="$3"
            mt="$6"
          >
            <H2>Quick Start</H2>
            <YStack gap="$3">
              <XStack
                gap="$2"
                items="center"
                flexWrap="wrap"
              >
                <Plus size={18} />
                <YStack
                  flex={1}
                  minW={0}
                >
                  <Paragraph>
                    Create a{' '}
                    <Paragraph
                      display="inline"
                      fontWeight="600"
                    >
                      Workspace
                    </Paragraph>
                    , then add{' '}
                    <Paragraph
                      display="inline"
                      fontWeight="600"
                    >
                      Categories
                    </Paragraph>
                    .
                  </Paragraph>
                </YStack>
              </XStack>
              <XStack
                gap="$2"
                items="center"
                flexWrap="wrap"
              >
                <Receipt size={18} />
                <YStack
                  flex={1}
                  minW={0}
                >
                  <Paragraph>
                    Add{' '}
                    <Paragraph
                      display="inline"
                      fontWeight="600"
                    >
                      Expenses
                    </Paragraph>{' '}
                    with receipts and notes to the right category.
                  </Paragraph>
                </YStack>
              </XStack>
              <XStack
                gap="$2"
                items="center"
                flexWrap="wrap"
              >
                <Share size={18} />
                <YStack
                  flex={1}
                  minW={0}
                >
                  <Paragraph>
                    Share a category and assign roles to collaborate on submissions and reviews.
                  </Paragraph>
                </YStack>
              </XStack>
              <XStack
                gap="$2"
                items="center"
                flexWrap="wrap"
              >
                <CheckCircle size={18} />
                <YStack
                  flex={1}
                  minW={0}
                >
                  <Paragraph>Review pending expenses and approve or deny as needed.</Paragraph>
                </YStack>
              </XStack>
            </YStack>
          </YStack>

          <Separator />

          <Card
            p="$6"
            bg="$background"
            elevation="$2"
            borderWidth={1}
            borderColor="$borderColor"
          >
            <XStack
              gap="$6"
              items="center"
              $sm={{ flexDirection: 'row' }}
              flexDirection="column"
            >
              <AlexProfilePicture size={140} />

              <YStack
                gap="$3"
                flex={1}
              >
                <H2 color="$color12">Hi, I'm Alex Frutkin</H2>
                <Paragraph
                  color="$color11"
                  lineHeight="$4"
                >
                  I'm a student at the University of California, Irvine studying Software
                  Engineering. I'm passionate about software development, and I'm always looking for
                  new opportunities to learn and grow.
                </Paragraph>
                <Paragraph
                  color="$color11"
                  lineHeight="$4"
                >
                  I'm currently seeking internships for Summer 2026.
                </Paragraph>
              </YStack>
            </XStack>
          </Card>

          <YStack
            gap="$2"
            items="center"
            mt="$6"
            mb="$6"
          >
            <Paragraph
              color="$color10"
              text="center"
            >
              Thank you for using Keystone! Questions or feedback? Email thejunkyarddev@gmail.com
            </Paragraph>
          </YStack>
        </YStack>
      </RefreshableScrollView>
      <Footer />
    </>
  )
}
