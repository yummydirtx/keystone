import React, { useState, useCallback } from 'react'
import { ScrollView, YStack, H1, H2, H3, Paragraph, Separator } from '@my/ui'
import { RefreshableScrollView } from '../../components/RefreshableScrollView'
import { NavigationBar } from '../../components/NavigationBar.web'
import { Footer } from '../../components/Footer'

export function TermsScreen() {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      // For static content like terms, we don't need to fetch new data
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
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        <YStack
          p="$4"
          pt="$12"
          maxW={800}
          als="center"
          gap="$4"
        >
        <H1
          color="$color"
          items="center"
        >
          Terms and Conditions
        </H1>

        <Paragraph
          color="$color11"
          items="center"
          fontSize="$3"
        >
          Last updated: {new Date().toLocaleDateString()}
        </Paragraph>

        <Separator my="$3" />

        <YStack gap="$4">
          <YStack gap="$2">
            <H2 color="$color">1. Acceptance of Terms</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              By accessing or using the Keystone application ("App"), you agree to be bound by these
              Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use
              the App. We reserve the right to modify these Terms at any time, and your continued use
              of the App constitutes acceptance of any modifications.
            </Paragraph>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">2. Description of Service</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              Keystone is an expense tracking and shared budgeting application that allows users to:
            </Paragraph>
            <YStack
              pl="$3"
              gap="$1"
            >
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Track personal and shared expenses
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Create and manage shared workspaces with other users
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Manage budgets and categorize expenses
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Request and track reimbursements
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Sync data across multiple devices
              </Paragraph>
            </YStack>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">3. User Accounts</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              To use Keystone, you must create an account using Google Sign-In or Apple Sign-In. You
              agree to:
            </Paragraph>
            <YStack
              pl="$3"
              gap="$1"
            >
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Provide accurate and complete information
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Maintain the security of your account credentials
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Notify us immediately of any unauthorized access
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Be responsible for all activities under your account
              </Paragraph>
            </YStack>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">4. Acceptable Use</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              You agree not to use Keystone to:
            </Paragraph>
            <YStack
              pl="$3"
              gap="$1"
            >
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Violate any applicable laws or regulations
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Infringe on the rights of others
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Transmit malicious code or interfere with the App's operation
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Attempt to gain unauthorized access to our systems
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Engage in fraudulent or deceptive activities
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Use the App for any illegal financial activities
              </Paragraph>
            </YStack>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">5. User Content</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              You retain ownership of any content you submit to Keystone, including expense data,
              notes, and other information. By using the App, you grant us a limited license to
              store, process, and display your content solely for the purpose of providing the
              service to you. You are solely responsible for the accuracy and legality of your
              content.
            </Paragraph>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">6. Shared Workspaces</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              When using shared workspaces:
            </Paragraph>
            <YStack
              pl="$3"
              gap="$1"
            >
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • You are responsible for inviting only trusted individuals
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Workspace owners have administrative control over the workspace
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Data shared in workspaces is visible to all workspace members
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Keystone is not responsible for disputes between workspace members
              </Paragraph>
            </YStack>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">7. Intellectual Property</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              The Keystone App, including its design, features, code, and content (excluding user
              content), is owned by us and protected by copyright, trademark, and other intellectual
              property laws. You may not copy, modify, distribute, or create derivative works based
              on the App without our prior written consent.
            </Paragraph>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">8. Third-Party Services</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              Keystone integrates with third-party services including Google Sign-In, Apple Sign-In,
              and Firebase. Your use of these services is subject to their respective terms and
              conditions. We are not responsible for the practices or policies of third-party
              service providers.
            </Paragraph>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">9. Disclaimer of Warranties</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              KEYSTONE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER
              EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE,
              OR SECURE. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </Paragraph>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">10. Limitation of Liability</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO
              LOSS OF PROFITS, DATA, OR USE, ARISING OUT OF OR RELATED TO YOUR USE OF THE APP. OUR
              TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US, IF ANY, IN THE PAST TWELVE
              MONTHS.
            </Paragraph>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">11. Indemnification</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              You agree to indemnify and hold harmless Keystone, its affiliates, and their
              respective officers, directors, employees, and agents from any claims, damages,
              losses, or expenses (including reasonable attorneys' fees) arising out of your use of
              the App, violation of these Terms, or infringement of any rights of another.
            </Paragraph>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">12. Termination</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              We reserve the right to suspend or terminate your access to Keystone at any time, with
              or without cause or notice. You may also delete your account at any time through the
              App settings. Upon termination, your right to use the App will immediately cease, and
              we may delete your data in accordance with our Privacy Policy.
            </Paragraph>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">13. Governing Law</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              These Terms shall be governed by and construed in accordance with the laws of the
              United States, without regard to conflict of law principles. Any disputes arising from
              these Terms or your use of the App shall be resolved in the courts of competent
              jurisdiction.
            </Paragraph>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">14. Changes to Terms</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              We may update these Terms from time to time. We will notify you of any significant
              changes by posting the new Terms in the App and updating the "Last updated" date. Your
              continued use of Keystone after such modifications constitutes your acknowledgment and
              acceptance of the updated Terms.
            </Paragraph>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">15. Contact Us</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              If you have any questions about these Terms and Conditions, please contact us at:
            </Paragraph>
            <YStack
              pl="$3"
              gap="$1"
            >
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                Email: support@keystoneapp.com
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                Or through the app's support feature in Settings
              </Paragraph>
            </YStack>
          </YStack>
        </YStack>

        <YStack
          py="$6"
          items="center"
        >
          <Paragraph
            color="$color11"
            fontSize="$2"
            items="center"
          >
            These terms and conditions are effective as of the date listed above and apply to all
            users of the Keystone expense tracking application.
          </Paragraph>
        </YStack>

        <Footer />
      </YStack>
    </RefreshableScrollView>
    </>
  )
}
