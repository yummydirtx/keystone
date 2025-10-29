import React, { useEffect, useState, useCallback } from 'react'
import {
  Button,
  H1,
  H2,
  H3,
  Paragraph,
  XStack,
  YStack,
  Card,
  ScrollView,
  Circle,
  Text,
  Anchor,
} from '@my/ui'
import {
  Receipt,
  Users,
  Brain,
  Shield,
  ArrowRight,
  CheckCircle,
  Star,
  FileText,
  Link,
  UserCheck,
  FolderTree,
} from '@tamagui/lucide-icons'
import { LinearGradient } from '@tamagui/linear-gradient'
import { useRouter } from 'solito/navigation'
import { useAuth } from '../../provider/AuthProvider'
import { NavigationBar } from '../../components/NavigationBar.web'
import { RefreshableScrollView } from '../../components/RefreshableScrollView'
import { RainbowKeystoneAI } from '../expense/components/RainbowKeystoneAI'

/**
 * Modern landing page for Keystone - AI-powered expense tracking and reporting platform
 */
export function LandingScreen() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      // For static content like landing page, we don't need to fetch new data
      // Just simulate a brief refresh to provide user feedback
      await new Promise(resolve => setTimeout(resolve, 500))
    } finally {
      setRefreshing(false)
    }
  }, [])

  // Redirect authenticated users to the dashboard
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  // Show a loading state during the auth check
  if (loading) {
    return (
      <YStack
        flex={1}
        justify="center"
        items="center"
        minH="100vh"
      >
        <Paragraph>Loading...</Paragraph>
      </YStack>
    )
  }

  // Do not show landing page content if the user is authenticated (they'll be redirected)
  if (user) {
    return (
      <YStack
        flex={1}
        justify="center"
        items="center"
        minH="100vh"
      >
        <Paragraph>Redirecting to the dashboard...</Paragraph>
      </YStack>
    )
  }

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Receipt Processing',
      description:
        'Upload receipts and let AI extract totals, dates, line items, and categories automatically. Eliminate manual data entry and accelerate reimbursements.',
    },
    {
      icon: UserCheck,
      title: 'Multi-Step Approvals',
      description:
        'Configure multi-step approval workflows with reviewers and admins. Direct expenses to the right people, enforce policies, and track status from submission to approval.',
    },
    {
      icon: FolderTree,
      title: 'Hierarchical Categories',
      description:
        'Organize spending with categories and subcategories. Delegate ownership by team, project, or department, and roll up budgets and reports across the organization.',
    },
    {
      icon: Users,
      title: 'Guest Access and Permissions',
      description:
        'Invite contributors without accounts. Fine-grained permissions let guests submit receipts or review expenses securely using expiring share links.',
    },
    {
      icon: FileText,
      title: 'Comprehensive Reporting',
      description:
        'Drill into spending by team, category, and time. Monitor budgets, analyze trends, and export audit-ready reports in seconds.',
    },
    {
      icon: Shield,
      title: 'Enterprise-Grade Security',
      description:
        'Bank-level encryption, role-based access control, and secure storage backed by Firebase and Google Cloud.',
    },
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Finance Manager',
      content:
        "Keystone's AI receipt processing saves me hours every week. I just snap photos, and the system handles all the data entry automatically.",
      rating: 5,
    },
    {
      name: 'Mike Rodriguez',
      role: 'Project Manager',
      content:
        'The guest access feature is incredible. Team members can submit expenses without accounts, and I can review everything in one dashboard.',
      rating: 5,
    },
    {
      name: 'Emily Johnson',
      role: 'Small Business Owner',
      content:
        'The reporting features help me track business expenses across multiple categories. The analytics give me insights I never had before.',
      rating: 5,
    },
  ]

  return (
    <>
      {/*<NavigationBar onMenuPress={() => { }} />*/}
      <RefreshableScrollView 
        flex={1}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        <YStack
          flex={1}
          minH="100vh"
        >
          {/* Hero Section */}
          <YStack
            position="relative"
            minH="100vh"
            justify="center"
            items="center"
            p="$4"
            pt="$16"
          >
            {/* Background Gradient */}
            <LinearGradient
              position="absolute"
              t={0}
              l={0}
              r={0}
              b={0}
              colors={['$blue2', '$purple2', '$pink2']}
              start={[0, 0]}
              end={[1, 1]}
              opacity={0.1}
            />

            <YStack
              maxW={800}
              width="100%"
              gap="$6"
              items="center"
            >
              <H1
                fontWeight="800"
                color="$color12"
                text="center"
                style={{
                  fontSize: 'clamp(3.5rem, 6vw, 5.5rem)',
                  lineHeight: 1.1,
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                }}
              >
                <img
                  src="/favicon.ico"
                  alt="Keystone logo"
                  style={{
                    height: '1em',
                    width: '1em',
                    verticalAlign: 'middle',
                    marginRight: '0.2em',
                    marginBottom: '0.1em',
                    borderRadius: 8,
                  }}
                />
                <RainbowKeystoneAI>Keystone</RainbowKeystoneAI>
              </H1>
              <YStack
                gap="$4"
                items="center"
              >
                <H1
                  size="$10"
                  fontWeight="800"
                  color="$color12"
                  text="center"
                >
                  AI-Powered{'\n'}
                  <Text color="$blue10">Expense Tracking</Text>
                </H1>
                <Paragraph
                  size="$6"
                  color="$color11"
                  maxW={600}
                  text="center"
                >
                  Upload receipts and let AI handle the data entry. Manage team expenses with guest
                  access and detailed reporting. Built for modern businesses and teams.
                </Paragraph>
              </YStack>

              <XStack
                gap="$4"
                flexDirection="column"
                $sm={{ flexDirection: 'row' }}
                justify="center"
              >
                {user ? (
                  <Button
                    size="$5"
                    theme="blue"
                    iconAfter={ArrowRight}
                    pressStyle={{ scale: 0.95 }}
                    onPress={() => router.push('/dashboard')}
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      size="$5"
                      theme="blue"
                      iconAfter={ArrowRight}
                      pressStyle={{ scale: 0.95 }}
                      onPress={() => router.push('/auth/login')}
                    >
                      Get Started for Free
                    </Button>
                    <Button
                      size="$5"
                      variant="outlined"
                      pressStyle={{ scale: 0.95 }}
                      onPress={() => router.push('/auth/login')}
                    >
                      Sign In
                    </Button>
                  </>
                )}
              </XStack>

              {/* Trust Indicators */}
              <XStack
                gap="$6"
                items="center"
                justify="center"
                flexWrap="wrap"
                mt="$6"
              >
                <XStack
                  items="center"
                  gap="$2"
                >
                  <CheckCircle
                    size={20}
                    color="$green10"
                  />
                  <Paragraph
                    fontSize="$4"
                    color="$color11"
                  >
                    AI-Powered Processing
                  </Paragraph>
                </XStack>
                <XStack
                  items="center"
                  gap="$2"
                >
                  <CheckCircle
                    size={20}
                    color="$green10"
                  />
                  <Paragraph
                    fontSize="$4"
                    color="$color11"
                  >
                    Guest Access
                  </Paragraph>
                </XStack>
                <XStack
                  items="center"
                  gap="$2"
                >
                  <CheckCircle
                    size={20}
                    color="$green10"
                  />
                  <Paragraph
                    fontSize="$4"
                    color="$color11"
                  >
                    Enterprise Security
                  </Paragraph>
                </XStack>
              </XStack>
            </YStack>
          </YStack>

          {/* Features Section */}
          <YStack
            p="$4"
            py="$12"
            bg="$background"
          >
            <YStack
              maxW={1200}
              width="100%"
              mx="auto"
              gap="$8"
            >
              <YStack
                gap="$4"
                items="center"
              >
                <H2
                  size="$8"
                  fontWeight="700"
                  color="$color12"
                  text="center"
                >
                  Built for modern, organization-wide expense management
                </H2>
                <Paragraph
                  size="$5"
                  color="$color11"
                  maxW={600}
                  text="center"
                >
                  From AI-powered receipt processing to multi-step approvals and hierarchical
                  categories, Keystone helps teams delegate, control, and scale expenses across your
                  organization.
                </Paragraph>
              </YStack>

              <XStack
                gap="$6"
                flexWrap="wrap"
                justify="center"
              >
                {features.map((feature, index) => (
                  <Card
                    key={index}
                    width={320}
                    height="auto"
                    p="$6"
                    borderRadius="$6"
                    borderWidth={1}
                    borderColor="$borderColor"
                    bg="$background"
                    elevation="$2"
                    hoverStyle={{
                      borderColor: '$blue8',
                      transform: 'translateY(-4px)',
                    }}
                    animation="quick"
                  >
                    <YStack
                      gap="$4"
                      height="100%"
                    >
                      <Circle
                        size={60}
                        bg="$blue3"
                        items="center"
                        justify="center"
                      >
                        <feature.icon
                          size={24}
                          color="$blue10"
                        />
                      </Circle>
                      <YStack
                        gap="$3"
                        flex={1}
                      >
                        <H3
                          size="$6"
                          fontWeight="600"
                          color="$color12"
                        >
                          {feature.title}
                        </H3>
                        <Paragraph
                          size="$4"
                          color="$color11"
                          lineHeight="$1"
                        >
                          {feature.description}
                        </Paragraph>
                      </YStack>
                    </YStack>
                  </Card>
                ))}
              </XStack>
            </YStack>
          </YStack>

          {/* Testimonials Section
          <YStack p="$4" py="$12" background="$gray2">
            <YStack maxW={1200} width="100%" mx="auto" gap="$8">
              <YStack gap="$4" items="center">
                <H2 size="$8" fontWeight="700" color="$color12">
                  Trusted by finance teams worldwide
                </H2>
                <Paragraph size="$5" color="$color11" maxW={600} mx="auto">
                  See how Keystone is transforming expense management for businesses
                </Paragraph>
              </YStack>

              <XStack gap="$6" flexWrap="wrap" justify="center">
                {testimonials.map((testimonial, index) => (
                  <Card
                    key={index}
                    width={340}
                    height="auto"
                    p="$6"
                    borderRadius="$6"
                    bg="$background"
                    borderWidth={1}
                    borderColor="$borderColor"
                    elevation="$1"
                  >
                    <YStack gap="$4" height="100%">
                      <XStack gap="$1">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} size={16} color="$yellow10" fill="$yellow10" />
                        ))}
                      </XStack>
                      <Paragraph size="$4" color="$color11" lineHeight="$1" fontStyle="italic">
                        "{testimonial.content}"
                      </Paragraph>
                      <YStack gap="$1" mt="auto">
                        <Text fontSize="$4" fontWeight="600" color="$color12">
                          {testimonial.name}
                        </Text>
                        <Text fontSize="$3" color="$color10">
                          {testimonial.role}
                        </Text>
                      </YStack>
                    </YStack>
                  </Card>
                ))}
              </XStack>
            </YStack>
          </YStack>
          */}

          {/* CTA Section */}
          <YStack
            p="$4"
            py="$12"
            bg="$background"
          >
            <YStack
              maxW={800}
              width="100%"
              mx="auto"
              gap="$6"
              items="center"
            >
              <YStack gap="$4">
                <H2
                  size="$8"
                  fontWeight="700"
                  color="$color12"
                  text="center"
                >
                  Ready to streamline your expense management?
                </H2>
                <Paragraph
                  size="$5"
                  color="$color11"
                  maxW={600}
                  mx="auto"
                  text="center"
                >
                  Join teams worldwide that have transformed their expense workflows with AI-powered
                  processing and intelligent reporting.
                </Paragraph>
              </YStack>

              {!user && (
                <Button
                  size="$6"
                  theme="blue"
                  iconAfter={ArrowRight}
                  pressStyle={{ scale: 0.95 }}
                  onPress={() => router.push('/auth/login')}
                >
                  Create Your Free Account
                </Button>
              )}
            </YStack>
          </YStack>
        </YStack>
      </RefreshableScrollView>
    </>
  )
}
