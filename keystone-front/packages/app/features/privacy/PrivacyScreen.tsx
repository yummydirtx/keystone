import React, { useState, useCallback } from 'react'
import { ScrollView, YStack, H1, H2, H3, Paragraph, Separator } from '@my/ui'
import { RefreshableScrollView } from '../../components/RefreshableScrollView'

export function PrivacyScreen() {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      // For static content like privacy policy, we don't need to fetch new data
      // Just simulate a brief refresh to provide user feedback
      await new Promise(resolve => setTimeout(resolve, 500))
    } finally {
      setRefreshing(false)
    }
  }, [])

  return (
    <RefreshableScrollView
      flex={1}
      bg="$background"
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <YStack
        p="$4"
        maxW={800}
        justify="center"
        gap="$4"
      >
        <H1
          color="$color"
          items="center"
        >
          Privacy Policy
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
            <H2 color="$color">1. Information We Collect</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              Keystone collects information to provide better services to our users. We collect
              information in the following ways:
            </Paragraph>

            <YStack
              pl="$3"
              gap="$2"
            >
              <YStack gap="$1">
                <H3
                  color="$color"
                  fontSize="$4"
                >
                  Personal Information
                </H3>
                <Paragraph
                  color="$color"
                  lineHeight="$4"
                >
                  When you sign in to Keystone, we collect your email address, name, and profile
                  picture from your Google or Apple account. This information is used to create and
                  maintain your user account.
                </Paragraph>
              </YStack>

              <YStack gap="$1">
                <H3
                  color="$color"
                  fontSize="$4"
                >
                  Expense Data
                </H3>
                <Paragraph
                  color="$color"
                  lineHeight="$4"
                >
                  We collect and store the expense information you enter into the app, including
                  amounts, categories, descriptions, and dates. This data is necessary to provide
                  the core functionality of expense tracking.
                </Paragraph>
              </YStack>

              <YStack gap="$1">
                <H3
                  color="$color"
                  fontSize="$4"
                >
                  Usage Information
                </H3>
                <Paragraph
                  color="$color"
                  lineHeight="$4"
                >
                  We may collect information about how you use the app, including which features you
                  access and how often you use the service.
                </Paragraph>
              </YStack>
            </YStack>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">2. How We Use Your Information</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              We use the information we collect to:
            </Paragraph>
            <YStack
              pl="$3"
              gap="$1"
            >
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Provide, maintain, and improve our services
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Process and sync your expense data across devices
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Authenticate your identity and maintain account security
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Provide customer support and respond to your requests
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Send you important updates about the service
              </Paragraph>
            </YStack>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">3. Information Sharing and Disclosure</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              We do not sell, trade, or otherwise transfer your personal information to third
              parties. We may share your information only in the following circumstances:
            </Paragraph>
            <YStack
              pl="$3"
              gap="$1"
            >
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • With your explicit consent
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • To comply with legal obligations or law enforcement requests
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • To protect the rights, property, or safety of Keystone, our users, or others
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • In connection with a merger, acquisition, or sale of assets (with notice to you)
              </Paragraph>
            </YStack>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">4. Data Security</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              We implement appropriate security measures to protect your personal information
              against unauthorized access, alteration, disclosure, or destruction. Your data is
              stored securely using Firebase's infrastructure, which includes:
            </Paragraph>
            <YStack
              pl="$3"
              gap="$1"
            >
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Encryption in transit and at rest
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Regular security assessments and updates
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Access controls and authentication mechanisms
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Regular backups and disaster recovery procedures
              </Paragraph>
            </YStack>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">5. Data Retention</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              We retain your personal information for as long as your account is active or as needed
              to provide you services. You may delete your account at any time through the app
              settings, which will remove your personal data from our systems within 30 days, except
              where we are required to retain it for legal purposes.
            </Paragraph>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">6. Your Rights and Choices</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              You have the following rights regarding your personal information:
            </Paragraph>
            <YStack
              pl="$3"
              gap="$1"
            >
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Access and update your account information at any time
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Export your expense data from the app
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Delete your account and associated data
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Request correction of inaccurate information
              </Paragraph>
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                • Opt out of non-essential communications
              </Paragraph>
            </YStack>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">7. Third-Party Services</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              Keystone integrates with the following third-party services:
            </Paragraph>
            <YStack
              pl="$3"
              gap="$2"
            >
              <YStack gap="$1">
                <H3
                  color="$color"
                  fontSize="$4"
                >
                  Google Sign-In & Apple Sign-In
                </H3>
                <Paragraph
                  color="$color"
                  lineHeight="$4"
                >
                  For authentication purposes. Please review their respective privacy policies for
                  information about how they handle your data.
                </Paragraph>
              </YStack>

              <YStack gap="$1">
                <H3
                  color="$color"
                  fontSize="$4"
                >
                  Firebase (Google)
                </H3>
                <Paragraph
                  color="$color"
                  lineHeight="$4"
                >
                  For data storage, authentication, and app functionality. Firebase's privacy policy
                  can be found at https://firebase.google.com/support/privacy.
                </Paragraph>
              </YStack>
            </YStack>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">8. Children's Privacy</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              Keystone is not intended for use by children under the age of 13. We do not knowingly
              collect personal information from children under 13. If you are a parent or guardian
              and believe your child has provided us with personal information, please contact us so
              we can delete such information.
            </Paragraph>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">9. International Data Transfers</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              Your information may be transferred to and processed in countries other than your
              country of residence. These countries may have data protection laws that are different
              from the laws of your country. However, we ensure that your data receives an adequate
              level of protection through appropriate safeguards.
            </Paragraph>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">10. Changes to This Privacy Policy</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              We may update this Privacy Policy from time to time. We will notify you of any
              significant changes by posting the new Privacy Policy in the app and updating the
              "Last updated" date. Your continued use of Keystone after such modifications
              constitutes your acknowledgment and acceptance of the updated Privacy Policy.
            </Paragraph>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <H2 color="$color">11. Contact Us</H2>
            <Paragraph
              color="$color"
              lineHeight="$4"
            >
              If you have any questions about this Privacy Policy or our privacy practices, please
              contact us at:
            </Paragraph>
            <YStack
              pl="$3"
              gap="$1"
            >
              <Paragraph
                color="$color"
                lineHeight="$4"
              >
                Email: privacy@keystoneapp.com
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
            This privacy policy is effective as of the date listed above and applies to all users of
            the Keystone expense tracking application.
          </Paragraph>
        </YStack>
      </YStack>
    </RefreshableScrollView>
  )
}
