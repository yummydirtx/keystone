import React, { useState, useEffect } from 'react'
import { Button, H1, YStack, Paragraph, XStack, Text, Separator } from '@my/ui'
import { useAuth } from '../../provider/AuthProvider'
import { useRouter } from 'solito/navigation'
import { GoogleIcon } from './GoogleIcon'
import { EmailIcon } from './EmailIcon'
import { AppleSignInButton } from './AppleSignInButton'
import { EmailPasswordForm } from './EmailPasswordForm'
import { Footer } from '../../components/Footer'
import { NavigationBar } from '../../components/NavigationBar'
import { UserMenu } from '../../components/UserMenu'

/**
 * Renders the authentication login screen with social sign-in options.
 * This component provides Google and Apple sign-in functionality,
 * handles authentication errors, and displays loading states during sign-in.
 *
 * @returns {JSX.Element} The rendered login screen with authentication options.
 *
 * @example
 * // Basic login screen
 * <LoginScreen />
 *
 * @example
 * // Conditional rendering based on auth state
 * function App() {
 *   const { user } = useAuth()
 *   return user ? <HomeScreen /> : <LoginScreen />
 * }
 *
 * @example
 * // Usage in a route guard
 * export default function AuthPage() {
 *   return <LoginScreen />
 * }
 */
export function LoginScreen() {
  const { user, signInWithGoogle, signInWithApple, loading } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleGoogleSignIn = async () => {
    try {
      setError(null)
      await signInWithGoogle()
      // Redirect will be handled by useEffect when user state updates
    } catch (error) {
      console.error('Google sign in failed:', error)
      setError('Failed to sign in with Google. Please try again.')
    }
  }

  const handleAppleSignIn = async () => {
    try {
      setError(null)
      await signInWithApple()
      // Redirect will be handled by useEffect when user state updates
    } catch (error) {
      console.error('Apple sign in failed:', error)
      setError('Failed to sign in with Apple. Please try again.')
    }
  }

  const toggleEmailForm = () => {
    setShowEmailForm(!showEmailForm)
    setError(null)
  }

  return (
    <YStack
      flex={1}
      minH="100vh"
    >
      <NavigationBar onMenuPress={() => setMenuOpen(!menuOpen)} />
      <UserMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        variant="dropdown"
      />
      <YStack
        flex={1}
        justify="center"
        items="center"
        gap="$4"
        p="$4"
      >
        <H1
          text="center"
          color="$color12"
        >
          Welcome to Keystone.
        </H1>
        <Paragraph
          color="$color10"
          text="center"
        >
          Sign in to continue
        </Paragraph>

        {error && (
          <Paragraph
            color="$red10"
            text="center"
          >
            {error}
          </Paragraph>
        )}

        {/* Social Sign-In Buttons - only show when email form is closed */}
        {!showEmailForm && (
          <>
            <Button
              size="$6"
              onPress={handleGoogleSignIn}
              disabled={loading}
              theme="blue"
              color="white"
            >
              <XStack
                items="center"
                gap="$2"
              >
                <GoogleIcon
                  width={18}
                  height={18}
                />
                {loading ? <Text>Signing in...</Text> : <Text>Sign in with Google</Text>}
              </XStack>
            </Button>

            <AppleSignInButton
              onPress={handleAppleSignIn}
              disabled={loading}
            />
          </>
        )}

        {/* Email Sign-In Toggle */}
        {!showEmailForm ? (
          <>
            {/* Separator */}
            <XStack
              items="center"
              gap="$3"
              width="100%"
              maxW={400}
            >
              <Separator flex={1} />
              <Text color="$color10">or</Text>
              <Separator flex={1} />
            </XStack>

            <Button
              size="$6"
              onPress={toggleEmailForm}
              disabled={loading}
              color="white"
              bg="$color8"
              borderColor="$color9"
              hoverStyle={{
                bg: '$color9',
                borderColor: '$color10',
              }}
              pressStyle={{
                bg: '$color7',
                borderColor: '$color8',
              }}
            >
              <XStack
                items="center"
                gap="$2"
              >
                <EmailIcon
                  width={18}
                  height={18}
                  color="white"
                />
                <Text>Sign in with Email</Text>
              </XStack>
            </Button>
          </>
        ) : (
          <>
            {/* Separator */}
            <XStack
              items="center"
              gap="$3"
              width="100%"
              maxW={400}
            >
              <Separator flex={1} />
              <Text color="$color10">or</Text>
              <Separator flex={1} />
            </XStack>

            {/* Email/Password Form */}
            <EmailPasswordForm onBack={toggleEmailForm} />
          </>
        )}
      </YStack>

      <Footer />
    </YStack>
  )
}
